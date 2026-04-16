import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import Messages from "../pages/Messages";
import Appointments from "../pages/Appointments";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Calendar from "../pages/Calendar";
import Patients from "../pages/Patients";
import PatientDetails from "../pages/PatientDetails";
import Doctors from "../pages/Doctors";
import DoctorDetails from "../pages/DoctorDetails";
import DoctorSchedule from "../pages/DoctorSchedule";
import DoctorProfile from "../pages/DoctorProfile";
import PatientProfile from "../pages/PatientProfile";
import AdminProfile from "../pages/AdminProfile";
import Inventory from "../pages/Inventory";
import Departments from "../pages/Departments";
import DepartmentDetails from "../pages/DepartmentDetails";
import AdminUsers from "../pages/AdminUsers";
import {
  ProtectedRoute,
  AdminRoute,
  DoctorRoute,
} from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

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

      {/* Calendar - All authenticated users */}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
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

      {/* Departments - All authenticated users */}
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Departments />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments/:id"
        element={
          <ProtectedRoute>
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
    </Routes>
  );
}

export default AppRoutes;
