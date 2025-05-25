import "../../App.css";
import { cartImage, loadingGif } from "../images";
import { deleteFriend, addFriend } from "../services/api";
import { useRef, useEffect, useState } from "react";
import { useGetAllPeople } from "../hooks/UseGetAllPeople";
import { isClickableFriend } from "../utilities/utilityFunctions";

type searchWrapperTypes = {
  messagesRef: React.MutableRefObject<Record<string, Contact>>;
  username: string;
  setFriends: React.Dispatch<React.SetStateAction<clickableContact[]>>;
};

type listedPeopleType = {
  isFriend: boolean;
  username: string;
};

function SearchWrapper({ messagesRef, setFriends }: searchWrapperTypes) {
  const searchRef = useRef<HTMLDivElement>(null);
  const [isSearchDropdownVisible, setIsSearchDropdownVisible] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [listedPeople, setListedPeople] = useState<listedPeopleType[]>();
  const { isPending, data: allPeople } = useGetAllPeople(searchParam);

  useEffect(() => {
    setListedPeople(allPeople);
  }, [allPeople]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div
        className="search bg-white shadow-[0px_4px_5px_2px_rgba(121,197,239,0.38)] p-[15px] flex justify-center items-center relative row-[1/2] col-[1/3]"
        ref={searchRef}
      >
        <img
          className="bg-center w-[40px] h-[40px] ml-[8px]"
          src={cartImage}
          alt="123"
        />
        <input
          className="p-0 w-full h-full border-0 outline-none text-[22px]"
          type="text"
          placeholder="Search"
          onFocus={() => setIsSearchDropdownVisible(true)}
          onChange={(e) => {
            setSearchParam(e.target.value);
          }}
        />
        <div
          className={`searchDropDown h-0 overflow-hidden absolute top-[80px] w-full bg-white shadow-[0_4px_6px_rgba(0,_0,_0,_0.1)] z-[1000] flex flex-col !rounded-[8px] transition-[height] duration-300 ease-in-out gap-[8px] ${isSearchDropdownVisible ? "h-[280px] p-[5px] border border-[#ccc]" : ""}`}
        >
          {isPending && (
            <div
              id="loadingDiv"
              className="absolute flex bg-white w-full h-full rounded-1xl opacity-90 "
            >
              <img
                className="absolute top-1/2 left-1/2 scale-200 transform -translate-x-1/2 -translate-y-1/2 !m-0"
                src={loadingGif}
                alt="Loading..."
              />
            </div>
          )}
          {listedPeople &&
            listedPeople.map(
              (
                user: { username: string; isFriend: boolean },
                index: number,
              ) => (
                <div
                  className="flex justify-between items-center p-[10px_15px]  border border-[#e0e0e0] transition-all duration-200 ease-in-out  cursor-pointer shadow-[0_2px_5px_rgba(0,_0,_0,_0.05)] hover:bg-purple-400"
                  key={user.username}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLDivElement;
                    if (
                      target.style.backgroundColor == "rgba(77, 255, 145, 0.8)"
                    )
                      target.style.backgroundColor = "rgba(227, 57, 57, 0.8)";
                  }}
                  onMouseLeave={(e) => {
                    if (user.isFriend)
                      (e.target as HTMLDivElement).style.backgroundColor =
                        "rgba(77, 255, 145, 0.8)";
                  }}
                  onClick={() => {
                    if (user.isFriend) {
                      deleteFriend(user.username).then(() => {
                        delete messagesRef.current![user.username];
                        setFriends((prev) =>
                          prev.filter(
                            (contact) =>
                              !isClickableFriend(contact) ||
                              contact.friendName != user.username,
                          ),
                        );
                      });
                    } else {
                      addFriend(user.username)
                        .then((data) => data.json())
                        .then((json: friendContact) => {
                          messagesRef.current![user.username] = json;
                          setFriends((prev) => [
                            ...prev,
                            {
                              friendName: json.friendName,
                              lastMessage: json.lastMessage,
                              fileName: json.fileName,
                            },
                          ]);
                        });
                    }
                    listedPeople[index].isFriend = !user.isFriend;
                    setListedPeople([...listedPeople]);
                  }}
                  style={
                    user.isFriend
                      ? { backgroundColor: "rgba(77, 255, 145, 0.8)" }
                      : {}
                  }
                >
                  <span>{user.username}</span>
                  {!user.isFriend ? (
                    <div className="w-[20px] aspect-square rounded-full bg-[#6a0dad] flex justify-center items-center text-white font-extrabold text-[14px] transition-[200ms] hover:scale-110">
                      +
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              ),
            )}
        </div>
      </div>
    </>
  );
}

export default SearchWrapper;
