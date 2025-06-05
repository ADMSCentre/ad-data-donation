import React, { createContext, useCallback, useEffect } from "react";
import { useParamsContext } from "./ParamsContext";

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

  const { username: usernameParam } = useParamsContext();

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
    if (usernameParam) {
      handleLogin(usernameParam);
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
  }, [handleLogin, usernameParam]);

  return (
    <AuthContext.Provider value={{ username, isAuthenticated, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;