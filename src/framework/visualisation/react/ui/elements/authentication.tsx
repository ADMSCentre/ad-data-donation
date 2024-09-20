import React from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { BsQuestionCircle } from "react-icons/bs";

const NUM_DIGITS = 8;

function validateLogin(username: string): boolean {
  return username.length === NUM_DIGITS && !isNaN(Number(username));
}

export const Login = () => {
  // Login and store username in local storage
  const [username, setUsername] = React.useState("");

  const { handleLogin } = React.useContext(AuthContext);

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        <BsQuestionCircle
          className="text-text"
          data-tooltip-id="my-tooltip"
          data-tooltip-content="The activation code is used to identify you in the system without revealing your identity."
        />
        <input
          type="text"
          value={username}
          className="ring-primary rounded px-2 bg-behind w-80 text-md valid:ring-green-500 transition-all ring-2 focus:outline-none"
          required
          onChange={(e) => setUsername(e.target.value)}
          placeholder={`First ${NUM_DIGITS} characters of activation code`}
          pattern={`[0-9]{${NUM_DIGITS}}`}
        />
        <button
          className="bg-text bg-opacity-0 hover:bg-opacity-100 text-text rounded px-2 font-semibold border border-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-opacity-0 hover:text-primary transition-all disabled:hover:text-text"
          onClick={() => handleLogin(username)}
          disabled={!validateLogin(username)}
        >
          Login
        </button>
      </div>
    </>
  );
}

export const Logout = () => {
  // Logout and remove username from local storage
  const { username, handleLogout } = React.useContext(AuthContext);

  return (
    <div className="flex flex-row gap-4">
      <span className="hidden sm:block">
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

