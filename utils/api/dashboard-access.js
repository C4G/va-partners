import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/utils/api/client";

export async function authorizeDashboardHospitalIds(req, res, session) {
  const currentSession = session || (await getServerSession(req, res, authOptions));
  if (!currentSession?.user?.email) {
    return { status: 401, error: "Unauthorized" };
  }

  const rawHospitalIds = req.query.hospitalIds;
  const values = Array.isArray(rawHospitalIds) ? rawHospitalIds : [rawHospitalIds];
  if (values.length === 0 || values.some((value) => typeof value !== "string" || value.trim() === "")) {
    return { status: 400, error: "hospitalIds is required and must contain valid integers" };
  }

  const requestedHospitalIds = values.map(Number);
  if (requestedHospitalIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return { status: 400, error: "hospitalIds is required and must contain valid integers" };
  }

  const user = await prisma.user.findUnique({
    where: { email: currentSession.user.email },
    select: {
      admin: { select: { id: true } },
      hospitalRole: {
        select: { hospitalId: true },
      },
    },
  });

  if (!user) {
    return { status: 403, error: "You do not have access to the requested hospital data" };
  }

  const hospitalWhere = { deleted: false };
  if (!user.admin) {
    hospitalWhere.id = { in: user.hospitalRole.map(({ hospitalId }) => hospitalId) };
  }

  const hospitals = await prisma.hospital.findMany({
    where: hospitalWhere,
    select: { id: true },
  });
  const allowedHospitalIds = new Set(hospitals.map(({ id }) => id));

  if (requestedHospitalIds.some((id) => !allowedHospitalIds.has(id))) {
    return { status: 403, error: "You do not have access to the requested hospital data" };
  }

  return { hospitalIds: [...new Set(requestedHospitalIds)] };
}
