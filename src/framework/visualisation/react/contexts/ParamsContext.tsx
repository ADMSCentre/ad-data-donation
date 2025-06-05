import React from "react";

type ParamsContextProps = {
  username: string | null;
  platform: string | null;
}

const ParamsContext = React.createContext<ParamsContextProps | null>(null);

export const useParamsContext = (): ParamsContextProps => {
  const context = React.useContext(ParamsContext);
  if (!context) {
    throw new Error("useParamsContext must be used within a ParamsProvider");
  }
  return context;
}

export const ParamsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [params, setParams] = React.useState<ParamsContextProps>({
    username: null,
    platform: null,
  });

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    const platform = urlParams.get("platform");

    setParams({ username, platform });
  }, []);

  return (
    <ParamsContext.Provider value={params}>
      {children}
    </ParamsContext.Provider>
  );
}