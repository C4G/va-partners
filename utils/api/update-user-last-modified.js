import prisma from "@/utils/api/client";

export const updateUserLastModified = async (endpoint, method, email) => {
  const data = {
    lastUpdate: `${method} ${endpoint}`,
    lastUpdateDate: new Date().toISOString(),
  };
  await prisma.user.update({
    data,
    where: { email },
  });
}