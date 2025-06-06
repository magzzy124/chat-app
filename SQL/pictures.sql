-- pictures.sql
-- User profile picture management

-- ➕ Insert or update profile picture
INSERT INTO user_images (userId, fileName)
VALUES (?, ?)
AS new
ON DUPLICATE KEY UPDATE
    fileName = new.fileName,
    uploaded_at = CURRENT_TIMESTAMP;

-- 🔍 Get user's profile picture
SELECT fileName 
FROM user_images ui
JOIN users u ON ui.userId = u.userId
WHERE u.username = ?;

-- 🔍 Get your profile picture
SELECT fileName
FROM users u 
JOIN user_images ui ON u.userId = ui.userId
WHERE u.username = ?;
