// Import necessary modules and initialize Prisma Client
import prisma from "@/utils/api/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { updateUserLastModified } from "@/utils/api/update-user-last-modified";
import moment from 'moment';
import { difference, intersect, union } from "@/constants/globalFunctions";

// Mapping for distanceBinocularVisionBE values to categories
const distanceBinocularVisionMapping = {
  '4.0 LogMAR': 'Blindness',
  '3.5 LogMAR': 'Blindness',
  '2.7 LogMAR': 'Blindness',
  '2.3 LogMAR': 'Blindness',
  '2.0 LogMAR': 'Blindness',
  '1.92 LogMAR': 'Blindness',
  '1.8 LogMAR': 'Blindness',
  '1.7 LogMAR': 'Blindness',
  '1.6 LogMAR': 'Blindness',
  '1.52 LogMAR': 'Blindness',
  '1.4 LogMAR': 'Blindness',
  '1.3 LogMAR': 'Severe visual impairment',
  '1.22 LogMAR': 'Severe visual impairment',
  '1.1 LogMAR': 'Severe visual impairment',
  '1.0 LogMAR': 'Moderate visual impairment',
  '0.92 LogMAR': 'Moderate visual impairment',
  '0.8 LogMAR': 'Moderate visual impairment',
  '0.7 LogMAR': 'Moderate visual impairment',
  '0.6 LogMAR': 'Moderate visual impairment',
  '0.5 LogMAR': 'Mild visual impairment',
  '0.4 LogMAR': 'Mild visual impairment',
  '0.3 LogMAR': 'Visual Acuity normal',
  '0.22 LogMAR': 'Visual Acuity normal',
  '0.1 LogMAR': 'Visual Acuity normal',
  '0.0 LogMAR': 'Visual Acuity normal',
  'PL- 6m': 'Blindness',
  'PL+: PR inaccurate 6m': 'Blindness',
  'PL+: PR accurate 6m': 'Blindness',
  'HMCF 6m': 'Blindness',
  'CFCF 6m': 'Blindness',
  '6/600 6m': 'Blindness',
  '6/480 6m': 'Blindness',
  '6/380 6m': 'Blindness',
  '6/300 6m': 'Blindness',
  '6/240 6m': 'Blindness',
  '6/190 6m': 'Blindness',
  '6/150 6m': 'Blindness',
  '6/126 6m': 'Severe visual impairment',
  '6/95 6m': 'Severe visual impairment',
  '6/75 6m': 'Severe visual impairment',
  '6/60 6m': 'Moderate visual impairment',
  '6/48 6m': 'Moderate visual impairment',
  '6/38 6m': 'Moderate visual impairment',
  '6/30 6m': 'Moderate visual impairment',
  '6/24 6m': 'Moderate visual impairment',
  '6/19 6m': 'Mild visual impairment',
  '6/15 6m': 'Mild visual impairment',
  '6/12 6m': 'Visual Acuity normal',
  '6/9.5 6m': 'Visual Acuity normal',
  '6/7.5 6m': 'Visual Acuity normal',
  '6/6.0 6m': 'Visual Acuity normal',
  'PL- 20ft': 'Blindness',
  'PL+: PR inaccurate 20ft': 'Blindness',
  'PL+: PR accurate 20ft': 'Blindness',
  'HMCF 20ft': 'Blindness',
  'CFCF 20ft': 'Blindness',
  '20/2000 20ft': 'Blindness',
  '20/1600 20ft': 'Blindness',
  '20/1250 20ft': 'Blindness',
  '20/1000 20ft': 'Blindness',
  '20/800 20ft': 'Blindness',
  '20/630 20ft': 'Blindness',
  '20/500 20ft': 'Blindness',
  '20/400 20ft': 'Severe visual impairment',
  '20/320 20ft': 'Severe visual impairment',
  '20/250 20ft': 'Severe visual impairment',
  '20/200 20ft': 'Moderate visual impairment',
  '20/160 20ft': 'Moderate visual impairment',
  '20/125 20ft': 'Moderate visual impairment',
  '20/100 20ft': 'Moderate visual impairment',
  '20/80 20ft': 'Moderate visual impairment',
  '20/63 20ft': 'Mild visual impairment',
  '20/50 20ft': 'Mild visual impairment',
  '20/40 20ft': 'Visual Acuity normal',
  '20/32 20ft': 'Visual Acuity normal',
  '20/25 20ft': 'Visual Acuity normal',
  '20/20 20ft': 'Visual Acuity normal',
};

const trainingCategories = [
  "Braille training",
  "Corporate skill development",
  "Job Coaching / IBPS",
  "Spoken English Programme - Beginner",
  "Spoken English Programme - Intermediate",
  "Training for Life skills/ Money identification/ Home management / Kitchen skills",
  "Training with Braille reader / ORBIT reader",
  "Vocational Training",
  "Assistive technology training",
  "Certificate course in Computer Applications – CCA",
  "Certificate course in Mobile technology - MT",
  "Digital Accessibility Testing",
  "Microsoft Excel -MS EXCEL",
  "Python Programming",
  "SQL training",
  "Mobile applications training",
  "Behavioral modification/management",
  "Functional academic skills or remedial education, vocabulary development",
  "Prevocational skills training",
  "Social skills /life skills / to manage Activities of Daily living",
  "Special education",
  "Training for Eye-hand coordination",
];

// Define specific counseling categories
const specificCounselingCategories = [
  'Counseled and Shortlisted for Smart vision glasses',
  'Counseled and Shortlisted for Smartphone',
  'Educational guidance',
  'Life skills training/ Home management / Kitchen skills',
  'Referral to computer applications & technology training',
  'Referral to mobile technology training',
  'Referral to orientation and mobility – training',
  'Referral to Vision-Aid online training programs',
  'Referral to vocational training',
  'Self-care and Activities of daily living',
  'Counseling to the parents/ family/caretaker',
  'Other',
  'Referral to a special school',
  'Referral to Genetic Counseling',
  'Referral to Vision-Aid for Job Placement',
];

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
        parsedHospitalIds = hospitalIds
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id));
      } else if (typeof hospitalIds === "string") {
        const id = parseInt(hospitalIds, 10);
        if (!isNaN(id)) parsedHospitalIds.push(id);
      }
    }

    if (parsedHospitalIds.length === 0) {
      return res.status(400).json({ error: 'hospitalIds is required and must be valid integers' });
    }

    // Parse date range
    let parsedStartDate = null;
    let parsedEndDate = null;

    if (startDate) {
      const tempStartDate = moment.utc(startDate).startOf('day').toDate();
      parsedStartDate = tempStartDate;
    }

    if (endDate) {
      const tempEndDate = moment.utc(endDate).endOf('day').toDate();
      parsedEndDate = tempEndDate;
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
        genderFilters = genders;
      } else if (typeof genders === 'string') {
        genderFilters = [genders];
      }
    }

    // Parse MDVI filters
    let mdviFilters  = [];
    if (mdvis) {
      if (Array.isArray(mdvis)) {
        mdviFilters  = mdvis;
      } else if (typeof mdvis === 'string') {
        mdviFilters  = [mdvis];
      }
    }

    // Parse age filters
    const minAge = min_age ? parseInt(min_age, 10) : undefined;
    const maxAge = max_age ? parseInt(max_age, 10) : undefined;

    // Calculate dateOfBirth range based on minAge and maxAge
    let dateOfBirthFilter = {};
    const today = new Date();
    if (minAge !== undefined) {
      const maxDateOfBirth = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate() + 1);
      dateOfBirthFilter.lte = maxDateOfBirth;
    }
    if (maxAge !== undefined) {
      const minDateOfBirth = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate() + 1);
      dateOfBirthFilter.gte = minDateOfBirth;
    }

    // Build beneficiary filters
    const beneficiaryFilters = {
      hospitalId: { in: parsedHospitalIds },
      ...(genderFilters.length > 0 && { gender: { in: genderFilters } }),
      ...(mdviFilters.length > 0 && { mDVI: { in: mdviFilters } }),
      ...(minAge !== undefined || maxAge !== undefined) && {
        dateOfBirth: dateOfBirthFilter,
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

    // Get total number of beneficiaries matching the filters (regardless of activities)
    const totalBeneficiariesCount = await prisma.Beneficiary.count({
      where: beneficiaryFilters,
    });

    // Get counts for main activities and unique beneficiaries
    const activityCounts = await Promise.all([
      // Unique beneficiaries who participated in any activity
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
      // Counts for each activity subtype
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
    formattedCounts["Total_Beneficiaries"] = totalBeneficiariesCount;
    formattedCounts["Unique_Beneficiaries"] = activityCounts[0]; // Unique beneficiaries across all activities

    // Assign counts to each subtype
    for (let i = 0; i < subtypes.length; i++) {
      formattedCounts[subtypes[i]] = activityCounts[i + 1];
    }

    // **Training Types and Subtypes**

    const trainingGrouped = await prisma.Training.groupBy({
      by: ["type", "subType"],
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      _count: {
        _all: true,
      },
    });

    const trainingTypeCounts = {};
    const trainingSubTypeCounts = {};

    trainingGrouped.forEach((item) => {
      const rawSubType = item.subType ? item.subType.trim() : "Other";
      const mappedSubType = trainingCategories.includes(rawSubType) ? rawSubType : "Other";
      const count = item._count._all;

      // Aggregate type counts (Assuming 'Training' is the main type)
      trainingTypeCounts["Training"] = (trainingTypeCounts["Training"] || 0) + count;

      // Initialize subType counts for 'Training'
      if (!trainingSubTypeCounts["Training"]) {
        trainingSubTypeCounts["Training"] = {};
      }

      // Aggregate subtype counts, mapping to 'Other' if not in trainingCategories
      trainingSubTypeCounts["Training"][mappedSubType] = (trainingSubTypeCounts["Training"][mappedSubType] || 0) + count;
    });

    // **Counselling Types**

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
      const rawType = item.type ? item.type.trim() : "Other";
      const mappedType = specificCounselingCategories.includes(rawType) ? rawType : "Other";
      counsellingTypeCounts[mappedType] = (counsellingTypeCounts[mappedType] || 0) + item._count._all;
    });

    // **Devices Counts**

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

    // Get counts of Devices Dispensed and Recommended from CLVE
    const clveRecords = await prisma.Comprehensive_Low_Vision_Evaluation.findMany({
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      select: {
        beneficiaryId: true,
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

    // Initialize devicesBeneficiaryIds as empty Set
    const devicesBeneficiaryIds = new Set();

    if (clveRecords && clveRecords.length > 0) {
      clveRecords.forEach((record) => {
        ["Spectacle", "Electronic", "Optical", "NonOptical"].forEach((type) => {
          const dispensedField = `dispensed${type}`;
          const recommendedField = `recommendation${type}`;

          // Process dispensed devices
          if (record[dispensedField]) {
            const devices = record[dispensedField]
              .split(";")
              .map((d) => d.trim())
              .filter(Boolean);
            devicesDispensedCounts[type] += devices.length;
            devices.forEach((device) => {
              devicesDispensedDetails[type][device] = (devicesDispensedDetails[type][device] || 0) + 1;
            });
            // Add beneficiaryId to devicesBeneficiaryIds
            devicesBeneficiaryIds.add(record.beneficiaryId);
          }

          // Process recommended devices
          if (record[recommendedField]) {
            const devices = record[recommendedField]
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean);
            devicesRecommendedCounts[type] += devices.length;
            devices.forEach((device) => {
              devicesRecommendedDetails[type][device] = (devicesRecommendedDetails[type][device] || 0) + 1;
            });
          }
        });
      });
    }

    // Add counts to formattedCounts
    formattedCounts["Training_Types"] = trainingTypeCounts;
    formattedCounts["Training_Subtypes"] = trainingSubTypeCounts;
    formattedCounts["Counselling_Types"] = counsellingTypeCounts;
    formattedCounts["Devices_Dispensed"] = devicesDispensedCounts;
    formattedCounts["Devices_Recommended"] = devicesRecommendedCounts;

    // **Visual Acuity Counts**

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
      'Blindness': 0,
      'Severe visual impairment': 0,
      'Moderate visual impairment': 0,
      'Mild visual impairment': 0,
      'Visual Acuity normal': 0,
      // 'Other': 0, // Uncomment if you wish to include 'Other' category
    };

    // Map each `distanceBinocularVisionBE` value to its category and aggregate
    distanceBinocularCounts.forEach((record) => {
      const rawValue = record.distanceBinocularVisionBE;
      const category = distanceBinocularVisionMapping[rawValue] || 'Other'; // Default to 'Other' if not mapped

      if (Object.prototype.hasOwnProperty.call(distanceBinocularVisionBE_counts, category)) {
        distanceBinocularVisionBE_counts[category] += record._count.distanceBinocularVisionBE;
      } else {
        // If category is not predefined, you can choose to handle 'Other' category
        // distanceBinocularVisionBE_counts['Other'] += record._count.distanceBinocularVisionBE;
      }
    });

    // Add the aggregated category counts to formattedCounts
    formattedCounts["distanceBinocularVisionBE_counts"] = distanceBinocularVisionBE_counts;

    // Add detailed device counts
    formattedCounts["Devices_Dispensed_Details"] = devicesDispensedDetails;
    formattedCounts["Devices_Recommended_Details"] = devicesRecommendedDetails;

    // **Compute Unique Beneficiaries for Each Activity**

    // Screenings
    const screeningsBeneficiaries = await prisma.Low_Vision_Evaluation.findMany({
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      select: {
        beneficiaryId: true,
      },
    });
    const screeningsBeneficiaryIds = new Set(screeningsBeneficiaries.map(item => item.beneficiaryId));

    // Vision Enhancement
    const visionEnhancementBeneficiaries = await prisma.Vision_Enhancement.findMany({
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      select: {
        beneficiaryId: true,
      },
    });
    const visionEnhancementBeneficiaryIds = new Set(visionEnhancementBeneficiaries.map(item => item.beneficiaryId));

    // CLVE
    const clveBeneficiaryIds = new Set(clveRecords.map(item => item.beneficiaryId));

    // Counselling
    const counsellingBeneficiaries = await prisma.Counselling_Education.findMany({
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      select: {
        beneficiaryId: true,
      },
    });
    const counsellingBeneficiaryIds = new Set(counsellingBeneficiaries.map(item => item.beneficiaryId));

    // Training (including subtypes)
    const trainingBeneficiariesList = await Promise.all([
      prisma.Training.findMany({
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
        select: {
          beneficiaryId: true,
        },
      }),
      prisma.Mobile_Training.findMany({
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
        select: {
          beneficiaryId: true,
        },
      }),
      prisma.Computer_Training.findMany({
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
        select: {
          beneficiaryId: true,
        },
      }),
      prisma.Orientation_Mobility_Training.findMany({
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
        select: {
          beneficiaryId: true,
        },
      }),
    ]);
    const trainingBeneficiaryIds = new Set();
    trainingBeneficiariesList.forEach(beneficiaries => {
      beneficiaries.forEach(item => trainingBeneficiaryIds.add(item.beneficiaryId));
    });

    // Now compute unique beneficiaries counts per activity
    const uniqueBeneficiariesCounts = {
      Screenings: screeningsBeneficiaryIds.size,
      Vision_Enhancement: visionEnhancementBeneficiaryIds.size,
      CLVE: clveBeneficiaryIds.size,
      Counselling: counsellingBeneficiaryIds.size,
      Training: trainingBeneficiaryIds.size,
      Devices_Dispensed: devicesBeneficiaryIds.size,
    };

    // Add to formattedCounts
    formattedCounts["Unique_Beneficiaries_By_Activity"] = uniqueBeneficiariesCounts;


    // **Initialize Counts for Mutually Exclusive Categories**
    const mutuallyExclusiveCounts = {
      screeningsOnlyCount: 0,
      screeningsAndCLVECount: 0,
      screeningsCLVEVisionCount: 0,
      visionCLVECount: 0,
      screeningsCLVEVisionDevicesCount: 0,
      screeningsCLVEVisionCounsellingCount: 0,
      screeningsCLVEVisionTrainingCount: 0,
      screeningsCLVEVisionDevicesCounsellingCount: 0,
      screeningsCLVEVisionDevicesTrainingCount: 0,
      screeningsCLVEVisionCounsellingTrainingCount: 0,
      screeningsCLVEVisionDevicesCounsellingTrainingCount: 0,
      visionEnhancementOnlyCount: 0,
      screeningsVisionEnhancementCount: 0,
      clveOnlyCount: 0,
      trainingOnlyCount: 0,
      counsellingOnlyCount: 0,
      devicesOnlyCount: 0,
      trainingCounsellingOnlyCount: 0,
      trainingDevicesOnlyCount: 0,
      counsellingDevicesOnlyCount: 0,
      trainingDevicesCounsellingOnlyCount: 0,
    };

    // **Compute the counts**

    // Screenings Only
    const screeningsOnlySet = difference(screeningsBeneficiaryIds, union(clveBeneficiaryIds, visionEnhancementBeneficiaryIds, trainingBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.screeningsOnlyCount = screeningsOnlySet.size;

    // Low vision screening at centre/screening camps + CLVE
    const screeningsAndCLVESet = difference(intersect(screeningsBeneficiaryIds, clveBeneficiaryIds), union(trainingBeneficiaryIds, visionEnhancementBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.screeningsAndCLVECount = screeningsAndCLVESet.size;

    // Functional Vision/Early Intervention/ Vision enhancement + CLVE only
    const visionCLVESet = difference(intersect(clveBeneficiaryIds, visionEnhancementBeneficiaryIds), union(screeningsBeneficiaryIds, trainingBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.visionCLVECount = visionCLVESet.size;

    // Low vision screening at centre/screening camps + CLVE + Functional Vision/Early Intervention/ Vision enhancement
    const screeningsCLVEVisionSet = difference(intersect(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), union(trainingBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.screeningsCLVEVisionCount = screeningsCLVEVisionSet.size;

    // Evaluation(s) + Dispensed Devices only
    const screeningsCLVEVisionDevicesSet = difference(intersect(union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), devicesBeneficiaryIds), union(trainingBeneficiaryIds, counsellingBeneficiaryIds));
    mutuallyExclusiveCounts.screeningsCLVEVisionDevicesCount = screeningsCLVEVisionDevicesSet.size;

    // Evaluation(s) + Counselling only
    const screeningsCLVEVisionCounsellingSet = difference(intersect(union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), counsellingBeneficiaryIds), union(trainingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.screeningsCLVEVisionCounsellingCount = screeningsCLVEVisionCounsellingSet.size;

    // Evaluation(s) + Training only
    const screeningsCLVEVisionTrainingSet = difference(intersect(union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), trainingBeneficiaryIds), union(counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.screeningsCLVEVisionTrainingCount = screeningsCLVEVisionTrainingSet.size;

    // Evaluation(s) + Dispensed Devices + Counselling only
    const screeningsCLVEVisionDevicesCounsellingSet = difference(intersect(union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), devicesBeneficiaryIds, counsellingBeneficiaryIds), trainingBeneficiaryIds);
    mutuallyExclusiveCounts.screeningsCLVEVisionDevicesCounsellingCount = screeningsCLVEVisionDevicesCounsellingSet.size;

    // Evaluation(s) + Dispensed Devices + Training only
    const screeningsCLVEVisionDevicesTrainingSet = difference(intersect(union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), devicesBeneficiaryIds, trainingBeneficiaryIds), counsellingBeneficiaryIds);
    mutuallyExclusiveCounts.screeningsCLVEVisionDevicesTrainingCount = screeningsCLVEVisionDevicesTrainingSet.size;

    // Evaluation(s) + Counselling + Training only
    const screeningsCLVEVisionCounsellingTrainingSet = difference(intersect(union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), counsellingBeneficiaryIds, trainingBeneficiaryIds), devicesBeneficiaryIds);
    mutuallyExclusiveCounts.screeningsCLVEVisionCounsellingTrainingCount = screeningsCLVEVisionCounsellingTrainingSet.size;

    // Evaluation(s) + Dispensed Devices + Counselling + Training
    const screeningsCLVEVisionDevicesCounsellingTrainingSet = intersect(union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds), devicesBeneficiaryIds, counsellingBeneficiaryIds, trainingBeneficiaryIds);
    mutuallyExclusiveCounts.screeningsCLVEVisionDevicesCounsellingTrainingCount = screeningsCLVEVisionDevicesCounsellingTrainingSet.size;

    // Functional Vision/Early Intervention only
    const visionEnhancementOnlySet = difference(visionEnhancementBeneficiaryIds, union(screeningsBeneficiaryIds, clveBeneficiaryIds, trainingBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.visionEnhancementOnlyCount = visionEnhancementOnlySet.size;

    // Screenings + Functional Vision/Early Intervention
    const screeningsVisionEnhancementSet = difference(intersect(screeningsBeneficiaryIds, visionEnhancementBeneficiaryIds), union(clveBeneficiaryIds, trainingBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.screeningsVisionEnhancementCount = screeningsVisionEnhancementSet.size;

    // CLVE Only
    const clveOnlySet = difference(clveBeneficiaryIds, union(screeningsBeneficiaryIds, visionEnhancementBeneficiaryIds, trainingBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.clveOnlyCount = clveOnlySet.size;

    // Training Only
    const trainingOnlySet = difference(trainingBeneficiaryIds, union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds, counsellingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.trainingOnlyCount = trainingOnlySet.size;

    // Counselling Only
    const counsellingOnlySet = difference(counsellingBeneficiaryIds, union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds, trainingBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.counsellingOnlyCount = counsellingOnlySet.size;

    // Devices Only
    const devicesOnlySet = difference(devicesBeneficiaryIds, union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds, trainingBeneficiaryIds, counsellingBeneficiaryIds));
    mutuallyExclusiveCounts.devicesOnlyCount = devicesOnlySet.size;

    // Training and Counselling Only
    const trainingCounsellingOnlySet = difference(intersect(trainingBeneficiaryIds, counsellingBeneficiaryIds), union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds, devicesBeneficiaryIds));
    mutuallyExclusiveCounts.trainingCounsellingOnlyCount = trainingCounsellingOnlySet.size;

    // Training and Devices Only
    const trainingDevicesOnlySet = difference(intersect(trainingBeneficiaryIds, devicesBeneficiaryIds), union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds, counsellingBeneficiaryIds));
    mutuallyExclusiveCounts.trainingDevicesOnlyCount = trainingDevicesOnlySet.size;

    // Counselling and Devices Only
    const counsellingDevicesOnlySet = difference(intersect(counsellingBeneficiaryIds, devicesBeneficiaryIds), union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds, trainingBeneficiaryIds));
    mutuallyExclusiveCounts.counsellingDevicesOnlyCount = counsellingDevicesOnlySet.size;

    // Training, Devices, and Counselling Only
    const trainingDevicesCounsellingOnlySet = difference(intersect(trainingBeneficiaryIds, devicesBeneficiaryIds, counsellingBeneficiaryIds), union(screeningsBeneficiaryIds, clveBeneficiaryIds, visionEnhancementBeneficiaryIds));
    mutuallyExclusiveCounts.trainingDevicesCounsellingOnlyCount = trainingDevicesCounsellingOnlySet.size;

    // **Compute Total Beneficiaries Calculated**
    const totalBeneficiariesCalculated =
      mutuallyExclusiveCounts.screeningsOnlyCount +
      mutuallyExclusiveCounts.screeningsAndCLVECount +
      mutuallyExclusiveCounts.screeningsCLVEVisionCount +
      mutuallyExclusiveCounts.visionCLVECount +
      mutuallyExclusiveCounts.screeningsCLVEVisionDevicesCount +
      mutuallyExclusiveCounts.screeningsCLVEVisionCounsellingCount +
      mutuallyExclusiveCounts.screeningsCLVEVisionTrainingCount +
      mutuallyExclusiveCounts.screeningsCLVEVisionDevicesCounsellingCount +
      mutuallyExclusiveCounts.screeningsCLVEVisionDevicesTrainingCount +
      mutuallyExclusiveCounts.screeningsCLVEVisionCounsellingTrainingCount +
      mutuallyExclusiveCounts.screeningsCLVEVisionDevicesCounsellingTrainingCount +
      mutuallyExclusiveCounts.visionEnhancementOnlyCount +
      mutuallyExclusiveCounts.screeningsVisionEnhancementCount +
      mutuallyExclusiveCounts.clveOnlyCount +
      mutuallyExclusiveCounts.trainingOnlyCount +
      mutuallyExclusiveCounts.counsellingOnlyCount +
      mutuallyExclusiveCounts.devicesOnlyCount +
      mutuallyExclusiveCounts.trainingCounsellingOnlyCount +
      mutuallyExclusiveCounts.trainingDevicesOnlyCount +
      mutuallyExclusiveCounts.counsellingDevicesOnlyCount +
      mutuallyExclusiveCounts.trainingDevicesCounsellingOnlyCount;

    formattedCounts["Total_Beneficiaries_Calculated"] = totalBeneficiariesCalculated;
    formattedCounts["Mutually_Exclusive_Categories"] = mutuallyExclusiveCounts;

    // **Return the Response Including the New Counts**
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
