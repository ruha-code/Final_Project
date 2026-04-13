import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, MapPin, HeartPulse } from "lucide-react";
import { api } from "../services/api";

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "—";
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/patients/${id}/vitals`),
    ])
      .then(([p, v]) => {
        setPatient(p);
        setVitals(v);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!patient) return <div className="text-gray-400 p-6">Patient not found</div>;

  const latest = vitals[0] || {};

  return (
    <div className="space-y-6">
      {/* TOP PROFILE */}
      <div className="grid grid-cols-4 gap-6">
        {/* LEFT */}
        <div className="col-span-3 bg-white rounded-2xl border p-6 flex gap-6">
          <div className="w-24 h-24 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-teal-600">
            {getInitials(patient.full_name)}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-semibold">{patient.full_name}</h2>
              <p className="text-sm text-gray-400">#{patient.id}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Phone size={14} /> {patient.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} /> {patient.email}
              </div>
              {patient.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} /> {patient.address}
                </div>
              )}
            </div>
            <div className="flex gap-3 flex-wrap text-xs">
              <span className="bg-gray-100 px-3 py-1 rounded-lg">
                {calcAge(patient.date_of_birth)} / {patient.gender}
              </span>
              {patient.blood_type && (
                <span className="bg-gray-100 px-3 py-1 rounded-lg">{patient.blood_type}</span>
              )}
              {patient.condition && (
                <span className="bg-gray-100 px-3 py-1 rounded-lg">{patient.condition}</span>
              )}
              <span className={`px-3 py-1 rounded-lg ${patient.patient_status === "IN_TREATMENT" ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"}`}>
                {patient.patient_status?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-2xl p-6 flex flex-col justify-between">
          <p className="text-sm opacity-80">Clinic System</p>
          <div>
            <h3 className="text-lg font-semibold">{patient.full_name}</h3>
            <p className="text-xs opacity-80">#{patient.id}</p>
          </div>
          <p className="text-xs opacity-80 capitalize">{patient.patient_type?.toLowerCase()} Patient</p>
        </div>
      </div>

      {/* VITALS STATS */}
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Blood Sugar", latest.blood_sugar ? `${latest.blood_sugar} mg/dL` : "—"],
          ["Weight", latest.weight ? `${latest.weight} kg` : "—"],
          ["Temperature", latest.temperature ? `${latest.temperature}°C` : "—"],
          ["Blood Pressure", latest.systolic_bp ? `${latest.systolic_bp}/${latest.diastolic_bp}` : "—"],
        ].map(([title, val]) => (
          <div key={title} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-400">{title}</p>
            <p className="font-semibold text-lg">{val}</p>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="col-span-2 space-y-6">
          {/* VITALS CHART */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <HeartPulse size={16} /> Vitals History
            </h3>
            {vitals.length > 0 ? (
              <div className="flex items-end gap-3 h-40">
                {vitals.slice(0, 7).map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-teal-500 rounded-t-lg"
                    style={{ height: `${Math.min(100, ((v.systolic_bp || v.blood_sugar || 80) / 200) * 100)}%` }}
                    title={`${v.systolic_bp || v.blood_sugar || "—"}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No vitals recorded yet.</p>
            )}
          </div>

          {/* ADMISSION INFO */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Admission Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">{patient.patient_type?.toLowerCase()}</span>
              </div>
              {patient.admission_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Admitted</span>
                  <span>{new Date(patient.admission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              )}
              {patient.room_location && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Room</span>
                  <span>{patient.room_location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* MEDICAL */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Medical Info</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Condition: {patient.condition || "—"}</p>
              <p>Blood Type: {patient.blood_type || "—"}</p>
            </div>
          </div>

          {/* EMERGENCY */}
          {patient.emergency_contact_name && (
            <div className="bg-white border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Emergency Contact</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>{patient.emergency_contact_name}</p>
                <p>{patient.emergency_contact_phone}</p>
              </div>
            </div>
          )}

          {/* NOTES */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Notes</h3>
            <p className="text-sm text-gray-600">{patient.notes || "No notes available."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
