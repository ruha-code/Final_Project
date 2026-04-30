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

import Badge from "../components/Badge";
import { api } from "../services/api";
import { ROLES, useAuth } from "../context/AuthContext";

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
  return "bg-red-50 text-red-600";
}

function toTimestamp(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isSameLocalDay(timestamp, nowTimestamp) {
  if (!timestamp || !nowTimestamp) return false;
  return new Date(timestamp).toDateString() === new Date(nowTimestamp).toDateString();
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
      <p className="text-xs text-gray-400">{title}</p>
      <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-800">{value}</h2>
      <p className="mt-2 sm:mt-3 w-fit rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-600">
        {subtitle}
      </p>
    </div>
  );
}

function PatientDashboard({ appointments, user, nowTimestamp }) {
  const navigate = useNavigate();
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.appointment_time) - new Date(b.appointment_time),
  );
  const now = nowTimestamp;
  const upcoming = sorted.find(
    (item) =>
      item.status !== "CANCELLED" &&
      new Date(item.appointment_time).getTime() >= now,
  );
  const lastVisit = [...appointments]
    .filter(
      (item) =>
        item.status === "COMPLETED" ||
        (item.status !== "CANCELLED" &&
          new Date(item.appointment_time).getTime() < now),
    )
    .sort(
      (a, b) => new Date(b.appointment_time) - new Date(a.appointment_time),
    )[0];
  const nextInfo = formatDateTime(upcoming?.appointment_time);
  const lastInfo = formatDateTime(lastVisit?.appointment_time);
  const doctorSource = upcoming || lastVisit;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">
          Welcome, {user?.full_name || "Patient"}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          Here is a simple overview of your care and upcoming visit.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/patient/health")}
            className="flex-1 sm:flex-none rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600"
          >
            Open My Health
          </button>
          <button
            onClick={() => navigate("/patient/profile")}
            className="flex-1 sm:flex-none rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Manage Profile
          </button>
        </div>
      </div>

      {/* SummaryCards: 1 колонка → 3 колонки */}
      <div className="grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-3">
        <SummaryCard
          title="Upcoming Appointment"
          value={upcoming ? `${nextInfo.date} - ${nextInfo.time}` : "No appointment"}
          subtitle={upcoming ? upcoming.doctor_name : "Book your next visit"}
        />
        <SummaryCard
          title="Last Visit"
          value={lastVisit ? lastInfo.date : "No visits yet"}
          subtitle={lastVisit ? lastVisit.doctor_name : "History will appear here"}
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
    </div>
  );
}

function DoctorDashboard({ appointments, patients, nowTimestamp }) {
  const navigate = useNavigate();
  const now = new Date(nowTimestamp);
  const todayKey = now.toDateString();
  const todayAppointments = [...appointments]
    .filter(
      (item) => item.status !== "CANCELLED" && item.status !== "COMPLETED",
    )
    .filter(
      (item) => new Date(item.appointment_time).toDateString() === todayKey,
    )
    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));
  const nextPatient = [...appointments]
    .filter(
      (item) => item.status !== "CANCELLED" && item.status !== "COMPLETED",
    )
    .filter(
      (item) => new Date(item.appointment_time).getTime() >= now.getTime(),
    )
    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))[0];
  const nextInfo = formatDateTime(nextPatient?.appointment_time);
  const ongoingAppointment = appointments.find((item) => item.status === "ONGOING");
  const ongoingInfo = formatDateTime(ongoingAppointment?.appointment_time);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero блок */}
      <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Next Patient
            </p>
            {!nextPatient ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  No upcoming patient
                </h2>
                <p className="max-w-xl text-xs sm:text-sm text-gray-500">
                  You have no scheduled patient right now. Open appointments or
                  review your active cases.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/appointments")}
                    className="flex-1 sm:flex-none rounded-xl bg-teal-500 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-white hover:bg-teal-600"
                  >
                    Open Appointments
                  </button>
                  <button
                    onClick={() => navigate("/my-patients")}
                    className="flex-1 sm:flex-none rounded-xl bg-gray-100 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Open My Patients
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  {nextPatient.patient_name}
                </h2>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span>{nextInfo.date}</span>
                  <span>{nextInfo.time}</span>
                  <Badge
                    className={`rounded-full px-3 py-1 text-xs ${getStatusClass(nextPatient.status)}`}
                  >
                    {nextPatient.status}
                  </Badge>
                </div>
                <p className="max-w-xl text-xs sm:text-sm text-gray-500">
                  {nextPatient.reason ||
                    "Open the appointment to continue the patient workflow."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/appointments")}
                    className="flex-1 sm:flex-none rounded-xl bg-teal-500 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-white hover:bg-teal-600"
                  >
                    {nextPatient.status === "ONGOING"
                      ? "Continue Appointment"
                      : "Open Appointment"}
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/patients/${nextPatient.patient_id}`)
                    }
                    className="flex-1 sm:flex-none rounded-xl bg-gray-100 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    View Patient
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Today Queue */}
          <div className="rounded-2xl bg-teal-50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Today Queue
            </p>
            <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold text-gray-900">
              {todayAppointments.length}
            </p>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Appointments still active today.
            </p>
            <div className="mt-4 sm:mt-5 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-xs sm:text-sm text-gray-500">My patients</span>
                <span className="font-medium text-gray-900">{patients.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-xs sm:text-sm text-gray-500">Ongoing</span>
                <span className="font-medium text-gray-900">
                  {ongoingAppointment ? 1 : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments + боковые карточки */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">
              Today's Appointments
            </h2>
            <button
              onClick={() => navigate("/appointments")}
              className="text-xs sm:text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              View all
            </button>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400">
              No appointments scheduled for today.
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((item) => {
                const info = formatDateTime(item.appointment_time);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl bg-gray-50 px-4 py-4 md:grid md:grid-cols-[0.9fr_0.8fr_0.7fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.patient_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.reason || "No reason provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{info.date}</p>
                      <p className="text-xs text-gray-400">{info.time}</p>
                    </div>
                    <Badge
                      className={`h-fit w-fit rounded-full px-3 py-1 text-xs ${getStatusClass(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          navigate(`/patients/${item.patient_id}`)
                        }
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        View patient
                      </button>
                      <button
                        onClick={() => navigate("/appointments")}
                        className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600"
                      >
                        {item.status === "ONGOING"
                          ? "Continue"
                          : "Open appointment"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Ongoing Visit */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-gray-700">
              Ongoing Visit
            </h2>
            {!ongoingAppointment ? (
              <p className="text-xs sm:text-sm text-gray-400">
                No visit is currently in progress.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {ongoingAppointment.patient_name}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">Started For</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {ongoingInfo.date} at {ongoingInfo.time}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      navigate(`/patients/${ongoingAppointment.patient_id}`)
                    }
                    className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    View patient
                  </button>
                  <button
                    onClick={() => navigate("/appointments")}
                    className="flex-1 rounded-xl bg-teal-500 px-4 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-teal-600"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-gray-700">
              Quick Actions
            </h2>
            <div className="grid gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/my-patients")}
                className="rounded-xl bg-gray-100 px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Open my patients
              </button>
              <button
                onClick={() => navigate("/messages")}
                className="rounded-xl bg-gray-100 px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Check messages
              </button>
              <button
                onClick={() => navigate("/schedule")}
                className="rounded-xl bg-gray-100 px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Manage schedule
              </button>
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
    <div className="flex flex-col gap-4 sm:gap-6 xl:flex-row xl:gap-6">
      {/* Левая основная часть */}
      <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">

        {/* SummaryCards: 1 колонка → 3 колонки */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          <SummaryCard
            title="Total Patients"
            value={stats.totalPatients.toLocaleString()}
            subtitle="Registered patients"
          />
          <SummaryCard
            title="Appointments"
            value={stats.appointments.toLocaleString()}
            subtitle="Total in system"
          />
          <SummaryCard
            title="Doctors"
            value={stats.doctors}
            subtitle="Active clinicians"
          />
        </div>

        {/* Графики: 1 колонка → 2 колонки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold">
              Patient by Age Stages
            </h2>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
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
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold">
              Appointments by Month
            </h2>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
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

        {/* Recent Appointments */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-gray-700">
            Recent Appointments (Latest 5)
          </h2>

          {/* Таблица — только md+ */}
          <div className="hidden md:block">
            <div className="mb-2 grid grid-cols-5 px-4 text-xs text-gray-400">
              <span>Patient</span>
              <span>Doctor</span>
              <span>Type</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            {recentAppointments.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">
                No appointments yet
              </p>
            ) : (
              recentAppointments.map((item) => {
                const info = formatDateTime(item.appointment_time);
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-5 items-center rounded-xl bg-gray-50 px-4 py-3 mb-2 last:mb-0"
                  >
                    <span className="font-medium text-gray-700 text-sm">
                      {item.patient_name}
                    </span>
                    <span className="text-gray-500 text-sm">{item.doctor_name}</span>
                    <span className="capitalize text-gray-500 text-sm">
                      {item.appointment_type?.toLowerCase()}
                    </span>
                    <span className="text-gray-500 text-sm">{info.date}</span>
                    <Badge
                      className={`rounded-full px-3 py-1 text-xs w-fit ${getStatusClass(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          {/* Карточки — только до md */}
          <div className="md:hidden space-y-3">
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments yet</p>
            ) : (
              recentAppointments.map((item) => {
                const info = formatDateTime(item.appointment_time);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-gray-50 px-4 py-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-700 text-sm truncate">
                        {item.patient_name}
                      </p>
                      <Badge
                        className={`rounded-full px-2.5 py-1 text-xs shrink-0 ${getStatusClass(item.status)}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{item.doctor_name}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="capitalize">
                        {item.appointment_type?.toLowerCase()}
                      </span>
                      <span>{info.date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Правая боковая панель: под контентом на мобиле, сбоку на xl */}
      <div className="xl:w-80 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-6 xl:space-y-0">
        {/* Action Queue */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold">
            Action Queue
          </h2>
          {safeAgendaItems.length === 0 ? (
            <p className="text-xs text-gray-400">
              No appointments need attention right now
            </p>
          ) : (
            <div className="space-y-3">
              {safeAgendaItems.map((event) => (
                <div key={event.id} className="rounded-xl bg-teal-50 p-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    {event.title}
                  </p>
                  <p className="text-xs capitalize text-gray-400">
                    {event.category?.toLowerCase()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{event.subtitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctors Schedule */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold">
            Doctors' Schedule
          </h2>
          {topDoctors.length === 0 ? (
            <p className="text-xs text-gray-400">No doctors registered</p>
          ) : (
            <div className="space-y-4">
              {topDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                      {doctor.full_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {doctor.department_name || doctor.specialty || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {doctor.availability_detail}
                    </p>
                  </div>
                  <Badge
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      doctor.is_available_now
                        ? "bg-green-100 text-green-700"
                        : doctor.is_available === false
                        ? "bg-gray-100 text-gray-500"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {doctor.availability_label}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const months = new Map();
  appointments.forEach((appointment) => {
    if (!appointment.appointment_time) return;
    const date = new Date(appointment.appointment_time);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    months.set(key, {
      count: (months.get(key)?.count || 0) + 1,
      date: new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
      ),
    });
  });
  return [...months.values()]
    .sort((a, b) => a.date - b.date)
    .map((entry) => ({
      name: entry.date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      count: entry.count,
    }));
}

function buildActionQueue(appointments) {
  const now = Date.now();
  return appointments
    .filter(
      (item) => item.status === "ONGOING" || item.status === "SCHEDULED",
    )
    .map((item) => ({ ...item, timestamp: toTimestamp(item.appointment_time) }))
    .filter((item) => item.timestamp > 0)
    .sort((a, b) => {
      const priorityA = a.status === "ONGOING" ? 0 : 1;
      const priorityB = b.status === "ONGOING" ? 0 : 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const distanceA = Math.abs(a.timestamp - now);
      const distanceB = Math.abs(b.timestamp - now);
      return distanceA - distanceB;
    })
    .slice(0, 4)
    .map((item) => {
      const info = formatDateTime(item.appointment_time);
      return {
        id: item.id,
        title: `${item.patient_name} with ${item.doctor_name}`,
        category: item.status,
        subtitle: `${info.date} at ${info.time}`,
      };
    });
}

function buildDoctorScheduleSummary(doctors, appointments) {
  const now = Date.now();
  return doctors
    .map((doctor) => {
      const doctorAppointments = appointments.filter(
        (item) =>
          item.doctor_id === doctor.id && item.status !== "CANCELLED",
      );
      const hasOngoing = doctorAppointments.some(
        (item) => item.status === "ONGOING",
      );
      const hasScheduledNow = doctorAppointments.some((item) => {
        if (item.status !== "SCHEDULED") return false;
        const start = toTimestamp(item.appointment_time);
        if (!start) return false;
        const duration =
          Number(item.duration_minutes) ||
          Number(doctor.consultation_duration_minutes) ||
          30;
        const end = start + duration * 60 * 1000;
        return start <= now && end > now;
      });
      const isBusyNow = hasOngoing || hasScheduledNow;
      const isAvailableNow = Boolean(doctor.is_available) && !isBusyNow;
      const nextAppointment = doctorAppointments
        .filter((item) =>
          ["SCHEDULED", "ONGOING"].includes(item.status),
        )
        .map((item) => ({
          ...item,
          timestamp: toTimestamp(item.appointment_time),
        }))
        .filter((item) => item.timestamp >= now)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      const nextInfo = formatDateTime(nextAppointment?.appointment_time);
      const todayCount = doctorAppointments.filter((item) =>
        isSameLocalDay(toTimestamp(item.appointment_time), now),
      ).length;
      const nextTimestamp = nextAppointment
        ? toTimestamp(nextAppointment.appointment_time)
        : Number.POSITIVE_INFINITY;
      return {
        ...doctor,
        is_available_now: isAvailableNow,
        availability_label: !doctor.is_available
          ? "Marked unavailable"
          : isBusyNow
            ? "Busy now"
            : "Available now",
        availability_detail: nextAppointment
          ? `Next: ${nextInfo.date} ${nextInfo.time}`
          : todayCount > 0
            ? `${todayCount} appointment(s) today`
            : "No upcoming visits",
        today_count: todayCount,
        next_timestamp: nextTimestamp,
      };
    })
    .sort(
      (a, b) =>
        b.today_count - a.today_count ||
        a.next_timestamp - b.next_timestamp ||
        a.full_name.localeCompare(b.full_name),
    )
    .slice(0, 3);
}

function sortAppointmentsByRecent(appointments) {
  return [...appointments].sort(
    (a, b) =>
      toTimestamp(b.appointment_time) - toTimestamp(a.appointment_time),
  );
}

async function fetchAllAdminAppointments() {
  const data = await api.get("/appointments/admin/all?all=true");
  return Array.isArray(data?.items) ? data.items : [];
}

export default function Dashboard() {
  const { user } = useAuth();
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
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [snapshotTime, setSnapshotTime] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = user?.role;
  const isAdminRole = role === ROLES.ADMIN;
  const isDoctorRole = role === ROLES.DOCTOR;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        setSnapshotTime(Date.now());
        if (role === ROLES.ADMIN) {
          const [patients, doctors, appointments] = await Promise.allSettled([
            api.get("/patients"),
            api.get("/doctors"),
            fetchAllAdminAppointments(),
          ]);
          const failedSources = [
            patients.status === "rejected" ? "patients" : null,
            doctors.status === "rejected" ? "doctors" : null,
            appointments.status === "rejected" ? "appointments" : null,
          ].filter(Boolean);
          if (failedSources.length > 0) {
            throw new Error(
              `Failed to load admin dashboard data: ${failedSources.join(", ")}`,
            );
          }
          const patientList =
            patients.status === "fulfilled" ? patients.value : [];
          const doctorList =
            doctors.status === "fulfilled" ? doctors.value : [];
          const appointmentList =
            appointments.status === "fulfilled" &&
            Array.isArray(appointments.value)
              ? appointments.value
              : [];
          const sortedAppointments = sortAppointmentsByRecent(appointmentList);
          setStats({
            totalPatients: patientList.length,
            doctors: doctorList.length,
            appointments: sortedAppointments.length,
          });
          setRecentAppointments(sortedAppointments.slice(0, 5));
          setTopDoctors(
            buildDoctorScheduleSummary(doctorList, sortedAppointments),
          );
          setBarData(groupPatientsByAge(patientList));
          setLineData(groupAppointmentsByMonth(sortedAppointments));
          setAgendaItems(buildActionQueue(sortedAppointments));
          setDoctorPatients([]);
        } else if (role === ROLES.DOCTOR) {
          const [patients, appointments] = await Promise.allSettled([
            api.get("/patients"),
            api.get("/appointments/my"),
          ]);
          const failedSources = [
            patients.status === "rejected" ? "patients" : null,
            appointments.status === "rejected" ? "appointments" : null,
          ].filter(Boolean);
          if (failedSources.length > 0) {
            throw new Error(
              `Failed to load dashboard data: ${failedSources.join(", ")}`,
            );
          }
          const appointmentList =
            appointments.status === "fulfilled" &&
            Array.isArray(appointments.value)
              ? appointments.value
              : [];
          const patientIdSet = new Set(
            appointmentList.map((appointment) => appointment.patient_id),
          );
          const patientList = (
            patients.status === "fulfilled" ? patients.value : []
          ).filter((patient) => patientIdSet.has(patient.id));
          setStats({
            totalPatients: patientList.length,
            doctors: 0,
            appointments: appointmentList.length,
          });
          setRecentAppointments(appointmentList);
          setDoctorPatients(patientList);
          setTopDoctors([]);
          setBarData([]);
          setLineData([]);
          setAgendaItems([]);
        } else {
          const appointments = await api.get("/appointments/my");
          const appointmentList = Array.isArray(appointments)
            ? appointments
            : appointments?.items || [];
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
          setDoctorPatients([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, [role]);

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  if (error)
    return (
      <div className="rounded-lg bg-red-100 p-4 text-xs sm:text-sm text-red-700">
        {error}
      </div>
    );
  if (!isAdminRole && !isDoctorRole)
    return (
      <PatientDashboard
        appointments={recentAppointments}
        user={user}
        nowTimestamp={snapshotTime}
      />
    );
  if (isDoctorRole)
    return (
      <DoctorDashboard
        appointments={recentAppointments}
        patients={doctorPatients}
        nowTimestamp={snapshotTime}
      />
    );
  return (
    <AdminDashboard
      stats={stats}
      barData={barData}
      lineData={lineData}
      recentAppointments={recentAppointments}
      topDoctors={topDoctors}
      agendaItems={agendaItems}
    />
  );
}