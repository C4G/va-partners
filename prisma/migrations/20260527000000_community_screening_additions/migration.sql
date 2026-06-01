-- AlterEnum
--  Correct MySQL syntax:
ALTER TABLE `Hospital` MODIFY COLUMN `tier` ENUM('NIL_CASH_GRANT','RECEIVE_CASH_GRANT', 'COMMUNITY_SCREENING') NOT NULL;

-- AlterTable
ALTER TABLE `Community_Screening`
DROP COLUMN `comments`;