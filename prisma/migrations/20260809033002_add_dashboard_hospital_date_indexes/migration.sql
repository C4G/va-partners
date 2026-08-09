-- Dashboard count endpoint filters every activity table by hospitalId + date,
-- which previously had no usable index (the FK index leads with beneficiaryId).
-- MySQL 8 creates secondary indexes with ALGORITHM=INPLACE, LOCK=NONE by default,
-- so these are non-blocking online DDL.

-- CreateIndex
CREATE INDEX `Beneficiary_hospitalId_deleted_idx` ON `Beneficiary`(`hospitalId`, `deleted`);
-- CreateIndex
CREATE INDEX `Community_Screening_hospitalId_date_idx` ON `Community_Screening`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Comprehensive_Low_Vision_Evaluation_hospitalId_date_idx` ON `Comprehensive_Low_Vision_Evaluation`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Computer_Training_hospitalId_date_idx` ON `Computer_Training`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Counselling_Education_hospitalId_date_idx` ON `Counselling_Education`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Low_Vision_Evaluation_hospitalId_date_idx` ON `Low_Vision_Evaluation`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Mobile_Training_hospitalId_date_idx` ON `Mobile_Training`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Orientation_Mobility_Training_hospitalId_date_idx` ON `Orientation_Mobility_Training`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Training_hospitalId_date_idx` ON `Training`(`hospitalId`, `date`);
-- CreateIndex
CREATE INDEX `Vision_Enhancement_hospitalId_date_idx` ON `Vision_Enhancement`(`hospitalId`, `date`);
