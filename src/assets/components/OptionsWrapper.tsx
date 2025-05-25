import "../../App.css";
import { Link } from "react-router-dom";
import { navigationImmages } from "../images";
import { logoutImage } from "../images";

interface OptionsWrapperProps {
  isUploadShown: boolean;
  setIsUploadShown: (value: boolean) => void;
  yourPfp: string;
  username: string;
}

function OptionsWrapper({
  isUploadShown,
  setIsUploadShown,
  yourPfp,
  username,
}: OptionsWrapperProps) {
  return (
    <>
      <div className="border border-white flex flex-col items-center p-[10px] w-[100px] h-full relative bg-(--solid-purple)">
        <div className="mb-10 w-full flex justify-center items-center flex-col">
          <div
            onClick={() => setIsUploadShown(!isUploadShown)}
            className="aspect-[1/1] !rounded-full w-full bg-cover border-2"
            style={{
              backgroundImage: `url("http://localhost:3000/userImages/${yourPfp}")`,
            }}
          ></div>
          <h1 className="!text-white font-[900]">{username}</h1>
        </div>
        <div className="flex flex-col gap-[10px] w-fit">
          {navigationImmages.map((image: any, index: number) => (
            <div
              className="bg-no-repeat bg-cover bg-center w-[50px] aspect-square"
              style={{ backgroundImage: `url(${image})` }}
              key={index}
            ></div>
          ))}
        </div>
        <div className="logout">
          <Link to="/login">
            <div
              className="logout"
              style={{ backgroundImage: `url(${logoutImage})` }}
              onClick={() => sessionStorage.removeItem("token")}
            ></div>
          </Link>
        </div>
      </div>
    </>
  );
}

export default OptionsWrapper;
