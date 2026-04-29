import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Activity, HeartPulse, Mail, MapPin, MessageSquare, Phone, Stethoscope, UserRoundCheck } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Badge from "../components/Badge";
import { api } from "../services/api";

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "-";
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatDateTime(value) {
  if (!value) return { date: "-", time: "-" };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function normalizeWhitespace(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isMeaningfulDoctorNote(value) {
  if (value.length < 10) return false;
  const words = value.split(" ").filter(Boolean);
  if (words.length < 2) return false;
  const lettersCount = Array.from(value).filter((char) => /\p{L}/u.test(char)).length;
  return lettersCount >= 8;
}

function statusTone(status) {
  if (status === "IN_TREATMENT") return "bg-teal-50 text-teal-700";
  if (status === "ADMITTED") return "bg-blue-50 text-blue-700";
  if (status === "DISCHARGED") return "bg-gray-100 text-gray-600";
  return "bg-gray-100 text-gray-500";
}

function appointmentTone(status) {
  if (status === "ONGOING") return "bg-blue-50 text-blue-700";
  if (status === "SCHEDULED") return "bg-purple-50 text-purple-700";
  if (status === "COMPLETED") return "bg-green-50 text-green-700";
  if (status === "CANCELLED") return "bg-red-50 text-red-600";
  return "bg-gray-100 text-gray-500";
}

function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm w-full">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-base sm:text-lg font-semibold text-gray-900">{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

function toErrorMessage(error, fallback) {
  if (error && typeof error === "object" && "message" in error && error.message) {
    return error.message;
  }
  return fallback;
}

export default function PatientDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadWarning, setLoadWarning] = useState("");
  const [notesError, setNotesError] = useState("");
  const [appointmentActionLoading, setAppointmentActionLoading] = useState(false);
  const [appointmentActionError, setAppointmentActionError] = useState("");

  const [vitalsForm, setVitalsForm] = useState({
    blood_sugar: "",
    weight: "",
    temperature: "",
    systolic_bp: "",
    diastolic_bp: "",
  });

  const [noteForm, setNoteForm] = useState({
    notes: "",
    patient_status: "IN_TREATMENT",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError("");
        setLoadWarning("");
        setPatient(null);
        setVitals([]);
        setAppointments([]);

        const [patientResult, vitalsResult, appointmentsResult] = await Promise.allSettled([
          api.get(`/patients/${id}`),
          api.get(`/patients/${id}/vitals`),
          api.get("/appointments/my"),
        ]);

        if (patientResult.status !== "fulfilled") {
          throw new Error(toErrorMessage(patientResult.reason, "Failed to load patient details."));
        }

        const patientData = patientResult.value;

        const warningSources = [];

        const vitalsData = vitalsResult.status === "fulfilled" ? (vitalsResult.value || []) : [];
        if (vitalsResult.status !== "fulfilled") warningSources.push("vitals history");

        const myAppointments = appointmentsResult.status === "fulfilled" ? (appointmentsResult.value || []) : [];
        if (appointmentsResult.status !== "fulfilled") warningSources.push("appointments");

        const patientAppointments = myAppointments.filter((item) => Number(item.patient_id) === Number(id));

        setPatient(patientData);
        setVitals(vitalsData);
        setAppointments(patientAppointments);

        setNoteForm({
          notes: patientData.notes || "",
          patient_status: patientData.patient_status || "IN_TREATMENT",
        });

        if (warningSources.length > 0) {
          setLoadWarning(`Some patient data could not be loaded: ${warningSources.join(" and ")}.`);
        }
      } catch (err) {
        setLoadError(toErrorMessage(err, "Failed to load patient details."));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  const latest = vitals[0] || {};

  const orderedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => new Date(a.appointment_time) - new Date(b.appointment_time)
      ),
    [appointments]
  );

  const activeAppointment =
    orderedAppointments.find((a) => a.status === "ONGOING") ||
    orderedAppointments.find(
      (a) =>
        a.status === "SCHEDULED" &&
        new Date(a.appointment_time).getTime() >= Date.now()
    );

  const focusedAppointment =
    orderedAppointments.find((a) => a.id === location.state?.appointmentId) ||
    activeAppointment ||
    orderedAppointments.at(-1) ||
    null;

  const focusedInfo = formatDateTime(focusedAppointment?.appointment_time);

  const chartData = vitals
    .slice(0, 10)
    .reverse()
    .map((item) => ({
      date: new Date(item.recorded_at).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      }),
      bp: item.systolic_bp || 0,
      sugar: item.blood_sugar || 0,
    }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  if (loadError && !patient) {
    return (
      <div className="rounded-xl bg-red-50 p-4 sm:p-6 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="rounded-xl bg-white p-4 sm:p-6 text-sm text-gray-400">
        Patient not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 px-3 sm:px-6 lg:px-8">
      {loadWarning && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {loadWarning}
        </div>
      )}

      <div className="rounded-3xl border bg-white p-4 sm:p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-teal-100 text-xl sm:text-2xl font-bold text-teal-700">
                {getInitials(patient.full_name)}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
                  {patient.full_name}
                </h1>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-gray-600">
                    {calcAge(patient.date_of_birth)} years
                  </span>
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-gray-600">
                    {patient.gender || "-"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 sm:gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <Phone size={14} /> {patient.phone || "-"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Mail size={14} /> {patient.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Sugar" value={latest.blood_sugar || "-"} />
              <MetricCard label="Weight" value={latest.weight || "-"} />
              <MetricCard label="Temp" value={latest.temperature || "-"} />
              <MetricCard label="BP" value={latest.systolic_bp || "-"} />
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 p-4 sm:p-6 text-white">
            <h2 className="text-lg sm:text-2xl font-semibold">
              Current Encounter
            </h2>

            {!focusedAppointment ? (
              <button
                onClick={() => navigate("/appointments")}
                className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-teal-700"
              >
                Open Appointments
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="text-sm">
                  {focusedInfo.date} {focusedInfo.time}
                </div>
                <div className="text-sm opacity-80">
                  {focusedAppointment.reason}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Vitals</h2>

            <div className="h-56 sm:h-60 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="bp" stroke="#0d9488" />
                  <Line dataKey="sugar" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">{/* right panel unchanged */}</div>
      </div>
    </div>
  );
}