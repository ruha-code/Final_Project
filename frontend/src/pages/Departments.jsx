import { useState } from "react";
import {
  Building2,
  Layers,
  Users,
  MapPin,
  ArrowRight,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DepartmentsChart from "../components/DepartmentsChart";

const data = [
  {
    id: 3,
    name: "General Medicine",
    location: "Main Building - 2nd Floor",
    staff: 24,
    image: "https://images.unsplash.com/photo-1584982751601-97dcc096659c",
    description: "Routine check-ups and diagnostics",
  },
  {
    id: 2,
    name: "Pediatrics",
    location: "Children Wing - 3rd Floor",
    staff: 20,
    image: "https://images.unsplash.com/photo-1580281657527-47f249e8f4df",
    description: "Child healthcare services",
  },
  {
    id: 1,
    name: "Cardiology",
    location: "Heart Center - 4th Floor",
    staff: 22,
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3",
    description: "Heart disease treatment",
  },
  {
    id: 4,
    name: "Orthopedics",
    location: "Surgical Block",
    staff: 18,
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118",
    description: "Bone and joint care",
  },
];

function StatCard({ title, value, icon: Icon }) { // eslint-disable-line no-unused-vars
  return (
    <div className="bg-white rounded-2xl p-5 border flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>

      <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
        <Icon size={18} />
      </div>
    </div>
  );
}

function MiniStats() {
  return (
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <h3 className="font-semibold text-sm">Department Insights</h3>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-500">Staff Load</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-500 w-[75%] rounded-full" />
          </div>
        </div>

        <div>
          <p className="text-gray-500">Patient Flow</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-400 w-[60%] rounded-full" />
          </div>
        </div>

        <div>
          <p className="text-gray-500">Efficiency</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-600 w-[85%] rounded-full" />
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
        src={`${dep.image}?auto=format&fit=crop&w=800`}
        className="h-40 w-full object-cover"
      />

      <div className="p-4 space-y-2">
        <h3 className="font-semibold">{dep.name}</h3>

        <p className="text-xs text-gray-400 flex items-center gap-1">
          <MapPin size={12} /> {dep.location}
        </p>

        <p className="text-sm text-gray-500">{dep.description}</p>

        <div className="flex justify-between items-center pt-3">
          <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-lg">
            {dep.staff} Staff
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
  const [search, setSearch] = useState("");

  const filtered = data.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Departments</h1>
        <p className="text-sm text-gray-400">Manage hospital departments</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* LEFT */}
        <div className="col-span-1 space-y-4">
          <StatCard title="Total Departments" value="8" icon={Building2} />
          <StatCard title="Total Specialties" value="24" icon={Layers} />
          <StatCard title="Avg Team Size" value="45" icon={Users} />
          <MiniStats />
        </div>

        {/* RIGHT */}
        <div className="col-span-3">
          <DepartmentsChart />
        </div>
      </div>

      {/* SEARCH */}
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

        <button className="text-sm bg-teal-100 text-teal-600 px-4 py-2 rounded-xl">
          Filter
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-6">
        {filtered.map((dep) => (
          <DepartmentCard key={dep.id} dep={dep} />
        ))}
      </div>
    </div>
  );
}
