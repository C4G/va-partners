import prisma from "@/utils/api/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { updateUserLastModified } from "@/utils/api/update-user-last-modified";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: "You must be logged in." });
    return;
  }
  await updateUserLastModified("communityScreening", req.method, session.user.email);
  if (req.method === "POST") {
    return await addData(req, res);
  } else if (req.method == "DELETE") {
    return await deleteData(req, res);
  } else if (req.method == "GET") {
    return await readData(req, res);
  } else if (req.method == "PATCH") {
    return await updateData(req, res);
  } else {
    return res.status(405).json({ message: "Method not allowed", success: false });
  }
}

async function updateData(req, res) {
  try {
    const { id, ...data } = req.body;
    const updatedRecord = await prisma.community_Screening.update({
      where: { id },
      data,
    });
    res.status(200).json(updatedRecord);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Failed to update community screening data." });
  }
}

async function readData() {}

async function deleteData(req, res) {
  const body = req.body;
  try {
    const record = await prisma.community_Screening.delete({
      where: { id: body.id },
    });
    return res.status(200).json(record, { success: true });
  } catch (error) {
    console.log("Request error " + error);
    res.status(500).json({ error: "Error deleting Community Screening Data" + error, success: false });
  }
}

async function addData(req, res) {
  const body = req.body;
  const create = {
    data: {
      beneficiaryId: body.beneficiaryId,
      hospitalId: body.hospitalId,
      mdvi: body.mdvi,
      diagnosis: body.diagnosis,
      date: body.date,
      sessionNumber: body.sessionNumber,
      uncorrectedDistanceRE: body.uncorrectedDistanceRE,
      uncorrectedDistanceLE: body.uncorrectedDistanceLE,
      uncorrectedDistanceBE: body.uncorrectedDistanceBE,
      uncorrectedNearRE: body.uncorrectedNearRE,
      uncorrectedNearLE: body.uncorrectedNearLE,
      uncorrectedNearBE: body.uncorrectedNearBE,
      bestCorrectedDistanceRE: body.bestCorrectedDistanceRE,
      bestCorrectedDistanceLE: body.bestCorrectedDistanceLE,
      bestCorrectedDistanceBE: body.bestCorrectedDistanceBE,
      bestCorrectedNearRE: body.bestCorrectedNearRE,
      bestCorrectedNearLE: body.bestCorrectedNearLE,
      bestCorrectedNearBE: body.bestCorrectedNearBE,
      recommendationSpectacle: body.recommendationSpectacle,
      dispensedSpectacle: body.dispensedSpectacle,
      costSpectacle: body.costSpectacle,
      costToBeneficiarySpectacle: body.costToBeneficiarySpectacle,
      dispensedDateSpectacle: body.dispensedDateSpectacle,
      trainingGivenSpectacle: body.trainingGivenSpectacle,
      extraInformation: body.extraInformation,
    },
    include: {
      beneficiary: true,
    },
  };
  try {
    if (body.id != null) {
      const update = {
        where: {
          id: body.id,
        },
        data: {
          mdvi: body.mdvi,
          diagnosis: body.diagnosis,
          date: body.date,
          sessionNumber: body.sessionNumber,
          uncorrectedDistanceRE: body.uncorrectedDistanceRE,
          uncorrectedDistanceLE: body.uncorrectedDistanceLE,
          uncorrectedDistanceBE: body.uncorrectedDistanceBE,
          uncorrectedNearRE: body.uncorrectedNearRE,
          uncorrectedNearLE: body.uncorrectedNearLE,
          uncorrectedNearBE: body.uncorrectedNearBE,
          bestCorrectedDistanceRE: body.bestCorrectedDistanceRE,
          bestCorrectedDistanceLE: body.bestCorrectedDistanceLE,
          bestCorrectedDistanceBE: body.bestCorrectedDistanceBE,
          bestCorrectedNearRE: body.bestCorrectedNearRE,
          bestCorrectedNearLE: body.bestCorrectedNearLE,
          bestCorrectedNearBE: body.bestCorrectedNearBE,
          recommendationSpectacle: body.recommendationSpectacle,
          dispensedSpectacle: body.dispensedSpectacle,
          costSpectacle: body.costSpectacle,
          costToBeneficiarySpectacle: body.costToBeneficiarySpectacle,
          dispensedDateSpectacle: body.dispensedDateSpectacle,
          trainingGivenSpectacle: body.trainingGivenSpectacle,
          extraInformation: body.extraInformation,
        },
        include: {
          beneficiary: true,
        },
      };
      const record = await prisma.community_Screening.update(update);
      return res.status(200).json(record, { success: true });
    }
    const record = await prisma.community_Screening.create(create);
    return res.status(200).json(record, { success: true });
  } catch (error) {
    console.log("Request error " + error);
    res.status(500).json({ error: "Error adding community screening" + error, success: false });
  }
}
