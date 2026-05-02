import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export const ROLES = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  PATIENT: "PATIENT",
};

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

  const refreshUser = async () => {
    try {
      const me = await api.get("/auth/me");
      setUser(me);
      return me;
    } catch (err) {
      console.error("Failed to refresh user:", err);
      api.removeToken();
      setUser(null);
      throw err;
    }
  };

  const login = async ({ email, password }) => {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });
    api.setToken(response.access_token);
    if (response.refresh_token) api.setRefreshToken(response.refresh_token);
    return refreshUser();
  };

  const register = async ({ name, username, email, password }) => {
    const response = await api.post("/auth/register", {
      full_name: name,
      username,
      email,
      password,
    });
    return response;
  };

  const verifyCode = async ({ email, code }) => {
    const response = await api.post("/auth/verify", { email, code });
    api.setToken(response.access_token);
    if (response.refresh_token) api.setRefreshToken(response.refresh_token);
    return refreshUser();
  };

  const resendVerification = async (email) => {
    return api.post("/auth/resend-verification", { email });
  };

  const forgotPassword = async (email) => {
    return api.post("/auth/forgot-password", { email });
  };

  const resetPassword = async (token, newPassword) => {
    return api.post("/auth/reset-password", { token, new_password: newPassword });
  };

  const logout = async () => {
    const refreshToken = api.getRefreshToken();

    try {
      await api.post("/auth/logout", {
        refresh_token: refreshToken || null,
      });
    } catch {
      // Ignore logout failures and clear the local session anyway.
    }
    api.clearTokens();
    setUser(null);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = () => user?.role === ROLES.ADMIN;
  const isDoctor = () => user?.role === ROLES.DOCTOR;
  const isPatient = () => user?.role === ROLES.PATIENT;
  const isDoctorOrAdmin = () => hasRole([ROLES.ADMIN, ROLES.DOCTOR]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        verifyCode,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout,
        loading,
        isAuthenticated: !!user,
        hasRole,
        isAdmin,
        isDoctor,
        isPatient,
        isDoctorOrAdmin,
        refreshUser,
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
