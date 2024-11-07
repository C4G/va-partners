import prisma from "@/utils/api/client";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return await getBeneficiariesWithDetails(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function getBeneficiariesWithDetails(req, res) {
  try {
    const { hospitalIds, startDate, endDate } = req.query;

    let parsedHospitalIds;
    if (Array.isArray(hospitalIds)) {
      parsedHospitalIds = hospitalIds.map((id) => parseInt(id, 10));
    } else if (typeof hospitalIds === "string") {
      parsedHospitalIds = [parseInt(hospitalIds, 10)];
    } else {
      parsedHospitalIds = undefined;
    }

    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    parsedStartDate?.setUTCHours(0, 0, 0, 0);
    parsedEndDate?.setUTCHours(23, 59, 59, 999);
    const range =
      parsedStartDate && parsedEndDate
        ? {
            gte: parsedStartDate,
            lte: parsedEndDate,
          }
        : undefined;

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

    const beneficiaries = await prisma.Beneficiary.findMany({
      where: {
        deleted: false,
        hospitalId: { in: parsedHospitalIds },
        ...(range && {
          OR: subtypes.map((subtype) => ({
            [subtype]: { some: { date: range } },
          })),
        }),
      },
      include: {
        hospital: true,
        Vision_Enhancement: true,
        Counselling_Education: true,
        Comprehensive_Low_Vision_Evaluation: true,
        Low_Vision_Evaluation: true,
        Training: true,
        Computer_Training: true,
        Mobile_Training: true,
        Orientation_Mobility_Training: true,
      },
    });

    return res.status(200).json({ records: beneficiaries });
  } catch (error) {
    console.error("Error fetching beneficiaries with details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
