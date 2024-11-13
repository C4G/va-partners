// Import necessary modules and initialize Prisma Client
import prisma from "@/utils/api/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { updateUserLastModified } from "@/utils/api/update-user-last-modified";
import moment from 'moment';

// Define the mapping for distanceBinocularVisionBE
const distanceBinocularVisionMapping = {
  '1 N-scale': 'Other',
  '6/60 6m': 'Moderate visual impairment',
  'PL- 6m': 'Blindness',
  'Unable To Assess': 'Other',
  '6/126 6m': 'Severe visual impairment',
  '6/9.5 6m': 'Visual Acuity normal',
  '6/48 6m': 'Moderate visual impairment',
  '6/24 6m': 'Moderate visual impairment',
  '1.0 LogMAR': 'Moderate visual impairment',
  '6/600 6m': 'Blindness',
  '6/38 6m': 'Moderate visual impairment',
  'HMCF 6m': 'Blindness',
  '6/15 6m': 'Mild visual impairment',
  '6/190 6m': 'Blindness',
  '0.8 LogMAR': 'Moderate visual impairment',
  '0.4 LogMAR': 'Mild visual impairment',
  'PL+, PR unaccurate 6m': 'Blindness',
  '0.0 LogMAR': 'Visual Acuity normal',
  '20/100 20ft': 'Other',
  '1 Metric': 'Other',
  '4 LogMAR': 'Blindness',
  'Not assessible': 'Other',
  '2.0 LogMAR': 'Blindness',
  '20/320 20ft': 'Severe visual impairment',
  '20/125 20ft': 'Moderate visual impairment',
  '20/160 20ft': 'Moderate visual impairment',
  '6/75 6m': 'Severe visual impairment',
  '6/6.0 6m': 'Other',
  '6/300 6m': 'Blindness',
  '6/19 6m': 'Mild visual impairment',
  '6/480 6m': 'Blindness',
  '0.5 LogMAR': 'Mild visual impairment',
  '6/30 6m': 'Moderate visual impairment',
  '0.3 LogMAR': 'Visual Acuity normal',
  '6/240 6m': 'Blindness',
  '0.22 LogMAR': 'Visual Acuity normal',
  '20 6m': 'Other',
  '6m': 'Other',
  'PL+, PR accurate 6m': 'Blindness',
  '4.0 LogMAR': 'Blindness',
  '6/380 6m': 'Blindness',
  '2.3 LogMAR': 'Blindness',
  '20/250 20ft': 'Severe visual impairment',
  'PL+, PR inaccurate 6m': 'Blindness',
  'CFCF 6m': 'Blindness',
  '6/12 6m': 'Visual Acuity normal',
  '6/150 6m': 'Blindness',
  '0.92 LogMAR': 'Moderate visual impairment',
  '6/95 6m': 'Severe visual impairment',
  '1.1 LogMAR': 'Severe visual impairment',
  'LogMAR': 'Other',
  '0.6 LogMAR': 'Moderate visual impairment',
  '20ft': 'Other',
};

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

    // Parse date range with improved validation
    let parsedStartDate = null;
    let parsedEndDate = null;

    if (startDate) {
      const tempStartDate = moment.utc(startDate).startOf('day').toDate();
      parsedStartDate = tempStartDate;
    } else {
      console.warn('Invalid startDate:', startDate);
    }
    
    if (endDate) {
      const tempEndDate = moment.utc(endDate).endOf('day').toDate();
      parsedEndDate = tempEndDate;
    } else {
      console.warn('Invalid endDate:', endDate);
    }

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

    // Parse MDVI filters
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
      // deleted: false,
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

    // Get counts of Devices Dispensed and Recommended from Comprehensive_Low_Vision_Evaluation
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

    // **Updated Addition: GroupBy for distanceBinocularVisionBE on Comprehensive_Low_Vision_Evaluation**
    const distanceBinocularCounts = await prisma.Comprehensive_Low_Vision_Evaluation.groupBy({
      by: ['distanceBinocularVisionBE'],
      where: {
        ...beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      _count: {
        distanceBinocularVisionBE: true,
      },
    });

    const distanceBinocularVisionBE_counts = {
      'Other': 0,
      'Moderate visual impairment': 0,
      'Blindness': 0,
      'Severe visual impairment': 0,
      'Visual Acuity normal': 0,
      'Mild visual impairment': 0,
    };

    // Map each `distanceBinocularVisionBE` value to its category and aggregate
    distanceBinocularCounts.forEach((record) => {
      const rawValue = record.distanceBinocularVisionBE;
      const category = distanceBinocularVisionMapping[rawValue] || 'Other'; // Default to 'Other' if not mapped
    
      if (Object.prototype.hasOwnProperty.call(distanceBinocularVisionBE_counts, category)) {
        distanceBinocularVisionBE_counts[category] += record._count.distanceBinocularVisionBE;
      } else {
        // If category is not predefined, categorize it as 'Other'
        distanceBinocularVisionBE_counts['Other'] += record._count.distanceBinocularVisionBE;
      }
    });

    // Add the aggregated category counts to formattedCounts
    formattedCounts["distanceBinocularVisionBE_counts"] = distanceBinocularVisionBE_counts;

    // Add detailed device counts
    formattedCounts["Devices_Dispensed_Details"] = devicesDispensedDetails;
    formattedCounts["Devices_Recommended_Details"] = devicesRecommendedDetails;

    // Return the response including the new counts
    return res.status(200).json({
      ...formattedCounts,
      distanceBinocularVisionBE_counts,
      parsedHospitalIds,
      parsedStartDate,
      parsedEndDate,
    });
  } catch (error) {
    console.error('Error in readData:', error);
    return res.status(500).json({ error: error.message });
  }
}
