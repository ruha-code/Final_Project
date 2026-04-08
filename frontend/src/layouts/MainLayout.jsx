import { useNavigate, useLocation } from "react-router-dom";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItem = (path, name) => {
    const isActive = location.pathname === path;

    return (
      <li
        onClick={() => navigate(path)}
        className={`px-4 py-2 rounded-xl cursor-pointer text-sm transition-all duration-200 ${
          isActive
            ? "bg-teal-500 text-white shadow-md scale-[1.02]"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:scale-[1.01]"
        }`}
      >
        {name}
      </li>
    );
  };

  const getTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/appointments":
        return "Appointments";
      case "/patients":
        return "Patients";
      case "/doctors":
        return "Doctors";
      case "/departments":
        return "Departments";
      case "/calendar":
        return "Calendar";
      case "/inventory":
        return "Inventory";
      case "/messages":
        return "Messages";
      default:
        return "Dashboard";
    }
  };

  const getSubtitle = () => {
    if (location.pathname === "/dashboard") {
      return "Hello Ruslan, welcome back!";
    }
    return "Manage your data easily";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7]">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between px-6 py-7 shadow-sm">
        <div>
          <div className="mb-10 px-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-teal-600 tracking-wide">
              Medlink
            </h2>
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

        <div className="bg-teal-50 p-4 rounded-xl">
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
          <div>
            <h1 className="text-base font-semibold text-gray-700">
              {getTitle()}
            </h1>
            <p className="text-xs text-gray-400">{getSubtitle()}</p>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-100 px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400 transition"
            />

            <div className="w-9 h-9 bg-teal-500 text-white flex items-center justify-center rounded-full text-sm font-medium">
              R
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 lg:p-10 overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
