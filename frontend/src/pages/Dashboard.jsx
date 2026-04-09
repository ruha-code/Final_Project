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

function formatAppointmentDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    doctors: 0,
    appointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const [patients, doctors, apptPage, calendar] =
          await Promise.allSettled([
            api.get("/patients"),
            api.get("/doctors"),
            api.get("/appointments/admin/all?page=1&page_size=5"),
            api.get("/calendar"),
          ]);

        const patientCount =
          patients.status === "fulfilled" ? patients.value.length : 0;
        const doctorList = doctors.status === "fulfilled" ? doctors.value : [];
        const apptData =
          apptPage.status === "fulfilled"
            ? apptPage.value
            : { items: [], total: 0 };
        const calendarData =
          calendar.status === "fulfilled" ? calendar.value : [];

        setStats({
          totalPatients: patientCount,
          doctors: doctorList.length,
          appointments: apptData.total ?? apptData.items?.length ?? 0,
        });

        setRecentAppointments(apptData.items || []);
        setTopDoctors(doctorList.slice(0, 3));
        setAgendaItems(
          Array.isArray(calendarData) ? calendarData.slice(0, 3) : [],
        );
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
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
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
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
              value: stats.totalPatients.toLocaleString(),
              info: "Registered patients",
            },
            {
              title: "Appointments",
              value: stats.appointments.toLocaleString(),
              info: "Total in system",
            },
            {
              title: "Doctors",
              value: stats.doctors,
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

        {/* RECENT APPOINTMENTS TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Recent Appointments
            </h2>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-5 text-xs text-gray-400 px-4 mb-2">
              <span>Patient</span>
              <span>Doctor</span>
              <span>Type</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {recentAppointments.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-3">
                No appointments yet
              </p>
            ) : (
              recentAppointments.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-5 items-center bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                >
                  <span className="font-medium text-gray-700">
                    {item.patient_name}
                  </span>
                  <span className="text-gray-500">{item.doctor_name}</span>
                  <span className="text-gray-500 capitalize">
                    {item.appointment_type?.toLowerCase()}
                  </span>
                  <span className="text-gray-500">
                    {formatAppointmentDate(item.appointment_time)}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full w-fit ${
                      item.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 font-medium"
                        : item.status === "SCHEDULED"
                          ? "bg-purple-100 text-purple-600"
                          : item.status === "ONGOING"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-red-100 text-red-500"
                    }`}
                  >
                    {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-80 space-y-6">
        {/* CALENDAR */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <h2 className="text-sm font-semibold mb-4">
            {new Date().toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="grid grid-cols-7 text-xs text-center gap-2 text-gray-400 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 text-sm text-center gap-2">
            {[
              ...Array(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  0,
                ).getDate(),
              ),
            ].map((_, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg cursor-pointer ${
                  i + 1 === new Date().getDate()
                    ? "bg-teal-500 text-white shadow-sm"
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
          {agendaItems.length === 0 ? (
            <p className="text-xs text-gray-400">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {agendaItems.map((evt, i) => {
                const d = new Date(evt.event_date);
                return (
                  <div key={i} className="flex gap-3 bg-teal-50 p-3 rounded-xl">
                    <div className="text-center w-10">
                      <p className="text-sm font-semibold text-gray-800">
                        {d.getDate()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {d.toLocaleDateString("en-GB", { weekday: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {evt.title}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {evt.category?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DOCTORS SCHEDULE */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Doctors' Schedule</h2>
          {topDoctors.length === 0 ? (
            <p className="text-xs text-gray-400">No doctors registered</p>
          ) : (
            <div className="space-y-4">
              {topDoctors.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {doc.full_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {doc.department_name || doc.specialty || "—"}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      doc.is_available
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-500"
                    }`}
                  >
                    {doc.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
