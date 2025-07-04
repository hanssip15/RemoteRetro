-- Create retros table
CREATE TABLE IF NOT EXISTS retros (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    team_size INTEGER,
    duration INTEGER DEFAULT 60,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create retro_items table for feedback items
CREATE TABLE IF NOT EXISTS retro_items (
    id SERIAL PRIMARY KEY,
    retro_id INTEGER REFERENCES retros(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'went_well', 'improve', 'action_item'
    content TEXT NOT NULL,
    author VARCHAR(255),
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    retro_id INTEGER REFERENCES retros(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO retros (title, description, team_size, duration, status) VALUES
('Sprint 23 Retrospective', 'End of sprint retrospective for development team', 6, 60, 'completed'),
('Q4 Team Retrospective', 'Quarterly team retrospective session', 8, 90, 'completed'),
('Project Alpha Retro', 'Project completion retrospective', 5, 45, 'completed');

-- Update sample data dengan status active
UPDATE retros SET status = 'active' WHERE status = 'completed';

-- Atau insert data baru dengan status active
INSERT INTO retros (title, description, team_size, duration, status, created_at, updated_at) VALUES
('Test Retro Board', 'Test retrospective for debugging', 5, 60, 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample retro items
INSERT INTO retro_items (retro_id, type, content, author, votes) VALUES
(1, 'went_well', 'Great collaboration between frontend and backend teams', 'Alice', 5),
(1, 'went_well', 'Delivered all features on time', 'Bob', 3),
(1, 'improve', 'Need better communication during code reviews', 'Charlie', 4),
(1, 'improve', 'Testing could be more thorough', 'Diana', 2),
(1, 'action_item', 'Set up automated testing pipeline', 'Alice', 0),
(1, 'action_item', 'Schedule weekly code review sessions', 'Bob', 0);
