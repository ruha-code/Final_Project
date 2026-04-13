import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, MapPin, Users, Calendar, Star } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../services/api";

const chartData = [
  { day: "Mon", inpatient: 30, outpatient: 50 },
  { day: "Tue", inpatient: 40, outpatient: 60 },
  { day: "Wed", inpatient: 35, outpatient: 70 },
  { day: "Thu", inpatient: 50, outpatient: 65 },
  { day: "Fri", inpatient: 45, outpatient: 75 },
  { day: "Sat", inpatient: 30, outpatient: 55 },
  { day: "Sun", inpatient: 25, outpatient: 45 },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function DoctorDetails() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");

  useEffect(() => {
    api.get("/doctors")
      .then((doctors) => {
        const found = doctors.find((d) => d.id === Number(id));
        setDoc(found || null);
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

  if (!doc) return <div className="text-gray-400 p-6">Doctor not found</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="grid grid-cols-4 gap-6">
        {/* PROFILE */}
        <div className="bg-white rounded-2xl border p-6 text-center">
          {doc.avatar_url ? (
            <img src={doc.avatar_url} alt="" className="w-32 h-32 mx-auto rounded-2xl object-cover" />
          ) : (
            <div className="w-32 h-32 mx-auto rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center text-3xl font-bold">
              {getInitials(doc.full_name)}
            </div>
          )}
          <h2 className="mt-4 font-semibold text-lg">{doc.full_name}</h2>
          <p className="text-sm text-gray-500">{doc.specialty || "—"}</p>
          <div className="text-xs text-gray-400 mt-1">
            {doc.years_of_experience ? `${doc.years_of_experience}+ years` : "—"}
          </div>
          <span className={`mt-3 inline-block px-3 py-1 text-xs rounded-lg ${doc.is_available ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"}`}>
            {doc.is_available ? "Available" : "Unavailable"}
          </span>
        </div>

        {/* INFO */}
        <div className="col-span-2 bg-white rounded-2xl border p-6 space-y-4">
          <h3 className="font-semibold">About</h3>
          <p className="text-sm text-gray-500">{doc.bio || "No bio available."}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="flex gap-2 items-center">
              <Phone size={16} className="text-teal-500" /> {doc.phone || "—"}
            </p>
            <p className="flex gap-2 items-center">
              <Mail size={16} className="text-teal-500" /> {doc.email}
            </p>
            <p className="flex gap-2 items-center col-span-2">
              <MapPin size={16} className="text-teal-500" /> {doc.department_name || "No department"}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border flex gap-3 items-center">
            <Users className="text-teal-500" />
            <div>
              <p className="text-xs text-gray-400">Department</p>
              <p className="font-semibold text-sm">{doc.department_name || "—"}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border flex gap-3 items-center">
            <Calendar className="text-teal-500" />
            <div>
              <p className="text-xs text-gray-400">Consultation</p>
              <p className="font-semibold">{doc.consultation_duration_minutes} min</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border flex gap-3 items-center">
            <Star className="text-yellow-400" />
            <div>
              <p className="text-xs text-gray-400">Rating</p>
              <p className="font-semibold">{doc.rating?.toFixed(1) || "0.0"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Patient Overview</h3>
        <div className="flex gap-5 text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" /> Inpatient
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-teal-200 rounded-full" /> Outpatient
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={6}>
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={{ borderRadius: "12px", border: "none", fontSize: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
            <Bar dataKey="inpatient" fill="rgba(20, 184, 166, 0.9)" radius={[8, 8, 0, 0]} activeBar={{ fill: "#0f766e" }} />
            <Bar dataKey="outpatient" fill="rgba(20, 184, 166, 0.35)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PATIENTS */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex justify-between mb-4">
          <h3 className="text-sm font-semibold">Schedule</h3>
          <div className="flex gap-3 text-xs">
            {["All", "Upcoming", "History"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg ${tab === t ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-400">No schedule data available.</p>
      </div>
    </div>
  );
}
