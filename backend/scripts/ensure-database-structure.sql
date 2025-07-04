-- Ensure participants table has all required columns
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    retro_id INTEGER REFERENCES retros(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'participant',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add role column if it doesn't exist
ALTER TABLE participants ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'participant';

-- Update existing participants to have role
UPDATE participants SET role = 'participant' WHERE role IS NULL OR role = '';

-- Try to add unique constraint
ALTER TABLE participants DROP CONSTRAINT IF EXISTS unique_name_per_retro;
ALTER TABLE participants ADD CONSTRAINT unique_name_per_retro UNIQUE (retro_id, name);

-- Verify the structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'participants' 
ORDER BY ordinal_position;
