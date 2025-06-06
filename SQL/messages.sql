-- messages.sql
-- Direct message history retrieval

-- 📨 Get messages between two users
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
ORDER BY dm.timestamp;
