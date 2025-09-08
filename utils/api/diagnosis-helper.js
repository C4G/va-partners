import prisma from "./client";

/**
 * Get the latest diagnosis for a beneficiary from their Comprehensive Low Vision Evaluations
 * @param {string} beneficiaryId - The beneficiary's MRN
 * @param {number} hospitalId - The hospital ID
 * @returns {string|null} The latest diagnosis or null if none found
 */
export async function getLatestDiagnosis(beneficiaryId, hospitalId) {
  try {
    // Get only Comprehensive Low Vision Evaluations with diagnosis
    const clvEvaluation = await prisma.comprehensive_Low_Vision_Evaluation.findFirst({
      where: {
        beneficiaryId,
        hospitalId,
        diagnosis: { not: null },
      },
      select: {
        diagnosis: true,
        date: true,
        id: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return clvEvaluation ? clvEvaluation.diagnosis : null;
  } catch (error) {
    console.error("Error fetching latest diagnosis:", error);
    return null;
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
    const diagnosis = await getLatestDiagnosis(beneficiary.mrn, beneficiary.hospitalId);
    diagnosisMap[key] = diagnosis;
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

  for (const beneficiary of beneficiaries) {
    if (beneficiary.mrn && beneficiary.hospitalId) {
      beneficiary.diagnosis = await getLatestDiagnosis(beneficiary.mrn, beneficiary.hospitalId);
    }
  }

  return isArray ? beneficiaries : beneficiaries[0];
}
