import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (api.getToken()) {
        try {
          const me = await api.get("/auth/me");
          setUser(me);
        } catch {
          api.removeToken();
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async ({ email, password }) => {
    const response = await api.post("/auth/login", { email, password });
    api.setToken(response.access_token);
    const me = await api.get("/auth/me");
    setUser(me);
    return me;
  };

  const register = async ({ name, username, email, password }) => {
    const response = await api.post("/auth/register", {
      full_name: name,
      username,
      email,
      password,
      role: "ADMIN",
    });
    api.setToken(response.access_token);
    const me = await api.get("/auth/me");
    setUser(me);
    return me;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {
    }
    api.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
