CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255),
    name VARCHAR(255),
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS retros (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status ENUM('ongoing', 'active', 'completed') DEFAULT 'ongoing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    format ENUM('happy_sad_confused', 'start_stop_continue') DEFAULT 'happy_sad_confused',
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL
);
 
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    retro_id VARCHAR(255) REFERENCES retros(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    role boolean DEFAULT false, -- true for facilitator
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS retro_items (
    id SERIAL PRIMARY KEY,
    retro_id VARCHAR(255) REFERENCES retros(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('went_well', 'improve', 'action_item')) NOT NULL,
    content TEXT NOT NULL,
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create participants table






-- Insert sample data
INSERT INTO retros (title, status) VALUES
('Sprint 23 Retrospective', 'completed'),
('Q4 Team Retrospective', 'completed'),
('Project Alpha Retro', 'completed');

-- Update sample data dengan status active
UPDATE retros SET status = 'active' WHERE status = 'completed';

-- Atau insert data baru dengan status active
INSERT INTO retros (title, status) VALUES
('Test Retro Board', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample retro items
INSERT INTO retro_items (retro_id, type, content, author, votes) VALUES
(1, 'went_well', 'Great collaboration between frontend and backend teams', 'Alice', 5),
(1, 'went_well', 'Delivered all features on time', 'Bob', 3),
(1, 'improve', 'Need better communication during code reviews', 'Charlie', 4),
(1, 'improve', 'Testing could be more thorough', 'Diana', 2),
(1, 'action_item', 'Set up automated testing pipeline', 'Alice', 0),
(1, 'action_item', 'Schedule weekly code review sessions', 'Bob', 0);
