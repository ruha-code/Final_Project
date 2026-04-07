import { useNavigate, useLocation } from "react-router-dom";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const itemClass = (path) =>
    `px-3 py-2 rounded-lg cursor-pointer text-sm transition ${
      isActive(path)
        ? "bg-teal-50 text-teal-700 font-medium"
        : "text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <div className="flex h-screen bg-[#f7f9fb]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r px-6 py-8 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold text-teal-600 mb-10">Medlink</h2>

          <ul className="space-y-1">
            <li
              onClick={() => navigate("/dashboard")}
              className={itemClass("/dashboard")}
            >
              Dashboard
            </li>
            <li
              onClick={() => navigate("/appointments")}
              className={itemClass("/appointments")}
            >
              Appointments
            </li>
            <li className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
              Patients
            </li>
            <li className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
              Doctors
            </li>
            <li className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
              Departments
            </li>
            <li className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
              Calendar
            </li>
            <li className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
              Inventory
            </li>
            <li
              onClick={() => navigate("/messages")}
              className={itemClass("/messages")}
            >
              Messages
            </li>
          </ul>
        </div>

        <button className="text-sm text-gray-400 hover:text-gray-600">
          Sign Out
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        {/* NAVBAR */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <h1 className="text-sm font-semibold text-gray-700">Dashboard</h1>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-gray-100 px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />

            <div className="w-9 h-9 bg-teal-500 text-white flex items-center justify-center rounded-full text-sm font-medium">
              R
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
