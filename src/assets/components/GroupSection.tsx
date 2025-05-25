import { plusSvg } from "../images";
import Person from "./Person";
import { getGroup } from "../services/api";

type groupSectionTypes = {
  setIsGroupCreationShown: React.Dispatch<React.SetStateAction<boolean>>;
  messagesRef: React.MutableRefObject<Record<string, Contact>>;
  unreadCount: Record<string, number>;
  setUnreadCount: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  friends: clickableContact[];
  setSelectedFriend: React.Dispatch<React.SetStateAction<Contact | undefined>>;
  setGroupEdit: React.Dispatch<React.SetStateAction<groupContact | undefined>>;
};

function GroupSection({
  setIsGroupCreationShown,
  messagesRef,
  unreadCount,
  setUnreadCount,
  friends,
  setSelectedFriend,
  setGroupEdit,
}: groupSectionTypes) {
  return (
    <div className="bg-white shadow-[0px_4px_5px_2px_rgba(121,197,239,0.38)] p-[15px] row-[7/11] col-[1/3]">
      <div className="flex justify-between">
        <h1 className="font-[900] w-auto text-center flex justify-center items-center">
          Groups
        </h1>
        <div
          onClick={() => setIsGroupCreationShown((prev) => !prev)}
          style={{ backgroundImage: `url("${plusSvg}")` }}
          className="w-8 h-8 bg-cover bg-center items-center"
        ></div>
      </div>
      {friends.map((group: any) => {
        if (group.groupId !== undefined)
          return (
            <Person
              name={group.groupName}
              image={"groupPicture.svg"}
              onClick={() => {
                if (messagesRef?.current?.[group.groupId] == undefined) {
                  getGroup(group.groupId).then((json) => {
                    messagesRef.current![group.groupId] = json;
                    setSelectedFriend({
                      ...messagesRef.current![group.groupId],
                    });
                  });
                } else {
                  setSelectedFriend({ ...messagesRef.current[group.groupId] });
                }
              }}
              lastMessage={group.lastMessage}
              unreadCount={unreadCount}
              setUnreadCount={setUnreadCount}
              key={group.groupId}
              setGroupEdit={setGroupEdit}
              contact={messagesRef.current?.[group.groupId] as groupContact}
              isGroup={true}
              groupId={group.groupId}
              messagesRef={messagesRef}
            />
          );
      })}
    </div>
  );
}
export default GroupSection;
