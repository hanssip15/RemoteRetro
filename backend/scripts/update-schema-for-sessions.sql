-- Add session tracking and remove author
ALTER TABLE retro_items 
DROP COLUMN IF EXISTS author,
ADD COLUMN IF NOT EXISTS session_phase INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS group_id INTEGER;

-- Create feedback groups table
CREATE TABLE IF NOT EXISTS feedback_groups (
    id SERIAL PRIMARY KEY,
    retro_id INTEGER REFERENCES retros(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_sources TEXT[], -- ['session_1', 'session_2'] to track which sessions contributed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    retro_id INTEGER REFERENCES retros(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES feedback_groups(id) ON DELETE CASCADE,
    participant_name VARCHAR(255) NOT NULL,
    votes_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(retro_id, group_id, participant_name)
);

-- Create action item assignments table
CREATE TABLE IF NOT EXISTS action_assignments (
    id SERIAL PRIMARY KEY,
    retro_id INTEGER REFERENCES retros(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES feedback_groups(id) ON DELETE CASCADE,
    action_item_id INTEGER REFERENCES retro_items(id) ON DELETE CASCADE,
    assigned_to VARCHAR(255) NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add session phase to retros table
ALTER TABLE retros ADD COLUMN IF NOT EXISTS current_session INTEGER DEFAULT 1;

-- Update existing data
UPDATE retro_items SET session_phase = 
    CASE 
        WHEN type = 'went_well' THEN 1
        WHEN type = 'improve' THEN 2
        WHEN type = 'action_item' THEN 5
        ELSE 1
    END
WHERE session_phase IS NULL;
