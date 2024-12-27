/*
  Warnings:

  - The primary key for the `Beneficiary` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `hospitalId` to the `Comprehensive_Low_Vision_Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Computer_Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Counselling_Education` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Low_Vision_Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Mobile_Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Orientation_Mobility_Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Vision_Enhancement` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Beneficiary_mrn_key` ON `Beneficiary`;

-- AlterTable
ALTER TABLE `Beneficiary` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`mrn`, `hospitalId`);

-- AlterTable
ALTER TABLE `Comprehensive_Low_Vision_Evaluation` ADD COLUMN `hospitalId` INTEGER;

-- AlterTable
ALTER TABLE `Computer_Training` ADD COLUMN `hospitalId` INTEGER;

-- AlterTable
ALTER TABLE `Counselling_Education` ADD COLUMN `hospitalId` INTEGER;

-- AlterTable
ALTER TABLE `Low_Vision_Evaluation` ADD COLUMN `hospitalId` INTEGER;

-- AlterTable
ALTER TABLE `Mobile_Training` ADD COLUMN `hospitalId` INTEGER;

-- AlterTable
ALTER TABLE `Orientation_Mobility_Training` ADD COLUMN `hospitalId` INTEGER;

-- AlterTable
ALTER TABLE `Training` ADD COLUMN `hospitalId` INTEGER;

-- AlterTable
ALTER TABLE `Vision_Enhancement` ADD COLUMN `hospitalId` INTEGER;

-- MANUAL UPDATES

DELETE t
FROM Admin t
LEFT JOIN User b ON t.userId = b.id
WHERE b.id IS NULL;

DELETE t
FROM HospitalRole t
LEFT JOIN Hospital b ON t.hospitalId = b.id
WHERE b.id IS NULL;

DELETE t
FROM HospitalRole t
LEFT JOIN User b ON t.userId = b.id
WHERE b.id IS NULL;

DELETE t
FROM Beneficiary t
LEFT JOIN Hospital b ON t.hospitalId = b.id
WHERE b.id IS NULL;

DELETE t
FROM Camps t
LEFT JOIN Hospital b ON t.hospitalId = b.id
WHERE b.id IS NULL;

DELETE t
FROM Comprehensive_Low_Vision_Evaluation t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

DELETE t
FROM Computer_Training t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

DELETE t
FROM Counselling_Education t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

DELETE t
FROM Low_Vision_Evaluation t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

DELETE t
FROM Mobile_Training t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

DELETE t
FROM Orientation_Mobility_Training t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

DELETE t
FROM Training t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

DELETE t
FROM Vision_Enhancement t
LEFT JOIN Beneficiary b ON t.beneficiaryId = b.mrn
WHERE b.mrn IS NULL;

UPDATE Comprehensive_Low_Vision_Evaluation t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

UPDATE Computer_Training t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

UPDATE Counselling_Education t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

UPDATE Low_Vision_Evaluation t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

UPDATE Mobile_Training t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

UPDATE Orientation_Mobility_Training t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

UPDATE Training t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

UPDATE Vision_Enhancement t
JOIN Beneficiary b ON t.beneficiaryId = b.mrn
SET t.hospitalId = b.hospitalId;

ALTER TABLE Comprehensive_Low_Vision_Evaluation
MODIFY hospitalId INT NOT NULL;
ALTER TABLE Computer_Training
MODIFY hospitalId INT NOT NULL;
ALTER TABLE Counselling_Education
MODIFY hospitalId INT NOT NULL;
ALTER TABLE Low_Vision_Evaluation
MODIFY hospitalId INT NOT NULL;
ALTER TABLE Mobile_Training
MODIFY hospitalId INT NOT NULL;
ALTER TABLE Orientation_Mobility_Training
MODIFY hospitalId INT NOT NULL;
ALTER TABLE Training
MODIFY hospitalId INT NOT NULL;
ALTER TABLE Vision_Enhancement
MODIFY hospitalId INT NOT NULL;
-- END MANUAL UPDATES

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HospitalRole` ADD CONSTRAINT `HospitalRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HospitalRole` ADD CONSTRAINT `HospitalRole_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Beneficiary` ADD CONSTRAINT `Beneficiary_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Computer_Training` ADD CONSTRAINT `Computer_Training_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mobile_Training` ADD CONSTRAINT `Mobile_Training_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orientation_Mobility_Training` ADD CONSTRAINT `Orientation_Mobility_Training_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vision_Enhancement` ADD CONSTRAINT `Vision_Enhancement_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Low_Vision_Evaluation` ADD CONSTRAINT `Low_Vision_Evaluation_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comprehensive_Low_Vision_Evaluation` ADD CONSTRAINT `Comprehensive_Low_Vision_Evaluation_beneficiaryId_hospitalI_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Training` ADD CONSTRAINT `Training_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Training_Sub_Type` ADD CONSTRAINT `Training_Sub_Type_trainingTypeId_fkey` FOREIGN KEY (`trainingTypeId`) REFERENCES `Training_Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Counselling_Education` ADD CONSTRAINT `Counselling_Education_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Camps` ADD CONSTRAINT `Camps_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `School_Screening` ADD CONSTRAINT `School_Screening_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Landing_Page` ADD CONSTRAINT `Landing_Page_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
