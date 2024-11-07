import prisma from "@/utils/api/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { updateUserLastModified } from "@/utils/api/update-user-last-modified";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await updateUserLastModified("dashboard/count", req.method, session.user.email);

  if (req.method === "GET") {
    return await readData(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

export async function readData(req, res) {
  try {
    const { hospitalIds, startDate, endDate, genders, mdvis, min_age, max_age } = req.query;

    console.log('req.query:', req.query);

    // Parse hospital IDs
    let parsedHospitalIds = [];
    if (hospitalIds) {
      if (Array.isArray(hospitalIds)) {
        parsedHospitalIds = hospitalIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
      } else if (typeof hospitalIds === "string") {
        const id = parseInt(hospitalIds, 10);
        if (!isNaN(id)) parsedHospitalIds.push(id);
      }
    }

    if (parsedHospitalIds.length === 0) {
      return res.status(400).json({ error: 'hospitalIds is required and must be valid integers' });
    }

    // Parse date range
    let parsedStartDate = startDate ? new Date(startDate) : null;
    let parsedEndDate = endDate ? new Date(endDate) : null;

    console.log('Parsed Start Date:', parsedStartDate);
    console.log('Parsed End Date:', parsedEndDate);

    if (parsedStartDate && isNaN(parsedStartDate.getTime())) parsedStartDate = null;
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) parsedEndDate = null;

    if (parsedStartDate) parsedStartDate.setUTCHours(0, 0, 0, 0);
    if (parsedEndDate) parsedEndDate.setUTCHours(23, 59, 59, 999);

    // Build date range condition
    const dateRangeCondition = parsedStartDate && parsedEndDate ? {
      gte: parsedStartDate,
      lte: parsedEndDate,
    } : undefined;

    // Parse gender filters
    let genderFilters = [];
    if (genders) {
      if (Array.isArray(genders)) {
        genderFilters = genders.map((g) => g.toLowerCase());
      } else {
        genderFilters.push(genders.toLowerCase());
      }
    }

    // // Parse MDVI filters
    let mdviFilters  = [];
    if (Array.isArray(mdvis)) {
      mdviFilters  = mdvis;
    } else if (typeof mdvis === 'string') {
      mdviFilters  = [mdvis];
    }

    // Parse age filters
    const minAge = min_age ? parseInt(min_age, 10) : undefined;
    const maxAge = max_age ? parseInt(max_age, 10) : undefined;

    // Build beneficiary filters
    const beneficiaryFilters = {
      deleted: false,
      hospitalId: { in: parsedHospitalIds },
      ...(genderFilters.length > 0 && { gender: { in: genderFilters } }),
      ...(mdviFilters.length > 0 && { mDVI: { in: mdviFilters } }),
      ...(minAge !== undefined || maxAge !== undefined) && {
        dateOfBirth: {
          ...(minAge !== undefined && { lte: new Date(new Date().setFullYear(new Date().getFullYear() - minAge)) }),
          ...(maxAge !== undefined && { gte: new Date(new Date().setFullYear(new Date().getFullYear() - maxAge)) }),
        },
      },
    };

    // Define activity subtypes and models
    const subtypes = [
      "Training",
      "Computer_Training",
      "Mobile_Training",
      "Orientation_Mobility_Training",
      "Vision_Enhancement",
      "Counselling_Education",
      "Comprehensive_Low_Vision_Evaluation",
      "Low_Vision_Evaluation",
    ];

    const modelMap = {
      Training: prisma.Training,
      Computer_Training: prisma.Computer_Training,
      Mobile_Training: prisma.Mobile_Training,
      Orientation_Mobility_Training: prisma.Orientation_Mobility_Training,
      Vision_Enhancement: prisma.Vision_Enhancement,
      Counselling_Education: prisma.Counselling_Education,
      Comprehensive_Low_Vision_Evaluation: prisma.Comprehensive_Low_Vision_Evaluation,
      Low_Vision_Evaluation: prisma.Low_Vision_Evaluation,
    };

    // Get counts for main activities
    const counts = await Promise.all([
      prisma.Beneficiary.count({
        where: {
          ...beneficiaryFilters,
          ...(dateRangeCondition && {
            OR: subtypes.map((subtype) => ({
              [subtype]: {
                some: {
                  date: dateRangeCondition,
                },
              },
            })),
          }),
        },
      }),
      ...subtypes.map((subtype) =>
        modelMap[subtype].count({
          where: {
            beneficiary: beneficiaryFilters,
            ...(dateRangeCondition && { date: dateRangeCondition }),
          },
        })
      ),
    ]);

    const formattedCounts = {};
    formattedCounts["Beneficiary"] = counts[0];
    for (let i = 0; i < subtypes.length; i++) {
      formattedCounts[subtypes[i]] = counts[i + 1];
    }

    // Get counts of Training subtypes
    const trainingSubTypeCountsArray = await prisma.Training.groupBy({
      by: ["subType"],
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      _count: {
        _all: true,
      },
    });

    const trainingSubTypeCounts = {};
    trainingSubTypeCountsArray.forEach((item) => {
      const key = item.subType || "Unknown";
      trainingSubTypeCounts[key] = (trainingSubTypeCounts[key] || 0) + item._count._all;
    });

    // Get counts of Counselling types
    const counsellingTypeCountsArray = await prisma.Counselling_Education.groupBy({
      by: ["type"],
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      _count: {
        _all: true,
      },
    });

    const counsellingTypeCounts = {};
    counsellingTypeCountsArray.forEach((item) => {
      const key = item.type || "Unknown";
      counsellingTypeCounts[key] = item._count._all;
    });

    // Initialize devices counts
    const devicesDispensedCounts = {
      Spectacle: 0,
      Electronic: 0,
      Optical: 0,
      NonOptical: 0,
    };

    const devicesRecommendedCounts = {
      Spectacle: 0,
      Electronic: 0,
      Optical: 0,
      NonOptical: 0,
    };

    // For detailed device counts
    const devicesDispensedDetails = {
      Spectacle: {},
      Electronic: {},
      Optical: {},
      NonOptical: {},
    };

    const devicesRecommendedDetails = {
      Spectacle: {},
      Electronic: {},
      Optical: {},
      NonOptical: {},
    };

    // Get counts of Devices Dispensed and Recommended
    const clveRecords = await prisma.Comprehensive_Low_Vision_Evaluation.findMany({
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      select: {
        dispensedSpectacle: true,
        dispensedElectronic: true,
        dispensedOptical: true,
        dispensedNonOptical: true,
        recommendationSpectacle: true,
        recommendationElectronic: true,
        recommendationOptical: true,
        recommendationNonOptical: true,
      },
    });

    if (clveRecords && clveRecords.length > 0) {
      clveRecords.forEach((record) => {
        ["Spectacle", "Electronic", "Optical", "NonOptical"].forEach((type) => {
          const dispensedField = `dispensed${type}`;
          const recommendedField = `recommendation${type}`;

          // Process dispensed devices
          if (record[dispensedField]) {
            const devices = record[dispensedField].split(";").map((d) => d.trim()).filter(Boolean);
            devicesDispensedCounts[type] += devices.length;
            devices.forEach((device) => {
              devicesDispensedDetails[type][device] = (devicesDispensedDetails[type][device] || 0) + 1;
            });
          }

          // Process recommended devices
          if (record[recommendedField]) {
            const devices = record[recommendedField].split(",").map((d) => d.trim()).filter(Boolean);
            devicesRecommendedCounts[type] += devices.length;
            devices.forEach((device) => {
              devicesRecommendedDetails[type][device] = (devicesRecommendedDetails[type][device] || 0) + 1;
            });
          }
        });
      });
    }

    // Add the new counts to formattedCounts
    formattedCounts["Training_Subtypes"] = trainingSubTypeCounts;
    formattedCounts["Counselling_Types"] = counsellingTypeCounts;
    formattedCounts["Devices_Dispensed"] = devicesDispensedCounts;
    formattedCounts["Devices_Recommended"] = devicesRecommendedCounts;

    // Add detailed device counts
    formattedCounts["Devices_Dispensed_Details"] = devicesDispensedDetails;
    formattedCounts["Devices_Recommended_Details"] = devicesRecommendedDetails;

    // Return the response
    return res.status(200).json({
      ...formattedCounts,
      parsedHospitalIds,
      parsedStartDate,
      parsedEndDate,
    });
  } catch (error) {
    console.error('Error in readData:', error);
    return res.status(500).json({ error: error.message });
  }
}
