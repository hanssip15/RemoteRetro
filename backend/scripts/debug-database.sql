-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check retros table structure
\d retros;

-- Check existing retros
SELECT * FROM retros ORDER BY id DESC LIMIT 5;

-- Test insert
INSERT INTO retros (title, description, team_size, duration, status, created_at, updated_at)
VALUES ('Debug Test Retro', 'Test retro for debugging', 5, 60, 'active', NOW(), NOW())
RETURNING *;

-- Check if the insert worked
SELECT * FROM retros WHERE title LIKE 'Debug Test%';
