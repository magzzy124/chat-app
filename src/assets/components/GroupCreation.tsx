import { CSSProperties, useState } from "react";
import { checkMark } from "../images";
import { createAGroup } from "../services/api";
import { useRef } from "react";

type groupCreationType = {
  isGroupCreationShown: boolean;
  setIsGroupCreationShown: React.Dispatch<React.SetStateAction<boolean>>;
  friends: clickableContact[];
  setFriends: React.Dispatch<React.SetStateAction<clickableContact[]>>;
  messagesRef: React.MutableRefObject<Record<string, Contact>>;
};

function GroupCreation({
  isGroupCreationShown,
  setIsGroupCreationShown,
  friends,
  setFriends,
  messagesRef,
}: groupCreationType) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isError, setIsError] = useState<boolean>(false);
  const input = useRef<HTMLInputElement>(null);
  function toggleWindow(e: any) {
    if (e.target.classList.contains("groupCreationWrapper")) {
      setIsGroupCreationShown((prev) => !prev);
    }
  }

  return (
    isGroupCreationShown && (
      <div
        onClick={(e) => toggleWindow(e)}
        className="groupCreationWrapper absolute w-screen h-screen bg-black/60 z-10"
      >
        <div className=" bg-white w-fit h-105 border-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 flex flex-col">
          <h2 className="text-left text-[22px]">Input the group name</h2>
          <input
            type="text"
            className="border-2 w-[60%] h-[40px] text-[25px] p-1"
            ref={input}
          />
          {isError && <h1 className="red">This group already exists!</h1>}
          <h2 className="text-[22px] text-left">Choose which friends to add</h2>
          <div className="border-1 !rounded-none h-3/6 w-[350px]">
            {friends.map(
              (member) =>
                !("groupId" in member) && (
                  <Friend
                    onClick={() => {
                      setSelectedFriends((prev) =>
                        prev.includes(member.friendName)
                          ? prev.filter((name) => name !== member.friendName)
                          : [...prev, member.friendName],
                      );
                    }}
                    key={member.friendName}
                    isSelected={selectedFriends.includes(member.friendName)}
                    image={member.fileName}
                    name={member.friendName}
                  />
                ),
            )}
          </div>
          <div
            className="flex justify-center items-center button absolute border-2 w-40 h-12 bottom-4.5 right-4.5"
            onClick={() => {
              if (input.current != undefined)
                createAGroup(input.current.value, selectedFriends)
                  .then((response) => {
                    if (response.status == 409) {
                      input.current!.style.borderColor = "red";
                      setIsError(true);
                    } else {
                      input.current!.style.borderColor = "gray";
                      return response.json();
                    }
                  })
                  .then((group: groupContact) => {
                    messagesRef.current[group.groupId!] = group;
                    let { groupId, groupName } = group;
                    setFriends([
                      ...friends,
                      {
                        groupId,
                        groupName,
                        fileName: "groupPicture.svg",
                        lastMessage: group.lastMessage,
                      },
                    ]);
                    setIsGroupCreationShown((prev) => !prev);
                  });
            }}
          >
            Create a group
          </div>
        </div>
      </div>
    )
  );
}
const checkedCss: CSSProperties = {
  backgroundImage: `url(${checkMark})`,
  backgroundRepeat: "no-repeat",
  backgroundSize: "50%",
  backgroundPosition: "center",
  backgroundColor: "purple",
};

type friendType = {
  image: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
};

function Friend({ image, name, isSelected, onClick }: friendType) {
  return (
    <div
      className="border-b-2 border-b-gray-400 !rounded-none w-full h-13 flex p-2 justify-between items-center"
      onClick={onClick}
    >
      <div className="flex justify-center items-center gap-2">
        <div
          className="w-10 h-10 bg-cover border-1"
          style={{
            backgroundImage: `url(http://localhost:3000/userImages/${image})`,
          }}
        />
        <h2>{name}</h2>
      </div>
      <div
        style={isSelected ? checkedCss : {}}
        className="border-2 rounded-full w-6 h-6 mr-2"
      ></div>
    </div>
  );
}

export default GroupCreation;
