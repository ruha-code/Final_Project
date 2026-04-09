import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "—";
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

const GENDER_ICON = { MALE: "♂", FEMALE: "♀", OTHER: "⚧" };

const STATUS_STYLES = {
  DISCHARGED: "bg-gray-100 text-gray-500",
  IN_TREATMENT: "bg-teal-100 text-teal-600",
  ADMITTED: "bg-blue-100 text-blue-600",
};

const STATUS_LABELS = {
  DISCHARGED: "Discharged",
  IN_TREATMENT: "In Treatment",
  ADMITTED: "Admitted",
};

function Status({ status }) {
  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-400"}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await api.get("/patients");
        setPatients(data);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Patients</h2>

        <div className="flex gap-2">
          {["Gender", "Age", "Patient Type", "Condition"].map((f) => (
            <button
              key={f}
              className="px-3 py-1.5 bg-gray-100 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              {f} <span className="text-xs">▾</span>
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="grid grid-cols-9 px-6 py-3 text-xs text-gray-400 bg-gray-50">
          <span></span>
          <span>Name</span>
          <span>Gender / Age</span>
          <span>Condition</span>
          <span>Blood Type</span>
          <span>Patient Type</span>
          <span>Admission Date</span>
          <span>Location</span>
          <span>Status</span>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No patients found
          </div>
        ) : (
          patients.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              className={`grid grid-cols-9 px-6 py-4 border-t items-center cursor-pointer transition hover:bg-gray-50 ${
                selected.includes(p.id) ? "bg-teal-50" : ""
              }`}
            >
              <input
                type="checkbox"
                onClick={(e) => e.stopPropagation()}
                checked={selected.includes(p.id)}
                onChange={() => toggleSelect(p.id)}
              />

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-semibold">
                  {getInitials(p.full_name)}
                </div>
                <div>
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-xs text-gray-400">#{p.id}</p>
                </div>
              </div>

              <span className="text-sm text-gray-500">
                {GENDER_ICON[p.gender] || "—"} / {calcAge(p.date_of_birth)}
              </span>

              <span className="text-sm text-gray-600">
                {p.condition || "—"}
              </span>

              <span className="text-sm text-gray-500">
                {p.blood_type || "—"}
              </span>

              <span className="text-sm text-gray-500 capitalize">
                {p.patient_type?.toLowerCase()}
              </span>

              <span className="text-sm text-gray-500">
                {p.admission_date
                  ? new Date(p.admission_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>

              <span className="text-sm text-gray-500">
                {p.room_location || "—"}
              </span>

              <Status status={p.patient_status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Patients;
