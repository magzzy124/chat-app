export function useWebsocket({
  username,
  onMessage,
  onDeliver,
  onSeen,
  onFriendEdit,
  onGroupEdit,
  onGroupDeletionOrCreation,
}: webSocketProps) {
  let websocketId = new WebSocket("ws://127.0.0.1:4221", "protocol1");

  const onSeenQueue: Array<{ reciever: string; messageId: string }> = [];
  let isProcessingOnSeen = false;

  const processOnSeenQueue = async () => {
    if (isProcessingOnSeen || onSeenQueue.length === 0) return;

    isProcessingOnSeen = true;
    const { reciever, messageId } = onSeenQueue.shift()!;

    try {
      await Promise.resolve(onSeen(reciever, messageId));
    } finally {
      isProcessingOnSeen = false;
      // Process next one if it exists
      processOnSeenQueue();
    }
  };

  websocketId.onopen = function () {
    let message = "1: " + username;
    websocketId.send(message);
  };

  websocketId.onmessage = function (event: any) {
    const parts = event.data.split(" ");
    const messageType = parts[0];

    if (messageType === "2:") {
      const [_, sender, messageId, message, pfp, timestamp] = parts;
      onMessage(sender, message, messageId, pfp, timestamp);
    } else if (messageType === "7:") {
      const [_, sender, messageId, message, pfp, timestamp, groupUsername] =
        parts;
      onMessage(
        sender,
        message,
        messageId,
        pfp,
        timestamp,
        true,
        groupUsername,
      );
    } else if (messageType === "3:") {
      const friendName = parts[1];
      onFriendEdit(friendName);
    } else if (messageType === "4:") {
      const groupId = parts[1];
      const recievedUsername = parts[2];
      onGroupEdit(groupId, recievedUsername);
    } else if (messageType === "5:") {
      const groupId = parts[1];
      const shouldCreate = parts[2] == "2";
      onGroupDeletionOrCreation(groupId, shouldCreate);
    } else if (messageType === "8:") {
      const reciever = parts[1];
      const messageId = parts[2];
      onDeliver(reciever, messageId, true);
    } else if (messageType === "6:") {
      const reciever = parts[1];
      const messageId = parts[2];
      onSeenQueue.push({ reciever, messageId });
      processOnSeenQueue();
    }
  };

  return { websocketId };
}
