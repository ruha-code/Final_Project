function Dashboard() {
  return (
    <div>
      {/* TITLE */}
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Dashboard</h1>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-gray-50 p-5 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Patients</p>
          <h2 className="text-2xl font-semibold mt-2">120</h2>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Appointments</p>
          <h2 className="text-2xl font-semibold mt-2">45</h2>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Doctors</p>
          <h2 className="text-2xl font-semibold mt-2">12</h2>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-gray-50 p-6 rounded-xl border">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Recent Appointments
        </h2>

        {/* HEADER */}
        <div className="grid grid-cols-3 text-xs text-gray-400 uppercase mb-3">
          <span>Patient</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {/* ROWS */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 p-3 bg-white rounded-lg">
            <span className="font-medium text-gray-700">John Doe</span>
            <span className="text-gray-500">10 Apr</span>
            <span className="text-green-600 font-medium">Done</span>
          </div>

          <div className="grid grid-cols-3 p-3 bg-white rounded-lg">
            <span className="font-medium text-gray-700">Jane Smith</span>
            <span className="text-gray-500">11 Apr</span>
            <span className="text-yellow-600 font-medium">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
