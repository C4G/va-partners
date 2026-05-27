-- AlterEnum
ALTER TYPE "HospitalTier" ADD VALUE 'COMMUNITY_SCREENING';

-- AlterTable
ALTER TABLE "Community_Screening"
DROP COLUMN "comments";