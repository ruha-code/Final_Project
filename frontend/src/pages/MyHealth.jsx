import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarClock,
  HeartPulse,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Badge from "../components/Badge";
import { api } from "../services/api";

/* ================= FORMAT ================= */

function formatDateTime(value) {
  if (!value) return { date: "-", time: "-" };

  const date = new Date(value);

  return {
    date: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/* ================= UI ================= */

function SummaryCard({ title, value, subtitle, icon: ICON }) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          {createElement(ICON, { size: 18 })}
        </div>
      </div>
    </div>
  );
}

function VitalCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-3 sm:p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-2 text-base sm:text-lg font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function appointmentTone(status) {
  if (status === "SCHEDULED") return "bg-purple-50 text-purple-700";
  if (status === "ONGOING") return "bg-blue-50 text-blue-700";
  if (status === "COMPLETED") return "bg-green-50 text-green-700";
  if (status === "CANCELLED") return "bg-red-50 text-red-600";
  return "bg-gray-100 text-gray-500";
}

function statusLabel(status) {
  if (!status) return "No status";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/* ================= PAGE ================= */

export default function MyHealth() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [snapshotTime, setSnapshotTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");

  /* ================= FETCH ================= */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      setProfileError("");

      const results = await Promise.allSettled([
        api.get("/patients/me"),
        api.get("/patients/me/vitals?limit=20"),
        api.get("/appointments/my"),
      ]);

      const [profileResult, vitalsResult, appointmentsResult] = results;

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
        setProfileError("");
      } else {
        setProfileError("Failed to load profile. Some information may be unavailable.");
      }

      setVitals(
        vitalsResult.status === "fulfilled" ? vitalsResult.value : []
      );

      setAppointments(
        appointmentsResult.status === "fulfilled"
          ? appointmentsResult.value
          : []
      );

      const failedResults = results.filter((r) => r.status === "rejected");
      if (failedResults.length === results.length) {
        setError("Failed to load health data. Please try again later.");
      }

      setSnapshotTime(Date.now());
      setLoading(false);
    };

    fetchData();
  }, []);

  /* ================= COMPUTED ================= */

  const latestVitals = vitals[0] || {};

  const upcomingAppointment = useMemo(() => {
    return [...appointments]
      .filter(
        (a) =>
          a.status !== "CANCELLED" &&
          new Date(a.appointment_time).getTime() >= snapshotTime
      )
      .sort(
        (a, b) =>
          new Date(a.appointment_time) - new Date(b.appointment_time)
      )[0];
  }, [appointments, snapshotTime]);

  const visitHistory = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(b.appointment_time) - new Date(a.appointment_time)
      ),
    [appointments]
  );

  const chartData = vitals.slice(0, 8).reverse().map((item) => ({
    date: new Date(item.recorded_at).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    }),
    sugar: item.blood_sugar || 0,
    bp: item.systolic_bp || 0,
  }));

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  /* ================= UI ================= */

  const nextVisit = formatDateTime(upcomingAppointment?.appointment_time);

  return (
    <div className="min-h-screen space-y-6 px-3 sm:px-6 pb-10">

      {/* HEADER */}
      <div className="rounded-2xl sm:rounded-3xl border bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              My Health
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
              Your health record at a glance
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Review your vitals, treatment status and visit history.
            </p>
          </div>

          <button
            onClick={() => navigate("/patient/profile")}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            Manage Profile
          </button>
        </div>
      </div>

      {profileError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {profileError}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Treatment Status"
          value={statusLabel(profile?.patient_status)}
          subtitle={profile?.condition || "No condition"}
          icon={Stethoscope}
        />
        <SummaryCard
          title="Next Visit"
          value={upcomingAppointment ? `${nextVisit.date}` : "No visit"}
          subtitle={upcomingAppointment?.doctor_name}
          icon={CalendarClock}
        />
        <SummaryCard
          title="Latest Vitals"
          value={vitals.length ? "Updated" : "No data"}
          subtitle="Latest medical records"
          icon={HeartPulse}
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* VITALS */}
          <div className="rounded-2xl border bg-white p-5 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <VitalCard label="Sugar" value={latestVitals.blood_sugar || "-"} />
              <VitalCard label="Weight" value={latestVitals.weight || "-"} />
              <VitalCard label="Temp" value={latestVitals.temperature || "-"} />
              <VitalCard label="BP" value={latestVitals.systolic_bp || "-"} />
            </div>

            <div className="mt-6 h-56 sm:h-64">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" />
                    <YAxis width={30} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bp" stroke="#0d9488" />
                    <Line type="monotone" dataKey="sugar" stroke="#f59e0b" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No data
                </div>
              )}
            </div>
          </div>

          {/* HISTORY */}
          <div className="rounded-2xl border bg-white p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">Visit History</h2>

            <div className="space-y-3">
              {visitHistory.map((a) => {
                const info = formatDateTime(a.appointment_time);

                return (
                  <div
                    key={a.id}
                    className="rounded-xl bg-gray-50 p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold">{a.doctor_name}</p>
                      <p className="text-xs text-gray-400">{a.doctor_specialty}</p>
                    </div>

                    <div className="text-sm">
                      {info.date} {info.time}
                    </div>

                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs ${appointmentTone(a.status)}`}>
                        {statusLabel(a.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          <div className="rounded-2xl border bg-white p-5 sm:p-6">
            <h2 className="font-semibold mb-4">Care Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-500">Blood Type</span>
                <span className="font-medium">{profile?.blood_type || "-"}</span>
              </div>
              <div className="flex justify-between bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-500">Patient Type</span>
                <span className="font-medium">{statusLabel(profile?.patient_type)}</span>
              </div>
              <div className="flex justify-between bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium">{profile?.gender || "-"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 sm:p-6">
            <div className="flex gap-2 items-center mb-3">
              <ShieldAlert size={16} />
              <h2 className="font-semibold">Emergency Contact</h2>
            </div>
            {profile?.emergency_contact_name ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800">
                  {profile.emergency_contact_name}
                </p>
                {profile.emergency_contact_phone && (
                  <p className="text-sm text-gray-500">
                    {profile.emergency_contact_phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No emergency contact set</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 sm:p-6">
            <div className="flex gap-2 items-center mb-3">
              <Activity size={16} />
              <h2 className="font-semibold">Notes</h2>
            </div>
            <p className="text-sm text-gray-600">
              {profile?.notes || "No notes"}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}