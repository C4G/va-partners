/*
  Warnings:

  - You are about to alter the column `gender` on the `Beneficiary` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/

-- MANUAL UPDATES

UPDATE `Beneficiary`
SET `gender` = 
  CASE 
    WHEN `gender` = 'M' THEN 'Male'
    WHEN `gender` = 'F' THEN 'Female'
    ELSE 'Other'
  END
WHERE `gender` NOT IN ('Other', 'Male', 'Female');
-- END MANUAL UPDATES

-- AlterTable
ALTER TABLE `Beneficiary` MODIFY `gender` ENUM('Other', 'Male', 'Female') NOT NULL;




