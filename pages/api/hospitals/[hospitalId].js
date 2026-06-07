// pages/api/hospitals/[hospitalId].js
import prisma from "@/utils/api/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; // Double-check this relative path matches your directory depth
import { updateUserLastModified } from "@/utils/api/update-user-last-modified";

export default async function handler(req, res) {
  // 1. Authenticate the user session
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "You must be logged in." });
  }

  // 2. Log user activity tracking
  await updateUserLastModified("admin", req.method, session.user.email);

  // 3. Only handle GET requests for retrieving data
  if (req.method === "GET") {
    return await getHospitalTier(req, res);
  }

  // Handle unsupported methods
  return res.status(405).json({ message: "Method Not Allowed" });
}

async function getHospitalTier(req, res) {
  // Grab dynamic hospitalId from the URL query context
  const { hospitalId } = req.query;

  if (!hospitalId) {
    return res.status(400).json({ message: "Hospital ID is required" });
  }

  // Convert string parameter into an integer for your Prisma model
  const parsedHospitalId = parseInt(hospitalId, 10);

  if (isNaN(parsedHospitalId)) {
    return res.status(400).json({ message: "Invalid Hospital ID format. Must be an integer." });
  }

  try {
    // Look up the hospital using your specific database client
    const hospital = await prisma.hospital.findUnique({
      where: {
        id: parsedHospitalId,
        deleted: false // Ignores soft-deleted records based on your schema
      },
      select: {
        tier: true // Optimizes execution by only pulling the tier enum
      }
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Returns standard JSON object matching your frontend state mapping
    return res.status(200).json({ hospitalTier: hospital.tier });

  } catch (error) {
    console.error("Database query error: " + error);
    return res.status(500).json({ error: "Error fetching hospital tier: " + error });
  }
}