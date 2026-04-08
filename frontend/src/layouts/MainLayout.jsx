import { useNavigate, useLocation } from "react-router-dom";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItem = (path, name) => {
    const isActive = location.pathname === path;

    return (
      <li
        onClick={() => navigate(path)}
        className={`px-4 py-2 rounded-lg cursor-pointer text-sm transition ${
          isActive
            ? "bg-teal-500 text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
      >
        {name}
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-[#f4f7f9]">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r flex flex-col justify-between px-6 py-7">
        <div>
          <div className="mb-10 px-2">
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

        {/* BOTTOM */}
        <div className="bg-teal-50 p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-3">
            Upgrade to Pro for more features
          </p>

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
            <h1 className="text-base font-semibold text-gray-700">Dashboard</h1>
            <p className="text-xs text-gray-400">Hello Ruslan, welcome back!</p>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-100 px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />

            <div className="w-9 h-9 bg-teal-500 text-white flex items-center justify-center rounded-full text-sm font-medium">
              R
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
