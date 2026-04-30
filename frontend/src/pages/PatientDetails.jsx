import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Calendar, HeartPulse, Mail, MessageSquare, Phone, Stethoscope, Plus, Save, X } from "lucide-react";
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
  const [notesSuccess, setNotesSuccess] = useState("");
  const [vitalsSuccess, setVitalsSuccess] = useState("");

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

  const handleSaveNotes = async () => {
    setNotesError("");
    setNotesSuccess("");
    const normalized = normalizeWhitespace(noteForm.notes);

    if (!isMeaningfulDoctorNote(normalized)) {
      setNotesError("Notes must contain at least 8 meaningful letters.");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await api.put(`/patients/${id}/doctor-notes`, {
        notes: normalized,
        patient_status: noteForm.patient_status,
      });
      setPatient(updated);
      setNotesSuccess("Notes updated successfully.");
    } catch (err) {
      setNotesError(toErrorMessage(err, "Failed to update notes."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddVitals = async () => {
    setVitalsSuccess("");
    const payload = {};
    if (vitalsForm.blood_sugar) payload.blood_sugar = Number(vitalsForm.blood_sugar);
    if (vitalsForm.weight) payload.weight = Number(vitalsForm.weight);
    if (vitalsForm.temperature) payload.temperature = Number(vitalsForm.temperature);
    if (vitalsForm.systolic_bp) payload.systolic_bp = Number(vitalsForm.systolic_bp);
    if (vitalsForm.diastolic_bp) payload.diastolic_bp = Number(vitalsForm.diastolic_bp);

    if (Object.keys(payload).length === 0) return;

    try {
      setSavingVitals(true);
      const newVital = await api.post(`/patients/${id}/vitals`, payload);
      setVitals((prev) => [newVital, ...prev]);
      setVitalsForm({ blood_sugar: "", weight: "", temperature: "", systolic_bp: "", diastolic_bp: "" });
      setShowVitalsForm(false);
      setVitalsSuccess("Vitals recorded successfully.");
    } catch (err) {
      setNotesError(toErrorMessage(err, "Failed to record vitals."));
    } finally {
      setSavingVitals(false);
    }
  };

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
                  <Badge className={`rounded-lg px-2 py-0.5 text-xs ${statusTone(patient.patient_status)}`}>
                    {patient.patient_status || "Unknown"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 sm:gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <Phone size={14} /> {patient.phone || "-"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Mail size={14} /> {patient.email}
                  </span>
                  {patient.blood_type && (
                    <span className="flex items-center gap-2">
                      <HeartPulse size={14} /> {patient.blood_type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Sugar" value={latest.blood_sugar || "-"} helper="mg/dL" />
              <MetricCard label="Weight" value={latest.weight || "-"} helper="kg" />
              <MetricCard label="Temp" value={latest.temperature || "-"} helper="°C" />
              <MetricCard label="BP" value={latest.systolic_bp || "-"} helper="mmHg" />
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
                <Badge className={`rounded-lg px-2 py-0.5 text-xs ${appointmentTone(focusedAppointment.status)}`}>
                  {focusedAppointment.status}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Vitals History</h2>
              <button
                onClick={() => setShowVitalsForm(!showVitalsForm)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
              >
                <Plus size={14} /> Add Vitals
              </button>
            </div>

            {showVitalsForm && (
              <div className="mt-4 rounded-xl border bg-gray-50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Blood Sugar"
                    value={vitalsForm.blood_sugar}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, blood_sugar: e.target.value })}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Temp (°C)"
                    value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Systolic BP"
                    value={vitalsForm.systolic_bp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, systolic_bp: e.target.value })}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Diastolic BP"
                    value={vitalsForm.diastolic_bp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic_bp: e.target.value })}
                    className="rounded-lg border bg-white px-3 py-2 text-sm col-span-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddVitals}
                    disabled={savingVitals}
                    className="flex-1 rounded-lg bg-teal-500 text-white py-2 text-xs font-medium hover:bg-teal-600 disabled:opacity-60"
                  >
                    {savingVitals ? "Saving..." : "Record Vitals"}
                  </button>
                  <button
                    onClick={() => setShowVitalsForm(false)}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {vitalsSuccess && (
              <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                {vitalsSuccess}
              </div>
            )}

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

            {vitals.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {vitals.slice(0, 5).map((vital) => {
                  const dt = formatDateTime(vital.recorded_at);
                  return (
                    <div key={vital.id} className="flex items-center justify-between text-xs border-b pb-2 last:border-0">
                      <span className="text-gray-500">{dt.date} {dt.time}</span>
                      <div className="flex gap-3">
                        {vital.blood_sugar && <span className="text-gray-700">Sugar: {vital.blood_sugar}</span>}
                        {vital.systolic_bp && <span className="text-gray-700">BP: {vital.systolic_bp}/{vital.diastolic_bp || "-"}</span>}
                        {vital.temperature && <span className="text-gray-700">Temp: {vital.temperature}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Doctor Notes */}
          <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <MessageSquare size={14} /> Doctor Notes
            </h2>

            {notesError && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {notesError}
              </div>
            )}
            {notesSuccess && (
              <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                {notesSuccess}
              </div>
            )}

            <textarea
              value={noteForm.notes}
              onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
              rows={4}
              placeholder="Add clinical notes, observations, treatment plan..."
              className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <select
                value={noteForm.patient_status}
                onChange={(e) => setNoteForm({ ...noteForm, patient_status: e.target.value })}
                className="rounded-lg border bg-white px-3 py-2 text-xs"
              >
                <option value="IN_TREATMENT">In Treatment</option>
                <option value="ADMITTED">Admitted</option>
                <option value="DISCHARGED">Discharged</option>
              </select>

              <button
                onClick={handleSaveNotes}
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 text-white px-3 py-2 text-xs font-medium hover:bg-teal-600 disabled:opacity-60"
              >
                <Save size={14} /> {savingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Appointments */}
          <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Calendar size={14} /> Appointments
            </h2>

            {orderedAppointments.length === 0 ? (
              <p className="text-xs text-gray-400">No appointments found.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {orderedAppointments.slice(-5).reverse().map((apt) => {
                  const dt = formatDateTime(apt.appointment_time);
                  return (
                    <div key={apt.id} className="rounded-xl border p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{dt.date}</span>
                        <Badge className={`rounded-lg px-2 py-0.5 ${appointmentTone(apt.status)}`}>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-gray-500">{dt.time} — {apt.reason || "No reason"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Stethoscope size={14} /> Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/appointments", { state: { bookDoctorId: null } })}
                className="w-full rounded-xl bg-teal-50 text-teal-700 py-2.5 text-xs font-medium hover:bg-teal-100"
              >
                Schedule Appointment
              </button>
              <button
                onClick={() => setShowVitalsForm(true)}
                className="w-full rounded-xl bg-blue-50 text-blue-700 py-2.5 text-xs font-medium hover:bg-blue-100"
              >
                Record Vitals
              </button>
              <button
                onClick={() => navigate(`/patients`)}
                className="w-full rounded-xl bg-gray-50 text-gray-700 py-2.5 text-xs font-medium hover:bg-gray-100"
              >
                Back to Patients
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
