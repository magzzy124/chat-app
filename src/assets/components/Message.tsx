import { seen, delievered, sent } from "../images";

function Message({
  message,
  isSender,
}: {
  message: Message;
  isSender: boolean;
}) {
  let statusIcon;
  switch (message.messageStatus) {
    case "sent":
      statusIcon = sent;
      break;
    case "delivered":
      statusIcon = delievered;
      break;
    case "seen":
      statusIcon = seen;
  }

  const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div
      className={`messageWrapper flex mt-[18px] h-[60px] gap-1 ${!isSender && message.messageStatus !== "seen" ? "unseen" : ""}`}
      id={`${message.messageId}`}
      style={
        isSender
          ? { justifyContent: "flex-end" }
          : { justifyContent: "flex-start" }
      }
    >
      <div
        className="flex gap-1"
        style={isSender ? { flexDirection: "row-reverse" } : {}}
      >
        <div
          className="border-1 w-8 h-8 bg-cover"
          style={{
            backgroundImage: `url(http://localhost:3000/userImages/${message.sender_image})`,
          }}
        ></div>
        <div
          className="flex flex-col items-end justify-between p-3"
          style={
            isSender
              ? {
                  backgroundColor: "var(--solid-purple)",
                  color: "white",
                  borderRadius: "10px 5px 10px 10px",
                }
              : {
                  backgroundColor: "var(--gray-comment-color)",
                  borderRadius: "5px 10px 10px 10px",
                }
          }
        >
          <h1 className="text-[20px] font-light leading-[20px] !w-full !flex !items-center !justify-center">
            {message.message}
          </h1>
          <div className="flex items-center gap-1">
            <h1 className="!text-[13px]">{time}</h1>
            {isSender && (
              <div
                className="w-7 h-6 bg-cover bg-no-repeat"
                style={{ backgroundImage: `url(${statusIcon})` }}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
