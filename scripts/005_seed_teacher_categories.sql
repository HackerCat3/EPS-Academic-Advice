-- Seed some example teacher threads with categories
INSERT INTO threads (title, body, author_id, visibility, category, is_anonymous) 
SELECT 
  'Welcome to the Enhanced Teachers'' Lounge',
  'This is an announcement about the new features available in our Teachers'' Lounge. We now have categories, file attachments, and reaction systems to better facilitate our professional discussions.',
  profiles.id,
  'teachers_only',
  'announcements',
  false
FROM profiles 
WHERE profiles.role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO threads (title, body, author_id, visibility, category, is_anonymous) 
SELECT 
  'Best Practices for Student Engagement',
  'I''d like to start a discussion about effective strategies for keeping students engaged during virtual and in-person classes. What techniques have worked well for you?',
  profiles.id,
  'teachers_only',
  'collaboration',
  false
FROM profiles 
WHERE profiles.role = 'teacher' 
LIMIT 1
ON CONFLICT DO NOTHING;
