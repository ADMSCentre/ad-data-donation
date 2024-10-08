import { useContext } from "react";
import { Main } from "../../main";
import * as ReactDOM from 'react-dom/client'
import { AuthContext } from "../../contexts/AuthContext";
import UserDonationsPage from "../pages/user_donations_page";

const rootElement = document.getElementById('root') as HTMLElement

const NavItem = ({ onClick, to, requiresLogin = false, children }:
  {
    onClick?: () => void,
    to?: string,
    requiresLogin?: boolean
    children: React.ReactNode
  }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (requiresLogin && !isAuthenticated) {
    return null;
  }

  return (
    <a
      className="text-text px-2 py-1 font-semibold bg-opacity-0 bg-text hover:bg-opacity-100 transition-all cursor-pointer hover:text-primary"
      href={to}
      onClick={onClick}
      target="_blank"
    >
      {children}
    </a>
  );
}

const NavBar = () => {
  return (
    <div>
      <NavItem
        onClick={() => {
          // Clear any query parameters and hash
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        }}
      >
        Donate
      </NavItem>
      <NavItem
        to="https://www.admscentre.org.au/ad-observatory-project/"
      >
        About
      </NavItem>
      <NavItem
        onClick={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.hash = "#donations";
          window.location.reload();
        }}
        requiresLogin
      >
        My Donations
      </NavItem>
    </div>
  );
}

export default NavBar;