-- users.sql
-- User registration and credential verification

-- ➕ Add a new user
INSERT INTO users (username, password_hash) 
VALUES (?, ?);

-- 🔑 Check credentials (login)
SELECT * 
FROM users 
WHERE username = ? AND password_hash = ?;

-- 🔍 Search all users with friendship status
SELECT 
    u.username, 
    CASE 
        WHEN f1.userName IS NULL AND f2.userName IS NULL THEN FALSE 
        ELSE TRUE 
    END AS isFriend
FROM users u 
LEFT JOIN friendships f1 
    ON u.username = f1.userName AND f1.friendName = ?
LEFT JOIN friendships f2 
    ON u.username = f2.friendName AND f2.userName = ?
WHERE u.username LIKE ?
  AND u.username != ?
LIMIT 5;
