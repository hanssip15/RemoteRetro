-- Add format and description columns to retros table
ALTER TABLE retros 
ADD COLUMN IF NOT EXISTS format VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records to have a default format
UPDATE retros 
SET format = 'happy_sad_confused' 
WHERE format IS NULL; 