import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, HeartPulse, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

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

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDoctor } = useAuth();
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
        setPatient(patientData);
        setVitals(vitalsData || []);
        setAppointments((myAppointments || []).filter((item) => Number(item.patient_id) === Number(id)));
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

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" /></div>;
  }

  if (!patient) {
    return <div className="rounded-xl bg-white p-6 text-sm text-gray-400">Patient not found.</div>;
  }

  const latest = vitals[0] || {};
  const sortedAppointments = [...appointments].sort(
    (first, second) => new Date(first.appointment_time).getTime() - new Date(second.appointment_time).getTime(),
  );
  const activeAppointment = sortedAppointments.find((appointment) => appointment.status === "ONGOING")
    || sortedAppointments.find((appointment) => appointment.status === "SCHEDULED" && new Date(appointment.appointment_time).getTime() >= Date.now());
  const chartData = vitals.slice(0, 10).reverse().map((item) => ({
    date: new Date(item.recorded_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    bp: item.systolic_bp || 0,
    sugar: item.blood_sugar || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.7fr]">
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-teal-100 text-2xl font-bold text-teal-600">
              {getInitials(patient.full_name)}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{patient.full_name}</h2>
                <p className="text-sm text-gray-400">#{patient.id}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-2"><Phone size={14} /> {patient.phone || "-"}</span>
                <span className="flex items-center gap-2"><Mail size={14} /> {patient.email}</span>
                {patient.address && <span className="flex items-center gap-2"><MapPin size={14} /> {patient.address}</span>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg bg-gray-100 px-3 py-1">{calcAge(patient.date_of_birth)} years</span>
                <span className="rounded-lg bg-gray-100 px-3 py-1">{patient.gender || "-"}</span>
                <span className="rounded-lg bg-gray-100 px-3 py-1">{patient.blood_type || "No blood type"}</span>
                <span className="rounded-lg bg-teal-50 px-3 py-1 text-teal-700">{patient.patient_status?.replace("_", " ") || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 p-6 text-white">
          <p className="text-sm opacity-80">Doctor Actions</p>
          <div className="mt-6 grid gap-3">
            <button onClick={() => navigate("/messages", { state: { patientId: patient.id } })} className="rounded-xl bg-white/15 px-4 py-3 text-left text-sm font-medium hover:bg-white/20">
              <span className="inline-flex items-center gap-2"><MessageSquare size={16} /> Message patient</span>
            </button>
            <button
              onClick={async () => {
                if (!activeAppointment) {
                  navigate("/appointments");
                  return;
                }

                if (activeAppointment.status === "ONGOING") {
                  return;
                }

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
              className="rounded-xl bg-white/15 px-4 py-3 text-left text-sm font-medium hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {appointmentActionLoading
                ? "Starting appointment..."
                : activeAppointment?.status === "ONGOING"
                  ? "Appointment in progress"
                  : activeAppointment
                    ? "Start appointment"
                    : "Open appointments"}
            </button>
            {appointmentActionError && <p className="rounded-xl bg-white/10 px-4 py-3 text-xs text-white/90">{appointmentActionError}</p>}
            <button onClick={() => navigate("/appointments")} className="rounded-xl bg-white/15 px-4 py-3 text-left text-sm font-medium hover:bg-white/20">
              View appointments
            </button>
            <button onClick={() => navigate("/my-patients")} className="rounded-xl bg-white/15 px-4 py-3 text-left text-sm font-medium hover:bg-white/20">
              Back to my patients
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-gray-400">Blood Sugar</p><p className="text-lg font-semibold">{latest.blood_sugar ? `${latest.blood_sugar} mg/dL` : "-"}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-gray-400">Weight</p><p className="text-lg font-semibold">{latest.weight ? `${latest.weight} kg` : "-"}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-gray-400">Temperature</p><p className="text-lg font-semibold">{latest.temperature ? `${latest.temperature}°C` : "-"}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-gray-400">Blood Pressure</p><p className="text-lg font-semibold">{latest.systolic_bp ? `${latest.systolic_bp}/${latest.diastolic_bp}` : "-"}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><HeartPulse size={16} /> Vitals History</h3>
              {isDoctor() && (
                <button onClick={() => setShowVitalsForm(true)} className="rounded-lg bg-teal-500 px-3 py-2 text-xs font-medium text-white hover:bg-teal-600">
                  <span className="inline-flex items-center gap-2"><Activity size={14} /> Add Vitals</span>
                </button>
              )}
            </div>
            {chartData.length > 0 ? (
              <div className="h-56">
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

          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold">Appointments History</h3>
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments with this patient yet.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => {
                  const info = formatDateTime(appointment.appointment_time);
                  return (
                    <div key={appointment.id} className="grid gap-3 rounded-xl bg-gray-50 px-4 py-3 md:grid-cols-[0.9fr_0.7fr_0.8fr]">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{info.date}</p>
                        <p className="text-xs text-gray-400">{info.time}</p>
                      </div>
                      <div className="text-sm text-gray-600">{appointment.appointment_type?.toLowerCase().replace("_", " ") || "-"}</div>
                      <div>
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">{appointment.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold">Doctor Notes</h3>
            <div className="space-y-4">
              <select value={noteForm.patient_status} onChange={(e) => setNoteForm({ ...noteForm, patient_status: e.target.value })} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400">
                <option value="IN_TREATMENT">In Treatment</option>
                <option value="ADMITTED">Admitted</option>
                <option value="DISCHARGED">Discharged</option>
              </select>
              <textarea
                value={noteForm.notes}
                onChange={(e) => {
                  setNotesError("");
                  setNoteForm({ ...noteForm, notes: e.target.value });
                }}
                rows={6}
                placeholder="Clinical note, summary, follow-up plan..."
                className="w-full resize-none rounded-xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              {notesError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{notesError}</p>
              )}
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
                {savingProfile ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold">Medical Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Condition: {patient.condition || "-"}</p>
              <p>Blood Type: {patient.blood_type || "-"}</p>
              <p>Type: {patient.patient_type?.toLowerCase() || "-"}</p>
              <p>Room: {patient.room_location || "-"}</p>
            </div>
          </div>

          {patient.emergency_contact_name && (
            <div className="rounded-xl border bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold">Emergency Contact</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{patient.emergency_contact_name}</p>
                <p>{patient.emergency_contact_phone || "-"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showVitalsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Add Vitals for {patient.full_name}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={vitalsForm.blood_sugar} onChange={(e) => setVitalsForm({ ...vitalsForm, blood_sugar: e.target.value })} placeholder="Blood sugar" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" value={vitalsForm.weight} onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })} placeholder="Weight" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" step="0.1" value={vitalsForm.temperature} onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })} placeholder="Temperature" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" value={vitalsForm.systolic_bp} onChange={(e) => setVitalsForm({ ...vitalsForm, systolic_bp: e.target.value })} placeholder="Systolic BP" className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" value={vitalsForm.diastolic_bp} onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic_bp: e.target.value })} placeholder="Diastolic BP" className="rounded-lg border px-3 py-2 text-sm" />
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
