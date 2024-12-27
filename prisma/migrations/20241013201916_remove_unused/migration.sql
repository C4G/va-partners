/*
  Warnings:

  - You are about to drop the `Camps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Landing_Page` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `School_Screening` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Camps` DROP FOREIGN KEY `Camps_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `Landing_Page` DROP FOREIGN KEY `Landing_Page_userId_fkey`;

-- DropForeignKey
ALTER TABLE `School_Screening` DROP FOREIGN KEY `School_Screening_hospitalId_fkey`;

-- DropTable
DROP TABLE `Camps`;

-- DropTable
DROP TABLE `Landing_Page`;

-- DropTable
DROP TABLE `School_Screening`;
