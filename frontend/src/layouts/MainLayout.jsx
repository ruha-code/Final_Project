import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);

  const dropdownRef = useRef();

  // CLOSE DROPDOWNS
  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // MENU
  const menuItem = (path, name) => {
    const isActive = location.pathname.startsWith(path);

    return (
      <li
        onClick={() => navigate(path)}
        className={`px-4 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-200 ${
          isActive
            ? "bg-teal-500 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
      >
        {name}
      </li>
    );
  };

  // TITLE
  const getTitle = () => {
    const path = location.pathname;

    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("appointments")) return "Appointments";
    if (path.includes("patients")) return "Patients";
    if (path.includes("doctors")) return "Doctors";
    if (path.includes("departments")) return "Departments";
    if (path.includes("calendar")) return "Calendar";
    if (path.includes("inventory")) return "Inventory";
    if (path.includes("messages")) return "Messages";

    return "Dashboard";
  };

  // SUBTITLE
  const getSubtitle = () => {
    const path = location.pathname;

    if (path.includes("dashboard")) return "Hello Ruslan, welcome back 👋";

    if (path.includes("patients") && path !== "/patients")
      return "Patient profile & medical data";

    if (path.includes("appointments")) return "Manage and track appointments";

    if (path.includes("calendar")) return "Schedule and plan events";

    return "Manage your data easily";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7]">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r flex flex-col justify-between px-6 py-7 shadow-sm">
        <div>
          <div className="mb-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-teal-600">Medlink</h2>
          </div>

          <ul className="space-y-2">
            {menuItem("/dashboard", "Dashboard")}
            {menuItem("/appointments", "Appointments")}
            {menuItem("/patients", "Patients")}
            {menuItem("/doctors", "Doctors")}
            {menuItem("/departments", "Departments")}
            {menuItem("/calendar", "Calendar")}
            {menuItem("/inventory", "Inventory")}
            {menuItem("/messages", "Messages")}
          </ul>
        </div>

        {/* UPGRADE */}
        <div className="bg-teal-50 p-4 rounded-xl border">
          <p className="text-sm text-gray-600 mb-3">Upgrade to Pro</p>
          <button className="w-full bg-teal-500 text-white py-2 rounded-lg text-sm hover:bg-teal-600 transition">
            Upgrade
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* NAVBAR */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
          {/* LEFT */}
          <div>
            <h1 className="text-base font-semibold text-gray-700">
              {getTitle()}
            </h1>
            <p className="text-xs text-gray-400">{getSubtitle()}</p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4" ref={dropdownRef}>
            {/* SEARCH */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anything..."
                className="bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none 
                           focus:ring-2 focus:ring-teal-400 transition w-64"
              />
            </div>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() =>
                  setOpen(open === "notifications" ? null : "notifications")
                }
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <Bell size={16} />
              </button>

              {open === "notifications" && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-lg p-3 text-sm">
                  <p className="font-medium mb-2">Notifications</p>
                  <p className="text-gray-500">No new notifications</p>
                </div>
              )}
            </div>

            {/* SETTINGS */}
            <div className="relative">
              <button
                onClick={() => setOpen(open === "settings" ? null : "settings")}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <Settings size={16} />
              </button>

              {open === "settings" && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-2 text-sm">
                  <p className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    Preferences
                  </p>
                  <p className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    Theme
                  </p>
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div className="relative">
              <div
                onClick={() => setOpen(open === "profile" ? null : "profile")}
                className="flex items-center gap-3 pl-3 border-l cursor-pointer"
              >
                <div className="w-9 h-9 bg-teal-500 text-white flex items-center justify-center rounded-full text-sm font-medium">
                  R
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Ruslan</p>
                  <p className="text-xs text-gray-400">Admin</p>
                </div>
              </div>

              {open === "profile" && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-2 text-sm">
                  <p className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    Profile
                  </p>
                  <p className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    Settings
                  </p>
                  <p className="px-3 py-2 hover:bg-red-100 text-red-500 rounded-lg cursor-pointer">
                    Logout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 overflow-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export default MainLayout;
