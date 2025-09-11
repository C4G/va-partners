/*
  Warnings:

  - You are about to drop the column `diagnosis` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisRequired` on the `Beneficiary_Mirror` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Beneficiary` DROP COLUMN `diagnosis`;

-- AlterTable
ALTER TABLE `Beneficiary_Mirror` DROP COLUMN `diagnosisRequired`;
