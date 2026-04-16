import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Trash2, Edit, X } from "lucide-react";

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
  const { isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [editPatient, setEditPatient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchPatients();
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients();
    } catch (err) {
      console.error("Failed to delete patient:", err);
    }
  };

  const handleEdit = (patient, e) => {
    e.stopPropagation();
    setEditPatient(patient);
    setEditForm({
      phone: patient.phone || "",
      address: patient.address || "",
      blood_type: patient.blood_type || "",
      condition: patient.condition || "",
      notes: patient.notes || "",
      patient_status: patient.patient_status || "IN_TREATMENT",
      room_location: patient.room_location || "",
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/patients/${editPatient.id}`, editForm);
      setEditPatient(null);
      fetchPatients();
    } catch (err) {
      console.error("Failed to update patient:", err);
    } finally {
      setSaving(false);
    }
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

        {isAdmin() && selected.length > 0 && (
          <button
            onClick={async () => {
              if (!window.confirm(`Delete ${selected.length} selected patient(s)?`)) return;
              for (const id of selected) {
                try { await api.delete(`/patients/${id}`); } catch (err) { console.error(err); }
              }
              setSelected([]);
              fetchPatients();
            }}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete Selected ({selected.length})
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className={`grid px-6 py-3 text-xs text-gray-400 bg-gray-50 ${isAdmin() ? "grid-cols-9" : "grid-cols-8"}`}>
          {isAdmin() && <span></span>}
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
              className={`grid px-6 py-4 border-t items-center cursor-pointer transition hover:bg-gray-50 ${
                selected.includes(p.id) ? "bg-teal-50" : ""
              } ${isAdmin() ? "grid-cols-9" : "grid-cols-8"}`}
            >
              {isAdmin() && (
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selected.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                />
              )}

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

              {isAdmin() && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleEdit(p, e)}
                    className="p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[500px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-teal-50 border-b">
              <h2 className="font-semibold">Edit Patient - {editPatient.full_name}</h2>
              <button onClick={() => setEditPatient(null)} className="p-1 hover:bg-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Address</label>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Blood Type</label>
                <select
                  value={editForm.blood_type}
                  onChange={(e) => setEditForm({...editForm, blood_type: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Condition</label>
                <input
                  value={editForm.condition}
                  onChange={(e) => setEditForm({...editForm, condition: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Status</label>
                <select
                  value={editForm.patient_status}
                  onChange={(e) => setEditForm({...editForm, patient_status: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="IN_TREATMENT">In Treatment</option>
                  <option value="ADMITTED">Admitted</option>
                  <option value="DISCHARGED">Discharged</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Room Location</label>
                <input
                  value={editForm.room_location}
                  onChange={(e) => setEditForm({...editForm, room_location: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditPatient(null)} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm">Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-2 bg-teal-500 text-white rounded-xl text-sm hover:bg-teal-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
