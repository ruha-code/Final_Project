// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // LOGIN
  const login = async ({ email, password }) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const savedUser = JSON.parse(localStorage.getItem("user"));

        if (
          savedUser &&
          savedUser.email === email &&
          savedUser.password === password
        ) {
          setUser(savedUser);
          setLoading(false);
          resolve(savedUser);
        } else {
          setLoading(false);
          reject(new Error("Invalid credentials"));
        }
      }, 500);
    });
  };

  // REGISTER
  const register = async ({ name, email, password }) => {
    setLoading(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          name,
          email,
          password,
          role: "Admin",
        };

        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
        setLoading(false);

        resolve(newUser);
      }, 500);
    });
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
