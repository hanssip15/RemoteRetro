-- Check if role column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'participants' AND column_name = 'role'
    ) THEN
        ALTER TABLE participants ADD COLUMN role VARCHAR(20) DEFAULT 'participant';
    END IF;
END $$;

-- Update existing participants to have role if null
UPDATE participants SET role = 'participant' WHERE role IS NULL;

-- Try to add unique constraint (ignore if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_name_per_retro'
    ) THEN
        ALTER TABLE participants ADD CONSTRAINT unique_name_per_retro UNIQUE (retro_id, name);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Check final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'participants' 
ORDER BY ordinal_position;
