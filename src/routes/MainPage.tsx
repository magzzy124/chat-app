import { useEffect, useRef, useState } from "react";
import "../App.css";
import Person from "../assets/components/Person.js";
import { jwtDecode, JwtPayload } from "jwt-decode";
import UploadImage from "../assets/components/UploadImage.tsx";
import {
  isClickableFriend,
  isGroupContact,
} from "../assets/utilities/utilityFunctions.ts";
import {
  getFriends,
  getGroup,
  getUserMessages,
  getYourPfp,
} from "../assets/services/api.ts";
import OptionsWrapper from "../assets/components/OptionsWrapper.tsx";
import SearchWrapper from "../assets/components/SearchWrapper.tsx";
import ChatSection from "../assets/components/ChatSection.tsx";
import { useWebsocket } from "../assets/services/websocket.ts";
import GroupSection from "../assets/components/GroupSection.tsx";
import GroupCreation from "../assets/components/GroupCreation.tsx";
import GroupEdit from "../assets/components/GroupEdit.tsx";

interface customJwtPayload extends JwtPayload {
  username: string;
}

function MainPage() {
  const [isUploadShown, setIsUploadShown] = useState(false);
  const [isGroupCreationShown, setIsGroupCreationShown] = useState(false);
  const [groupEdit, setGroupEdit] = useState<groupContact>();
  const [username] = useState<string>(() => {
    const token = sessionStorage.getItem("token") || "";
    const decodedToken = jwtDecode<customJwtPayload>(token);
    const username = decodedToken.username;
    return username;
  });
  const [selectedFriend, setSelectedFriend] = useState<Contact | undefined>();
  const [friends, setFriends] = useState<clickableContact[]>([]);
  const [yourPfp, setYourPfp] = useState<string>("default.png");
  const [unreadCount, setUnreadCount] = useState<Record<string, number>>(() => {
    const storedUnreadCount = localStorage.getItem("unreadCount");
    return storedUnreadCount ? JSON.parse(storedUnreadCount) : {};
  });

  let unreadCounterRef = useRef<Record<string, number>>({});
  let messagesRef = useRef<Record<string, Contact>>({});
  let selectedFriendRef = useRef<Contact | undefined>();
  var websocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (selectedFriend != undefined && messagesRef.current != undefined)
      if ("isGroup" in selectedFriend)
        selectedFriendRef.current =
          messagesRef.current[String(selectedFriend.groupId)];
      else
        selectedFriendRef.current =
          messagesRef.current[selectedFriend.friendName];
  }, [selectedFriend]);

  useEffect(() => {
    getFriends()
      .then((data) => data.json())
      .then((json) => setFriends(json));

    getYourPfp(username)
      .then((response) => response.json())
      .then((data) => {
        setYourPfp(data.imgSrc);
      });

    const { websocketId } = useWebsocket({
      username,
      onMessage: handleWsMessage,
      onDeliver: onDeliver,
      onSeen: onSeen,
      onFriendEdit: onFriendEdit,
      onGroupEdit: onGroupEdit,
      onGroupDeletionOrCreation: onGroupDeletionOrCreation,
    });
    websocket.current = websocketId;

    return () => {
      if (websocketId) websocketId.close();
    };
  }, []);

  async function handleWsMessage(
    sender: string,
    message: string,
    messageId: string,
    pfp: string,
    timestamp: string,
    isGroup?: boolean,
  ) {
    if (messagesRef.current[sender] == undefined) {
      if (isGroup == true) {
        if (messagesRef.current[sender] == undefined) {
          let json = await getGroup(Number(sender));
          messagesRef.current[sender] = json;
        }
        let group = Object.values(messagesRef.current).find(
          (member) => "isGroup" in member && member.groupId === sender,
        );
        if (group && "isGroup" in group) sender = group.groupName;
      } else {
        let data = await getUserMessages(sender);
        let json = await data.json();
        messagesRef.current[sender] = json;
      }
    }

    messagesRef.current?.[sender]?.messages.push({
      username: sender,
      message: message,
      messageId: messageId,
      sender_image: pfp,
      timestamp: timestamp,
    });

    if (
      (isGroup &&
        (selectedFriendRef.current as groupContact | undefined)?.groupId !=
          sender) ||
      (selectedFriendRef.current as friendContact | undefined)?.friendName !==
        sender
    ) {
      if (unreadCounterRef.current[sender] == undefined)
        unreadCounterRef.current[sender] = 1;
      else unreadCounterRef.current[sender] += 1;
      setUnreadCount({ ...unreadCounterRef.current });
    } else setSelectedFriend({ ...selectedFriendRef.current } as Contact);
  }

  async function onDeliver(
    reciever: string,
    messageId: string,
    isGroup?: boolean,
  ) {
    if (messagesRef.current == undefined) return;
    const messages = messagesRef.current;

    if (isGroup) {
      if (messages[reciever] == undefined) {
        const data = await getGroup(Number(reciever));
        messages[reciever] = await data.json();
      }
      let group = Object.values(messages).find(
        (group): group is groupContact =>
          isGroupContact(group) && group.groupId === reciever,
      );
      if (group) reciever = group.groupName;
    }

    let targetMessage = messages[reciever].messages.find(
      (message) => message.messageId === messageId,
    );
    targetMessage.messageStatus = "delivered";

    if (selectedFriendRef.current == undefined) return;

    const selectedMember = selectedFriendRef.current;
    const isMatch = isGroupContact(selectedMember)
      ? selectedMember.groupId === reciever
      : selectedMember.friendName === reciever;

    if (isMatch) setSelectedFriend(messages[reciever]);
  }

  async function onSeen(reciever: string, messageId: string) {
    if (messagesRef.current == undefined) return;
    const messages = messagesRef.current;

    if (messages[reciever] == undefined) {
      let data = await getUserMessages(reciever);
      messages[reciever] = await data.json();
    }

    let targetMessage = messages[reciever].messages.find((message) => {
      return message.messageId == messageId;
    });
    targetMessage.messageStatus = "seen";

    if (selectedFriendRef.current == undefined) return;
    const selectedMember = selectedFriendRef.current;
    if (
      !isGroupContact(selectedMember) &&
      selectedMember.friendName === reciever
    )
      setSelectedFriend({ ...messages[reciever] });
  }

  async function onFriendEdit(friendName: string) {
    getUserMessages(friendName)
      .then((data) => {
        if (data.status == 403) {
          delete messagesRef.current[friendName];
          setFriends((prev) =>
            prev.filter(
              (contact) =>
                !isClickableFriend(contact) || contact.friendName != friendName,
            ),
          );
          const selectedFriend = selectedFriendRef.current;
          if (
            selectedFriend &&
            !isGroupContact(selectedFriend) &&
            selectedFriend.friendName == friendName
          )
            setSelectedFriend(undefined);
          throw new Error(`${friendName} unfriended you!`);
        }
        return data.json();
      })
      .then((json: friendContact) => {
        messagesRef.current[friendName] = json;
        setFriends((prev) => {
          return [
            ...prev,
            {
              fileName: json.fileName,
              friendName: json.friendName,
              lastMessage: json.lastMessage,
            },
          ];
        });
      });
  }

  async function onGroupEdit(groupId: string, recievedUsername: string) {
    const messages = messagesRef.current;
    if (recievedUsername == username) {
      //If YOU are the one getting removed from the group
      delete messages[groupId];
      setFriends((prev) =>
        prev.filter(
          (member) => isClickableFriend(member) || member.groupId != groupId,
        ),
      );
      const selectedMember = selectedFriendRef.current;
      if (
        selectedMember &&
        isGroupContact(selectedMember) &&
        selectedMember.groupId == groupId
      )
        setSelectedFriend(undefined);
      setGroupEdit((prev) => (prev?.groupId == groupId ? undefined : prev));
    } else {
      //If someone else is getting removed from the group
      const group = messages[groupId] as groupContact;
      if (!group) return;

      group.users = group.users?.filter((user) => user != recievedUsername);
      setGroupEdit((prev) => (prev?.groupId == groupId ? { ...group } : prev));
    }
  }

  async function onGroupDeletionOrCreation(
    groupId: string,
    shouldCreate: boolean,
  ) {
    if (shouldCreate == false) {
      // delete the group
      delete messagesRef.current[groupId];
      setFriends((prev) =>
        prev.filter(
          (member) => isClickableFriend(member) || member.groupId != groupId,
        ),
      );
      const selectedMember = selectedFriendRef.current;
      if (
        selectedMember &&
        isGroupContact(selectedMember) &&
        selectedMember.groupId == groupId
      )
        setSelectedFriend(undefined);
      setGroupEdit((prev) => prev && undefined);
    } else {
      // fetch a new group
      getGroup(Number(groupId)).then((json: groupContact) => {
        messagesRef.current[groupId] = json;
        setFriends((prev) => [
          ...prev,
          {
            fileName: json.fileName,
            lastMessage: json.lastMessage,
            groupId: groupId,
            groupName: json.groupName,
          },
        ]);
      });
    }
  }

  useEffect(() => {
    unreadCounterRef.current = unreadCount;
    const handleBeforeUnload = () => {
      localStorage.setItem("unreadCount", JSON.stringify(unreadCount));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unreadCount]);

  return (
    <>
      <GroupEdit
        username={username}
        setGroupEdit={setGroupEdit}
        groupEdit={groupEdit}
        setFriends={setFriends}
        messagesRef={messagesRef}
      />
      <UploadImage
        isUploadShown={isUploadShown}
        setIsUploadShown={setIsUploadShown}
      />
      <GroupCreation
        friends={friends}
        setFriends={setFriends}
        isGroupCreationShown={isGroupCreationShown}
        setIsGroupCreationShown={setIsGroupCreationShown}
        messagesRef={messagesRef}
      />
      <div className="border border-white w-[1200px] h-[800px] p-4 flex gap-[30px] bg-(--wrapper-background)">
        <OptionsWrapper
          isUploadShown={isUploadShown}
          setIsUploadShown={setIsUploadShown}
          yourPfp={yourPfp}
          username={username}
        />
        <div className="pageWrapper grid grid-rows-[repeat(10,_1fr)] grid-cols-[repeat(5,_1fr)] w-full gap-[30px]">
          <SearchWrapper
            messagesRef={messagesRef}
            username={username}
            setFriends={setFriends}
          />
          <div className="bg-white shadow-[0px_4px_5px_2px_rgba(121,197,239,0.38)] p-[15px] row-[2/7] col-[1/3]">
            <h1 className="text-left font-[900]">Friends</h1>
            {friends.map((friend, index) => {
              if (!("groupId" in friend))
                return (
                  <Person
                    key={index}
                    name={friend.friendName}
                    image={friend.fileName}
                    lastMessage={friend.lastMessage}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                    onClick={() => {
                      if (
                        messagesRef.current?.[friend.friendName] === undefined
                      ) {
                        getUserMessages(friend.friendName)
                          .then((data) => data.json())
                          .then((json) => {
                            messagesRef.current![friend.friendName] = json;
                            setSelectedFriend(
                              messagesRef.current![friend.friendName],
                            );
                          });
                      } else {
                        setSelectedFriend(
                          messagesRef.current![friend.friendName],
                        );
                      }
                    }}
                  />
                );
            })}
          </div>
          <GroupSection
            setIsGroupCreationShown={setIsGroupCreationShown}
            friends={friends}
            unreadCount={unreadCount}
            messagesRef={messagesRef}
            setUnreadCount={setUnreadCount}
            setSelectedFriend={setSelectedFriend}
            setGroupEdit={setGroupEdit}
          />
          <ChatSection
            username={username}
            messagesRef={messagesRef}
            selectedFriend={selectedFriend}
            setSelectedFriend={setSelectedFriend}
            websocket={websocket}
            yourPfp={yourPfp}
          />
        </div>
      </div>
    </>
  );
}

export default MainPage;
