import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings, LogOut, Users } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAdmin, isDoctor } = useAuth();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);

  const dropdownRef = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const menuItem = (path, name) => {
    const isActive = location.pathname.startsWith(path);

    return (
      <li
        key={path}
        onClick={() => navigate(path)}
        className={`px-4 py-2.5 rounded-xl cursor-pointer text-sm transition ${
          isActive
            ? "bg-teal-500 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {name}
      </li>
    );
  };

  const getTitle = () => {
    const path = location.pathname;

    if (path.includes("admin/users")) return "User Management";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("appointments")) return "Appointments";
    if (path.includes("patients")) return "Patients";
    if (path.includes("doctors")) return "Doctors";
    if (path.includes("departments")) return "Departments";
    if (path.includes("schedule")) return "My Schedule";
    if (path.includes("calendar")) return "Calendar";
    if (path.includes("inventory")) return "Inventory";
    if (path.includes("messages")) return "Messages";

    return "Dashboard";
  };

  const getSubtitle = () => {
    const path = location.pathname;

    if (path.includes("admin/users")) return "Manage system users";
    if (path.includes("dashboard")) {
      if (isAdmin()) return "Admin dashboard overview";
      if (isDoctor()) return "Doctor dashboard overview";
      return "Patient dashboard overview";
    }
    if (path.includes("appointments")) return "Manage appointments";
    if (path.includes("patients")) return "Patient data & profiles";
    if (path.includes("schedule")) return "Manage your weekly availability";

    return "Manage your system";
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: "Administrator",
      DOCTOR: "Doctor",
      PATIENT: "Patient",
      STAFF: "Staff",
    };
    return labels[role] || role;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7]">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r flex flex-col justify-between px-6 py-7">
        <div>
          <div className="mb-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-teal-600">Medlink</h2>
          </div>

          <ul className="space-y-2">
            {menuItem("/dashboard", "Dashboard")}
            {menuItem("/appointments", "Appointments")}
            {(isAdmin() || isDoctor()) && menuItem("/patients", "Patients")}
            {menuItem("/doctors", "Doctors")}
            {menuItem("/departments", "Departments")}
            {isDoctor() && menuItem("/schedule", "My Schedule")}
            {menuItem("/calendar", "Calendar")}
            {isAdmin() && menuItem("/inventory", "Inventory")}
            {menuItem("/messages", "Messages")}
            {isAdmin() && (
              <>
                <li className="pt-4 pb-1 px-4 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Admin
                </li>
                {menuItem("/admin/users", "Users")}
              </>
            )}
          </ul>
        </div>

        {isAdmin() && (
          <div className="bg-teal-50 p-4 rounded-xl">
            <p className="text-sm text-gray-600 mb-3">System Admin</p>
            <div className="flex items-center gap-2 text-xs text-teal-600">
              <Users size={14} />
              <span>Full access enabled</span>
            </div>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* NAVBAR */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center relative z-50">
          {/* LEFT */}
          <div>
            <h1 className="text-base font-semibold text-gray-700">
              {getTitle()}
            </h1>
            <p className="text-xs text-gray-400">{getSubtitle()}</p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            {/* SEARCH */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 w-64"
              />
            </div>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() =>
                  setOpen(open === "notifications" ? null : "notifications")
                }
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100"
              >
                <Bell size={16} />
              </button>

              {open === "notifications" && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg p-3 z-50">
                  <p className="font-medium mb-2">Notifications</p>
                  <p className="text-gray-500 text-sm">No new notifications</p>
                </div>
              )}
            </div>

            {/* SETTINGS */}
            {isAdmin() && (
              <div className="relative">
                <button
                  onClick={() => setOpen(open === "settings" ? null : "settings")}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100"
                >
                  <Settings size={16} />
                </button>

                {open === "settings" && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg p-2 z-50">
                    <p
                      onClick={() => { navigate("/admin/users"); setOpen(null); }}
                      className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                    >
                      User Management
                    </p>
                    <p className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
                      Preferences
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            <div className="relative">
              <div
                onClick={() => setOpen(open === "profile" ? null : "profile")}
                className="flex items-center gap-3 pl-3 border-l cursor-pointer"
              >
                <div className="w-9 h-9 bg-teal-500 text-white flex items-center justify-center rounded-full text-sm font-medium">
                  {getInitials(user?.full_name)}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {getRoleLabel(user?.role)}
                  </p>
                </div>
              </div>

              {open === "profile" && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg p-2 z-50">
                  <p className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
                    Profile
                  </p>
                  {isAdmin() && (
                    <p
                      onClick={() => { navigate("/admin/users"); setOpen(null); }}
                      className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                    >
                      Settings
                    </p>
                  )}
                  <p
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="px-3 py-2 hover:bg-red-100 text-red-500 rounded-lg cursor-pointer flex items-center gap-2 text-sm"
                  >
                    <LogOut size={14} /> Logout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
