import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const data = [
  { name: "Mon", patients: 30 },
  { name: "Tue", patients: 45 },
  { name: "Wed", patients: 60 },
  { name: "Thu", patients: 50 },
  { name: "Fri", patients: 70 },
  { name: "Sat", patients: 40 },
  { name: "Sun", patients: 65 },
];

function Dashboard() {
  return (
    <div className="flex gap-6">
      {/* LEFT */}
      <div className="flex-1 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-5">
              <p className="text-sm text-gray-500">Total Patients</p>
              <h2 className="text-2xl font-semibold mt-2">8,340</h2>
            </div>
            <div className="bg-teal-50 text-teal-600 text-xs px-5 py-2">
              +1.5% vs last week
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-5">
              <p className="text-sm text-gray-500">Appointments</p>
              <h2 className="text-2xl font-semibold mt-2">1,275</h2>
            </div>
            <div className="bg-teal-50 text-teal-600 text-xs px-5 py-2">
              +8% vs yesterday
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-5">
              <p className="text-sm text-gray-500">Doctors</p>
              <h2 className="text-2xl font-semibold mt-2">24</h2>
            </div>
            <div className="bg-teal-50 text-teal-600 text-xs px-5 py-2">
              Active staff
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-2 gap-6">
          {/* BAR CHART */}
          <div className="bg-white p-6 rounded-xl border">
            <h2 className="text-sm font-semibold mb-4">Patients by Day</h2>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="patients"
                    fill="#14b8a6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LINE CHART */}
          <div className="bg-white p-6 rounded-xl border">
            <h2 className="text-sm font-semibold mb-4">Revenue Trend</h2>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke="#0f766e"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white p-6 rounded-xl border">
          <h2 className="text-sm font-semibold mb-4">Patient Appointments</h2>

          <div className="space-y-2">
            <div className="grid grid-cols-4 text-xs text-gray-400 mb-2">
              <span>Name</span>
              <span>Doctor</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            <div className="grid grid-cols-4 p-3 bg-gray-50 rounded-lg">
              <span>Erica Smith</span>
              <span>Dr. Nina</span>
              <span>20 March</span>
              <span className="text-green-600">Completed</span>
            </div>

            <div className="grid grid-cols-4 p-3 bg-gray-50 rounded-lg">
              <span>John Doe</span>
              <span>Dr. Alex</span>
              <span>22 March</span>
              <span className="text-yellow-600">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-72 space-y-6">
        {/* CALENDAR */}
        <div className="bg-white p-5 rounded-xl border">
          <h2 className="text-sm font-semibold mb-3">March 2025</h2>

          <div className="grid grid-cols-7 text-xs text-center gap-2 text-gray-400">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <span key={d}>{d}</span>
            ))}

            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg ${
                  i === 7 ? "bg-teal-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="bg-white p-5 rounded-xl border">
          <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>

          <div className="space-y-3 text-sm text-gray-600">
            <p>New patient registered</p>
            <p>Appointment completed</p>
            <p>Doctor updated</p>
            <p>Report generated</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
