import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { User, Calendar, ChevronRight, Activity } from "lucide-react";

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "—";
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function MyPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const appointments = await api.get("/appointments/my");
        const patientIds = [...new Set(appointments.map(a => a.patient_id))];
        const allPatients = await api.get("/patients");
        const myPatients = allPatients.filter(p => patientIds.includes(p.id));
        setPatients(myPatients);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [user.id]);

  const filtered = patients.filter((p) => {
    const matchSearch = !search || 
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || filter === "all" || p.patient_status === filter;
    return matchSearch && matchFilter;
  });

  const statusCounts = patients.reduce((acc, p) => {
    const status = p.patient_status || "UNKNOWN";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

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
        <h2 className="text-2xl font-semibold">My Patients</h2>
        <p className="text-sm text-gray-400">Patients assigned to you</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: patients.length, color: "text-gray-700" },
          { label: "In Treatment", value: statusCounts.IN_TREATMENT || 0, color: "text-teal-600" },
          { label: "Admitted", value: statusCounts.ADMITTED || 0, color: "text-blue-600" },
          { label: "Discharged", value: statusCounts.DISCHARGED || 0, color: "text-gray-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <input
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border px-4 py-2 rounded-xl text-sm"
        >
          <option value="">All Status</option>
          <option value="IN_TREATMENT">In Treatment</option>
          <option value="ADMITTED">Admitted</option>
          <option value="DISCHARGED">Discharged</option>
        </select>
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
          No patients found
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="grid grid-cols-6 px-6 py-3 text-xs text-gray-400 border-b bg-gray-50">
            <span>Patient</span>
            <span>Age / Gender</span>
            <span>Blood Type</span>
            <span>Type</span>
            <span>Status</span>
            <span></span>
          </div>

          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              className="grid grid-cols-6 px-6 py-4 items-center border-b last:border-none hover:bg-gray-50 cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  {getInitials(p.full_name)}
                </div>
                <div>
                  <p className="font-medium text-sm">{p.full_name}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {calcAge(p.date_of_birth)} / {p.gender?.slice(0, 1) || "—"}
              </span>
              <span className="text-sm text-gray-500">{p.blood_type || "—"}</span>
              <span className="text-sm text-gray-500 capitalize">{p.patient_type?.toLowerCase() || "—"}</span>
              <span className={`text-xs px-2 py-1 rounded-md w-fit ${
                p.patient_status === "IN_TREATMENT" ? "bg-teal-100 text-teal-600" :
                p.patient_status === "ADMITTED" ? "bg-blue-100 text-blue-600" :
                "bg-gray-100 text-gray-500"
              }`}>
                {p.patient_status?.replace("_", " ") || "—"}
              </span>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
