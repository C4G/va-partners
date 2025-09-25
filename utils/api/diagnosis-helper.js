import prisma from "./client";

/**
 * Get the latest diagnosis and diagnosis notes for a beneficiary from Comprehensive Low Vision Evaluations
 * @param {string} beneficiaryId - The beneficiary's MRN
 * @param {number} hospitalId - The hospital ID
 * @returns {{ diagnosis: string|null, diagnosisNotes: string|null }} The latest diagnosis info or nulls if none found
 */
export async function getLatestDiagnosis(beneficiaryId, hospitalId) {
  try {
    const clvEvaluation = await prisma.comprehensive_Low_Vision_Evaluation.findFirst({
      where: {
        beneficiaryId,
        hospitalId,
        OR: [{ diagnosis: { not: null } }, { diagnosisNotes: { not: null } }],
      },
      select: {
        diagnosis: true,
        diagnosisNotes: true,
        date: true,
        id: true,
      },
      orderBy: { date: "desc" },
    });
    return {
      diagnosis: clvEvaluation?.diagnosis ?? null,
      diagnosisNotes: clvEvaluation?.diagnosisNotes ?? null,
    };
  } catch (error) {
    console.error("Error fetching latest diagnosis:", error);
    return { diagnosis: null, diagnosisNotes: null };
  }
}

/**
 * Get diagnosis information for multiple beneficiaries from their Comprehensive Low Vision Evaluations
 * @param {Array} beneficiaries - Array of beneficiary objects with mrn and hospitalId
 * @returns {Object} Map of beneficiaryKey to diagnosis
 */
export async function getLatestDiagnosisForBeneficiaries(beneficiaries) {
  const diagnosisMap = {};
  for (const beneficiary of beneficiaries) {
    const key = `${beneficiary.mrn}_${beneficiary.hospitalId}`;
    const { diagnosis, diagnosisNotes } = await getLatestDiagnosis(beneficiary.mrn, beneficiary.hospitalId);
    diagnosisMap[key] = { diagnosis, diagnosisNotes };
  }
  return diagnosisMap;
}

/**
 * Enrich beneficiary data with latest diagnosis from Comprehensive Low Vision Evaluations
 * @param {Array|Object} beneficiaryData - Single beneficiary or array of beneficiaries
 * @returns {Array|Object} Enriched beneficiary data with diagnosis field
 */
export async function enrichBeneficiariesWithDiagnosis(beneficiaryData) {
  if (!beneficiaryData) return beneficiaryData;
  const isArray = Array.isArray(beneficiaryData);
  const beneficiaries = isArray ? beneficiaryData : [beneficiaryData];
  // Collect composite keys
  const keyMap = new Map(); // key -> beneficiary object
  const whereOR = [];
  for (const b of beneficiaries) {
    if (b?.mrn && b?.hospitalId != null) {
      const key = `${b.mrn}__${b.hospitalId}`;
      keyMap.set(key, b);
      whereOR.push({ beneficiaryId: b.mrn, hospitalId: b.hospitalId });
    }
  }

  if (whereOR.length > 0) {
    // Fetch all relevant CLVE records (only needed fields) ordered by date desc
    const clveRecords = await prisma.comprehensive_Low_Vision_Evaluation.findMany({
      where: {
        AND: [{ OR: whereOR }, { OR: [{ diagnosis: { not: null } }, { diagnosisNotes: { not: null } }] }],
      },
      select: {
        beneficiaryId: true,
        hospitalId: true,
        date: true,
        diagnosis: true,
        diagnosisNotes: true,
      },
      orderBy: { date: "desc" },
    });

    // Keep first (latest) per composite key
    const seen = new Set();
    for (const rec of clveRecords) {
      const key = `${rec.beneficiaryId}__${rec.hospitalId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const target = keyMap.get(key);
      if (target) {
        target.diagnosis = rec.diagnosis ?? null;
        target.diagnosisNotes = rec.diagnosisNotes ?? null;
      }
    }
  }
  return isArray ? beneficiaries : beneficiaries[0];
}
