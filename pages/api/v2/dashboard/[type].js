// /** 
// * API Endpoints for Dashboard "beneficiary", "vision-enhancement", "training", 
// * "comprehensive-low-vision-evaluation", and "counseling" functionality.
// * Uses Next.js Dynamic Routes to consolodate into one module.
// */

import prisma from "@/utils/api/client";

export default async function handler(req, res) {
  const { type } = req.query;
  const validTypes = ["Beneficiary", "Vision_Enhancement", "Training", 
      "Comprehensive_Low_Vision_Evaluation", "Counselling_Education", "Low_Vision_Evaluation"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Bad request" });
  }

  if (req.method == "GET") {
    return await readData(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

export async function readData(req, res) {
  try {
    const { type } = req.query;
    const { hospitalIds, offset, limit, startDate, endDate, genders, mdvis, min_age, max_age } = req.query;
    
    // Parse hospitalIds
    let parsedHospitalIds;
    if (Array.isArray(hospitalIds)) {
      parsedHospitalIds = hospitalIds.map(id => parseInt(id, 10)) 
    }
    else if (typeof hospitalIds === 'string') {
      parsedHospitalIds = [parseInt(hospitalIds, 10)]; 
    }
    else {
      parsedHospitalIds = undefined;
    }

    // Parse other query parameters
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    parsedStartDate?.setUTCHours(0, 0, 0, 0);  
    parsedEndDate?.setUTCHours(23, 59, 59, 999); 

    const parsedMinAge = min_age ? parseInt(min_age, 10) : undefined;
    const parsedMaxAge = max_age ? parseInt(max_age, 10) : undefined;

    // Parse genders
    let parsedGenders = [];
    if (Array.isArray(genders)) {
      parsedGenders = genders;
    } else if (typeof genders === 'string') {
      parsedGenders = [genders];
    }

    // Expand genders: 'Male' to ['Male', 'M'], 'Female' to ['Female', 'F'], 'Other' remains as ['Other']
    parsedGenders = parsedGenders.flatMap(gender => {
      if (gender === 'Male') return ['Male', 'M'];
      if (gender === 'Female') return ['Female', 'F'];
      if (gender === 'Other') return ['Other'];
      return [gender]; // default case
    });

    // Parse mdvis
    let parsedMdvis = [];
    if (Array.isArray(mdvis)) {
      parsedMdvis = mdvis;
    } else if (typeof mdvis === 'string') {
      parsedMdvis = [mdvis];
    }

    // Calculate date of birth range based on age
    let dobFilter = undefined;
    if (parsedMinAge !== undefined || parsedMaxAge !== undefined) {
      const currentDate = new Date();
      let minDOB = undefined;
      let maxDOB = undefined;

      if (parsedMinAge !== undefined) {
        minDOB = new Date(
          currentDate.getFullYear() - parsedMinAge,
          currentDate.getMonth(),
          currentDate.getDate() + 1 // Adjust date to include today
        );
      }
      if (parsedMaxAge !== undefined) {
        maxDOB = new Date(
          currentDate.getFullYear() - parsedMaxAge,
          currentDate.getMonth(),
          currentDate.getDate()
        );
      }

      dobFilter = {
        ...(minDOB && { gte: maxDOB }), // Note the swap of minDOB and maxDOB
        ...(maxDOB && { lte: minDOB }),
      };
    }

    const range = (parsedStartDate || parsedEndDate) ? { 
      gte: parsedStartDate,
      lte: parsedEndDate,
    } : undefined;

    let records, totalRecords;
    if (type === "Beneficiary") {
      const subtypes = [
        'Training',
        'Computer_Training',
        'Mobile_Training',
        'Orientation_Mobility_Training',
        'Vision_Enhancement',
        'Counselling_Education',
        'Comprehensive_Low_Vision_Evaluation',
        'Low_Vision_Evaluation'
      ];

      records = await prisma.Beneficiary.findMany({
        where: {
          deleted: false,
          hospitalId: { in: parsedHospitalIds },
          ...(parsedGenders.length > 0 && { gender: { in: parsedGenders } }),
          ...(parsedMdvis.length > 0 && { mDVI: { in: parsedMdvis } }),
          ...(dobFilter && { dateOfBirth: dobFilter }),
          ...(range && {
            OR: subtypes.map(subtype => ({
              [subtype]: { some: { date: range } }
            }))
          })
        },
        include: {
          hospital: true
        },
        skip: parsedOffset,
        take: parsedLimit,
      });
      totalRecords = await prisma.Beneficiary.count({
        where: {
          deleted: false,
          hospitalId: { in: parsedHospitalIds },
          ...(parsedGenders.length > 0 && { gender: { in: parsedGenders } }),
          ...(parsedMdvis.length > 0 && { mDVI: { in: parsedMdvis } }),
          ...(dobFilter && { dateOfBirth: dobFilter }),
          ...(range && {
            OR: subtypes.map(subtype => ({
              [subtype]: { some: { date: range } }
            }))
          })
        },
      });
    }
    else {
      records = await prisma[type].findMany({
        where: {
          beneficiary: {
            deleted: false,
            hospitalId: { in: parsedHospitalIds },
            ...(parsedGenders.length > 0 && { gender: { in: parsedGenders } }),
            ...(parsedMdvis.length > 0 && { mDVI: { in: parsedMdvis } }),
            ...(dobFilter && { dateOfBirth: dobFilter }),
          },
          date: range,
        },
        include: {
          beneficiary: {
            include: {
              hospital: true,
            },
          },
        },
        skip: parsedOffset,
        take: parsedLimit,
      });
      totalRecords = await prisma[type].count({
        where: {
          beneficiary: {
            deleted: false,
            hospitalId: { in: parsedHospitalIds },
            ...(parsedGenders.length > 0 && { gender: { in: parsedGenders } }),
            ...(parsedMdvis.length > 0 && { mDVI: { in: parsedMdvis } }),
            ...(dobFilter && { dateOfBirth: dobFilter }),
          },
          date: range,
        },
      });
    }

    return res.status(200).json({ 
      records,
      totalRecords,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
