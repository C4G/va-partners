import prisma from "@/utils/api/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { updateUserLastModified } from "@/utils/api/update-user-last-modified";
import moment from "moment";

const distanceBinocularVisionMapping = {
  "4.0 LogMAR": "Blindness",
  "3.5 LogMAR": "Blindness",
  "2.7 LogMAR": "Blindness",
  "2.3 LogMAR": "Blindness",
  "2.0 LogMAR": "Blindness",
  "1.92 LogMAR": "Blindness",
  "1.8 LogMAR": "Blindness",
  "1.7 LogMAR": "Blindness",
  "1.6 LogMAR": "Blindness",
  "1.52 LogMAR": "Blindness",
  "1.4 LogMAR": "Blindness",
  "1.3 LogMAR": "Severe visual impairment",
  "1.22 LogMAR": "Severe visual impairment",
  "1.1 LogMAR": "Severe visual impairment",
  "1.0 LogMAR": "Moderate visual impairment",
  "0.92 LogMAR": "Moderate visual impairment",
  "0.8 LogMAR": "Moderate visual impairment",
  "0.7 LogMAR": "Moderate visual impairment",
  "0.6 LogMAR": "Moderate visual impairment",
  "0.5 LogMAR": "Mild visual impairment",
  "0.4 LogMAR": "Mild visual impairment",
  "0.3 LogMAR": "Visual Acuity normal",
  "0.22 LogMAR": "Visual Acuity normal",
  "0.1 LogMAR": "Visual Acuity normal",
  "0.0 LogMAR": "Visual Acuity normal",
  "PL- 6m": "Blindness",
  "PL+: PR inaccurate 6m": "Blindness",
  "PL+: PR accurate 6m": "Blindness",
  "HMCF 6m": "Blindness",
  "CFCF 6m": "Blindness",
  "6/600 6m": "Blindness",
  "6/480 6m": "Blindness",
  "6/380 6m": "Blindness",
  "6/300 6m": "Blindness",
  "6/240 6m": "Blindness",
  "6/190 6m": "Blindness",
  "6/150 6m": "Blindness",
  "6/126 6m": "Severe visual impairment",
  "6/95 6m": "Severe visual impairment",
  "6/75 6m": "Severe visual impairment",
  "6/60 6m": "Moderate visual impairment",
  "6/48 6m": "Moderate visual impairment",
  "6/38 6m": "Moderate visual impairment",
  "6/30 6m": "Moderate visual impairment",
  "6/24 6m": "Moderate visual impairment",
  "6/19 6m": "Mild visual impairment",
  "6/15 6m": "Mild visual impairment",
  "6/12 6m": "Visual Acuity normal",
  "6/9.5 6m": "Visual Acuity normal",
  "6/7.5 6m": "Visual Acuity normal",
  "6/6.0 6m": "Visual Acuity normal",
  "PL- 20ft": "Blindness",
  "PL+: PR inaccurate 20ft": "Blindness",
  "PL+: PR accurate 20ft": "Blindness",
  "HMCF 20ft": "Blindness",
  "CFCF 20ft": "Blindness",
  "20/2000 20ft": "Blindness",
  "20/1600 20ft": "Blindness",
  "20/1250 20ft": "Blindness",
  "20/1000 20ft": "Blindness",
  "20/800 20ft": "Blindness",
  "20/630 20ft": "Blindness",
  "20/500 20ft": "Blindness",
  "20/400 20ft": "Severe visual impairment",
  "20/320 20ft": "Severe visual impairment",
  "20/250 20ft": "Severe visual impairment",
  "20/200 20ft": "Moderate visual impairment",
  "20/160 20ft": "Moderate visual impairment",
  "20/125 20ft": "Moderate visual impairment",
  "20/100 20ft": "Moderate visual impairment",
  "20/80 20ft": "Moderate visual impairment",
  "20/63 20ft": "Mild visual impairment",
  "20/50 20ft": "Mild visual impairment",
  "20/40 20ft": "Visual Acuity normal",
  "20/32 20ft": "Visual Acuity normal",
  "20/25 20ft": "Visual Acuity normal",
  "20/20 20ft": "Visual Acuity normal",
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

const specificCounselingCategories = [
  "Counseled and Shortlisted for Smart vision glasses",
  "Counseled and Shortlisted for Smartphone",
  "Educational guidance",
  "Life skills training/ Home management / Kitchen skills",
  "Referral to computer applications & technology training",
  "Referral to mobile technology training",
  "Referral to orientation and mobility – training",
  "Referral to Vision-Aid online training programs",
  "Referral to vocational training",
  "Self-care and Activities of daily living",
  "Counseling to the parents/ family/caretaker",
  "Other",
  "Referral to a special school",
  "Referral to Genetic Counseling",
  "Referral to Vision-Aid for Job Placement",
];

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: "Unauthorized" });

  await updateUserLastModified("dashboard/count", req.method, session.user.email);

  if (req.method === "GET") {
    return readData(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function readData(req, res) {
  try {
    const { hospitalIds, startDate, endDate, genders, mdvis, min_age, max_age } = req.query;

    // Parse hospital IDs
    let parsedHospitalIds = [];
    if (hospitalIds) {
      parsedHospitalIds = Array.isArray(hospitalIds)
        ? hospitalIds.map(Number).filter((id) => !isNaN(id))
        : [Number(hospitalIds)].filter((id) => !isNaN(id));
    }
    if (parsedHospitalIds.length === 0) {
      return res.status(400).json({ error: "hospitalIds is required and must be valid integers" });
    }

    // Date range
    const parsedStartDate = startDate ? moment.utc(startDate).startOf("day").toDate() : null;
    const parsedEndDate = endDate ? moment.utc(endDate).endOf("day").toDate() : null;
    const dateRangeCondition =
      parsedStartDate && parsedEndDate ? { gte: parsedStartDate, lte: parsedEndDate } : undefined;

    // Filters
    const genderFilters = genders ? (Array.isArray(genders) ? genders : [genders]) : [];
    const mdviFilters = mdvis ? (Array.isArray(mdvis) ? mdvis : [mdvis]) : [];

    const minAgeVal = min_age ? parseInt(min_age, 10) : undefined;
    const maxAgeVal = max_age ? parseInt(max_age, 10) : undefined;
    const today = new Date();
    let dateOfBirthFilter = {};
    if (minAgeVal !== undefined) {
      const maxDateOfBirth = new Date(today.getFullYear() - minAgeVal, today.getMonth(), today.getDate() + 1);
      dateOfBirthFilter.lte = maxDateOfBirth;
    }
    if (maxAgeVal !== undefined) {
      const minDateOfBirth = new Date(today.getFullYear() - maxAgeVal - 1, today.getMonth(), today.getDate() + 1);
      dateOfBirthFilter.gte = minDateOfBirth;
    }

    const beneficiaryFilters = {
      hospitalId: { in: parsedHospitalIds },
      deleted: false,
      ...(genderFilters.length > 0 && { gender: { in: genderFilters } }),
      ...(mdviFilters.length > 0 && { mDVI: { in: mdviFilters } }),
      ...(Object.keys(dateOfBirthFilter).length > 0 && { dateOfBirth: dateOfBirthFilter }),
    };

    const subtypes = [
      "Training",
      "Computer_Training",
      "Mobile_Training",
      "Orientation_Mobility_Training",
      "Vision_Enhancement",
      "Counselling_Education",
      "Comprehensive_Low_Vision_Evaluation",
      "Low_Vision_Evaluation",
      "Community_Screening",
    ];

    const activitySubtypes = ["Screenings", "Vision_Enhancement", "CLVE", "Counselling", "Training"];

    const activityModelMap = {
      Screenings: prisma.Low_Vision_Evaluation,
      Vision_Enhancement: prisma.Vision_Enhancement,
      CLVE: prisma.Comprehensive_Low_Vision_Evaluation,
      Counselling: prisma.Counselling_Education,
      Training: prisma.Training,
    };

    const modelMap = {
      Training: prisma.Training,
      Computer_Training: prisma.Computer_Training,
      Mobile_Training: prisma.Mobile_Training,
      Orientation_Mobility_Training: prisma.Orientation_Mobility_Training,
      Vision_Enhancement: prisma.Vision_Enhancement,
      Counselling_Education: prisma.Counselling_Education,
      Comprehensive_Low_Vision_Evaluation: prisma.Comprehensive_Low_Vision_Evaluation,
      Low_Vision_Evaluation: prisma.Low_Vision_Evaluation,
      Community_Screening: prisma.Community_Screening,
    };

    // const uniqueBeneficiariesCondition = dateRangeCondition
    //   ? { OR: subtypes.map(st => ({ [st]: { some: { date: dateRangeCondition } } })) }
    //   : {};

    // Pre-fetch beneficiaries once
    const selectedBeneficiaries = await prisma.Beneficiary.findMany({
      where: beneficiaryFilters,
      select: { mrn: true, hospitalId: true, dateOfBirth: true, gender: true },
    });

    let uniqueBenefIds = new Set();
    if (dateRangeCondition) {
      // We need to find those with activity in the date range
      const activityPromises = subtypes.map((st) =>
        modelMap[st].findMany({
          where: {
            beneficiary: beneficiaryFilters,
            ...(dateRangeCondition && { date: dateRangeCondition }),
          },
          distinct: ["beneficiaryId", "hospitalId"],
          select: { beneficiaryId: true, hospitalId: true },
        })
      );
      const activityResults = await Promise.all(activityPromises);
      for (const arr of activityResults) {
        for (const r of arr) {
          uniqueBenefIds.add(`${r.beneficiaryId}-${r.hospitalId}`);
        }
      }
    } else {
      // No date filter: all beneficiaries are unique
      for (const b of selectedBeneficiaries) {
        uniqueBenefIds.add(`${b.mrn}-${b.hospitalId}`);
      }
    }

    const filteredBeneficiaries = dateRangeCondition
      ? selectedBeneficiaries.filter((b) => uniqueBenefIds.has(`${b.mrn}-${b.hospitalId}`))
      : selectedBeneficiaries;

    const totalBeneficiariesCount = filteredBeneficiaries.length;
    const uniqueBeneficiariesCount = uniqueBenefIds.size;

    const formattedCounts = {
      Total_Beneficiaries: totalBeneficiariesCount,
      Unique_Beneficiaries: uniqueBeneficiariesCount,
    };

    // Compute subtype counts
    const subtypeCountPromises = subtypes.map((st) =>
      modelMap[st].count({
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
      })
    );
    const subtypeCounts = await Promise.all(subtypeCountPromises);
    for (let i = 0; i < subtypes.length; i++) {
      formattedCounts[subtypes[i]] = subtypeCounts[i];
    }

    // If multiple hospitals, build Activity_Counts_Per_Hospital
    let activityCountsPerHospital = {};
    if (parsedHospitalIds.length > 1) {
      // Compute totals/uniques per hospital from selectedBeneficiaries and uniqueBenefIds
      const totalByHospitalMap = {};
      for (const b of filteredBeneficiaries) {
        totalByHospitalMap[b.hospitalId] = (totalByHospitalMap[b.hospitalId] || 0) + 1;
      }

      const uniqueByHospitalMap = {};
      for (const key of uniqueBenefIds) {
        const [, hospId] = key.split("-");
        const hid = parseInt(hospId, 10);
        uniqueByHospitalMap[hid] = (uniqueByHospitalMap[hid] || 0) + 1;
      }

      // subtype per hospital
      const subtypePerHospitalPromises = subtypes.map((st) =>
        modelMap[st].findMany({
          where: {
            beneficiary: beneficiaryFilters,
            ...(dateRangeCondition && { date: dateRangeCondition }),
          },
          select: { beneficiaryId: true, hospitalId: true },
        })
      );

      const subtypePerHospitalResultsRaw = await Promise.all(subtypePerHospitalPromises);
      const subtypePerHospitalMap = {};
      for (let i = 0; i < subtypes.length; i++) {
        const st = subtypes[i];
        const records = subtypePerHospitalResultsRaw[i];
        const countByHospital = {};
        for (const r of records) {
          countByHospital[r.hospitalId] = (countByHospital[r.hospitalId] || 0) + 1;
        }
        subtypePerHospitalMap[st] = countByHospital;
      }

      for (const hid of parsedHospitalIds) {
        const totalB = totalByHospitalMap[hid] || 0;
        const uniqueB = uniqueByHospitalMap[hid] || 0;
        activityCountsPerHospital[hid] = {
          Total_Beneficiaries: totalB,
          Unique_Beneficiaries: uniqueB,
        };
        let totalSessions = 0;
        for (const st of subtypes) {
          const c = subtypePerHospitalMap[st][hid] || 0;
          activityCountsPerHospital[hid][st] = c;
          totalSessions += c;
        }
        activityCountsPerHospital[hid]["Total_Sessions"] = totalSessions;
      }

      formattedCounts["Activity_Counts_Per_Hospital"] = activityCountsPerHospital;
    }

    // Training & Counselling breakdown
    const [trainingGrouped, counsellingTypeCountsArray] = await Promise.all([
      prisma.Training.groupBy({
        by: ["type", "subType"],
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
        _count: { _all: true },
      }),
      prisma.Counselling_Education.groupBy({
        by: ["type"],
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
        _count: { _all: true },
      }),
    ]);

    const trainingTypeCounts = {};
    const trainingSubTypeCounts = {};
    for (const item of trainingGrouped) {
      const rawSub = item.subType ? item.subType.trim() : "Other";
      const mappedSubType = trainingCategories.includes(rawSub) ? rawSub : "Other";
      const c = item._count._all;
      trainingTypeCounts["Training"] = (trainingTypeCounts["Training"] || 0) + c;
      if (!trainingSubTypeCounts["Training"]) trainingSubTypeCounts["Training"] = {};
      trainingSubTypeCounts["Training"][mappedSubType] = (trainingSubTypeCounts["Training"][mappedSubType] || 0) + c;
    }

    const counsellingTypeCounts = {};
    for (const item of counsellingTypeCountsArray) {
      const rawType = item.type ? item.type.trim() : "Other";
      const mappedType = specificCounselingCategories.includes(rawType) ? rawType : "Other";
      counsellingTypeCounts[mappedType] = (counsellingTypeCounts[mappedType] || 0) + item._count._all;
    }

    formattedCounts["Training_Types"] = trainingTypeCounts;
    formattedCounts["Training_Subtypes"] = trainingSubTypeCounts;
    formattedCounts["Counselling_Types"] = counsellingTypeCounts;

    // Devices from CLVE
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

    const devicesDispensedCounts = { Spectacle: 0, Electronic: 0, Optical: 0, NonOptical: 0 };
    const devicesRecommendedCounts = { Spectacle: 0, Electronic: 0, Optical: 0, NonOptical: 0 };
    const devicesDispensedDetails = { Spectacle: {}, Electronic: {}, Optical: {}, NonOptical: {} };
    const devicesRecommendedDetails = { Spectacle: {}, Electronic: {}, Optical: {}, NonOptical: {} };

    for (const record of clveRecords) {
      for (const type of ["Spectacle", "Electronic", "Optical", "NonOptical"]) {
        const dField = `dispensed${type}`;
        const rField = `recommendation${type}`;
        if (record[dField]) {
          const devices = record[dField]
            .split(";")
            .map((d) => d.trim())
            .filter(Boolean);
          for (const dev of devices) {
            devicesDispensedCounts[type]++;
            devicesDispensedDetails[type][dev] = (devicesDispensedDetails[type][dev] || 0) + 1;
          }
        }
        if (record[rField]) {
          const devices = record[rField]
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean);
          for (const dev of devices) {
            devicesRecommendedCounts[type]++;
            devicesRecommendedDetails[type][dev] = (devicesRecommendedDetails[type][dev] || 0) + 1;
          }
        }
      }
    }

    formattedCounts["Devices_Dispensed"] = devicesDispensedCounts;
    formattedCounts["Devices_Recommended"] = devicesRecommendedCounts;
    formattedCounts["Devices_Dispensed_Details"] = devicesDispensedDetails;
    formattedCounts["Devices_Recommended_Details"] = devicesRecommendedDetails;

    // Now compute gender and age from filteredBeneficiaries, not selectedBeneficiaries.
    const genderCountsFormatted = { Male: 0, Female: 0, Other: 0 };
    const ageGroups = { "0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "66+": 0 };

    for (const b of filteredBeneficiaries) {
      const g = b.gender;
      if (g === "Male") genderCountsFormatted.Male++;
      else if (g === "Female") genderCountsFormatted.Female++;
      else genderCountsFormatted.Other++;

      const age = calculateAge(b.dateOfBirth);
      if (age !== null) {
        if (age <= 18) ageGroups["0-18"]++;
        else if (age <= 35) ageGroups["19-35"]++;
        else if (age <= 50) ageGroups["36-50"]++;
        else if (age <= 65) ageGroups["51-65"]++;
        else ageGroups["66+"]++;
      }
    }

    formattedCounts["genderCounts"] = genderCountsFormatted;
    formattedCounts["ageGroupCounts"] = ageGroups;

    // Visual Acuity
    const distanceBinocularCounts = await prisma.Comprehensive_Low_Vision_Evaluation.groupBy({
      by: ["distanceBinocularVisionBE"],
      where: {
        beneficiary: beneficiaryFilters,
        ...(dateRangeCondition && { date: dateRangeCondition }),
      },
      _count: { distanceBinocularVisionBE: true },
    });

    const distanceBinocularVisionBE_counts = {
      Blindness: 0,
      "Severe visual impairment": 0,
      "Moderate visual impairment": 0,
      "Mild visual impairment": 0,
      "Visual Acuity normal": 0,
    };

    for (const record of distanceBinocularCounts) {
      const category = distanceBinocularVisionMapping[record.distanceBinocularVisionBE] || "Other";
      if (Object.prototype.hasOwnProperty.call(distanceBinocularVisionBE_counts, category)) {
        distanceBinocularVisionBE_counts[category] += record._count.distanceBinocularVisionBE;
      }
    }
    formattedCounts["distanceBinocularVisionBE_counts"] = distanceBinocularVisionBE_counts;

    // Unique Beneficiaries By Activity
    // Already have activities from previous queries? We can re-use or fetch again:
    const uniqueByActivityPromises = activitySubtypes.map((act) =>
      activityModelMap[act].findMany({
        where: {
          beneficiary: beneficiaryFilters,
          ...(dateRangeCondition && { date: dateRangeCondition }),
        },
        distinct: ["beneficiaryId", "hospitalId"],
        select: { beneficiaryId: true, hospitalId: true },
      })
    );
    const uniqueByActivityResultsArr = await Promise.all(uniqueByActivityPromises);
    const uniqueBeneficiariesByActivity = {};
    activitySubtypes.forEach((act, i) => {
      uniqueBeneficiariesByActivity[act] = uniqueByActivityResultsArr[i].length;
    });
    formattedCounts["Unique_Beneficiaries_By_Activity"] = uniqueBeneficiariesByActivity;

    // Unique Beneficiaries By Activity Per Hospital
    // Pre-fetch hospital names in one query
    const hospitalsData = await prisma.Hospital.findMany({
      where: { id: { in: parsedHospitalIds } },
      select: { id: true, name: true },
    });
    const hospitalMap = {};
    for (const h of hospitalsData) {
      hospitalMap[h.id] = h.name || `Hospital ${h.id}`;
    }

    const uniqueByActivityBenefIdsResults = uniqueByActivityResultsArr.map((records, idx) => ({
      activity: activitySubtypes[idx],
      records,
    }));

    const uniqueByActivityPerHospital = {};
    for (const hid of parsedHospitalIds) {
      uniqueByActivityPerHospital[hospitalMap[hid]] = {};
    }

    for (const { activity, records } of uniqueByActivityBenefIdsResults) {
      const perHospitalCount = {};
      for (const r of records) {
        perHospitalCount[r.hospitalId] = (perHospitalCount[r.hospitalId] || 0) + 1;
      }
      for (const hid of parsedHospitalIds) {
        uniqueByActivityPerHospital[hospitalMap[hid]][activity] = perHospitalCount[hid] || 0;
      }
    }

    formattedCounts["Unique_Beneficiaries_By_Activity_Per_Hospital"] = uniqueByActivityPerHospital;

    return res.status(200).json({
      ...formattedCounts,
      parsedHospitalIds,
      parsedStartDate,
      parsedEndDate,
    });
  } catch (error) {
    console.error("Error in readData:", error);
    return res.status(500).json({ error: error.message });
  }
}
