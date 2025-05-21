import React, { createContext, useCallback, useEffect } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  handleLogin: (username: string) => { },
  handleLogout: () => { },
  username: "",
});

const AuthProvider = ({ children }: {
  children: React.ReactNode;
}) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [username, setUsername] = React.useState("");


  const handleLogin = useCallback((username: string) => {
    if (!username) return;
    localStorage.setItem("username", username);
    setUsername(username);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("username");
    setIsAuthenticated(false);
    setUsername("");
  }, []);

  useEffect(() => {
    // Try to get the username from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromParams = urlParams.get("username");
    if (usernameFromParams) {
      handleLogin(usernameFromParams);
      // Clear the query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Try to get the username from local storage
    const username = localStorage.getItem("username");
    if (username) {
      setIsAuthenticated(true);
      setUsername(username);
    }
    return () => {
      setIsAuthenticated(false);
      setUsername("");
    }
  }, [handleLogin]);

  return (
    <AuthContext.Provider value={{ username, isAuthenticated, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;