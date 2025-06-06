-- friends.sql
-- SQL queries for managing user friendships

-- 🟢 Add a new friend (only if not already friends)
INSERT INTO Friendships (userName, friendName)
SELECT ?, ?
FROM DUAL
WHERE NOT EXISTS (
    SELECT NULL
    FROM Friendships t
    WHERE (t.userName = ? AND t.friendName = ?)
       OR (t.userName = ? AND t.friendName = ?)
);

-- 🔴 Delete a friend (removes both directions)
DELETE FROM Friendships
WHERE (userName = ? AND friendName = ?)
   OR (userName = ? AND friendName = ?);

-- 🔎 Check if two users are friends
SELECT * FROM Friendships
WHERE (userName = ? AND friendName = ?)
   OR (userName = ? AND friendName = ?);

-- 📜 Get all friends of a user with their last message and profile picture
WITH friends AS (
  SELECT friendName
  FROM Friendships
  WHERE userName = ?
  UNION
  SELECT userName
  FROM Friendships
  WHERE friendName = ?
),
last_messages AS (
  SELECT *
  FROM (
    SELECT 
      dm.*,
      ROW_NUMBER() OVER (PARTITION BY dm.senderUsername ORDER BY dm.timestamp DESC) AS rn
    FROM direct_messages dm
    WHERE dm.recipientUsername = ?
  ) sub
  WHERE rn = 1
)
SELECT 
  f.friendName,
  COALESCE(dm.message, '') AS lastMessage,
  ui.fileName
FROM friends f
LEFT JOIN last_messages dm 
  ON f.friendName = dm.senderUsername
LEFT JOIN users u 
  ON f.friendName = u.username
LEFT JOIN user_images ui 
  ON u.userId = ui.userId;

-- 📄 Get a single friend with their last message and picture
WITH last_message AS (
  SELECT dm1.*
  FROM direct_messages dm1
  WHERE (dm1.recipientUsername = ? AND dm1.senderUsername = ?)
     OR (dm1.senderUsername = ? AND dm1.recipientUsername = ?)
  AND dm1.timestamp = (
    SELECT MAX(dm2.timestamp)
    FROM direct_messages dm2
    WHERE (dm2.senderUsername = dm1.senderUsername AND dm2.recipientUsername = dm1.recipientUsername)
  )
)
SELECT 
  f.friendName,
  COALESCE(dm.message, '') AS lastMessage,
  ui.fileName
FROM (SELECT ? AS friendName) f
LEFT JOIN last_message dm 
  ON (f.friendName = dm.senderUsername OR f.friendName = dm.recipientUsername)
LEFT JOIN users u 
  ON f.friendName = u.username
LEFT JOIN user_images ui 
  ON u.userId = ui.userId;
