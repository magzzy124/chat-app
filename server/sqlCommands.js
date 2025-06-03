import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const pool = mysql
  .createPool({
    host: "127.0.0.1",
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  })
  .promise();

async function getYourProfilePicture(username) {
  const [result] = await pool.query(
    `
    SELECT fileName
    FROM users u JOIN user_images ui ON u.userId = ui.userId
    WHERE u.username = ?;
  `,
    [username],
  );
  return result;
}

async function deleteFriend(username, friendname) {
  const [result] = await pool.query(
    `
    DELETE FROM friendships
    WHERE (userName = ? AND friendName = ?) OR (userName = ? AND friendName = ?);
  `,
    [username, friendname, friendname, username],
  );
  return result;
}

async function getFriend(username, friendName) {
  const [result] = await pool.query(
    `
    WITH last_message AS (
      SELECT dm1.*
      FROM direct_messages dm1
      WHERE ((dm1.recipientUsername = ? AND dm1.senderUsername = ?)
          OR (dm1.senderUsername = ? AND dm1.recipientUsername = ?))
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
  `,
    [username, friendName, username, friendName, friendName],
  );
  return result;
}

async function areFriends(username, friendName) {
  const [result] = await pool.query(
    `
    SELECT * FROM friendships
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
      SELECT friendName FROM Friendships WHERE userName = ?
      UNION
      SELECT userName FROM Friendships WHERE friendName = ?
    ),
    last_messages AS (
      SELECT * FROM (
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

  return result.map((e) => ({
    message: e.message,
    messageId: e.messageId,
    messageStatus: e.status,
    username: e.senderUsername,
    sender_image: e.sender_image,
    timestamp: e.timestamp,
  }));
}

async function addFriend(userName, friendName) {
  const [result] = await pool.query(
    `
    INSERT INTO Friendships (userName, friendName)
    SELECT ?, ? FROM DUAL
    WHERE NOT EXISTS (
      SELECT 1 FROM Friendships t
      WHERE (t.userName = ? AND t.friendName = ?)
         OR (t.userName = ? AND t.friendName = ?)
    );
  `,
    [userName, friendName, friendName, userName, userName, friendName],
  );
  return result;
}

async function insertPicture(username) {
  const [[user]] = await pool.query(
    `
    SELECT userId FROM users WHERE username = ?
  `,
    [username],
  );
  const userId = user?.userId;
  if (!userId) return;
  const status = await pool.query(
    `
    INSERT INTO user_images (userId, fileName)
    VALUES (?, ?) AS new
    ON DUPLICATE KEY UPDATE
        fileName = new.fileName,
        uploaded_at = CURRENT_TIMESTAMP;
  `,
    [userId, `${username}Image.png`],
  );
  return status;
}

async function getPicture(username) {
  const [[result]] = await pool.query(
    `
    SELECT fileName 
    FROM user_images ui JOIN users u ON ui.userId = u.userId
    WHERE username = ?;
  `,
    [username],
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
    LEFT JOIN friendships f1 ON u.username = f1.userName AND f1.friendName = ?
    LEFT JOIN friendships f2 ON u.username = f2.friendName AND f2.userName = ?
    WHERE u.username LIKE ? AND u.username != ?
    LIMIT 5;
  `,
    [username, username, `%${searchParam}%`, username],
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
    SELECT * FROM grupe WHERE groupId = ?;
  `,
    [groupId],
  );
  if (groupRows.length === 0) return null;
  const group = groupRows[0];

  const [allUsers] = await pool.query(
    `
    SELECT DISTINCT username
    FROM group_members gm
    JOIN grupe g ON gm.groupId = g.groupId
    WHERE g.groupId = ? AND g.adminName != gm.username;
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
    `SELECT * FROM users WHERE username = ? AND password_hash = ?;`,
    [username, password],
  );
  return result;
}

async function addUser(username, password) {
  try {
    const result = await pool.query(
      `INSERT INTO users (username, password_hash) VALUES (?, ?);`,
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
    return rows.map((row) => row.username);
  } catch (err) {
    console.error("Error fetching group members:", err);
    throw err;
  }
}

async function deleteAGroup(groupId) {
  try {
    const result = await pool.query(`DELETE FROM grupe WHERE groupId = ?`, [
      groupId,
    ]);
    return result;
  } catch (err) {
    return err;
  }
}

async function removeMemberFromGroup(username, groupId, friendName) {
  try {
    const result = await pool.query(
      `DELETE FROM group_members WHERE groupId = ? AND username = ?`,
      [groupId, friendName],
    );
    return result;
  } catch (err) {
    return err;
  }
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
