import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={["ADMIN"]}>{children}</ProtectedRoute>;
}

export function DoctorRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "DOCTOR"]}>{children}</ProtectedRoute>
  );
}

export function PatientRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={["PATIENT"]}>
      {children}
    </ProtectedRoute>
  );
}
