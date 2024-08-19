import { useContext } from "react";
import { Main } from "../../main";
import * as ReactDOM from 'react-dom/client'
import { AuthContext } from "../../contexts/AuthContext";
import UserDonationsPage from "../pages/user_donations_page";

const rootElement = document.getElementById('root') as HTMLElement

const NavItem = ({ onClick, requiresLogin = false, children }:
  {
    onClick: () => void,
    requiresLogin?: boolean
    children: React.ReactNode
  }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (requiresLogin && !isAuthenticated) {
    return null;
  }

  return (
    <button
      className="text-text rounded-md px-2 font-semibold bg-opacity-0 bg-primary hover:bg-opacity-100 transition-all"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const NavBar = () => {
  return (
    <div>
      <NavItem
        onClick={() => {
          window.location.href = "/";
        }}
      >
        Home
      </NavItem>
      <NavItem
        onClick={() => {
          window.location.href = "/donations";
        }}
        requiresLogin
      >
        My Donations
      </NavItem>
    </div>
  );
}

export default NavBar;