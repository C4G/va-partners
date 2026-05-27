-- CreateTable
CREATE TABLE `CashGrant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quarter` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `hospital` VARCHAR(191) NOT NULL,
    `budgetHead` VARCHAR(191) NOT NULL,
    `openingBalance` DOUBLE NOT NULL,
    `amountReceived` DOUBLE NOT NULL,
    `dateOfReceipt` DATETIME(3) NULL,
    `remarks` VARCHAR(191) NULL,
    `closingBalance` DOUBLE NOT NULL,
    `manpowerCost` DOUBLE NOT NULL,
    `equipmentCost` DOUBLE NOT NULL,
    `operationalExpenses` DOUBLE NOT NULL,
    `freeLVDs` DOUBLE NOT NULL,
    `trainingCosts` DOUBLE NOT NULL,
    `additionalCosts` DOUBLE NOT NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
