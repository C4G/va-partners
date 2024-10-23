import { readData as recordInit } from "pages/api/v2/dashboard/[type]";
import { readData as countInit } from "pages/api/v2/dashboard/count";

export default async function handler(req, res) {
  if (req.method === "GET") {
    readData(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

export async function readData(req, res) {
    try {
      req.query.indexHelper = "true";
      const charts = await countInit(req, res);
      req.query.type = "Beneficiary";
      req.query.offset = "0";
      req.query.limit = "100";
      const dashboard = await recordInit(req, res);

      return res.status(200).json(
        {
          charts,
          dashboard
        }
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
}