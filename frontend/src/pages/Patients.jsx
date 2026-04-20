import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Eye, X } from "lucide-react";

import Badge from "../components/Badge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "-";
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getAgeNumber(dateOfBirth) {
  if (!dateOfBirth) return -1;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatPatientType(value) {
  if (!value) return "-";
  return value === "INPATIENT" ? "Inpatient" : "Outpatient";
}

function toInputDate(value) {
  if (!value) return "";
  return typeof value === "string" ? value.slice(0, 10) : new Date(value).toISOString().slice(0, 10);
}

function formatAdmissionCell(patient) {
  if (patient.patient_type === "OUTPATIENT") {
    return { text: "N/A", className: "text-gray-400" };
  }
  if (!patient.admission_date) {
    return { text: "Missing", className: "text-amber-600" };
  }
  return {
    text: new Date(`${patient.admission_date}T00:00:00`).toLocaleDateString("en-GB"),
    className: "text-gray-500",
  };
}

function getConsistencyHint(patient) {
  if (!patient) return null;

  if (patient.patient_type === "OUTPATIENT" && patient.patient_status === "ADMITTED") {
    return "Review type/status";
  }
  if (patient.patient_type === "OUTPATIENT" && (patient.admission_date || patient.room_location)) {
    return "Outpatient timeline mismatch";
  }
  if (patient.patient_type === "INPATIENT" && !patient.admission_date) {
    return "Missing admission date";
  }
  return null;
}

const STATUS_STYLES = {
  DISCHARGED: "bg-gray-100 text-gray-500",
  IN_TREATMENT: "bg-teal-100 text-teal-600",
  ADMITTED: "bg-blue-100 text-blue-600",
};

function Status({ status }) {
  return (
    <Badge className={`justify-self-start rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-400"}`}>
      {status ? status.replace("_", " ") : "-"}
    </Badge>
  );
}

function EditModal({ patient, form, setForm, onClose, onSave, saving }) {
  const isInpatient = form.patient_type === "INPATIENT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[540px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-teal-50 px-6 py-4">
          <h2 className="font-semibold">Edit Patient - {patient.full_name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Address" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <input value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} placeholder="Condition" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.patient_type}
              onChange={(event) => {
                const nextType = event.target.value;
                setForm({
                  ...form,
                  patient_type: nextType,
                  patient_status: nextType === "OUTPATIENT" && form.patient_status === "ADMITTED"
                    ? "IN_TREATMENT"
                    : form.patient_status,
                  admission_date: nextType === "OUTPATIENT" ? "" : form.admission_date,
                  room_location: nextType === "OUTPATIENT" ? "" : form.room_location,
                });
              }}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="OUTPATIENT">Outpatient</option>
              <option value="INPATIENT">Inpatient</option>
            </select>

            <select
              value={form.patient_status}
              onChange={(event) => setForm({ ...form, patient_status: event.target.value })}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="IN_TREATMENT">In Treatment</option>
              {isInpatient && <option value="ADMITTED">Admitted</option>}
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.admission_date}
              onChange={(event) => setForm({ ...form, admission_date: event.target.value })}
              disabled={!isInpatient}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <input
              value={form.room_location}
              onChange={(event) => setForm({ ...form, room_location: event.target.value })}
              placeholder="Room location"
              disabled={!isInpatient}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          {!isInpatient && <p className="text-xs text-gray-400">Outpatients do not require admission date or room.</p>}

          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} placeholder="Notes" className="w-full resize-none rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name_asc");
  const [editPatient, setEditPatient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

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
      patient_type: patient.patient_type || "OUTPATIENT",
      patient_status: patient.patient_status || "IN_TREATMENT",
      admission_date: toInputDate(patient.admission_date),
      room_location: patient.room_location || "",
    });
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      const isInpatient = editForm.patient_type === "INPATIENT";
      const payload = {
        phone: editForm.phone || null,
        address: editForm.address || null,
        condition: editForm.condition || null,
        notes: editForm.notes || null,
        patient_type: editForm.patient_type,
        patient_status: editForm.patient_type === "OUTPATIENT" && editForm.patient_status === "ADMITTED"
          ? "IN_TREATMENT"
          : editForm.patient_status,
        admission_date: isInpatient ? (editForm.admission_date || null) : null,
        room_location: isInpatient ? (editForm.room_location || null) : null,
      };
      await api.put(`/patients/${editPatient.id}`, payload);
      setEditPatient(null);
      void fetchPatients();
    } catch (err) {
      console.error("Failed to update patient:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const isDoctorView = isDoctor() && !isAdmin();

  const visiblePatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = patients.filter((patient) => {
      const matchesSearch = !query
        || patient.full_name?.toLowerCase().includes(query)
        || patient.email?.toLowerCase().includes(query)
        || patient.condition?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "ALL" || patient.patient_status === statusFilter;
      const matchesType = typeFilter === "ALL" || patient.patient_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "name_asc") return (a.full_name || "").localeCompare(b.full_name || "");
      if (sortBy === "name_desc") return (b.full_name || "").localeCompare(a.full_name || "");
      if (sortBy === "age_desc") return getAgeNumber(b.date_of_birth) - getAgeNumber(a.date_of_birth);
      if (sortBy === "age_asc") return getAgeNumber(a.date_of_birth) - getAgeNumber(b.date_of_birth);
      if (sortBy === "admission_desc") return (b.admission_date || "").localeCompare(a.admission_date || "");
      if (sortBy === "admission_asc") return (a.admission_date || "").localeCompare(b.admission_date || "");
      return 0;
    });
    return sorted;
  }, [patients, search, statusFilter, typeFilter, sortBy]);

  const visibleIds = visiblePatients.map((patient) => patient.id);
  const selectedVisibleCount = visibleIds.filter((id) => selected.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const toggleSelectVisible = () => {
    setSelected((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      const merged = new Set([...current, ...visibleIds]);
      return [...merged];
    });
  };

  const dischargeSelected = async () => {
    const selectedPatients = patients.filter((patient) => selected.includes(patient.id));
    const targets = selectedPatients.filter((patient) => patient.patient_status !== "DISCHARGED");
    if (targets.length === 0) return;

    try {
      setBulkSaving(true);
      await Promise.all(targets.map((patient) => api.put(`/patients/${patient.id}`, { patient_status: "DISCHARGED" })));
      setSelected([]);
      void fetchPatients();
    } catch (err) {
      console.error("Failed to discharge selected patients:", err);
    } finally {
      setBulkSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Patients</h2>
          <p className="text-sm text-gray-400">{isDoctorView ? "Open a patient and continue the visit workflow." : "Manage patient records with safe controls."}</p>
        </div>
        {isAdmin() && selected.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={dischargeSelected}
              disabled={bulkSaving}
              className="rounded-xl bg-teal-500 px-4 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-60"
            >
              {bulkSaving ? "Updating..." : `Discharge Selected (${selected.length})`}
            </button>
            <button onClick={() => setSelected([])} className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">
              Clear
            </button>
          </div>
        )}
      </div>

      {isAdmin() && (
        <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, condition"
            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400">
            <option value="ALL">All Statuses</option>
            <option value="IN_TREATMENT">In Treatment</option>
            <option value="ADMITTED">Admitted</option>
            <option value="DISCHARGED">Discharged</option>
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400">
            <option value="ALL">All Types</option>
            <option value="OUTPATIENT">Outpatient</option>
            <option value="INPATIENT">Inpatient</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400">
            <option value="name_asc">Sort: Name A-Z</option>
            <option value="name_desc">Sort: Name Z-A</option>
            <option value="age_desc">Sort: Oldest First</option>
            <option value="age_asc">Sort: Youngest First</option>
            <option value="admission_desc">Sort: Admission Newest</option>
            <option value="admission_asc">Sort: Admission Oldest</option>
          </select>
        </div>
      )}

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
            {visiblePatients.map((patient) => (
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
              <span className="flex items-center">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} aria-label="Select all visible patients" />
              </span>
              <span>Name</span>
              <span>Age</span>
              <span>Condition</span>
              <span>Blood Type</span>
              <span>Type</span>
              <span>Admission Date</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {visiblePatients.map((patient) => {
              const admissionCell = formatAdmissionCell(patient);
              const hint = getConsistencyHint(patient);

              return (
                <div key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)} className={`grid cursor-pointer grid-cols-9 items-center border-t px-6 py-4 hover:bg-gray-50 ${selected.includes(patient.id) ? "bg-teal-50" : ""}`}>
                  <input type="checkbox" checked={selected.includes(patient.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelect(patient.id)} aria-label={`Select patient ${patient.full_name}`} />
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
                  <span className="text-sm text-gray-500">{formatPatientType(patient.patient_type)}</span>
                  <div>
                    <span className={`text-sm ${admissionCell.className}`}>{admissionCell.text}</span>
                    {hint && <p className="text-xs text-amber-600">{hint}</p>}
                  </div>
                  <Status status={patient.patient_status} />
                  <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-200"
                      title="View patient"
                      aria-label="View patient"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={(event) => openEdit(patient, event)}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs text-teal-700 hover:bg-teal-100"
                      title="Edit patient"
                      aria-label="Edit patient"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>
                    {patient.patient_status !== "DISCHARGED" && (
                      <button
                        onClick={async (event) => {
                          event.stopPropagation();
                          try {
                            await api.put(`/patients/${patient.id}`, { patient_status: "DISCHARGED" });
                            void fetchPatients();
                          } catch (err) {
                            console.error("Failed to discharge patient:", err);
                          }
                        }}
                        className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-100"
                        title="Mark as discharged"
                        aria-label="Mark as discharged"
                      >
                        Discharge
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
