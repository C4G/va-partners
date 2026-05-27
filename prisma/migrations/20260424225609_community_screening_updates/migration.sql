CREATE TABLE `Community_Screening` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `hospitalId` INTEGER NOT NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `diagnosis` VARCHAR(191) NULL,
    `mdvi` VARCHAR(191) NULL,
    `uncorrectedDistanceRE` VARCHAR(191) NULL,
    `uncorrectedDistanceLE` VARCHAR(191) NULL,
    `uncorrectedDistanceBE` VARCHAR(191) NULL,
    `uncorrectedNearRE` VARCHAR(191) NULL,
    `uncorrectedNearLE` VARCHAR(191) NULL,
    `uncorrectedNearBE` VARCHAR(191) NULL,
    `bestCorrectedDistanceRE` VARCHAR(191) NULL,
    `bestCorrectedDistanceLE` VARCHAR(191) NULL,
    `bestCorrectedDistanceBE` VARCHAR(191) NULL,
    `bestCorrectedNearRE` VARCHAR(191) NULL,
    `bestCorrectedNearLE` VARCHAR(191) NULL,
    `bestCorrectedNearBE` VARCHAR(191) NULL,
    `recommendationSpectacle` VARCHAR(191) NULL,
    `dispensedSpectacle` VARCHAR(191) NULL,
    `costSpectacle` INTEGER NULL,
    `costToBeneficiarySpectacle` INTEGER NULL,
    `dispensedDateSpectacle` DATETIME(3) NULL,
    `trainingGivenSpectacle` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Community_Screening_Mirror` (
    `id` INTEGER NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Community_Screening` ADD CONSTRAINT `Community_Screening_beneficiaryId_hospitalId_fkey` FOREIGN KEY (`beneficiaryId`, `hospitalId`) REFERENCES `Beneficiary`(`mrn`, `hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE;
