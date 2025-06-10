-- DropForeignKey
ALTER TABLE `Admin` DROP FOREIGN KEY `Admin_userId_fkey`;

-- DropForeignKey
ALTER TABLE `HospitalRole` DROP FOREIGN KEY `HospitalRole_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `HospitalRole` DROP FOREIGN KEY `HospitalRole_userId_fkey`;

-- DropIndex
DROP INDEX `HospitalRole_hospitalId_fkey` ON `HospitalRole`;

-- DropIndex
DROP INDEX `HospitalRole_userId_fkey` ON `HospitalRole`;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HospitalRole` ADD CONSTRAINT `HospitalRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HospitalRole` ADD CONSTRAINT `HospitalRole_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
