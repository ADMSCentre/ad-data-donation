import * as React from "react";
import AuthProvider, { AuthContext } from "./contexts/AuthContext";
import { BsQuestionCircle } from "react-icons/bs"
import { Tooltip } from 'react-tooltip'
import NavBar from "./ui/elements/navbar";
import { Login, Logout } from "./ui/elements/authentication";

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



function Logo() {
  const orgs = [
    {
      name: "ARC Centre of Excellence for Automated Decision-Making and Society",
      logoUrl: "https://www.unimelb.edu.au/__data/assets/image/0006/3625854/ADM-S-Logo.png",
      url: "https://www.admscentre.org.au/"
    },
    {
      name: "University of Queensland",
      logoUrl: "https://usercontent.one/wp/studyoptions.com/wp-content/uploads/2023/08/UQlogo.png",
      url: "https://www.uq.edu.au/"
    }
  ]

  return (
    <div className="h-20 sm:h-12 flex gap-2 items-center">
      {orgs.map((org, index) => (
        <a key={index} href={org.url} target="_blank" rel="noreferrer" className="h-full">
          <img src={org.logoUrl} alt={org.name} className="!m-0 bg-white object-contain max-h-full" />
        </a>
      ))}
    </div>
  );
}

const Standalone = ({ elements }: MainProps): JSX.Element => {
  const { isAuthenticated } = React.useContext(AuthContext);

  return (
    <div className="flex flex-col w-full h-full">
      <header className="sm:sticky top-0 z-[999] flex-col flex md:flex-row justify-between sm:items-center h-full border-b-2 shadow border-primary p-2 bg-primary gap-2">
        <div className="flex gap-2 items-center flex-col sm:flex-row">
          <Logo />
        </div>
        <div className="flex justify-between flex-1 w-full">
          <NavBar />
          {isAuthenticated
            ? <Logout />
            : <Login />}
        </div>
      </header>
      <div className="p-4 sm:p-8 md:p-12 flex justify-center w-full h-full">
        <div>{elements}</div>
      </div>
    </div>
  );
};
