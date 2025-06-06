-- groups.sql
-- Group creation, retrieval, and membership handling

-- 📥 Create a group
INSERT INTO grupe (adminName, groupName) 
VALUES (?, ?);

-- ➕ Add members to group
INSERT INTO group_members (groupId, username) 
VALUES (?, ?);

-- 📋 Get groups for a user
SELECT g.groupId, g.groupName, g.adminName
FROM grupe g
JOIN group_members gm ON g.groupId = gm.groupId
WHERE gm.username = ?;

-- 🔍 Get a single group
SELECT * 
FROM grupe 
WHERE groupId = ?;

-- 👥 Get members of a group (excluding admin)
SELECT DISTINCT username
FROM group_members gm 
JOIN grupe g ON gm.groupId = g.groupId
WHERE g.groupId = ? AND g.adminName != gm.username;

-- 💬 Get messages in a group
SELECT 
    gm.username, 
    gm.message, 
    gm.messageId, 
    gm.timestamp, 
    COALESCE(ui.fileName, 'defaultUser.svg') AS sender_image
FROM group_messages gm
LEFT JOIN users u ON gm.username = u.username
LEFT JOIN user_images ui ON u.userId = ui.userId
WHERE gm.groupId = ?;

-- ❌ Remove member from group
DELETE FROM group_members
WHERE groupId = ? AND username = ?;

-- ❌ Delete a group
DELETE FROM grupe 
WHERE groupId = ?;
