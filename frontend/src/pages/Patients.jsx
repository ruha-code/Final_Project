import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Eye, Trash2, X } from "lucide-react";

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

const STATUS_STYLES = {
  DISCHARGED: "bg-gray-100 text-gray-500",
  IN_TREATMENT: "bg-teal-100 text-teal-600",
  ADMITTED: "bg-blue-100 text-blue-600",
};

function Status({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-400"}`}>
      {status ? status.replace("_", " ") : "-"}
    </span>
  );
}

function EditModal({ patient, form, setForm, onClose, onSave, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[500px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-teal-50 px-6 py-4">
          <h2 className="font-semibold">Edit Patient - {patient.full_name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="Condition" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <select value={form.patient_status} onChange={(e) => setForm({ ...form, patient_status: e.target.value })} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400">
            <option value="IN_TREATMENT">In Treatment</option>
            <option value="ADMITTED">Admitted</option>
            <option value="DISCHARGED">Discharged</option>
          </select>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notes" className="w-full resize-none rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-2 text-sm">Cancel</button>
            <button onClick={onSave} disabled={saving} className="flex-1 rounded-xl bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Patients() {
  const { isAdmin, isDoctor } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [editPatient, setEditPatient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.get("/patients");
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPatients();
  }, []);

  const openEdit = (patient, event) => {
    event.stopPropagation();
    setEditPatient(patient);
    setEditForm({
      phone: patient.phone || "",
      address: patient.address || "",
      condition: patient.condition || "",
      notes: patient.notes || "",
      patient_status: patient.patient_status || "IN_TREATMENT",
    });
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      await api.put(`/patients/${editPatient.id}`, editForm);
      setEditPatient(null);
      void fetchPatients();
    } catch (err) {
      console.error("Failed to update patient:", err);
    } finally {
      setSaving(false);
    }
  };

  const deletePatient = async (id, event) => {
    event.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      await api.delete(`/patients/${id}`);
      void fetchPatients();
    } catch (err) {
      console.error("Failed to delete patient:", err);
    }
  };

  const toggleSelect = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500"></div></div>;
  }

  const isDoctorView = isDoctor() && !isAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Patients</h2>
          <p className="text-sm text-gray-400">{isDoctorView ? "Open a patient and continue the visit workflow." : "Manage patient records."}</p>
        </div>
        {isAdmin() && selected.length > 0 && (
          <button
            onClick={async () => {
              if (!window.confirm(`Delete ${selected.length} selected patient(s)?`)) return;
              for (const id of selected) {
                try { await api.delete(`/patients/${id}`); } catch (err) { console.error(err); }
              }
              setSelected([]);
              void fetchPatients();
            }}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
          >
            Delete Selected ({selected.length})
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        {isDoctorView ? (
          <>
            <div className="grid grid-cols-[1.4fr_0.7fr_1fr_0.8fr_0.7fr] bg-gray-50 px-6 py-3 text-xs text-gray-400">
              <span>Name</span>
              <span>Age</span>
              <span>Condition</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {patients.map((patient) => (
              <div key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)} className="grid cursor-pointer grid-cols-[1.4fr_0.7fr_1fr_0.8fr_0.7fr] items-center border-t px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                    {getInitials(patient.full_name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{patient.full_name}</p>
                    <p className="text-xs text-gray-400">#{patient.id}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{calcAge(patient.date_of_birth)}</span>
                <span className="text-sm text-gray-600">{patient.condition || "-"}</span>
                <Status status={patient.patient_status} />
                <div>
                  <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">View</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="grid grid-cols-9 bg-gray-50 px-6 py-3 text-xs text-gray-400">
              <span></span>
              <span>Name</span>
              <span>Age</span>
              <span>Condition</span>
              <span>Blood Type</span>
              <span>Type</span>
              <span>Admission Date</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {patients.map((patient) => (
              <div key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)} className={`grid cursor-pointer grid-cols-9 items-center border-t px-6 py-4 hover:bg-gray-50 ${selected.includes(patient.id) ? "bg-teal-50" : ""}`}>
                <input type="checkbox" checked={selected.includes(patient.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelect(patient.id)} />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">{getInitials(patient.full_name)}</div>
                  <div>
                    <p className="font-medium text-gray-900">{patient.full_name}</p>
                    <p className="text-xs text-gray-400">#{patient.id}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{calcAge(patient.date_of_birth)}</span>
                <span className="text-sm text-gray-600">{patient.condition || "-"}</span>
                <span className="text-sm text-gray-500">{patient.blood_type || "-"}</span>
                <span className="text-sm text-gray-500">{patient.patient_type?.toLowerCase() || "-"}</span>
                <span className="text-sm text-gray-500">{patient.admission_date || "-"}</span>
                <Status status={patient.patient_status} />
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => navigate(`/patients/${patient.id}`)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-teal-500"><Eye size={14} /></button>
                  <button onClick={(e) => openEdit(patient, e)} className="rounded-lg p-1.5 text-gray-400 hover:bg-teal-50 hover:text-teal-500"><Edit size={14} /></button>
                  <button onClick={(e) => deletePatient(patient.id, e)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {editPatient && (
        <EditModal
          patient={editPatient}
          form={editForm}
          setForm={setEditForm}
          onClose={() => setEditPatient(null)}
          onSave={saveEdit}
          saving={saving}
        />
      )}
    </div>
  );
}
