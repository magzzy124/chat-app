type Message = {
  message: string;
  messageId: string;
  messageStatus: "sent" | "seen" | "delivered";
  username: string;
  sender_image: string;
  timestamp: string;
};

type friendContact = {
  friendName: string;
  lastMessage: string;
  fileName: string;
  messages: message[];
};

type groupContact = {
  groupName: string;
  lastMessage: string;
  fileName: string;
  isGroup: boolean;
  groupId: string;
  adminName: string;
  users: string[];
  messages: message[];
};

type Contact = friendContact | groupContact;

type clickableFriend = {
  fileName: string;
  lastMessage: string;
  friendName: string;
};

type clickableGroup = {
  fileName: string;
  lastMessage: string;
  groupId: string;
  groupName: string;
};

type clickableContact = clickableFriend | clickableGroup;
