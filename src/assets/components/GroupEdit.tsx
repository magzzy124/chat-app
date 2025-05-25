import { Trash2 } from "lucide-react";
import { deleteAGroup, removeMemberFromGroup } from "../services/api";

type groupEditType = {
  groupEdit: groupContact | undefined;
  setGroupEdit: React.Dispatch<React.SetStateAction<groupContact | undefined>>;
  username: string;
  messagesRef: React.MutableRefObject<Record<string, Contact>>;
  setFriends: React.Dispatch<React.SetStateAction<clickableContact[]>>;
};

function GroupEdit({
  groupEdit,
  setGroupEdit,
  username,
  messagesRef,
  setFriends,
}: groupEditType) {
  const handleClickWrapper = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === "uploadImageWrapper") {
      setGroupEdit(undefined);
    }
  };

  const isAdmin = groupEdit?.adminName == username;

  return (
    groupEdit && (
      <div
        id="uploadImageWrapper"
        className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50"
        onClick={handleClickWrapper}
      >
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-[400px] space-y-6">
          <div className="flex justify-between text-purple-600 text-sm font-medium">
            <span className="text-[20px]">Admin: {groupEdit.adminName}</span>
          </div>

          <h2 className="text-xl font-bold text-black">Group members</h2>

          <div className="space-y-3 h-[clamp(150px,100px,400px)] overflow-auto rounded-none p-1">
            {groupEdit.users!.map((friendName) => (
              <div
                key={friendName}
                className="flex justify-between items-center px-4 py-2 border border-purple-200 rounded-xl "
              >
                <span className="text-base font-medium text-gray-800">
                  {friendName}
                </span>
                <button
                  className="text-purple-600 hover:text-purple-800"
                  title="Remove user"
                >
                  <div
                    onClick={() => {
                      removeMemberFromGroup(
                        groupEdit.groupId!,
                        friendName,
                      ).then(() => {
                        const groupMessages = messagesRef.current[
                          groupEdit.groupId
                        ] as groupContact;
                        groupMessages.users = groupMessages.users.filter(
                          (name) => name != friendName,
                        );
                        setGroupEdit({
                          ...groupMessages,
                        });
                      });
                    }}
                    className="p-1 hover:bg-red-400 cursor-pointer"
                  >
                    {isAdmin && <Trash2 size={18} />}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                deleteAGroup(groupEdit.groupId!).then(() => {
                  delete messagesRef.current[groupEdit.groupId!];
                  setFriends((prev) =>
                    prev.filter(
                      (user) =>
                        !("groupId" in user) ||
                        user.groupId != groupEdit.groupId,
                    ),
                  );
                  setGroupEdit(undefined);
                });
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-xl cursor-pointer"
            >
              Delete the group
            </button>
          )}
        </div>
      </div>
    )
  );
}
export default GroupEdit;
