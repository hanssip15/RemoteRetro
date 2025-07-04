-- Add role column to participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'participant';

-- Add unique constraint for name per retro to prevent duplicates
ALTER TABLE participants ADD CONSTRAINT IF NOT EXISTS unique_name_per_retro UNIQUE (retro_id, name);

-- Update existing participants to have role
UPDATE participants SET role = 'participant' WHERE role IS NULL;

-- Sample data with facilitator
INSERT INTO participants (retro_id, name, role, joined_at) VALUES
(1, 'John Doe', 'facilitator', NOW()),
(1, 'Jane Smith', 'participant', NOW()),
(1, 'Bob Wilson', 'participant', NOW())
ON CONFLICT (retro_id, name) DO NOTHING;
