import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function groupPatientsByAge(patients) {
  const groups = { "0-17": 0, "18-35": 0, "36-50": 0, "51+": 0 };
  patients.forEach((patient) => {
    if (!patient.date_of_birth) return;
    const age = Math.floor(
      (Date.now() - new Date(patient.date_of_birth).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25),
    );
    if (age < 18) groups["0-17"] += 1;
    else if (age < 36) groups["18-35"] += 1;
    else if (age < 51) groups["36-50"] += 1;
    else groups["51+"] += 1;
  });
  return Object.entries(groups).map(([name, count]) => ({ name, count }));
}

function groupAppointmentsByMonth(appointments) {
  const months = {};
  appointments.forEach((appointment) => {
    if (!appointment.appointment_time) return;
    const date = new Date(appointment.appointment_time);
    const key = date.toLocaleDateString("en-US", { month: "short" });
    months[key] = (months[key] || 0) + 1;
  });
  return Object.entries(months).map(([name, count]) => ({ name, count }));
}

function formatAppointmentDate(isoString) {
  if (!isoString) return "—";
  const value = new Date(isoString);
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatAppointmentTime(isoString) {
  if (!isoString) return "—";
  const value = new Date(isoString);
  return value.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(isoString) {
  if (!isoString) return "—";
  const value = new Date(isoString);
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStatusClass(status) {
  if (status === "COMPLETED") return "bg-green-100 text-green-700";
  if (status === "SCHEDULED") return "bg-purple-100 text-purple-600";
  if (status === "ONGOING") return "bg-blue-100 text-blue-600";
  return "bg-red-100 text-red-500";
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-400">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-gray-800">{value}</h2>
      <p className="mt-3 w-fit rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-600">
        {subtitle}
      </p>
    </div>
  );
}

function PatientDashboard({ appointments, user }) {
  const sortedAppointments = [...appointments].sort(
    (first, second) =>
      new Date(first.appointment_time).getTime() -
      new Date(second.appointment_time).getTime(),
  );

  const now = Date.now();
  const upcomingAppointment = sortedAppointments.find(
    (appointment) =>
      appointment.status !== "CANCELLED" &&
      new Date(appointment.appointment_time).getTime() >= now,
  );

  const lastVisit = [...appointments]
    .filter(
      (appointment) =>
        appointment.status === "COMPLETED" ||
        (appointment.status !== "CANCELLED" &&
          new Date(appointment.appointment_time).getTime() < now),
    )
    .sort(
      (first, second) =>
        new Date(second.appointment_time).getTime() -
        new Date(first.appointment_time).getTime(),
    )[0];

  const doctorSource = upcomingAppointment || lastVisit;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Welcome, {user?.full_name || "Patient"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Here is a simple overview of your care and upcoming visit.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <SummaryCard
          title="Upcoming Appointment"
          value={
            upcomingAppointment
              ? `${formatAppointmentDate(upcomingAppointment.appointment_time)} • ${formatAppointmentTime(upcomingAppointment.appointment_time)}`
              : "No appointment"
          }
          subtitle={
            upcomingAppointment
              ? `${upcomingAppointment.doctor_name}`
              : "Book your next visit"
          }
        />
        <SummaryCard
          title="Last Visit"
          value={
            lastVisit ? formatFullDate(lastVisit.appointment_time) : "No visits yet"
          }
          subtitle={
            lastVisit
              ? `${lastVisit.doctor_name}`
              : "Your visit history will appear here"
          }
        />
        <SummaryCard
          title="Doctor Info"
          value={doctorSource?.doctor_name || "No doctor assigned"}
          subtitle={
            doctorSource?.doctor_specialty ||
            "Choose a doctor from the doctors page"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Upcoming Appointment
            </h2>
            {upcomingAppointment && (
              <span
                className={`rounded-full px-3 py-1 text-xs ${getStatusClass(upcomingAppointment.status)}`}
              >
                {upcomingAppointment.status}
              </span>
            )}
          </div>

          {!upcomingAppointment ? (
            <p className="text-sm text-gray-400">
              You have no upcoming appointment right now.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-gray-800">
                  {upcomingAppointment.doctor_name}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Specialty</span>
                <span className="font-medium text-gray-800">
                  {upcomingAppointment.doctor_specialty || "General physician"}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-800">
                  {formatFullDate(upcomingAppointment.appointment_time)}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-800">
                  {formatAppointmentTime(upcomingAppointment.appointment_time)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Last Visit</h2>

          {!lastVisit ? (
            <p className="text-sm text-gray-400">
              Once you complete your first visit, details will appear here.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-gray-800">
                  {lastVisit.doctor_name}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Specialty</span>
                <span className="font-medium text-gray-800">
                  {lastVisit.doctor_specialty || "General physician"}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Visit Date</span>
                <span className="font-medium text-gray-800">
                  {formatFullDate(lastVisit.appointment_time)}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-500">Status</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${getStatusClass(lastVisit.status)}`}
                >
                  {lastVisit.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDoctorDashboard({
  agendaItems,
  barData,
  isAdmin,
  isDoctor,
  lineData,
  recentAppointments,
  stats,
  topDoctors,
}) {
  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
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
              info: "Active clinicians",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-xs text-gray-400">{item.title}</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-800">
                {item.value}
              </h2>
              <div className="mt-3 w-fit rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-600">
                {item.info}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <h2 className="mb-4 text-sm font-semibold">Patient by Age Stages</h2>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#14b8a6"
                    radius={[6, 6, 0, 0]}
                    name="Patients"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <h2 className="mb-4 text-sm font-semibold">Appointments by Month</h2>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    dataKey="count"
                    stroke="#0f766e"
                    strokeWidth={3}
                    name="Appointments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Recent Appointments
            </h2>
          </div>

          <div className="space-y-2">
            <div className="mb-2 grid grid-cols-5 px-4 text-xs text-gray-400">
              <span>Patient</span>
              <span>Doctor</span>
              <span>Type</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {recentAppointments.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No appointments yet</p>
            ) : (
              recentAppointments.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-5 items-center rounded-xl bg-gray-50 px-4 py-3 transition hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-700">
                    {item.patient_name}
                  </span>
                  <span className="text-gray-500">{item.doctor_name}</span>
                  <span className="capitalize text-gray-500">
                    {item.appointment_type?.toLowerCase()}
                  </span>
                  <span className="text-gray-500">
                    {formatAppointmentDate(item.appointment_time)}
                  </span>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs ${getStatusClass(item.status)}`}
                  >
                    {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="w-80 space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm transition hover:shadow-md">
          <h2 className="mb-4 text-sm font-semibold">
            {new Date().toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs text-gray-400">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {[
              ...Array(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  0,
                ).getDate(),
              ),
            ].map((_, index) => (
              <div
                key={index}
                className={`cursor-pointer rounded-lg p-2 ${
                  index + 1 === new Date().getDate()
                    ? "bg-teal-500 text-white shadow-sm"
                    : "hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Agenda</h2>
          {agendaItems.length === 0 ? (
            <p className="text-xs text-gray-400">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {agendaItems.map((event, index) => {
                const value = new Date(event.event_date);
                return (
                  <div
                    key={`${event.title}-${index}`}
                    className="flex gap-3 rounded-xl bg-teal-50 p-3"
                  >
                    <div className="w-10 text-center">
                      <p className="text-sm font-semibold text-gray-800">
                        {value.getDate()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {value.toLocaleDateString("en-GB", { weekday: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {event.title}
                      </p>
                      <p className="text-xs capitalize text-gray-400">
                        {event.category?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(isAdmin() || isDoctor()) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Doctors' Schedule</h2>
            {topDoctors.length === 0 ? (
              <p className="text-xs text-gray-400">No doctors registered</p>
            ) : (
              <div className="space-y-4">
                {topDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {doctor.full_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doctor.department_name || doctor.specialty || "—"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        doctor.is_available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {doctor.is_available ? "Available" : "Unavailable"}
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

          const [patients, doctors, appointments, calendar] =
            await Promise.allSettled([
              api.get("/patients"),
              api.get("/doctors"),
              api.get(appointmentsRequest),
              api.get("/calendar"),
            ]);

          const patientList =
            patients.status === "fulfilled" ? patients.value : [];
          const doctorList = doctors.status === "fulfilled" ? doctors.value : [];
          const appointmentData =
            appointments.status === "fulfilled"
              ? isAdmin()
                ? appointments.value
                : {
                    items: Array.isArray(appointments.value)
                      ? appointments.value
                      : [],
                    total: Array.isArray(appointments.value)
                      ? appointments.value.length
                      : 0,
                  }
              : { items: [], total: 0 };
          const calendarData =
            calendar.status === "fulfilled" ? calendar.value : [];

          setStats({
            totalPatients: patientList.length,
            doctors: doctorList.length,
            appointments:
              appointmentData.total ?? appointmentData.items?.length ?? 0,
          });
          setRecentAppointments(appointmentData.items?.slice(0, 5) || []);
          setTopDoctors(doctorList.slice(0, 3));
          setBarData(groupPatientsByAge(patientList));
          setLineData(groupAppointmentsByMonth(appointmentData.items || []));
          setAgendaItems(
            Array.isArray(calendarData) ? calendarData.slice(0, 3) : [],
          );
        } else {
          const appointments = await api.get("/appointments/my");
          const appointmentList = Array.isArray(appointments) ? appointments : [];

          setStats({
            totalPatients: 0,
            doctors: 0,
            appointments: appointmentList.length,
          });
          setRecentAppointments(appointmentList);
          setTopDoctors([]);
          setBarData([]);
          setLineData([]);
          setAgendaItems([]);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [isAdmin, isDoctor]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>;
  }

  if (!isAdmin() && !isDoctor()) {
    return <PatientDashboard appointments={recentAppointments} user={user} />;
  }

  return (
    <AdminDoctorDashboard
      agendaItems={agendaItems}
      barData={barData}
      isAdmin={isAdmin}
      isDoctor={isDoctor}
      lineData={lineData}
      recentAppointments={recentAppointments}
      stats={stats}
      topDoctors={topDoctors}
    />
  );
}

export default Dashboard;
