/** 
* API Endpoints for Dashboard "beneficiary", "vision-enhancement", "training", 
* "comprehensive-low-vision-evaluation", and "counseling" functionality.
* Uses Next.js Dynamic Routes to consolodate into one module.
*/

import prisma from "@/utils/api/client";

export default async function handler(req, res) {
  const { type } = req.query;
  const validTypes = ["Beneficiary", "Vision_Enhancement", "Training", 
      "Comprehensive_Low_Vision_Evaluation", "Counselling_Education"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Bad request" });
  }

  if (req.method == "GET") {
    return await readData(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

/** Offset-Pagination */
export async function readData(req, res) {
  try {
    const { type } = req.query;
    const { hospitalIds, offset, limit, startDate, endDate } = req.query;
    
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
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    parsedStartDate?.setUTCHours(0, 0, 0, 0);  
    parsedEndDate?.setUTCHours(23, 59, 59, 999); 
    const range = (parsedStartDate || parsedEndDate) ? { 
      gte: parsedStartDate,
      lte: parsedEndDate,
    } : undefined;

    let records;
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
          ...(range && {
            OR: subtypes.map(subtype => ({
              [subtype]: { some: { date: range } }
            }))
          })
        },
        skip: parsedOffset,
        take: parsedLimit,
      })
    }
    else {
      records = await prisma[type].findMany({
        where: {
          beneficiary: {
            deleted: false,
            hospitalId: { in: parsedHospitalIds },
          },
          date: range,
        },
        skip: parsedOffset,
        take: parsedLimit,
      });
    }

    // If called by index.js return as is or throw error VS return response
    if (req.query.indexHelper === "true") {
      return {
        records,
        type,
        parsedHospitalIds,
        parsedStartDate,
        parsedEndDate,
        parsedOffset,
        parsedLimit,
      }
    } else {
      return res.status(200).json({ 
        records,
        type,
        parsedHospitalIds,
        parsedStartDate,
        parsedEndDate,
        parsedOffset,
        parsedLimit,
      });
    }
  } catch (error) {
    console.error(error);
    if (req.query.indexHelper == "true") {
      throw error;
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}