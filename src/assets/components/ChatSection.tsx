import Message from "./Message";
import Header from "./Header";
import "../../App.css";
import { v4 as uuidv4 } from "uuid";
import { useRef, useEffect } from "react";

type chatSectionType = {
  messagesRef:
    | React.RefObject<Record<string, Contact>>
    | React.RefObject<undefined>;
  selectedFriend: Contact | undefined;
  setSelectedFriend: React.Dispatch<React.SetStateAction<Contact | undefined>>;
  websocket: React.RefObject<WebSocket>;
  username: string;
  yourPfp: string;
};

function ChatSection({
  messagesRef,
  selectedFriend,
  setSelectedFriend,
  websocket,
  username,
  yourPfp,
}: chatSectionType) {
  let identifier: string;
  if (selectedFriend && "isGroup" in selectedFriend)
    identifier = selectedFriend.groupId || "";
  else identifier = selectedFriend?.friendName || "";

  let chatInput = useRef<HTMLInputElement>(null);
  let chatOutput = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  function onChatInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      let messageText = chatInput.current?.value || "";
      if (messageText !== "" && selectedFriend != undefined) {
        const currentTime = new Date().toLocaleString();
        let messageId = uuidv4();
        messagesRef.current?.[identifier].messages.push({
          message: chatInput.current?.value || "",
          messageId: messageId,
          messageStatus: "sent",
          username: username,
          sender_image: yourPfp,
          timestamp: currentTime,
        });

        if ("isGroup" in selectedFriend) {
          let message = `7: ${selectedFriend.groupId}\n${messageId}\n${messageText}\n${yourPfp}\n${username}`;
          websocket.current?.send(message);
        } else {
          let message = `2: ${selectedFriend.friendName}\n${messageId}\n${messageText}\n${yourPfp}`;
          websocket.current?.send(message);
        }
      }
      if (chatInput.current) chatInput.current.value = "";
      setSelectedFriend((prev: any) => {
        return { ...prev };
      });
    }
  }

  const isInitalRender = useRef(true);

  useEffect(() => {
    if (isInitalRender.current === false)
      (
        chatOutput.current?.lastChild as HTMLElement | undefined
      )?.scrollIntoView();
    else isInitalRender.current = false;

    if (selectedFriend && !("groupId" in selectedFriend)) {
      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && selectedFriend != undefined) {
              let messageId = entry.target.id;
              let message = `6: ${selectedFriend.friendName} ${messageId}`;
              websocket.current?.send(message);

              const targetMessages =
                messagesRef.current?.[selectedFriend.friendName].messages;
              const targetMessage = targetMessages?.find(
                (message: Message) => message.messageId == messageId,
              );
              targetMessage.messageStatus = "seen";
            }
          });
        },
        { threshold: 1.0 },
      );

      const messageElements = document.querySelectorAll(".unseen");
      messageElements.forEach((el) => observer.current?.observe(el));
    }

    return () => {
      if (selectedFriend && !("groupId" in selectedFriend))
        observer.current?.disconnect();
    };
  }, [selectedFriend]);

  return (
    <div className="bg-white shadow-[0px_4px_5px_2px_rgba(121,197,239,0.38)] p-[15px] row-[1/11] col-[3/6]">
      {selectedFriend && <Header member={selectedFriend} />}
      <div
        className="chat h-[calc(100%_-_60px_-_65px)] p-[25px_15px_15px_15px] overflow-y-auto overflow-x-hidden hide-scrollbar"
        ref={chatOutput}
      >
        {selectedFriend?.messages.map((message) => (
          <Message
            key={message.messageId}
            message={message}
            isSender={message.username == username}
          />
        ))}
      </div>
      <input
        className="p-2 border-0 rounded-[25px] outline-none text-[22px] h-[60px] w-[80%] bg-(--wrapper-background)"
        ref={chatInput}
        type="text"
        placeholder="Type your message here..."
        onKeyDown={(e) => onChatInput(e)}
      />
    </div>
  );
}
export default ChatSection;
