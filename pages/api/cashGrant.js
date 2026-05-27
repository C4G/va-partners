import prisma from "@/utils/api/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "You must be logged in." });
  }

  switch (req.method) {
    case "GET":
      return readData(req, res);
    case "POST":
      return addData(req, res);
    case "PUT":
      return updateData(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

async function addData(req, res) {
  try {
    const body = req.body;

    const cashGrant = await prisma.cashGrant.create({
      data: {
        quarter: body.quarter,
        year: Number(body.year),
        hospital: String(body.hospitalId),
        budgetHead: body.budgetHead,

        openingBalance: parseFloatOrNull(body.openingBalance),
        amountReceived: parseFloatOrNull(body.amountReceived),
        dateOfReceipt: body.dateOfReceipt
          ? new Date(body.dateOfReceipt)
          : null,
        remarks: body.remarks || null,
        closingBalance: parseFloatOrNull(body.closingBalance),

        manpowerCost: parseFloatOrNull(body.manpowerCost),
        equipmentCost: parseFloatOrNull(body.equipmentCost),
        operationalExpenses: parseFloatOrNull(body.operationalExpenses),
        freeLVDs: parseFloatOrNull(body.freeLVDs),
        trainingCosts: parseFloatOrNull(body.trainingCosts),
        additionalCosts: parseFloatOrNull(body.additionalCosts),
        details: body.details || null,
      },
    });

    return res.status(200).json(cashGrant);
  } catch (error) {
    console.error("CREATE ERROR:", error);
    return res.status(500).json({
      error: "Error adding cashGrant",
      success: false,
    });
  }
}

export async function findAllGrants() {
  return prisma.cashGrant.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function readData(req, res) {
  try {
    const { quarter, year, hospitalId } = req.query;

    const cashGrants = await prisma.cashGrant.findMany({
      where: {
        ...(quarter && { quarter }),
        ...(year && { year: Number(year) }),
        ...(hospitalId && { hospitalId: String(hospitalId) }),
      },
      include: {
        hospitalId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(cashGrants);
  } catch (error) {
    console.error("READ ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch cashGrant data.",
    });
  }
}

async function updateData(req, res) {
  try {
    const { id, ...body } = req.body;

    const updatedCashGrant = await prisma.cashGrant.update({
      where: { id: Number(id) },
      data: {
        quarter: body.quarter,
        year: Number(body.year),
        hospital: String(body.hospitalId),
        budgetHead: body.budgetHead,
        openingBalance: parseFloatOrNull(body.openingBalance),
        amountReceived: parseFloatOrNull(body.amountReceived),
        dateOfReceipt: body.dateOfReceipt
          ? new Date(body.dateOfReceipt)
          : null,
        remarks: body.remarks || null,
        closingBalance: parseFloatOrNull(body.closingBalance),

        manpowerCost: parseFloatOrNull(body.manpowerCost),
        equipmentCost: parseFloatOrNull(body.equipmentCost),
        operationalExpenses: parseFloatOrNull(body.operationalExpenses),
        freeLVDs: parseFloatOrNull(body.freeLVDs),
        trainingCosts: parseFloatOrNull(body.trainingCosts),
        additionalCosts: parseFloatOrNull(body.additionalCosts),
        details: body.details || null,
      },
    });

    return res.status(200).json(updatedCashGrant);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(400).json({
      error: "Failed to update cashGrant data.",
    });
  }
}

function parseFloatOrNull(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}