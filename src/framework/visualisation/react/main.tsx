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
          className="border border-primary rounded px-2 bg-behind"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter UUID..."
        />
        <button
          className="bg-text bg-opacity-0 hover:bg-opacity-100 text-text rounded px-2 font-semibold border border-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-opacity-0 hover:text-primary transition-all"
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
        className="bg-text bg-opacity-0 hover:bg-opacity-100 text-text rounded px-2 font-semibold border border-text cursor-pointer hover:text-primary transition-all"
        onClick={() => {
          handleLogout();
          // Clear query parameters
          const review = window.location.search.includes("review");
          if (review) {
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.reload();
          }
        }}>
        Logout
      </button>
    </div>
  );
}


const Standalone = ({ elements }: MainProps): JSX.Element => {
  const { isAuthenticated } = React.useContext(AuthContext);

  return (
    <div className="flex flex-col w-full h-full">
      <header className="sticky top-0 z-[999] flex flex-row-reverse justify-between h-full border-b-2 shadow border-primary p-4 bg-primary">
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
