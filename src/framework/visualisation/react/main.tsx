import * as React from "react";
import AuthProvider, { AuthContext } from "./contexts/AuthContext";
import { BsQuestionCircle } from "react-icons/bs"
import { Tooltip } from 'react-tooltip'
import NavBar from "./ui/elements/navbar";

interface MainProps {
  elements: JSX.Element[];
}

export const Main = ({ elements }: MainProps): JSX.Element => {
  elements = elements.map((element, index) => {
    return { ...element, key: `${index}` };
  });

  return (
    <AuthProvider>
      {<Standalone elements={elements} />}
    </AuthProvider>
  );
};

const Login = () => {
  // Login and store username in local storage
  const [username, setUsername] = React.useState("");

  const { handleLogin } = React.useContext(AuthContext);

  return (
    <>
      <Tooltip id="my-tooltip" style={{
        maxWidth: "500px",
      }} />
      <div className="flex flex-row items-center gap-2">
        <BsQuestionCircle
          className="text-text"
          data-tooltip-id="my-tooltip"
          data-tooltip-content="The Unique User ID (UUID) is unique to each user and is used to identify you in the system without revealing your identity. Logging in allows you to access your donation history."
        />
        <input
          type="text"
          value={username}
          className="border border-primary rounded-md px-2"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter UUID..."
        />
        <button
          className="bg-primary text-text rounded-md px-2 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleLogin(username)}
          disabled={!username}
        >
          Login
        </button>
      </div>
    </>
  );
}

const Logout = () => {
  // Logout and remove username from local storage
  const { username, handleLogout } = React.useContext(AuthContext);

  return (
    <div className="flex flex-row gap-4">
      <span>
        Logged in as <span className="font-semibold">{username}</span>
      </span>
      <button
        className="bg-primary text-text rounded-md px-2 font-semibold"
        onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}


const Standalone = ({ elements }: MainProps): JSX.Element => {
  const { isAuthenticated } = React.useContext(AuthContext);

  return (
    <div className="flex flex-col w-full h-full">
      <header className="flex flex-row-reverse justify-between h-full border-b-2 shadow border-primary p-4 bg-primarylight bg-opacity-5">
        {isAuthenticated
          ? <Logout />
          : <Login />}
        <NavBar />
      </header>
      <div className="p-4 sm:p-8 md:p-12 flex justify-center w-full h-full">
        <div>{elements}</div>
      </div>
    </div>
  );
};
