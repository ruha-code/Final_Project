import { useNavigate } from "react-router-dom";

function MainLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col p-5">
        <h2 className="text-2xl font-bold mb-8 text-teal-400">Medlink</h2>

        <ul className="space-y-3">
          <li
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded hover:bg-gray-700 cursor-pointer"
          >
            Dashboard
          </li>

          <li
            onClick={() => navigate("/appointments")}
            className="p-2 rounded hover:bg-gray-700 cursor-pointer"
          >
            Appointments
          </li>
        </ul>
      </div>

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Clinic Dashboard</h1>

          <button className="bg-red-500 text-white px-4 py-1 rounded">
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export default MainLayout;
