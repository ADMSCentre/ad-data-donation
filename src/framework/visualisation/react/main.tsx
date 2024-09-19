import * as React from "react";
import AuthProvider, { AuthContext } from "./contexts/AuthContext";
import { BsQuestionCircle, BsGithub } from "react-icons/bs"
import { Tooltip } from 'react-tooltip'
import NavBar from "./ui/elements/navbar";
import { Login, Logout } from "./ui/elements/authentication";
import mediumZoom from 'medium-zoom'

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
      logoUrl: "images/logos/adms.png",
      url: "https://www.admscentre.org.au/"
    },
    {
      name: "University of Queensland",
      logoUrl: "images/logos/uq.png",
      url: "https://www.uq.edu.au/"
    }
  ]

  return (
    <div className="h-20 sm:h-12 flex gap-2 items-center">
      {orgs.map((org, index) => (
        <a key={index} href={org.url}
          target="_blank"
          rel="noreferrer"
          className="h-full p-[1px] border-text border-opacity-0 border-2 hover:border-opacity-100 transition-all"
        >
          <img
            src={org.logoUrl} alt={org.name}
            className="!m-0 object-contain max-h-full"
          />
        </a>
      ))}
    </div>
  );
}

const Standalone = ({ elements }: MainProps): JSX.Element => {
  const { isAuthenticated } = React.useContext(AuthContext);
  React.useEffect(() => {
    console.log('[Main] Applying mediumZoom to all images')
    mediumZoom(document.querySelectorAll('.zoomable img'), {
      margin: 24,
      background: 'rgba(0, 0, 0, 0.9)',
    });
  }, [elements]);

  return (
    <>
      <div className="flex flex-col w-full h-full min-h-screen">
        <header className="sm:sticky top-0 z-[999] flex-col flex md:flex-row justify-between sm:items-center h-full border-primary p-2 bg-primary gap-2">
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
        <div className="p-4 flex-1 sm:p-8 md:p-12 flex justify-center w-full h-full">
          <div>{elements}</div>
        </div>
        <footer className="flex flex-col justify-center text-text px-8 py-4 gap-4 min-h-10 bg-primary">
          <div className="flex flex-row justify-between items-center ">
            <div>Adapted from <a href="https://github.com/d3i-infra/data-donation-task" target="_blank">d3i-infra/data-donation-task</a></div>
            <div className='flex justify-center gap-4'>
              {/* Logos */}
              <img src="images/logos/adms.png" alt="ARC Centre of Excellence for Automated Decision-Making and Society" className="h-12 !m-0" />
              <img src="images/logos/uq.png" alt="University of Queensland" className="h-12 !m-0" />
              <img src="images/logos/qut.png" alt="Queensland University of Technology" className="h-12 !m-0" />
            </div>
            <div className="flex gap-2 items-center">
              Find us on
              <a href="https://github.com/ADMSCentre/ad-data-donation" target="_blank">
                <BsGithub size={28} />
              </a>
            </div>
          </div>

        </footer>
      </div>
      <Tooltip id="my-tooltip" style={{
        maxWidth: "500px",
        zIndex: "1000"
      }} />
    </>
  );
};
