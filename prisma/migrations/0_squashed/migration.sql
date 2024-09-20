-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `lastUpdate` VARCHAR(191) NULL,
    `lastUpdateDate` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Admin_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hospital` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `deleted` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `Hospital_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HospitalRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `hospitalId` INTEGER NOT NULL,
    `admin` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Beneficiary` (
    `mrn` VARCHAR(191) NOT NULL,
    `beneficiaryName` VARCHAR(191) NOT NULL,
    `hospitalId` INTEGER NOT NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `education` VARCHAR(191) NULL,
    `occupation` VARCHAR(191) NULL,
    `districts` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `diagnosis` VARCHAR(191) NULL,
    `vision` VARCHAR(191) NULL,
    `mDVI` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,
    `consent` VARCHAR(191) NULL,
    `deleted` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `Beneficiary_mrn_key`(`mrn`),
    PRIMARY KEY (`mrn`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Beneficiary_Mirror` (
    `id` INTEGER NOT NULL,
    `phoneNumberRequired` BOOLEAN NOT NULL,
    `educationRequired` BOOLEAN NOT NULL,
    `occupationRequired` BOOLEAN NOT NULL,
    `districtsRequired` BOOLEAN NOT NULL,
    `stateRequired` BOOLEAN NOT NULL,
    `diagnosisRequired` BOOLEAN NOT NULL,
    `visionRequired` BOOLEAN NOT NULL,
    `mDVIRequired` BOOLEAN NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Computer_Training` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `visionType` VARCHAR(191) NULL,
    `typeOfTraining` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Computer_Training_Mirror` (
    `id` INTEGER NOT NULL,
    `date` BOOLEAN NOT NULL,
    `sessionNumber` BOOLEAN NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mobile_Training` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `vision` VARCHAR(191) NULL,
    `typeOfTraining` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mobile_Training_Mirror` (
    `id` INTEGER NOT NULL,
    `date` BOOLEAN NOT NULL,
    `sessionNumber` BOOLEAN NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orientation_Mobility_Training` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `vision` VARCHAR(191) NULL,
    `typeOfTraining` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orientation_Mobility_Training_Mirror` (
    `id` INTEGER NOT NULL,
    `date` BOOLEAN NOT NULL,
    `sessionNumber` BOOLEAN NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vision_Enhancement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `Diagnosis` VARCHAR(191) NULL,
    `MDVI` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vision_Enhancement_Mirror` (
    `id` INTEGER NOT NULL,
    `date` BOOLEAN NOT NULL,
    `sessionNumber` BOOLEAN NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Low_Vision_Evaluation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `diagnosis` VARCHAR(191) NULL,
    `mdvi` VARCHAR(191) NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `distanceVisualAcuityRE` VARCHAR(191) NULL,
    `distanceVisualAcuityLE` VARCHAR(191) NULL,
    `distanceBinocularVisionBE` VARCHAR(191) NULL,
    `nearVisualAcuityRE` VARCHAR(191) NULL,
    `nearVisualAcuityLE` VARCHAR(191) NULL,
    `nearBinocularVisionBE` VARCHAR(191) NULL,
    `recommendationSpectacle` VARCHAR(191) NULL,
    `recommendationOptical` VARCHAR(191) NULL,
    `recommendationNonOptical` VARCHAR(191) NULL,
    `recommendationElectronic` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comprehensive_Low_Vision_Evaluation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `diagnosis` VARCHAR(191) NULL,
    `mdvi` VARCHAR(191) NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `distanceVisualAcuityRE` VARCHAR(191) NOT NULL,
    `distanceVisualAcuityLE` VARCHAR(191) NOT NULL,
    `distanceBinocularVisionBE` VARCHAR(191) NOT NULL,
    `nearVisualAcuityRE` VARCHAR(191) NOT NULL,
    `nearVisualAcuityLE` VARCHAR(191) NOT NULL,
    `nearBinocularVisionBE` VARCHAR(191) NOT NULL,
    `recommendationSpectacle` VARCHAR(191) NULL,
    `dispensedSpectacle` VARCHAR(191) NULL,
    `dispensedDateSpectacle` DATETIME(3) NULL,
    `costSpectacle` INTEGER NULL,
    `costToBeneficiarySpectacle` INTEGER NULL,
    `trainingGivenSpectacle` VARCHAR(191) NULL,
    `recommendationOptical` VARCHAR(191) NULL,
    `dispensedOptical` VARCHAR(191) NULL,
    `dispensedDateOptical` DATETIME(3) NULL,
    `costOptical` INTEGER NULL,
    `costToBeneficiaryOptical` INTEGER NULL,
    `trainingGivenOptical` VARCHAR(191) NULL,
    `recommendationNonOptical` VARCHAR(191) NULL,
    `dispensedNonOptical` VARCHAR(191) NULL,
    `dispensedDateNonOptical` DATETIME(3) NULL,
    `costNonOptical` INTEGER NULL,
    `costToBeneficiaryNonOptical` INTEGER NULL,
    `trainingGivenNonOptical` VARCHAR(191) NULL,
    `recommendationElectronic` VARCHAR(191) NULL,
    `dispensedElectronic` VARCHAR(191) NULL,
    `dispensedDateElectronic` DATETIME(3) NULL,
    `costElectronic` INTEGER NULL,
    `costToBeneficiaryElectronic` INTEGER NULL,
    `trainingGivenElectronic` VARCHAR(191) NULL,
    `colourVisionRE` VARCHAR(191) NULL,
    `colourVisionLE` VARCHAR(191) NULL,
    `contrastSensitivityRE` VARCHAR(191) NULL,
    `contrastSensitivityLE` VARCHAR(191) NULL,
    `visualFieldsRE` VARCHAR(191) NULL,
    `visualFieldsLE` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comprehensive_Low_Vision_Evaluation_Mirror` (
    `id` INTEGER NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Training` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `type` VARCHAR(191) NULL,
    `subType` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Training_Type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Training_Type_value_key`(`value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Training_Sub_Type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trainingTypeId` INTEGER NOT NULL,
    `value` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Training_Sub_Type_trainingTypeId_value_key`(`trainingTypeId`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Counselling_Type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Counselling_Type_value_key`(`value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Counselling_Education` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `sessionNumber` INTEGER NULL,
    `vision` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `typeCounselling` VARCHAR(191) NULL,
    `MDVI` VARCHAR(191) NULL,
    `extraInformation` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Counselling_Education_Mirror` (
    `id` INTEGER NOT NULL,
    `date` BOOLEAN NOT NULL,
    `sessionNumber` BOOLEAN NOT NULL,
    `typeCounselling` BOOLEAN NOT NULL,
    `extraInformationRequired` TEXT NOT NULL,
    `hospitalName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Camps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NULL,
    `schoolName` VARCHAR(191) NULL,
    `studentName` VARCHAR(191) NULL,
    `age` INTEGER NULL,
    `gender` VARCHAR(191) NULL,
    `diagnosis` VARCHAR(191) NULL,
    `visualAcuityRE` VARCHAR(191) NULL,
    `visualAcuityLE` VARCHAR(191) NULL,
    `unaidedNearVision` VARCHAR(191) NULL,
    `refractionVALE` VARCHAR(191) NULL,
    `LVA` VARCHAR(191) NULL,
    `LVANear` VARCHAR(191) NULL,
    `nonOpticalAid` VARCHAR(191) NULL,
    `actionNeeded` VARCHAR(191) NULL,
    `hospitalId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `School_Screening` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NULL,
    `typeCamp` VARCHAR(191) NULL,
    `screeningPlace` VARCHAR(191) NULL,
    `organiser` VARCHAR(191) NULL,
    `contactNumber` INTEGER NULL,
    `address` VARCHAR(191) NULL,
    `screenedTotal` INTEGER NULL,
    `refractiveErrors` INTEGER NULL,
    `spectaclesDistributed` INTEGER NULL,
    `checked` VARCHAR(191) NULL,
    `refer` INTEGER NULL,
    `staff` INTEGER NULL,
    `lowVision` INTEGER NULL,
    `hospitalId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Landing_Page` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creationDate` DATETIME(3) NULL,
    `content` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `datetime_recorded` DATETIME(3) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

