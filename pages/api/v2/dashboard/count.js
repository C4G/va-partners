import prisma from "@/utils/api/client";
//import { getServerSession } from "next-auth";
//import { authOptions } from "../../auth/[...nextauth]";
//import { updateUserLastModified } from "@/global/update-user-last-modified";

export default async function handler(req, res) {
  // const session = await getServerSession(req, res, authOptions);
  // if (!session) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }

  // await updateUserLastModified(prisma, "dashboard/count", req.method,
  //   session.user.email);

  if (req.method == "GET") {
    return await readData(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

export async function readData(req, res) {
  try {
    const { hospitalIds, startDate, endDate } = req.query;

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
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    parsedStartDate?.setUTCHours(0, 0, 0, 0);  
    parsedEndDate?.setUTCHours(23, 59, 59, 999); 
    const range = (parsedStartDate || parsedEndDate) ? { 
      gte: parsedStartDate,
      lte: parsedEndDate,
    } : undefined;

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

    const counts = await Promise.all([
      prisma.Beneficiary.count({
        where: {
          deleted: false,
          hospitalId: { in: parsedHospitalIds },
          ...(range && {
            OR: subtypes.map(subtype => ({
              [subtype]: { some: { date: range } }
            }))
          })
        }
      }),
      ...subtypes.map(subtype => 
        prisma[subtype].count({
          where: {
            beneficiary: {
              deleted: false,
              hospitalId: { in: parsedHospitalIds },
            },
            date: range,
          }
        })
      )
    ]);

    const formattedCounts = {};
    formattedCounts["Beneficiary"] = counts[0];
    for (let i = 0; i < subtypes.length; i++) {
      formattedCounts[subtypes[i]] = counts[i + 1];
    }

    // If called by index.js return as is or throw error VS return response
    if (req.query.indexHelper == "true") {
      return {
        ...formattedCounts,
        parsedHospitalIds,
        parsedStartDate,
        parsedEndDate,
      };
    }
    else {
      return res.status(200).json({
        ...formattedCounts,
        parsedHospitalIds,
        parsedStartDate,
        parsedEndDate,
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

