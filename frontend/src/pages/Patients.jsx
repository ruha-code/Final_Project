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
  if (patient.patient_type === "OUTPATIENT" && patient.patient_status === "ADMITTED") return "Review type/status";
  if (patient.patient_type === "OUTPATIENT" && (patient.admission_date || patient.room_location)) return "Outpatient timeline mismatch";
  if (patient.patient_type === "INPATIENT" && !patient.admission_date) return "Missing admission date";
  return null;
}

const STATUS_STYLES = {
  DISCHARGED: "bg-gray-100 text-gray-500",
  IN_TREATMENT: "bg-teal-100 text-teal-600",
  ADMITTED: "bg-blue-100 text-blue-600",
};

const ADMIN_PATIENT_GRID =
  "grid-cols-[40px_1.65fr_0.6fr_1fr_0.75fr_0.85fr_1fr_0.85fr_1.85fr]";
const ACTION_BUTTON_CLASS =
  "inline-flex min-w-[88px] items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-xl mx-4">
        <div className="flex items-center justify-between border-b bg-teal-50 px-4 py-4 sm:px-6">
          <h2 className="font-semibold text-sm sm:text-base">Edit Patient - {patient.full_name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="Condition" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={form.patient_type} onChange={(e) => {
              const nextType = e.target.value;
              setForm({
                ...form,
                patient_type: nextType,
                patient_status: nextType === "OUTPATIENT" && form.patient_status === "ADMITTED" ? "IN_TREATMENT" : form.patient_status,
                admission_date: nextType === "OUTPATIENT" ? "" : form.admission_date,
                room_location: nextType === "OUTPATIENT" ? "" : form.room_location,
              });
            }} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400">
              <option value="OUTPATIENT">Outpatient</option>
              <option value="INPATIENT">Inpatient</option>
            </select>
            <select value={form.patient_status} onChange={(e) => setForm({ ...form, patient_status: e.target.value })} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400">
              <option value="IN_TREATMENT">In Treatment</option>
              {isInpatient && <option value="ADMITTED">Admitted</option>}
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} disabled={!isInpatient} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-60" />
            <input value={form.room_location} onChange={(e) => setForm({ ...form, room_location: e.target.value })} placeholder="Room location" disabled={!isInpatient} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-60" />
          </div>
          {!isInpatient && <p className="text-xs text-gray-400">Outpatients do not require admission date or room.</p>}
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notes" className="w-full resize-none rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-2 text-sm order-2 sm:order-1">Cancel</button>
            <button onClick={onSave} disabled={saving} className="flex-1 rounded-xl bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-50 order-1 sm:order-2">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientCard({ patient, isAdminView, selected, onToggleSelect, onView, onEdit, onDischarge }) {
  const admissionCell = formatAdmissionCell(patient);
  const hint = getConsistencyHint(patient);
  
  return (
    <div className={`bg-white border rounded-xl p-4 ${selected ? "bg-teal-50" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {isAdminView && <input type="checkbox" checked={selected} onChange={onToggleSelect} onClick={(e) => e.stopPropagation()} className="mt-1" />}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">{getInitials(patient.full_name)}</div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm sm:text-base">{patient.full_name}</p>
            <p className="text-xs text-gray-400">#{patient.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onView} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200" title="View patient"><Eye size={14} /></button>
          <button onClick={onEdit} className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100" title="Edit patient"><Edit size={14} /></button>
          {!isAdminView && patient.patient_status !== "DISCHARGED" && (
            <button onClick={onDischarge} className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs" title="Mark as discharged">💉</button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
        <div className="text-gray-500">Age:</div><div className="text-gray-700">{calcAge(patient.date_of_birth)} years</div>
        <div className="text-gray-500">Condition:</div><div className="text-gray-700">{patient.condition || "-"}</div>
        {isAdminView && <><div className="text-gray-500">Blood Type:</div><div className="text-gray-700">{patient.blood_type || "-"}</div></>}
        {isAdminView && <><div className="text-gray-500">Type:</div><div className="text-gray-700">{formatPatientType(patient.patient_type)}</div></>}
        {isAdminView && <><div className="text-gray-500">Admission:</div><div className={admissionCell.className}>{admissionCell.text}</div></>}
        <div className="text-gray-500">Status:</div><div><Status status={patient.patient_status} /></div>
      </div>
      {hint && isAdminView && <p className="text-xs text-amber-600 mt-2 pt-2 border-t">{hint}</p>}
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

  useEffect(() => { void fetchPatients(); }, []);

  const openEdit = (patient, e) => {
    e.stopPropagation();
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
      await api.put(`/patients/${editPatient.id}`, {
        phone: editForm.phone || null,
        address: editForm.address || null,
        condition: editForm.condition || null,
        notes: editForm.notes || null,
        patient_type: editForm.patient_type,
        patient_status: editForm.patient_type === "OUTPATIENT" && editForm.patient_status === "ADMITTED" ? "IN_TREATMENT" : editForm.patient_status,
        admission_date: isInpatient ? (editForm.admission_date || null) : null,
        room_location: isInpatient ? (editForm.room_location || null) : null,
      });
      setEditPatient(null);
      void fetchPatients();
    } catch (err) {
      console.error("Failed to update patient:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const isDoctorView = isDoctor() && !isAdmin();

  const visiblePatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = patients.filter(p => (!query || p.full_name?.toLowerCase().includes(query) || p.email?.toLowerCase().includes(query) || p.condition?.toLowerCase().includes(query)) &&
      (statusFilter === "ALL" || p.patient_status === statusFilter) &&
      (typeFilter === "ALL" || p.patient_type === typeFilter));
    return [...filtered].sort((a, b) => {
      if (sortBy === "name_asc") return (a.full_name || "").localeCompare(b.full_name || "");
      if (sortBy === "name_desc") return (b.full_name || "").localeCompare(a.full_name || "");
      if (sortBy === "age_desc") return getAgeNumber(b.date_of_birth) - getAgeNumber(a.date_of_birth);
      if (sortBy === "age_asc") return getAgeNumber(a.date_of_birth) - getAgeNumber(b.date_of_birth);
      return 0;
    });
  }, [patients, search, statusFilter, typeFilter, sortBy]);

  const visibleIds = useMemo(() => visiblePatients.map(p => p.id), [visiblePatients]);
  const selectedVisibleCount = visibleIds.filter(id => selected.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  useEffect(() => {
    setSelected(prev => prev.filter(id => visibleIds.includes(id)));
  }, [visibleIds]);

  const toggleSelectVisible = () => setSelected(prev => allVisibleSelected ? prev.filter(id => !visibleIds.includes(id)) : [...new Set([...prev, ...visibleIds])]);

  const dischargeSelected = async () => {
    const targets = visiblePatients.filter(p => selected.includes(p.id) && p.patient_status !== "DISCHARGED");
    if (targets.length === 0) return;
    try {
      setBulkSaving(true);
      await Promise.all(targets.map(p => api.put(`/patients/${p.id}`, { patient_status: "DISCHARGED" })));
      setSelected([]);
      void fetchPatients();
    } catch (err) {
      console.error("Failed to discharge selected patients:", err);
    } finally {
      setBulkSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500"></div></div>;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Patients</h2>
          <p className="text-xs sm:text-sm text-gray-400">{isDoctorView ? "Open a patient and continue the visit workflow." : "Manage patient records with safe controls."}</p>
        </div>
        {isAdmin() && selectedVisibleCount > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={dischargeSelected} disabled={bulkSaving} className="rounded-xl bg-teal-500 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-teal-600 disabled:opacity-60">
              {bulkSaving ? "Updating..." : `Discharge (${selectedVisibleCount})`}
            </button>
            <button onClick={() => setSelected([])} className="rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200">Clear</button>
          </div>
        )}
      </div>

      {isAdmin() && (
        <div className="grid gap-3 rounded-2xl border bg-white p-3 sm:p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, condition" className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400">
            <option value="ALL">All Statuses</option>
            <option value="IN_TREATMENT">In Treatment</option>
            <option value="ADMITTED">Admitted</option>
            <option value="DISCHARGED">Discharged</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400">
            <option value="ALL">All Types</option>
            <option value="OUTPATIENT">Outpatient</option>
            <option value="INPATIENT">Inpatient</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400">
            <option value="name_asc">Sort: Name A-Z</option>
            <option value="name_desc">Sort: Name Z-A</option>
            <option value="age_desc">Sort: Oldest First</option>
            <option value="age_asc">Sort: Youngest First</option>
          </select>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white">
        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden space-y-3 p-3">
          {visiblePatients.map(p => (
            <PatientCard key={p.id} patient={p} isAdminView={isAdmin()} selected={selected.includes(p.id)} 
              onToggleSelect={() => toggleSelect(p.id)} onView={() => navigate(`/patients/${p.id}`)} 
              onEdit={(e) => openEdit(p, e)} onDischarge={async (e) => {
                e.stopPropagation();
                await api.put(`/patients/${p.id}`, { patient_status: "DISCHARGED" });
                void fetchPatients();
              }} />
          ))}
        </div>

        {/* Desktop Views */}
        <div className="hidden lg:block">
          {isDoctorView ? (
            <>
              <div className="grid grid-cols-[1.4fr_0.7fr_1fr_0.8fr_0.7fr] bg-gray-50 px-6 py-3 text-xs text-gray-400">
                <span>Name</span><span>Age</span><span>Condition</span><span>Status</span><span>Action</span>
              </div>
              {visiblePatients.map(p => (
                <div key={p.id} onClick={() => navigate(`/patients/${p.id}`)} className="grid cursor-pointer grid-cols-[1.4fr_0.7fr_1fr_0.8fr_0.7fr] items-center border-t px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">{getInitials(p.full_name)}</div>
                    <div><p className="font-medium text-gray-900">{p.full_name}</p><p className="text-xs text-gray-400">#{p.id}</p></div>
                  </div>
                  <span className="text-sm text-gray-500">{calcAge(p.date_of_birth)}</span>
                  <span className="text-sm text-gray-600">{p.condition || "-"}</span>
                  <Status status={p.patient_status} />
                  <div><span className="inline-flex rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">View</span></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className={`grid ${ADMIN_PATIENT_GRID} bg-gray-50 px-6 py-3 text-xs text-gray-400`}>
                <span className="flex items-center"><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} /></span>
                <span>Name</span><span>Age</span><span>Condition</span><span>Blood Type</span><span>Type</span><span>Admission Date</span><span>Status</span><span>Actions</span>
              </div>
              {visiblePatients.map(p => {
                const admissionCell = formatAdmissionCell(p);
                const hint = getConsistencyHint(p);
                return (
                  <div key={p.id} onClick={() => navigate(`/patients/${p.id}`)} className={`grid ${ADMIN_PATIENT_GRID} cursor-pointer items-center border-t px-6 py-4 hover:bg-gray-50 ${selected.includes(p.id) ? "bg-teal-50" : ""}`}>
                    <input type="checkbox" checked={selected.includes(p.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(p.id)} />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">{getInitials(p.full_name)}</div>
                      <div><p className="font-medium text-gray-900">{p.full_name}</p><p className="text-xs text-gray-400">#{p.id}</p></div>
                    </div>
                    <span className="text-sm text-gray-500">{calcAge(p.date_of_birth)}</span>
                    <span className="text-sm text-gray-600">{p.condition || "-"}</span>
                    <span className="text-sm text-gray-500">{p.blood_type || "-"}</span>
                    <span className="text-sm text-gray-500">{formatPatientType(p.patient_type)}</span>
                    <div><span className={`text-sm ${admissionCell.className}`}>{admissionCell.text}</span>{hint && <p className="text-xs text-amber-600">{hint}</p>}</div>
                    <Status status={p.patient_status} />
                    <div className="flex min-w-0 flex-nowrap items-center gap-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button onClick={() => navigate(`/patients/${p.id}`)} className={`${ACTION_BUTTON_CLASS} bg-gray-100 text-gray-700 hover:bg-gray-200`}><Eye size={13} /><span>View</span></button>
                      <button onClick={e => openEdit(p, e)} className={`${ACTION_BUTTON_CLASS} bg-teal-50 text-teal-700 hover:bg-teal-100`}><Edit size={13} /><span>Edit</span></button>
                      {p.patient_status !== "DISCHARGED" && (
                        <button onClick={async e => { e.stopPropagation(); await api.put(`/patients/${p.id}`, { patient_status: "DISCHARGED" }); void fetchPatients(); }} className={`${ACTION_BUTTON_CLASS} bg-amber-50 text-amber-700 hover:bg-amber-100`}><span>Discharge</span></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {editPatient && <EditModal patient={editPatient} form={editForm} setForm={setEditForm} onClose={() => setEditPatient(null)} onSave={saveEdit} saving={saving} />}
    </div>
  );
}
