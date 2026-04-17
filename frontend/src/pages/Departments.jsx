import { useState, useEffect } from "react";
import { Building2, Layers, Users, MapPin, ArrowRight, Search, Plus, X, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DepartmentsChart from "../components/DepartmentsChart";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1584982751601-97dcc096659c";

function StatCard({ title, value, icon: IconComponent }) {
  return (
    <div className="bg-white rounded-2xl p-5 border flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
      <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
        {IconComponent && <IconComponent size={18} />}
      </div>
    </div>
  );
}

function MiniStats({ departments }) {
  const avg = (key) => {
    if (!departments.length) return 0;
    const values = departments.map((d) => d[key] || 0);
    return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  };

  const allZero =
    avg("patient_satisfaction") === 0 &&
    avg("efficiency") === 0 &&
    avg("treatment_success") === 0;

  return (
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <h3 className="font-semibold text-sm">Department Insights</h3>
      {allZero ? (
        <p className="text-xs text-gray-400">
          Metrics not configured yet. Edit a department to set satisfaction, efficiency and success rates.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Patient Satisfaction</span>
              <span>{avg("patient_satisfaction")}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${avg("patient_satisfaction")}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Efficiency</span>
              <span>{avg("efficiency")}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-teal-400 rounded-full" style={{ width: `${avg("efficiency")}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Treatment Success</span>
              <span>{avg("treatment_success")}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-teal-600 rounded-full" style={{ width: `${avg("treatment_success")}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentCard({ dep, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition">
      <img
        src={dep.image_url ? `${dep.image_url}?auto=format&fit=crop&w=800` : `${FALLBACK_IMG}?auto=format&fit=crop&w=800`}
        className="h-40 w-full object-cover"
      />
      <div className="p-4 space-y-2">
        <h3 className="font-semibold">{dep.name}</h3>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <MapPin size={12} /> {dep.location || "—"}
        </p>
        <p className="text-sm text-gray-500">{dep.description || "—"}</p>
        <div className="flex justify-between items-center pt-3">
          <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-lg">
            {dep.staff_count} Team Members
          </span>
          <span className="text-sm text-teal-600 flex items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/departments/${dep.id}`); }}>
            View <ArrowRight size={14} />
          </span>
        </div>
        {isAdmin() && (
          <div className="flex gap-2 pt-2 border-t mt-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(dep); }} className="flex-1 py-1 text-xs bg-gray-100 rounded-lg hover:bg-teal-50 text-teal-600">Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(dep.id); }} className="flex-1 py-1 text-xs bg-gray-100 rounded-lg hover:bg-red-50 text-red-500">Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricInput({ label, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <label>{label}</label>
        <span>{Math.round(value || 0)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value || 0}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-teal-500"
      />
    </div>
  );
}

function DepartmentModal({ onClose, onSaved, editData }) {
  const [form, setForm] = useState({
    name: editData?.name || "",
    location: editData?.location || "",
    description: editData?.description || "",
    patient_satisfaction: editData?.patient_satisfaction ?? 0,
    efficiency: editData?.efficiency ?? 0,
    treatment_success: editData?.treatment_success ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    setError("");
    try {
      if (editData) {
        await api.put(`/departments/${editData.id}`, form);
      } else {
        await api.post("/departments", form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[480px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-teal-50 border-b">
          <h2 className="font-semibold">{editData ? "Edit" : "Add"} Department</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({...form, location: e.target.value})}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              rows={2}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
          </div>

          <div className="pt-2 border-t space-y-3">
            <p className="text-xs text-gray-400 font-medium">Performance Metrics</p>
            <MetricInput
              label="Patient Satisfaction"
              value={form.patient_satisfaction}
              onChange={(v) => setForm({ ...form, patient_satisfaction: v })}
            />
            <MetricInput
              label="Efficiency"
              value={form.efficiency}
              onChange={(v) => setForm({ ...form, efficiency: v })}
            />
            <MetricInput
              label="Treatment Success"
              value={form.treatment_success}
              onChange={(v) => setForm({ ...form, treatment_success: v })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2 bg-teal-500 text-white rounded-xl text-sm hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : editData ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Departments() {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editData, setEditData] = useState(null);

  const fetchDepartments = async () => {
    try {
      const data = await api.get("/departments");
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const openEdit = (dep) => {
    setEditData(dep);
    setModal(true);
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalTeamMembers = departments.reduce(
    (sum, department) => sum + (department.staff_count || 0),
    0,
  );
  const avgTeam = departments.length
    ? Math.round(totalTeamMembers / departments.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Departments</h1>
        <p className="text-sm text-gray-400">Manage hospital departments</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-4">
          <StatCard title="Total Departments" value={departments.length} icon={Building2} />
          <StatCard title="Total Team Members" value={totalTeamMembers} icon={Layers} />
          <StatCard title="Avg Team Size" value={avgTeam} icon={Users} />
          <MiniStats departments={departments} />
        </div>
        <div className="col-span-3">
          <DepartmentsChart />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl w-72">
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Search departments..."
            className="bg-transparent outline-none text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin() && (
          <button
            onClick={() => { setEditData(null); setModal(true); }}
            className="text-sm bg-teal-100 text-teal-600 px-4 py-2 rounded-xl flex items-center gap-1"
          >
            <Plus size={14} /> Add Department
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">No departments found</p>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {filtered.map((dep) => (
            <DepartmentCard key={dep.id} dep={dep} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal && (
        <DepartmentModal onClose={() => setModal(false)} onSaved={fetchDepartments} editData={editData} />
      )}
    </div>
  );
}
