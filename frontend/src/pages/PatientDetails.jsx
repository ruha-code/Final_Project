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
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
    </div>
  );
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
        const [patientData, vitalsData, myAppointments] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/patients/${id}/vitals`),
          api.get("/appointments/my"),
        ]);
        const patientAppointments = (myAppointments || []).filter((item) => Number(item.patient_id) === Number(id));
        setPatient(patientData);
        setVitals(vitalsData || []);
        setAppointments(patientAppointments);
        setNoteForm({
          notes: patientData.notes || "",
          patient_status: patientData.patient_status || "IN_TREATMENT",
        });
      } catch (err) {
        console.error("Failed to load patient details:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  const latest = vitals[0] || {};
  const orderedAppointments = useMemo(
    () => [...appointments].sort((first, second) => new Date(first.appointment_time).getTime() - new Date(second.appointment_time).getTime()),
    [appointments],
  );
  const activeAppointment = orderedAppointments.find((appointment) => appointment.status === "ONGOING")
    || orderedAppointments.find((appointment) => appointment.status === "SCHEDULED" && new Date(appointment.appointment_time).getTime() >= Date.now());
  const focusedAppointment = orderedAppointments.find((appointment) => appointment.id === location.state?.appointmentId) || activeAppointment || orderedAppointments.at(-1) || null;
  const focusedInfo = formatDateTime(focusedAppointment?.appointment_time);
  const chartData = vitals.slice(0, 10).reverse().map((item) => ({
    date: new Date(item.recorded_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    bp: item.systolic_bp || 0,
    sugar: item.blood_sugar || 0,
  }));

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" /></div>;
  }

  if (!patient) {
    return <div className="rounded-xl bg-white p-6 text-sm text-gray-400">Patient not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-100 text-2xl font-bold text-teal-700">
                {getInitials(patient.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Clinical Workspace</p>
                <h1 className="mt-2 text-3xl font-semibold text-gray-900">{patient.full_name}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-gray-600">{calcAge(patient.date_of_birth)} years</span>
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-gray-600">{patient.gender || "-"}</span>
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-gray-600">Blood type: {patient.blood_type || "-"}</span>
                  <Badge className={`rounded-lg px-3 py-1 text-xs ${statusTone(patient.patient_status)}`}>{patient.patient_status?.replaceAll("_", " ") || "No status"}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2"><Phone size={14} /> {patient.phone || "-"}</span>
                  <span className="flex items-center gap-2"><Mail size={14} /> {patient.email}</span>
                  {patient.address && <span className="flex items-center gap-2"><MapPin size={14} /> {patient.address}</span>}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Latest Blood Sugar" value={latest.blood_sugar ? `${latest.blood_sugar} mg/dL` : "-"} />
              <MetricCard label="Weight" value={latest.weight ? `${latest.weight} kg` : "-"} />
              <MetricCard label="Temperature" value={latest.temperature ? `${latest.temperature} C` : "-"} />
              <MetricCard label="Blood Pressure" value={latest.systolic_bp ? `${latest.systolic_bp}/${latest.diastolic_bp}` : "-"} />
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Current Encounter</p>
            {!focusedAppointment ? (
              <div className="mt-5 space-y-4">
                <h2 className="text-2xl font-semibold">No active encounter</h2>
                <p className="text-sm text-white/80">Open appointments to review the next visit or start a scheduled appointment.</p>
                <button onClick={() => navigate("/appointments")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-50">
                  Open Appointments
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <h2 className="text-2xl font-semibold">{focusedAppointment.appointment_type?.toLowerCase().replaceAll("_", " ") || "Visit"}</h2>
                <div className="space-y-2 rounded-2xl bg-white/10 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3"><span className="text-white/70">Date</span><span>{focusedInfo.date}</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-white/70">Time</span><span>{focusedInfo.time}</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-white/70">Status</span><span>{focusedAppointment.status}</span></div>
                </div>
                <p className="text-sm text-white/80">{focusedAppointment.reason || "No visit reason was added to this appointment."}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={() => navigate("/messages", { state: { patientId: patient.id } })} className="rounded-xl bg-white/15 px-4 py-3 text-left text-sm font-medium hover:bg-white/20">
                    <span className="inline-flex items-center gap-2"><MessageSquare size={16} /> Message patient</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!activeAppointment) {
                        navigate("/appointments");
                        return;
                      }
                      if (activeAppointment.status === "ONGOING") return;
                      try {
                        setAppointmentActionLoading(true);
                        setAppointmentActionError("");
                        await api.put(`/appointments/${activeAppointment.id}/start`);
                        const refreshedAppointments = await api.get("/appointments/my");
                        setAppointments((refreshedAppointments || []).filter((item) => Number(item.patient_id) === Number(id)));
                      } catch (err) {
                        setAppointmentActionError(err.message || "Failed to start appointment");
                      } finally {
                        setAppointmentActionLoading(false);
                      }
                    }}
                    disabled={appointmentActionLoading || activeAppointment?.status === "ONGOING"}
                    className="rounded-xl bg-white px-4 py-3 text-left text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {appointmentActionLoading
                      ? "Starting encounter..."
                      : activeAppointment?.status === "ONGOING"
                        ? "Encounter in progress"
                        : activeAppointment
                          ? "Start encounter"
                          : "Open appointments"}
                  </button>
                </div>
                {appointmentActionError && <p className="rounded-xl bg-white/10 px-4 py-3 text-xs text-white/90">{appointmentActionError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Vitals & Trends</h2>
                <p className="text-xs text-gray-400">Track recent clinical measurements before documenting the visit</p>
              </div>
              <button onClick={() => setShowVitalsForm(true)} className="rounded-lg bg-teal-500 px-3 py-2 text-xs font-medium text-white hover:bg-teal-600">
                <span className="inline-flex items-center gap-2"><Activity size={14} /> Add Vitals</span>
              </button>
            </div>
            {chartData.length > 0 ? (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} width={30} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bp" stroke="#0d9488" strokeWidth={2} name="BP" />
                    <Line type="monotone" dataKey="sugar" stroke="#f59e0b" strokeWidth={2} name="Sugar" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No vitals recorded yet.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Visit Timeline</h2>
                <p className="text-xs text-gray-400">Past and upcoming encounters for this patient</p>
              </div>
              <button onClick={() => navigate("/appointments")} className="text-sm font-medium text-teal-600 hover:text-teal-700">Open appointments</button>
            </div>
            {orderedAppointments.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments with this patient yet.</p>
            ) : (
              <div className="space-y-3">
                {[...orderedAppointments].reverse().map((appointment) => {
                  const info = formatDateTime(appointment.appointment_time);
                  const isFocused = focusedAppointment?.id === appointment.id;
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => navigate(`/patients/${patient.id}`, { state: { appointmentId: appointment.id } })}
                      className={`grid w-full gap-3 rounded-2xl border px-4 py-4 text-left transition md:grid-cols-[0.95fr_0.8fr_0.8fr] ${isFocused ? "border-teal-300 bg-teal-50" : "border-transparent bg-gray-50 hover:border-gray-200 hover:bg-white"}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{appointment.appointment_type?.toLowerCase().replaceAll("_", " ") || "Visit"}</p>
                        <p className="text-xs text-gray-400">{appointment.reason || "No reason provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{info.date}</p>
                        <p className="text-xs text-gray-400">{info.time}</p>
                      </div>
                      <div className="flex items-center justify-start md:justify-end">
                        <Badge className={`rounded-full px-3 py-1 text-xs ${appointmentTone(appointment.status)}`}>{appointment.status}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Stethoscope size={16} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Clinical Assessment</h2>
            </div>
            <div className="space-y-4">
              <select value={noteForm.patient_status} onChange={(event) => setNoteForm({ ...noteForm, patient_status: event.target.value })} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400">
                <option value="IN_TREATMENT">In Treatment</option>
                <option value="ADMITTED">Admitted</option>
                <option value="DISCHARGED">Discharged</option>
              </select>
              <textarea
                value={noteForm.notes}
                onChange={(event) => {
                  setNotesError("");
                  setNoteForm({ ...noteForm, notes: event.target.value });
                }}
                rows={7}
                placeholder="Clinical note, assessment, follow-up plan, medication changes..."
                className="w-full resize-none rounded-xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              {notesError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{notesError}</p>}
              <button
                onClick={async () => {
                  const normalizedNotes = normalizeWhitespace(noteForm.notes);
                  if (!isMeaningfulDoctorNote(normalizedNotes)) {
                    setNotesError("Enter meaningful clinical notes (at least 2 words, not numeric-only).");
                    return;
                  }
                  try {
                    setSavingProfile(true);
                    setNotesError("");
                    const updated = await api.put(`/patients/${id}/doctor-notes`, {
                      notes: normalizedNotes,
                      patient_status: noteForm.patient_status,
                    });
                    setPatient(updated);
                    setNoteForm({
                      notes: updated.notes || "",
                      patient_status: updated.patient_status || "IN_TREATMENT",
                    });
                  } catch (err) {
                    setNotesError(err.message || "Failed to save patient note.");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                disabled={savingProfile}
                className="w-full rounded-xl bg-teal-500 py-3 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
              >
                {savingProfile ? "Saving clinical note..." : "Save Clinical Note"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserRoundCheck size={16} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Patient Context</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="rounded-xl bg-gray-50 px-4 py-3"><span className="text-gray-400">Condition</span><p className="mt-1 font-medium text-gray-900">{patient.condition || "-"}</p></div>
              <div className="rounded-xl bg-gray-50 px-4 py-3"><span className="text-gray-400">Patient Type</span><p className="mt-1 font-medium text-gray-900">{patient.patient_type?.toLowerCase() || "-"}</p></div>
              <div className="rounded-xl bg-gray-50 px-4 py-3"><span className="text-gray-400">Room</span><p className="mt-1 font-medium text-gray-900">{patient.room_location || "-"}</p></div>
              <div className="rounded-xl bg-gray-50 px-4 py-3"><span className="text-gray-400">Admission Date</span><p className="mt-1 font-medium text-gray-900">{patient.admission_date ? new Date(patient.admission_date).toLocaleDateString("en-GB") : "-"}</p></div>
            </div>
          </div>

          {patient.emergency_contact_name && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-800">Emergency Contact</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{patient.emergency_contact_name}</p>
                <p>{patient.emergency_contact_phone || "-"}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Doctor Actions</h2>
            <div className="grid gap-3">
              <button onClick={() => navigate("/messages", { state: { patientId: patient.id } })} className="rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200">Message patient</button>
              <button onClick={() => navigate("/appointments")} className="rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200">Open appointments</button>
              <button onClick={() => navigate("/my-patients")} className="rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200">Back to my patients</button>
            </div>
          </div>
        </div>
      </div>

      {showVitalsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold">Add Vitals for {patient.full_name}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={vitalsForm.blood_sugar} onChange={(event) => setVitalsForm({ ...vitalsForm, blood_sugar: event.target.value })} placeholder="Blood sugar" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" value={vitalsForm.weight} onChange={(event) => setVitalsForm({ ...vitalsForm, weight: event.target.value })} placeholder="Weight" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" step="0.1" value={vitalsForm.temperature} onChange={(event) => setVitalsForm({ ...vitalsForm, temperature: event.target.value })} placeholder="Temperature" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" value={vitalsForm.systolic_bp} onChange={(event) => setVitalsForm({ ...vitalsForm, systolic_bp: event.target.value })} placeholder="Systolic BP" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" value={vitalsForm.diastolic_bp} onChange={(event) => setVitalsForm({ ...vitalsForm, diastolic_bp: event.target.value })} placeholder="Diastolic BP" className="rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowVitalsForm(false)} className="flex-1 rounded-lg border py-2 text-sm">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    setSavingVitals(true);
                    await api.post(`/patients/${id}/vitals`, {
                      blood_sugar: vitalsForm.blood_sugar ? parseFloat(vitalsForm.blood_sugar) : null,
                      weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
                      temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
                      systolic_bp: vitalsForm.systolic_bp ? parseInt(vitalsForm.systolic_bp, 10) : null,
                      diastolic_bp: vitalsForm.diastolic_bp ? parseInt(vitalsForm.diastolic_bp, 10) : null,
                    });
                    const nextVitals = await api.get(`/patients/${id}/vitals`);
                    setVitals(nextVitals || []);
                    setShowVitalsForm(false);
                    setVitalsForm({ blood_sugar: "", weight: "", temperature: "", systolic_bp: "", diastolic_bp: "" });
                  } catch (err) {
                    console.error("Failed to save vitals:", err);
                  } finally {
                    setSavingVitals(false);
                  }
                }}
                disabled={savingVitals}
                className="flex-1 rounded-lg bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-50"
              >
                {savingVitals ? "Saving..." : "Save Vitals"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
