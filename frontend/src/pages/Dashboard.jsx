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
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
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
  return (
    new Date(timestamp).toDateString() === new Date(nowTimestamp).toDateString()
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
      <p className="text-xs text-gray-400">{title}</p>
      <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-800">
        {value}
      </h2>
      <p className="mt-2 sm:mt-3 w-fit rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-600">
        {subtitle}
      </p>
    </div>
  );
}

function PatientDashboard({
  appointments,
  user,
  nowTimestamp,
  profileSetupNeeded,
}) {
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

      {profileSetupNeeded && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Complete your patient profile to unlock appointments, health records,
          and care chat.
          <button
            type="button"
            onClick={() => navigate("/patient/profile")}
            className="ml-0 mt-3 block rounded-xl bg-amber-100 px-4 py-2 font-medium text-amber-800 hover:bg-amber-200 sm:ml-3 sm:mt-0 sm:inline-block"
          >
            Complete profile
          </button>
        </div>
      )}

      {/* SummaryCards: 1 колонка → 3 колонки */}
      <div className="grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-3">
        <SummaryCard
          title="Upcoming Appointment"
          value={
            upcoming ? `${nextInfo.date} - ${nextInfo.time}` : "No appointment"
          }
          subtitle={upcoming ? upcoming.doctor_name : "Book your next visit"}
        />
        <SummaryCard
          title="Last Visit"
          value={lastVisit ? lastInfo.date : "No visits yet"}
          subtitle={
            lastVisit ? lastVisit.doctor_name : "History will appear here"
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
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function toTitleCase(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function PatientAvatar({ name, size = "md" }) {
  const initials = getInitials(name);
  const sizeClass = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-xs";
  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700`}
    >
      {initials}
    </div>
  );
}

function DoctorDashboard({ appointments, patients, nowTimestamp }) {
  const navigate = useNavigate();
  const now = new Date(nowTimestamp);
  const todayKey = now.toDateString();

  const todayAppointments = [...appointments]
    .filter((item) => item.status !== "CANCELLED" && item.status !== "COMPLETED")
    .filter((item) => new Date(item.appointment_time).toDateString() === todayKey)
    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

  const ongoingToday = appointments.find(
    (item) =>
      item.status === "ONGOING" &&
      new Date(item.appointment_time).toDateString() === todayKey,
  );
  const nextScheduled = [...appointments]
    .filter(
      (item) =>
        item.status === "SCHEDULED" &&
        new Date(item.appointment_time).getTime() >= now.getTime(),
    )
    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))[0];

  const featured = ongoingToday || nextScheduled;
  const featuredInfo = formatDateTime(featured?.appointment_time);
  const ongoingCount = appointments.filter((item) => item.status === "ONGOING").length;

  return (
    <div className="space-y-4">

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
          <p className="mt-0.5 text-xs text-gray-400">Today's queue</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-teal-600">{ongoingCount}</p>
          <p className="mt-0.5 text-xs text-gray-400">Ongoing</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
          <p className="mt-0.5 text-xs text-gray-400">My patients</p>
        </div>
      </div>

      {/* Current / Next patient hero */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-600">
          {featured?.status === "ONGOING" ? "Current Patient" : "Next Patient"}
        </p>

        {!featured ? (
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-700">No upcoming patients</p>
              <p className="text-xs text-gray-400">Your schedule is clear for now.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <PatientAvatar name={featured.patient_name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900">{toTitleCase(featured.patient_name)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">{featuredInfo.date} · {featuredInfo.time}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClass(featured.status)}`}>
                  {featured.status}
                </span>
              </div>
              {featured.reason && (
                <p className="mt-1 text-sm text-gray-400">{featured.reason}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate(`/patients/${featured.patient_id}`)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Patient
              </button>
              <button
                onClick={() => navigate("/appointments")}
                className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-600 transition-colors"
              >
                {featured.status === "ONGOING" ? "Continue" : "Open"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Today's Appointments */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Today's Appointments</h2>
          <button
            onClick={() => navigate("/appointments")}
            className="text-xs font-medium text-teal-600 hover:text-teal-700"
          >
            View all →
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-400">No appointments today.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayAppointments.map((item) => {
              const info = formatDateTime(item.appointment_time);
              const isOngoing = item.status === "ONGOING";
              return (
                <div
                  key={item.id}
                  className="grid items-center gap-x-3 py-3 first:pt-0 last:pb-0"
                  style={{ gridTemplateColumns: "2.25rem 1fr 4rem 7rem 5.5rem" }}
                >
                  {/* Avatar */}
                  <button onClick={() => navigate(`/patients/${item.patient_id}`)}>
                    <PatientAvatar name={item.patient_name} />
                  </button>

                  {/* Name + reason */}
                  <button
                    onClick={() => navigate(`/patients/${item.patient_id}`)}
                    className="min-w-0 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                      {toTitleCase(item.patient_name)}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {item.reason || "No reason provided"}
                    </p>
                  </button>

                  {/* Time */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{info.time}</p>
                    <p className="text-xs text-gray-400">{info.date}</p>
                  </div>

                  {/* Status badge */}
                  <div className="flex justify-center">
                    <Badge
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => navigate("/appointments")}
                    className={`w-full rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                      isOngoing
                        ? "bg-teal-500 text-white hover:bg-teal-600"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {isOngoing ? "Continue" : "Open"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => navigate("/my-patients")}
          className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm hover:border-teal-200 hover:bg-teal-50 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">My Patients</p>
            <p className="text-xs text-gray-400">View patient list</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/messages")}
          className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm hover:border-teal-200 hover:bg-teal-50 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Messages</p>
            <p className="text-xs text-gray-400">Check inbox</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/schedule")}
          className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm hover:border-teal-200 hover:bg-teal-50 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Schedule</p>
            <p className="text-xs text-gray-400">Manage availability</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({
  stats,
  barData,
  lineData,
  recentAppointments,
  topDoctors,
  agendaItems,
}) {
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
                    <span className="text-gray-500 text-sm">
                      {item.doctor_name}
                    </span>
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
      date: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
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
    .filter((item) => item.status === "ONGOING" || item.status === "SCHEDULED")
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
        (item) => item.doctor_id === doctor.id && item.status !== "CANCELLED",
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
        .filter((item) => ["SCHEDULED", "ONGOING"].includes(item.status))
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
    (a, b) => toTimestamp(b.appointment_time) - toTimestamp(a.appointment_time),
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
  const [profileSetupNeeded, setProfileSetupNeeded] = useState(false);

  const role = user?.role;
  const isAdminRole = role === ROLES.ADMIN;
  const isDoctorRole = role === ROLES.DOCTOR;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        setProfileSetupNeeded(false);
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
          const [appointmentResult] = await Promise.allSettled([
            api.get("/appointments/my"),
          ]);

          if (appointmentResult.status === "rejected") {
            const message = appointmentResult.reason?.message || "";
            if (message.toLowerCase().includes("patient profile")) {
              setProfileSetupNeeded(true);
            } else {
              throw new Error(message || "Failed to load dashboard data");
            }
          }

          const appointmentList =
            appointmentResult.status === "fulfilled" &&
            Array.isArray(appointmentResult.value)
              ? appointmentResult.value
              : appointmentResult.status === "fulfilled"
                ? appointmentResult.value?.items || []
                : [];
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
        profileSetupNeeded={profileSetupNeeded}
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
