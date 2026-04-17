import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import MainLayout from "../layouts/MainLayout";
import {
  ProtectedRoute,
  AdminRoute,
  DoctorRoute,
} from "../components/ProtectedRoute";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Messages = lazy(() => import("../pages/Messages"));
const Appointments = lazy(() => import("../pages/Appointments"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Calendar = lazy(() => import("../pages/Calendar"));
const Patients = lazy(() => import("../pages/Patients"));
const PatientDetails = lazy(() => import("../pages/PatientDetails"));
const Doctors = lazy(() => import("../pages/Doctors"));
const DoctorDetails = lazy(() => import("../pages/DoctorDetails"));
const DoctorSchedule = lazy(() => import("../pages/DoctorSchedule"));
const DoctorProfile = lazy(() => import("../pages/DoctorProfile"));
const PatientProfile = lazy(() => import("../pages/PatientProfile"));
const AdminProfile = lazy(() => import("../pages/AdminProfile"));
const MyPatients = lazy(() => import("../pages/MyPatients"));
const AuditLogs = lazy(() => import("../pages/AuditLogs"));
const Inventory = lazy(() => import("../pages/Inventory"));
const Departments = lazy(() => import("../pages/Departments"));
const DepartmentDetails = lazy(() => import("../pages/DepartmentDetails"));
const AdminUsers = lazy(() => import("../pages/AdminUsers"));
const Analytics = lazy(() => import("../pages/Analytics"));

function AuthRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function RouteLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

        {/* Dashboard - All authenticated users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Messages - All authenticated users */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Messages />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Appointments - All authenticated users */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Appointments />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Calendar - Admin and Doctor only */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "DOCTOR"]}>
              <MainLayout>
                <Calendar />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Doctors - All authenticated users */}
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Doctors />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctors/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DoctorDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Doctor Schedule - Doctor only */}
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <MainLayout>
                <DoctorSchedule />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* My Patients - Doctor only */}
        <Route
          path="/my-patients"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <MainLayout>
                <MyPatients />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Doctor Profile - Doctor only */}
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <MainLayout>
                <DoctorProfile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Patient Profile - Patient only */}
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <MainLayout>
                <PatientProfile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Profile - Admin only */}
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <MainLayout>
                <AdminProfile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Departments - Admin and Doctor only */}
        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "DOCTOR"]}>
              <MainLayout>
                <Departments />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "DOCTOR"]}>
              <MainLayout>
                <DepartmentDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Patients - ADMIN and DOCTOR only */}
        <Route
          path="/patients"
          element={
            <DoctorRoute>
              <MainLayout>
                <Patients />
              </MainLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/patients/:id"
          element={
            <DoctorRoute>
              <MainLayout>
                <PatientDetails />
              </MainLayout>
            </DoctorRoute>
          }
        />

        {/* Inventory - ADMIN only */}
        <Route
          path="/inventory"
          element={
            <AdminRoute>
              <MainLayout>
                <Inventory />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Admin Users - ADMIN only */}
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <MainLayout>
                <AdminUsers />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Audit Logs - ADMIN only */}
        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute>
              <MainLayout>
                <AuditLogs />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Analytics - ADMIN only */}
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <MainLayout>
                <Analytics />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
