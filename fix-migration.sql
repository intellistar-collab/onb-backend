-- Fix migration issue by marking the failed migration as resolved
-- This script should be run directly on the database

-- First, let's check if the enums already exist and handle them properly
DO $$ 
BEGIN
    -- Check if ItemStatus enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ItemStatus') THEN
        CREATE TYPE "ItemStatus" AS ENUM ('MOST_WANTED', 'WANTED', 'IN_DEMAND', 'UNCOMMON', 'COMMON');
    END IF;
    
    -- Check if UserStatus enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');
    END IF;
END $$;

-- Mark the failed migration as resolved
UPDATE "_prisma_migrations" 
SET finished_at = NOW(), 
    logs = 'Migration resolved manually - enums already existed'
WHERE migration_name = '20251010225128_add_user_status' 
AND finished_at IS NULL;
