type headerType = {
  member: Contact;
};
function Header({ member }: headerType) {
  return (
    <div className="w-full  border-0 flex justify-between items-center border-b border-b-(--gray-font-color) p-[3px] !rounded-none">
      <div
        className="rounded-full w-[50px] aspect-square border border-black bg-cover"
        style={{
          backgroundImage: `url(http://localhost:3000/userImages/${member.fileName})`,
        }}
      ></div>
      <div className="description w-[calc(100%_-_50px)] flex justify-between items-center p-[10px]">
        <div>
          <h1 className="font-[900]">
            {"isGroup" in member ? member.groupName : member.friendName}
          </h1>
        </div>
      </div>
    </div>
  );
}
export default Header;
