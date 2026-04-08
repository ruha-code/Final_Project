import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";
import { api } from "../services/api";

const barData = [
  { name: "Mon", a: 30, b: 45, c: 20 },
  { name: "Tue", a: 40, b: 50, c: 25 },
  { name: "Wed", a: 60, b: 55, c: 30 },
  { name: "Thu", a: 50, b: 70, c: 28 },
  { name: "Fri", a: 75, b: 60, c: 35 },
  { name: "Sat", a: 45, b: 55, c: 25 },
  { name: "Sun", a: 65, b: 70, c: 30 },
];

const lineData = [
  { name: "Jan", income: 800, expense: 400 },
  { name: "Feb", income: 900, expense: 500 },
  { name: "Mar", income: 1100, expense: 600 },
  { name: "Apr", income: 1000, expense: 700 },
  { name: "May", income: 1500, expense: 800 },
  { name: "Jun", income: 1200, expense: 700 },
  { name: "Jul", income: 1300, expense: 750 },
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls when backend is ready
        // const patients = await api.getPatients();
        // const doctors = await api.getDoctors();
        // const appointments = await api.getAppointments();

        // For now, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data - will be replaced with real API data
        setStats({
          totalPatients: 8340,
          appointments: 1275,
          doctors: 24
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* LEFT */}
      <div className="flex-1 space-y-6">
        {/* CARDS */}
        <div className="grid grid-cols-3 gap-5">
          {[
            {
              title: "Total Patients",
              value: stats?.totalPatients?.toLocaleString() || "8,340",
              info: "+1.5% vs last week",
            },
            {
              title: "Appointments",
              value: stats?.appointments?.toLocaleString() || "1,275",
              info: "+8% vs yesterday",
            },
            {
              title: "Doctors",
              value: stats?.doctors || "24",
              info: "Active staff",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <p className="text-xs text-gray-400">{item.title}</p>

              <h2 className="text-2xl font-semibold mt-2 text-gray-800">
                {item.value}
              </h2>

              <div className="mt-3 bg-teal-50 text-teal-600 text-xs px-3 py-1 rounded-full w-fit">
                {item.info}
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <h2 className="text-sm font-semibold mb-4">
              Patient by Age Stages
            </h2>

            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="a" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="b" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="c" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <h2 className="text-sm font-semibold mb-4">Revenue</h2>

            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="income" stroke="#0f766e" strokeWidth={3} />
                  <Line dataKey="expense" stroke="#94a3b8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Patient Appointment
            </h2>

            <button className="text-xs bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200">
              This Week
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-5 text-xs text-gray-400 px-4 mb-2">
              <span>Name</span>
              <span>Doctor</span>
              <span>Type</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {[
              {
                name: "Erica Smith",
                doctor: "Dr. Nina",
                type: "Consultation",
                date: "20 March",
                status: "Completed",
              },
              {
                name: "John Doe",
                doctor: "Dr. Alex",
                type: "Follow-up",
                date: "22 March",
                status: "Pending",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-5 items-center bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
              >
                <span className="font-medium text-gray-700">{item.name}</span>

                <span className="text-gray-500">{item.doctor}</span>
                <span className="text-gray-500">{item.type}</span>
                <span className="text-gray-500">{item.date}</span>

                <span
                  className={`text-xs px-3 py-1 rounded-full w-fit ${
                    item.status === "Completed"
                      ? "bg-green-100 text-green-700 font-medium shadow-sm"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-80 space-y-6">
        {/* CALENDAR */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <h2 className="text-sm font-semibold mb-4">March 2025</h2>

          <div className="grid grid-cols-7 text-xs text-center gap-2 text-gray-400 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 text-sm text-center gap-2">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg cursor-pointer ${
                  i === 7
                    ? "bg-teal-500 text-white shadow-sm"
                    : i === 16 || i === 19 || i === 27
                      ? "bg-teal-100 text-teal-600"
                      : "hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* AGENDA */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Agenda</h2>

          <div className="space-y-3">
            {/* ITEM */}
            <div className="flex gap-3 bg-teal-50 p-3 rounded-xl">
              <div className="text-center w-10">
                <p className="text-sm font-semibold text-gray-800">17</p>
                <p className="text-xs text-gray-400">Fri</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800">
                  Monthly Staff Meeting
                </p>
                <p className="text-xs text-gray-400">09:00 - 10:30</p>
              </div>
            </div>

            <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
              <div className="text-center w-10">
                <p className="text-sm font-semibold">20</p>
                <p className="text-xs text-gray-400">Mon</p>
              </div>

              <div>
                <p className="text-sm font-medium">Networking Event</p>
                <p className="text-xs text-gray-400">14:00 - 16:00</p>
              </div>
            </div>

            <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
              <div className="text-center w-10">
                <p className="text-sm font-semibold">28</p>
                <p className="text-xs text-gray-400">Tue</p>
              </div>

              <div>
                <p className="text-sm font-medium">Policy Review</p>
                <p className="text-xs text-gray-400">10:00 - 11:30</p>
              </div>
            </div>
          </div>
        </div>

        {/* DOCTORS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Doctors’ Schedule</h2>

          <div className="space-y-4">
            {[
              { name: "Dr. Amelia Hart", status: "Available" },
              { name: "Dr. Rizky Pratama", status: "Unavailable" },
              { name: "Dr. Sophia Liang", status: "Available" },
            ].map((doc, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-400">Cardiology</p>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    doc.status === "Available"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Recent Activity</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <p>New patient profile created</p>
              <span className="text-gray-400 text-xs">3m ago</span>
            </div>

            <div className="flex justify-between">
              <p>Appointment rescheduled</p>
              <span className="text-gray-400 text-xs">1h ago</span>
            </div>

            <div className="flex justify-between">
              <p>Discharge summary updated</p>
              <span className="text-gray-400 text-xs">4h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
