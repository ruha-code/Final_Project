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
import Inventory from "../pages/Inventory";
import Departments from "../pages/Departments";
import DepartmentDetails from "../pages/DepartmentDetails";

function AppRoutes() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* APP */}
      <Route
        path="/dashboard"
        element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        }
      />

      <Route
        path="/messages"
        element={
          <MainLayout>
            <Messages />
          </MainLayout>
        }
      />

      <Route
        path="/appointments"
        element={
          <MainLayout>
            <Appointments />
          </MainLayout>
        }
      />

      <Route
        path="/calendar"
        element={
          <MainLayout>
            <Calendar />
          </MainLayout>
        }
      />

      <Route
        path="/patients"
        element={
          <MainLayout>
            <Patients />
          </MainLayout>
        }
      />

      <Route
        path="/patients/:id"
        element={
          <MainLayout>
            <PatientDetails />
          </MainLayout>
        }
      />

      <Route
        path="/doctors"
        element={
          <MainLayout>
            <Doctors />
          </MainLayout>
        }
      />

      <Route
        path="/doctors/:id"
        element={
          <MainLayout>
            <DoctorDetails />
          </MainLayout>
        }
      />

      <Route
        path="/inventory"
        element={
          <MainLayout>
            <Inventory />
          </MainLayout>
        }
      />

      <Route
        path="/departments"
        element={
          <MainLayout>
            <Departments />
          </MainLayout>
        }
      />

      <Route
        path="/departments/:id"
        element={
          <MainLayout>
            <DepartmentDetails />
          </MainLayout>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
