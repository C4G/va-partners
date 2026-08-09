-- Realigns the database with schema.prisma.
-- CashGrant: the API writes null for blank financial fields (parseFloatOrNull),
-- so NOT NULL rejected every such save. Widening to NULL; table has no rows.
-- Hospital.tier: an earlier migration dropped the column default, leaving correct
-- behaviour dependent on MySQL's implicit first-enum-value default.

-- AlterTable
ALTER TABLE `CashGrant` MODIFY `openingBalance` DOUBLE NULL,
    MODIFY `amountReceived` DOUBLE NULL,
    MODIFY `closingBalance` DOUBLE NULL,
    MODIFY `manpowerCost` DOUBLE NULL,
    MODIFY `equipmentCost` DOUBLE NULL,
    MODIFY `operationalExpenses` DOUBLE NULL,
    MODIFY `freeLVDs` DOUBLE NULL,
    MODIFY `trainingCosts` DOUBLE NULL,
    MODIFY `additionalCosts` DOUBLE NULL;

-- AlterTable
ALTER TABLE `Hospital` MODIFY `tier` ENUM('NIL_CASH_GRANT', 'RECEIVE_CASH_GRANT', 'COMMUNITY_SCREENING') NOT NULL DEFAULT 'NIL_CASH_GRANT';

