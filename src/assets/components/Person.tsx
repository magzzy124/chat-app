import { isGroupContact } from "../utilities/utilityFunctions";
import { getGroup } from "../services/api";
import { Settings } from "lucide-react";

type personType = {
  name: string;
  image: string;
  lastMessage: string;
  onClick: () => void;
  unreadCount: Record<string, number>;
  setUnreadCount: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setGroupEdit?: React.Dispatch<React.SetStateAction<groupContact | undefined>>;
  contact?: groupContact;
  isGroup?: boolean;
  groupId?: string;
  messagesRef?: React.MutableRefObject<Record<string, Contact>>;
};

function Person({
  name,
  image,
  lastMessage,
  onClick,
  unreadCount,
  setUnreadCount,
  setGroupEdit,
  contact,
  isGroup,
  groupId,
  messagesRef,
}: personType) {
  let unreadCountIdentifier: string;
  if (contact && isGroupContact(contact))
    unreadCountIdentifier = contact.groupId;
  else unreadCountIdentifier = name;
  return (
    <div
      className="w-full flex !rounded-none justify-between items-center p-[3px] border-b border-gray-400"
      onClick={() => {
        onClick();
        setUnreadCount(() => {
          unreadCount[unreadCountIdentifier] = 0;
          return { ...unreadCount };
        });
      }}
    >
      <div
        className="!rounded-full w-[50px] h-[50px] bg-cover border border-black"
        style={{
          backgroundImage: `url(http://localhost:3000/userImages/${image})`,
        }}
      ></div>
      <div className="w-[calc(100%_-_50px)] flex justify-between items-center p-[10px]">
        <div className="flex flex-col items-end justify-start">
          <h1 className="text-left font-[900]">{name}</h1>
          <h2 className="text-left">{lastMessage && ""}</h2>
        </div>
        <div className="flex flex-col items-end justify-start h-[41.8px]">
          <div>
            <h3 className="text-right text-(--gray-font-color)">
              Today,9:52pm
            </h3>
            <div className="relative w-full">
              <div className="absolute left-1/2" />
              {isGroup ? (
                <Settings
                  size={18}
                  className="text-gray-600 hover:text-black cursor-pointer relative left-1/2 -translate-x-1/2"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      groupId == undefined ||
                      setGroupEdit == undefined ||
                      messagesRef == undefined
                    )
                      return;
                    if (messagesRef?.current[Number(groupId)] == undefined)
                      getGroup(Number(groupId)).then((json) => {
                        messagesRef.current![groupId] = json;
                        setGroupEdit(
                          messagesRef.current[groupId] as groupContact,
                        );
                      });
                    else
                      setGroupEdit(
                        messagesRef.current[groupId] as groupContact,
                      );
                  }}
                />
              ) : (
                ""
              )}
              {unreadCount[unreadCountIdentifier] != 0 &&
              unreadCount[unreadCountIdentifier] != undefined ? (
                <h4 className="text-right bg-(--notification-orange-color) text-white p-[10px] w-[12px] h-[12px] rounded-full flex justify-center items-center absolute right-0 top-0">
                  {unreadCount[unreadCountIdentifier]}
                </h4>
              ) : (
                <>
                  <h4 className="absolute right-0"></h4>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Person;
