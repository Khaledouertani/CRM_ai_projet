-- Migration: Add direct call fields to calls table
-- Run this script to add necessary columns for direct calls

-- Check and add besoin column
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'pfe_crm_ia' 
                     AND TABLE_NAME = 'calls' 
                     AND COLUMN_NAME = 'besoin');

IF @column_exists = 0 THEN
    ALTER TABLE calls ADD COLUMN besoin VARCHAR(100) DEFAULT '';
END IF;

-- Check and add budget column
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'pfe_crm_ia' 
                     AND TABLE_NAME = 'calls' 
                     AND COLUMN_NAME = 'budget');

IF @column_exists = 0 THEN
    ALTER TABLE calls ADD COLUMN budget VARCHAR(50) DEFAULT '';
END IF;

-- Check and add interet column
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'pfe_crm_ia' 
                     AND TABLE_NAME = 'calls' 
                     AND COLUMN_NAME = 'interet');

IF @column_exists = 0 THEN
    ALTER TABLE calls ADD COLUMN interet VARCHAR(50) DEFAULT '';
END IF;

-- Check and add customer_phone column
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'pfe_crm_ia' 
                     AND TABLE_NAME = 'calls' 
                     AND COLUMN_NAME = 'customer_phone');

IF @column_exists = 0 THEN
    ALTER TABLE calls ADD COLUMN customer_phone VARCHAR(20) DEFAULT '';
END IF;

-- Check and add customer_email column
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'pfe_crm_ia' 
                     AND TABLE_NAME = 'calls' 
                     AND COLUMN_NAME = 'customer_email');

IF @column_exists = 0 THEN
    ALTER TABLE calls ADD COLUMN customer_email VARCHAR(100) DEFAULT '';
END IF;

-- Check and add customer_company column
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'pfe_crm_ia' 
                     AND TABLE_NAME = 'calls' 
                     AND COLUMN_NAME = 'customer_company');

IF @column_exists = 0 THEN
    ALTER TABLE calls ADD COLUMN customer_company VARCHAR(100) DEFAULT '';
END IF;

-- Verify columns were added
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'pfe_crm_ia' 
AND TABLE_NAME = 'calls' 
AND COLUMN_NAME IN ('besoin', 'budget', 'interet', 'customer_phone', 'customer_email', 'customer_company');