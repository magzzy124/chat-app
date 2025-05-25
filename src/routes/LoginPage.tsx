import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../assets/hooks/UseLogin.tsx";
import { useLoginGuest } from "../assets/hooks/UseLoginGuest.tsx";
import { useRef } from "react";

function LoginPage() {
  const navigate = useNavigate();

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const { mutate: mutateLogin } = useLogin(
    (data) => {
      const { token } = data;
      sessionStorage.setItem("token", token);
      navigate("/mainPage");
    },
    (error) => {
      if (error?.res?.status === 401) {
        console.log("Invalid username or password!");
      } else {
        console.error(error);
      }
    },
  );

  const { mutate: mutateLoginGuest } = useLoginGuest(
    (data) => {
      const { token } = data;
      sessionStorage.setItem("token", token);
      navigate("/mainPage");
    },
    (error) => {
      console.error(error);
    },
  );

  const inputClass =
    "w-full p-2 mb-4 border-1 border-[#ccc] border-solid rounded-[0.5rem] my-2.5 mx-0";
  const buttonClass =
    "w-full p-3 my-[10px] mx-0 bg-[#6a0dad] text-[white] rounded-[0.5rem] cursor-pointer transition-bg duration-300 ease-in-out hover:bg-[#5800b0]";

  const handleLogin = () => {
    const username = usernameRef.current?.value;
    const password = passwordRef.current?.value;

    if (username && password) {
      mutateLogin({ username, password });
    } else {
      console.log("Please enter both username and password.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="!text-center !text-2xl !font-bold">Welcome</h2>
        <input
          ref={usernameRef}
          type="text"
          placeholder="Username"
          className={inputClass}
        />
        <input
          ref={passwordRef}
          type="password"
          placeholder="Password"
          className={inputClass}
        />
        <button onClick={handleLogin} className={buttonClass}>
          Login
        </button>
        <button className="btn btn-secondary">Register</button>
        <button onClick={() => mutateLoginGuest()} className={buttonClass}>
          Login as Guest
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
