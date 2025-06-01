import mysql from "mysql2";
import dotenv from "dotenv";
// import { wsInit } from "./initalizeWsConnection.js"; const websocket = wsInit();
dotenv.config({ path: "../.env" });
console.log(process.env.DATABASE_USERNAME);

const pool = mysql
  .createPool({
    host: "127.0.0.1",
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  })
  .promise();

async function getYourProfilePicture(username) {
  const [result] = await pool.query(`
select fileName
from users u join user_images ui
on u.userId=ui.userId
where u.username="${username}";
`);
  return result;
}

async function deleteFriend(username, friendname) {
  const [result] = await pool.query(
    `
delete from friendships
where (userName="${username}" and friendName="${friendname}") or (userName="${friendname}" and friendName="${username}");

`,
  );
  return result;
}

async function getFriend(username, friendName) {
  const [result] = await pool.query(
    `
WITH last_message AS (
  SELECT dm1.*
  FROM direct_messages dm1
  WHERE (dm1.recipientUsername = '${username}' AND dm1.senderUsername = '${friendName}')
     OR (dm1.senderUsername = '${username}' AND dm1.recipientUsername = '${friendName}')
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
FROM (SELECT '${friendName}' AS friendName) f
LEFT JOIN last_message dm 
  ON (f.friendName = dm.senderUsername OR f.friendName = dm.recipientUsername)
LEFT JOIN users u 
  ON f.friendName = u.username
LEFT JOIN user_images ui 
  ON u.userId = ui.userId;
`,
  );
  return result;
}

async function areFriends(username, friendName) {
  const [result] = await pool.query(
    `
select * from friendships
WHERE (userName = ? AND friendName = ?) 
OR (friendName = ? AND userName = ?);
`,
    [username, friendName, username, friendName],
  );
  return result.length > 0;
}

async function getFriends(username) {
  const [result] = await pool.query(
    `
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
`,
    [username, username, username],
  );
  return result;
}

async function getMessages(currentUser, recipient) {
  const [result] = await pool.query(
    `
    SELECT 
        dm.messageId,
        dm.senderUsername,
        dm.recipientUsername,
        dm.message,
        dm.status,
        dm.timestamp,
        sender_ui.fileName AS sender_image,
        recipient_ui.fileName AS recipient_image
    FROM direct_messages dm
    LEFT JOIN users sender_u ON dm.senderUsername = sender_u.username
    LEFT JOIN user_images sender_ui ON sender_u.userId = sender_ui.userId
    LEFT JOIN users recipient_u ON dm.recipientUsername = recipient_u.username
    LEFT JOIN user_images recipient_ui ON recipient_u.userId = recipient_ui.userId
    WHERE (dm.senderUsername = ? AND dm.recipientUsername = ?)
       OR (dm.senderUsername = ? AND dm.recipientUsername = ?)
    ORDER BY dm.timestamp
    `,
    [currentUser, recipient, recipient, currentUser],
  );

  return result.map((e) => {
    return {
      message: e.message,
      messageId: e.messageId,
      messageStatus: e.status,
      username: e.senderUsername,
      sender_image: e.sender_image,
      timestamp: e.timestamp,
    };
  });
}

async function addFriend(userName, friendName) {
  let [result] = await pool.query(
    `
INSERT INTO Friendships (userName, friendName)
SELECT '${userName}', '${friendName}'
FROM DUAL
WHERE NOT EXISTS (
    SELECT NULL
    FROM Friendships t
    WHERE (t.userName = '${friendName}' AND t.friendName = '${userName}')
       OR (t.userName = '${userName}' AND t.friendName = '${friendName}')
);
`,
  );
  return result;
}

async function insertPicture(username) {
  let [[userId]] = await pool.query(
    `
select userId 
from users
where username="${username}";
`,
  );
  userId = userId.userId;
  let status = await pool.query(
    `
INSERT INTO user_images (userId, fileName)
VALUES (${userId}, '${username}Image.png') AS new
ON DUPLICATE KEY UPDATE
    fileName = new.fileName,
    uploaded_at = CURRENT_TIMESTAMP;
`,
  );
  return status;
}

async function getPicture(username) {
  const [[result]] = await pool.query(
    `
select fileName 
from user_images ui join users u
on ui.userId=u.userId
where username="${username}";
`,
  );
  return result;
}

async function getAllUsers(username, searchParam) {
  const [result] = await pool.query(
    `
SELECT 
    u.username, 
    CASE 
        WHEN f1.userName IS NULL AND f2.userName IS NULL THEN FALSE 
        ELSE TRUE 
    END AS isFriend
FROM users u 
LEFT JOIN friendships f1 
    ON u.username = f1.userName AND f1.friendName = '${username}'
LEFT JOIN friendships f2 
    ON u.username = f2.friendName AND f2.userName = '${username}'
WHERE u.username LIKE '%${searchParam}%'
AND u.username != '${username}'
LIMIT 5;
;
`,
  );
  return result;
}

async function getGroups(username) {
  const [groupList] = await pool.query(
    `
    SELECT g.groupId, g.groupName, g.adminName
    FROM grupe g
    JOIN group_members gm ON g.groupId = gm.groupId
    WHERE gm.username = ?;
    `,
    [username],
  );

  return groupList;
}

async function getSingleGroup(groupId) {
  const [groupRows] = await pool.query(
    `
SELECT *
FROM grupe 
where groupId=?;
    `,
    [groupId],
  );

  if (groupRows.length === 0) {
    return null;
  }

  const group = groupRows[0];

  const [allUsers] = await pool.query(
    `
select distinct username
from group_members gm join grupe g
on gm.groupId=g.groupId
where g.groupId=? and g.adminName!=gm.username;
    `,
    [groupId],
  );
  const filteredUsers = allUsers.map((obj) => obj.username);

  const [messages] = await pool.query(
    `
    SELECT gm.username, gm.message, gm.messageId, gm.timestamp, 
           COALESCE(ui.fileName, 'defaultUser.svg') AS sender_image
    FROM group_messages gm
    LEFT JOIN users u ON gm.username = u.username
    LEFT JOIN user_images ui ON u.userId = ui.userId
    WHERE gm.groupId = ?;
    `,
    [group.groupId],
  );

  return {
    groupName: group.groupName,
    fileName: "groupPicture.svg",
    isGroup: true,
    groupId: group.groupId,
    adminName: group.adminName,
    users: filteredUsers,
    messages,
  };
}

async function createAGroup(username, groupName, friendList) {
  friendList.push(username);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [groupResult] = await connection.query(
      `INSERT INTO grupe (adminName, groupName) VALUES (?, ?)`,
      [username, groupName],
    );

    const groupId = groupResult.insertId;

    if (friendList.length === 0) {
      await connection.commit();
      return { groupId };
    }

    const values = friendList.map((friend) => [groupId, friend]);
    await connection.query(
      `INSERT INTO group_members (groupId, username) VALUES ?`,
      [values],
    );

    await connection.commit();
    return { groupId, success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function checkCredentials(username, password) {
  const [result] = await pool.query(
    `
select * from users where username=? and password_hash=?;

      `,
    [username, password],
  );

  return result;
}

async function addUser(username, password) {
  try {
    const result = await pool.query(
      `
INSERT INTO users (username, password_hash) 
VALUES 
    (?,?);

      `,
      [username, password],
    );
    return result;
  } catch (err) {
    return err;
  }
}

async function getGroupMembers(groupId) {
  try {
    const [rows] = await pool.query(
      `SELECT username FROM group_members WHERE groupId = ?`,
      [groupId],
    );
    const usernames = rows.map((row) => row.username);
    return usernames;
  } catch (err) {
    console.error("Error fetching group members:", err);
    throw err;
  }
}

async function deleteAGroup(groupId) {
  try {
    const result = await pool.query(
      `
DELETE FROM grupe where groupId=?
      `,
      [groupId],
    );
    return result;
  } catch (err) {
    return err;
  }
}

async function removeMemberFromGroup(username, groupId, friendName) {
  try {
    const result = await pool.query(
      `
delete from group_members
where groupId=? and username=?;
      `,
      [groupId, friendName],
    );
    return result;
  } catch (err) {
    return err;
  }
}

try {
  // console.log(await areFriend("pero", "marko1"));
} catch (err) {
  console.error(err.errno);
}

export {
  areFriends,
  addUser,
  getFriends,
  getFriend,
  getMessages,
  getPicture,
  getYourProfilePicture,
  insertPicture,
  getAllUsers,
  addFriend,
  deleteFriend,
  getGroups,
  createAGroup,
  checkCredentials,
  getSingleGroup,
  deleteAGroup,
  removeMemberFromGroup,
  getGroupMembers,
};
