import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatDateTime(value) {
  if (!value) return { date: "-", time: "-" };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
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
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.appointment_time) - new Date(b.appointment_time),
  );
  const now = Date.now();
  const upcoming = sorted.find(
    (item) => item.status !== "CANCELLED" && new Date(item.appointment_time).getTime() >= now,
  );
  const lastVisit = [...appointments]
    .filter(
      (item) =>
        item.status === "COMPLETED" ||
        (item.status !== "CANCELLED" && new Date(item.appointment_time).getTime() < now),
    )
    .sort((a, b) => new Date(b.appointment_time) - new Date(a.appointment_time))[0];
  const nextInfo = formatDateTime(upcoming?.appointment_time);
  const lastInfo = formatDateTime(lastVisit?.appointment_time);
  const doctorSource = upcoming || lastVisit;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Welcome, {user?.full_name || "Patient"}</h2>
        <p className="mt-2 text-sm text-gray-500">Here is a simple overview of your care and upcoming visit.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <SummaryCard title="Upcoming Appointment" value={upcoming ? `${nextInfo.date} - ${nextInfo.time}` : "No appointment"} subtitle={upcoming ? upcoming.doctor_name : "Book your next visit"} />
        <SummaryCard title="Last Visit" value={lastVisit ? lastInfo.date : "No visits yet"} subtitle={lastVisit ? lastVisit.doctor_name : "History will appear here"} />
        <SummaryCard title="Doctor Info" value={doctorSource?.doctor_name || "No doctor assigned"} subtitle={doctorSource?.doctor_specialty || "Choose a doctor from the doctors page"} />
      </div>
    </div>
  );
}

function DoctorDashboard({ appointments, patients }) {
  const navigate = useNavigate();
  const now = new Date();
  const todayKey = now.toDateString();
  const todayAppointments = [...appointments]
    .filter((item) => item.status !== "CANCELLED" && item.status !== "COMPLETED")
    .filter((item) => new Date(item.appointment_time).toDateString() === todayKey)
    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));
  const nextPatient = [...appointments]
    .filter((item) => item.status !== "CANCELLED" && item.status !== "COMPLETED")
    .filter((item) => new Date(item.appointment_time).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))[0];
  const nextInfo = formatDateTime(nextPatient?.appointment_time);
  const ongoingAppointment = appointments.find((item) => item.status === "ONGOING");
  const ongoingInfo = formatDateTime(ongoingAppointment?.appointment_time);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Next Patient</p>
            {!nextPatient ? (
              <>
                <h2 className="text-3xl font-semibold text-gray-900">No upcoming patient</h2>
                <p className="max-w-xl text-sm text-gray-500">You have no scheduled patient right now. Open appointments or review your active cases.</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => navigate("/appointments")} className="rounded-xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600">Open Appointments</button>
                  <button onClick={() => navigate("/my-patients")} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">Open My Patients</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-semibold text-gray-900">{nextPatient.patient_name}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span>{nextInfo.date}</span>
                  <span>{nextInfo.time}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${getStatusClass(nextPatient.status)}`}>{nextPatient.status}</span>
                </div>
                <p className="max-w-xl text-sm text-gray-500">{nextPatient.reason || "Open the appointment to continue the patient workflow."}</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => navigate("/appointments")} className="rounded-xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600">{nextPatient.status === "ONGOING" ? "Continue Appointment" : "Open Appointment"}</button>
                  <button onClick={() => navigate(`/patients/${nextPatient.patient_id}`)} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">View Patient</button>
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl bg-teal-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Today Queue</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">{todayAppointments.length}</p>
            <p className="mt-2 text-sm text-gray-600">Appointments still active today.</p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-gray-500">My patients</span>
                <span className="font-medium text-gray-900">{patients.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-gray-500">Ongoing</span>
                <span className="font-medium text-gray-900">{ongoingAppointment ? 1 : 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Today's Appointments</h2>
            <button onClick={() => navigate("/appointments")} className="text-sm font-medium text-teal-600 hover:text-teal-700">View all</button>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-gray-400">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((item) => {
                const info = formatDateTime(item.appointment_time);
                return (
                  <div key={item.id} className="grid gap-3 rounded-2xl bg-gray-50 px-4 py-4 md:grid-cols-[0.9fr_0.8fr_0.7fr_auto]">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.patient_name}</p>
                      <p className="text-xs text-gray-400">{item.reason || "No reason provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{info.date}</p>
                      <p className="text-xs text-gray-400">{info.time}</p>
                    </div>
                    <span className={`inline-flex h-fit rounded-full px-3 py-1 text-xs ${getStatusClass(item.status)}`}>{item.status}</span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate(`/patients/${item.patient_id}`)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">View patient</button>
                      <button onClick={() => navigate("/appointments")} className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600">{item.status === "ONGOING" ? "Continue" : "Open appointment"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Ongoing Visit</h2>
            {!ongoingAppointment ? (
              <p className="text-sm text-gray-400">No visit is currently in progress.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="mt-1 font-medium text-gray-900">{ongoingAppointment.patient_name}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">Started For</p>
                  <p className="mt-1 font-medium text-gray-900">{ongoingInfo.date} at {ongoingInfo.time}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate(`/patients/${ongoingAppointment.patient_id}`)} className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">View patient</button>
                  <button onClick={() => navigate("/appointments")} className="flex-1 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600">Continue Appointment</button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Quick Actions</h2>
            <div className="grid gap-3">
              <button onClick={() => navigate("/my-patients")} className="rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200">Open my patients</button>
              <button onClick={() => navigate("/messages")} className="rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200">Check messages</button>
              <button onClick={() => navigate("/schedule")} className="rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200">Manage schedule</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ stats, barData, lineData, recentAppointments, topDoctors, agendaItems }) {
  const safeAgendaItems = Array.isArray(agendaItems) ? agendaItems : [];
  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-3 gap-5">
          <SummaryCard title="Total Patients" value={stats.totalPatients.toLocaleString()} subtitle="Registered patients" />
          <SummaryCard title="Appointments" value={stats.appointments.toLocaleString()} subtitle="Total in system" />
          <SummaryCard title="Doctors" value={stats.doctors} subtitle="Active clinicians" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Patient by Age Stages</h2>
            <div className="h-56"><ResponsiveContainer><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Patients" /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Appointments by Month</h2>
            <div className="h-56"><ResponsiveContainer><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line dataKey="count" stroke="#0f766e" strokeWidth={3} name="Appointments" /></LineChart></ResponsiveContainer></div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Recent Appointments</h2>
          <div className="space-y-2">
            <div className="mb-2 grid grid-cols-5 px-4 text-xs text-gray-400"><span>Patient</span><span>Doctor</span><span>Type</span><span>Date</span><span>Status</span></div>
            {recentAppointments.length === 0 ? <p className="px-4 py-3 text-sm text-gray-400">No appointments yet</p> : recentAppointments.map((item) => {
              const info = formatDateTime(item.appointment_time);
              return <div key={item.id} className="grid grid-cols-5 items-center rounded-xl bg-gray-50 px-4 py-3"><span className="font-medium text-gray-700">{item.patient_name}</span><span className="text-gray-500">{item.doctor_name}</span><span className="capitalize text-gray-500">{item.appointment_type?.toLowerCase()}</span><span className="text-gray-500">{info.date}</span><span className={`w-fit rounded-full px-3 py-1 text-xs ${getStatusClass(item.status)}`}>{item.status}</span></div>;
            })}
          </div>
        </div>
      </div>
      <div className="w-80 space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Agenda</h2>
          {safeAgendaItems.length === 0 ? <p className="text-xs text-gray-400">No upcoming events</p> : <div className="space-y-3">{safeAgendaItems.map((event, index) => <div key={`${event.title}-${index}`} className="rounded-xl bg-teal-50 p-3"><p className="text-sm font-medium text-gray-800">{event.title}</p><p className="text-xs capitalize text-gray-400">{event.category?.toLowerCase()}</p></div>)}</div>}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Doctors' Schedule</h2>
          {topDoctors.length === 0 ? <p className="text-xs text-gray-400">No doctors registered</p> : <div className="space-y-4">{topDoctors.map((doctor) => <div key={doctor.id} className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-800">{doctor.full_name}</p><p className="text-xs text-gray-400">{doctor.department_name || doctor.specialty || "-"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${doctor.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{doctor.is_available ? "Available" : "Unavailable"}</span></div>)}</div>}
        </div>
      </div>
    </div>
  );
}

function groupPatientsByAge(patients) {
  const groups = { "0-17": 0, "18-35": 0, "36-50": 0, "51+": 0 };
  patients.forEach((patient) => {
    if (!patient.date_of_birth) return;
    const age = Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
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
    const key = new Date(appointment.appointment_time).toLocaleDateString("en-US", { month: "short" });
    months[key] = (months[key] || 0) + 1;
  });
  return Object.entries(months).map(([name, count]) => ({ name, count }));
}

export default function Dashboard() {
  const { isAdmin, isDoctor, user } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, doctors: 0, appointments: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        if (isAdmin()) {
          const [patients, doctors, appointments, calendar] = await Promise.allSettled([
            api.get("/patients"),
            api.get("/doctors"),
            api.get("/appointments/admin/all?page=1&page_size=100"),
            api.get("/calendar"),
          ]);
          const patientList = patients.status === "fulfilled" ? patients.value : [];
          const doctorList = doctors.status === "fulfilled" ? doctors.value : [];
          const appointmentData = appointments.status === "fulfilled" ? appointments.value : { items: [], total: 0 };
          const calendarData = calendar.status === "fulfilled" ? calendar.value : [];
          setStats({ totalPatients: patientList.length, doctors: doctorList.length, appointments: appointmentData.total ?? appointmentData.items?.length ?? 0 });
          setRecentAppointments(appointmentData.items?.slice(0, 5) || []);
          setTopDoctors(doctorList.slice(0, 3));
          setBarData(groupPatientsByAge(patientList));
          setLineData(groupAppointmentsByMonth(appointmentData.items || []));
          setAgendaItems(Array.isArray(calendarData) ? calendarData.slice(0, 3) : []);
          setDoctorPatients([]);
        } else if (isDoctor()) {
          const [patients, appointments] = await Promise.allSettled([api.get("/patients"), api.get("/appointments/my")]);
          const appointmentList = appointments.status === "fulfilled" && Array.isArray(appointments.value) ? appointments.value : [];
          const patientIdSet = new Set(appointmentList.map((appointment) => appointment.patient_id));
          const patientList = (patients.status === "fulfilled" ? patients.value : []).filter((patient) => patientIdSet.has(patient.id));
          setStats({ totalPatients: patientList.length, doctors: 0, appointments: appointmentList.length });
          setRecentAppointments(appointmentList);
          setDoctorPatients(patientList);
          setTopDoctors([]);
          setBarData([]);
          setLineData([]);
          setAgendaItems([]);
        } else {
          const appointments = await api.get("/appointments/my");
          const appointmentList = Array.isArray(appointments) ? appointments : [];
          setStats({ totalPatients: 0, doctors: 0, appointments: appointmentList.length });
          setRecentAppointments(appointmentList);
          setTopDoctors([]);
          setBarData([]);
          setLineData([]);
          setAgendaItems([]);
          setDoctorPatients([]);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, [isAdmin, isDoctor]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500"></div></div>;
  if (error) return <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>;
  if (!isAdmin() && !isDoctor()) return <PatientDashboard appointments={recentAppointments} user={user} />;
  if (isDoctor()) return <DoctorDashboard appointments={recentAppointments} patients={doctorPatients} />;
  return <AdminDashboard stats={stats} barData={barData} lineData={lineData} recentAppointments={recentAppointments} topDoctors={topDoctors} agendaItems={agendaItems} />;
}
