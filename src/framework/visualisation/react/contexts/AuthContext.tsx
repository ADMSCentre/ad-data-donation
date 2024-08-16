import React, { createContext, useEffect } from "react";

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

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setIsAuthenticated(true);
      setUsername(username);
    }
  }, []);

  const handleLogin = (username: string) => {
    if (!username) return;
    localStorage.setItem("username", username);
    setUsername(username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ username, isAuthenticated, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;