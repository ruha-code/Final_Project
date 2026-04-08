import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import Messages from "../pages/Messages";
import Appointments from "../pages/Appointments";
import Login from "../pages/Login";
import Register from "../pages/Register";

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
    </Routes>
  );
}

export default AppRoutes;
