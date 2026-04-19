import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, CalendarClock, HeartPulse, ShieldAlert, Stethoscope } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Badge from "../components/Badge";
import { api } from "../services/api";

function formatDateTime(value) {
  if (!value) return { date: "-", time: "-" };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function SummaryCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function VitalCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function statusTone(status) {
  if (status === "IN_TREATMENT") return "bg-teal-50 text-teal-700";
  if (status === "ADMITTED") return "bg-blue-50 text-blue-700";
  if (status === "DISCHARGED") return "bg-gray-100 text-gray-600";
  return "bg-gray-100 text-gray-500";
}

function appointmentTone(status) {
  if (status === "SCHEDULED") return "bg-purple-50 text-purple-700";
  if (status === "ONGOING") return "bg-blue-50 text-blue-700";
  if (status === "COMPLETED") return "bg-green-50 text-green-700";
  if (status === "CANCELLED") return "bg-red-50 text-red-600";
  return "bg-gray-100 text-gray-500";
}

export default function MyHealth() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        api.get("/patients/me"),
        api.get("/patients/me/vitals?limit=20"),
        api.get("/appointments/my"),
      ]);

      const [profileResult, vitalsResult, appointmentsResult] = results;

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
      } else {
        console.error("Failed to load profile:", profileResult.reason);
      }

      setVitals(vitalsResult.status === "fulfilled" && Array.isArray(vitalsResult.value) ? vitalsResult.value : []);
      setAppointments(appointmentsResult.status === "fulfilled" && Array.isArray(appointmentsResult.value) ? appointmentsResult.value : []);

      if (profileResult.status === "rejected" && vitalsResult.status === "rejected" && appointmentsResult.status === "rejected") {
        setError("Failed to load health records");
      }

      setLoading(false);
    };

    void fetchData();
  }, []);

  const latestVitals = vitals[0] || {};
  const upcomingAppointment = useMemo(
    () => [...appointments]
      .filter((item) => item.status !== "CANCELLED" && new Date(item.appointment_time).getTime() >= Date.now())
      .sort((first, second) => new Date(first.appointment_time).getTime() - new Date(second.appointment_time).getTime())[0],
    [appointments],
  );
  const visitHistory = useMemo(
    () => [...appointments].sort((first, second) => new Date(second.appointment_time).getTime() - new Date(first.appointment_time).getTime()),
    [appointments],
  );
  const chartData = vitals.slice(0, 8).reverse().map((item) => ({
    date: new Date(item.recorded_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    sugar: item.blood_sugar || 0,
    bp: item.systolic_bp || 0,
  }));

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" /></div>;
  }

  if (!profile && error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
        <button onClick={() => navigate("/patient/profile")} className="rounded-xl bg-teal-500 px-4 py-2.5 text-sm text-white hover:bg-teal-600">
          Open Profile Setup
        </button>
      </div>
    );
  }

  const nextVisit = formatDateTime(upcomingAppointment?.appointment_time);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">My Health</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Your health record at a glance</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">Review your vitals, treatment status and visit history. Medical records are read-only here.</p>
          </div>
          <button onClick={() => navigate("/patient/profile")} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Manage Contact Profile
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Treatment Status"
          value={profile?.patient_status?.replaceAll("_", " ") || "No status"}
          subtitle={profile?.condition || "Your doctor has not added a condition summary yet."}
          icon={Stethoscope}
        />
        <SummaryCard
          title="Next Visit"
          value={upcomingAppointment ? `${nextVisit.date}, ${nextVisit.time}` : "No appointment"}
          subtitle={upcomingAppointment ? `With ${upcomingAppointment.doctor_name}` : "Book your next appointment from the appointments page."}
          icon={CalendarClock}
        />
        <SummaryCard
          title="Latest Vitals"
          value={vitals.length > 0 ? `${new Date(vitals[0].recorded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No vitals"}
          subtitle={vitals.length > 0 ? "Most recent clinical measurements" : "Vitals will appear after your care team records them."}
          icon={HeartPulse}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Vitals Trend</h2>
                <p className="text-xs text-gray-400">Recent measurements recorded by your care team</p>
              </div>
              <Badge className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700">Read only</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <VitalCard label="Blood Sugar" value={latestVitals.blood_sugar ? `${latestVitals.blood_sugar} mg/dL` : "-"} />
              <VitalCard label="Weight" value={latestVitals.weight ? `${latestVitals.weight} kg` : "-"} />
              <VitalCard label="Temperature" value={latestVitals.temperature ? `${latestVitals.temperature} C` : "-"} />
              <VitalCard label="Blood Pressure" value={latestVitals.systolic_bp ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}` : "-"} />
            </div>
            <div className="mt-6 h-64">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-400">No vitals recorded yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} width={32} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bp" stroke="#0d9488" strokeWidth={2} name="BP" />
                    <Line type="monotone" dataKey="sugar" stroke="#f59e0b" strokeWidth={2} name="Sugar" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">Visit History</h2>
            {visitHistory.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments yet.</p>
            ) : (
              <div className="space-y-3">
                {visitHistory.map((appointment) => {
                  const info = formatDateTime(appointment.appointment_time);
                  return (
                    <div key={appointment.id} className="grid gap-3 rounded-2xl bg-gray-50 px-4 py-4 md:grid-cols-[1fr_0.9fr_0.7fr]">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{appointment.doctor_name}</p>
                        <p className="text-xs text-gray-400">{appointment.doctor_specialty || "Doctor"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{info.date}</p>
                        <p className="text-xs text-gray-400">{info.time}</p>
                      </div>
                      <div className="flex items-center justify-start md:justify-end">
                        <Badge className={`rounded-full px-3 py-1 text-xs ${appointmentTone(appointment.status)}`}>{appointment.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">Care Summary</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span>Blood Type</span>
                <span className="font-medium text-gray-900">{profile?.blood_type || "-"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span>Patient Type</span>
                <span className="font-medium text-gray-900">{profile?.patient_type?.toLowerCase() || "-"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span>Room</span>
                <span className="font-medium text-gray-900">{profile?.room_location || "-"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span>Admission</span>
                <span className="font-medium text-gray-900">{profile?.admission_date ? new Date(profile.admission_date).toLocaleDateString("en-GB") : "-"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-500" />
              <h2 className="text-sm font-semibold text-gray-800">Emergency Contact</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>{profile?.emergency_contact_name || "No emergency contact added"}</p>
              <p>{profile?.emergency_contact_phone || "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={16} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Clinical Notes</h2>
            </div>
            <p className="text-sm leading-6 text-gray-600">{profile?.notes || "No clinical notes are available yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
