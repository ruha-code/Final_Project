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
import { useAuth } from "../context/AuthContext";

function groupPatientsByAge(patients) {
  const groups = { "0-17": 0, "18-35": 0, "36-50": 0, "51+": 0 };
  patients.forEach((p) => {
    if (!p.date_of_birth) return;
    const age = Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 18) groups["0-17"]++;
    else if (age < 36) groups["18-35"]++;
    else if (age < 51) groups["36-50"]++;
    else groups["51+"]++;
  });
  return [
    { name: "0-17", count: groups["0-17"] },
    { name: "18-35", count: groups["18-35"] },
    { name: "36-50", count: groups["36-50"] },
    { name: "51+", count: groups["51+"] },
  ];
}

function groupAppointmentsByMonth(appointments) {
  const months = {};
  appointments.forEach((a) => {
    if (!a.appointment_time) return;
    const date = new Date(a.appointment_time);
    const key = date.toLocaleDateString("en-US", { month: "short" });
    months[key] = (months[key] || 0) + 1;
  });
  return Object.entries(months).map(([name, count]) => ({ name, count }));
}

function formatAppointmentDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Dashboard() {
  const { isAdmin, isDoctor, user } = useAuth();

  const [stats, setStats] = useState({
    totalPatients: 0,
    doctors: 0,
    appointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        if (isAdmin() || isDoctor()) {
          const appointmentsRequest = isAdmin()
            ? "/appointments/admin/all?page=1&page_size=100"
            : "/appointments/my";

          const [patients, doctors, apptPage, calendar] =
            await Promise.allSettled([
              api.get("/patients"),
              api.get("/doctors"),
              api.get(appointmentsRequest),
              api.get("/calendar"),
            ]);

          const patientList = patients.status === "fulfilled" ? patients.value : [];
          const doctorList = doctors.status === "fulfilled" ? doctors.value : [];
          const apptData =
            apptPage.status === "fulfilled"
              ? (isAdmin()
                  ? apptPage.value
                  : {
                      items: Array.isArray(apptPage.value) ? apptPage.value : [],
                      total: Array.isArray(apptPage.value) ? apptPage.value.length : 0,
                    })
              : { items: [], total: 0 };
          const calendarData =
            calendar.status === "fulfilled" ? calendar.value : [];

          const patientCount = patientList.length;
          const appointmentsByMonth = groupAppointmentsByMonth(apptData.items || []);
          const patientsByAge = groupPatientsByAge(patientList);

          setStats({
            totalPatients: patientCount,
            doctors: doctorList.length,
            appointments: apptData.total ?? apptData.items?.length ?? 0,
          });

          setRecentAppointments(apptData.items?.slice(0, 5) || []);
          setTopDoctors(doctorList.slice(0, 3));
          setBarData(patientsByAge);
          setLineData(appointmentsByMonth);
          setAgendaItems(
            Array.isArray(calendarData) ? calendarData.slice(0, 3) : [],
          );
        } else {
          const [appointments] = await Promise.allSettled([
            api.get("/appointments/my"),
          ]);

          const appointmentsList = appointments.status === "fulfilled" ? appointments.value : [];

          setStats({
            totalPatients: 0,
            doctors: 0,
            appointments: Array.isArray(appointmentsList) ? appointmentsList.length : 0,
          });

          const appointmentsByMonth = groupAppointmentsByMonth(appointmentsList);
          setRecentAppointments(Array.isArray(appointmentsList) ? appointmentsList.slice(0, 5) : []);
          setTopDoctors([]);
          setBarData([]);
          setLineData(appointmentsByMonth);
          setAgendaItems([]);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAdmin, isDoctor]);

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
        <div className={`grid gap-5 ${isAdmin() || isDoctor() ? "grid-cols-3" : "grid-cols-1"}`}>
          {(isAdmin() || isDoctor()) ? [
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
              info: "Active clinicians",
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
          )) : (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400">My Appointments</p>
              <h2 className="text-2xl font-semibold mt-2 text-gray-800">
                {stats.appointments}
              </h2>
              <div className="mt-3 bg-teal-50 text-teal-600 text-xs px-3 py-1 rounded-full w-fit">
                Total appointments
              </div>
            </div>
          )}
        </div>

        {/* CHARTS */}
        {(isAdmin() || isDoctor()) ? (
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
                    <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Patients" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <h2 className="text-sm font-semibold mb-4">Appointments by Month</h2>
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="count" stroke="#0f766e" strokeWidth={3} name="Appointments" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold mb-4">
              Welcome, {user?.full_name || "Patient"}!
            </h2>
            <p className="text-gray-500">
              Your health dashboard is ready. Track your appointments and health information.
            </p>
          </div>
        )}

        {/* RECENT APPOINTMENTS TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              {isAdmin() || isDoctor() ? "Recent Appointments" : "My Appointments"}
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
        {(isAdmin() || isDoctor()) && (
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
        )}
      </div>
    </div>
  );
}

export default Dashboard;
