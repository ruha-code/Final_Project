import { useState, useEffect } from "react";
import { Building2, Layers, Users, MapPin, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
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
    return Math.round(departments.reduce((s, d) => s + (d[key] || 0), 0) / departments.length);
  };

  return (
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <h3 className="font-semibold text-sm">Department Insights</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-500">Staff Load</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${avg("patient_satisfaction")}%` }} />
          </div>
        </div>
        <div>
          <p className="text-gray-500">Patient Flow</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-400 rounded-full" style={{ width: `${avg("efficiency")}%` }} />
          </div>
        </div>
        <div>
          <p className="text-gray-500">Efficiency</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-600 rounded-full" style={{ width: `${avg("treatment_success")}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DepartmentCard({ dep }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/departments/${dep.id}`)}
      className="bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition cursor-pointer"
    >
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
            {dep.staff_count} Staff
          </span>
          <span className="text-sm text-teal-600 flex items-center gap-1">
            View <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/departments")
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStaff = departments.reduce((s, d) => s + (d.staff_count || 0), 0);
  const avgTeam = departments.length ? Math.round(totalStaff / departments.length) : 0;

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
          <StatCard title="Total Staff" value={totalStaff} icon={Layers} />
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
        <button className="text-sm bg-teal-100 text-teal-600 px-4 py-2 rounded-xl">Filter</button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">No departments found</p>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {filtered.map((dep) => (
            <DepartmentCard key={dep.id} dep={dep} />
          ))}
        </div>
      )}
    </div>
  );
}
