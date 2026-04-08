import { useState } from "react";
import { useParams } from "react-router-dom";

import { Phone, Mail, MapPin, Users, Calendar, Star } from "lucide-react";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const doctors = {
  5: {
    name: "Dr. Nina Alvarez",
    specialty: "Dermatology",
    experience: "11+ years",
    status: "Available",
    phone: "+62 21-555-2035",
    email: "nina.alvarez@medlink.com",
    address: "Jakarta, Indonesia",
    about:
      "Specializes in dermatology, acne, pigmentation and skin care treatments.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    stats: {
      patients: 410,
      appointments: 620,
      rating: 4.8,
    },
  },
};

const chartData = [
  { day: "Mon", inpatient: 30, outpatient: 50 },
  { day: "Tue", inpatient: 40, outpatient: 60 },
  { day: "Wed", inpatient: 35, outpatient: 70 },
  { day: "Thu", inpatient: 50, outpatient: 65 },
  { day: "Fri", inpatient: 45, outpatient: 75 },
  { day: "Sat", inpatient: 30, outpatient: 55 },
  { day: "Sun", inpatient: 25, outpatient: 45 },
];

export default function DoctorDetails() {
  const { id } = useParams();
  const doc = doctors[id];

  const [tab, setTab] = useState("All");

  if (!doc) return <div>Not found</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="grid grid-cols-4 gap-6">
        {/* PROFILE */}
        <div className="bg-white rounded-2xl border p-6 text-center">
          <img
            src={doc.image}
            alt=""
            className="w-32 h-32 mx-auto rounded-2xl object-cover"
          />

          <h2 className="mt-4 font-semibold text-lg">{doc.name}</h2>
          <p className="text-sm text-gray-500">{doc.specialty}</p>

          <div className="text-xs text-gray-400 mt-1">{doc.experience}</div>

          <span className="mt-3 inline-block px-3 py-1 bg-teal-100 text-teal-600 text-xs rounded-lg">
            {doc.status}
          </span>
        </div>

        {/* INFO */}
        <div className="col-span-2 bg-white rounded-2xl border p-6 space-y-4">
          <h3 className="font-semibold">About</h3>
          <p className="text-sm text-gray-500">{doc.about}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="flex gap-2 items-center">
              <Phone size={16} className="text-teal-500" />
              {doc.phone}
            </p>

            <p className="flex gap-2 items-center">
              <Mail size={16} className="text-teal-500" />
              {doc.email}
            </p>

            <p className="flex gap-2 items-center col-span-2">
              <MapPin size={16} className="text-teal-500" />
              {doc.address}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border flex gap-3 items-center">
            <Users className="text-teal-500" />
            <div>
              <p className="text-xs text-gray-400">Patients</p>
              <p className="font-semibold">{doc.stats.patients}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border flex gap-3 items-center">
            <Calendar className="text-teal-500" />
            <div>
              <p className="text-xs text-gray-400">Appointments</p>
              <p className="font-semibold">{doc.stats.appointments}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border flex gap-3 items-center">
            <Star className="text-yellow-400" />
            <div>
              <p className="text-xs text-gray-400">Rating</p>
              <p className="font-semibold">{doc.stats.rating}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-gray-400 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full" />
          Inpatient
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-200 rounded-full" />
          Outpatient
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Patient Overview</h3>

        {/* LEGEND */}
        <div className="flex gap-5 text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />
            Inpatient
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-teal-200 rounded-full" />
            Outpatient
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={6}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                fontSize: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            />

            {/* PRIMARY */}
            <Bar
              dataKey="inpatient"
              fill="rgba(20, 184, 166, 0.9)"
              radius={[8, 8, 0, 0]}
              activeBar={{ fill: "#0f766e" }}
            />

            {/* SECONDARY */}
            <Bar
              dataKey="outpatient"
              fill="rgba(20, 184, 166, 0.35)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SCHEDULE */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="text-sm font-semibold mb-4">Appointment Schedule</h3>

        <div className="space-y-3">
          {[
            "Erica Smith – 13:30",
            "Johan Greece – 14:00",
            "Maya Patel – 15:00",
          ].map((s) => (
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100">
              <span>{s}</span>
              <button className="text-xs text-teal-600">View</button>
            </div>
          ))}
        </div>
      </div>

      {/* PATIENTS + TABS */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex justify-between mb-4">
          <h3 className="text-sm font-semibold">Patients</h3>

          <div className="flex gap-3 text-xs">
            {["All", "Upcoming", "History"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg ${
                  tab === t
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {["Erica Smith", "Johan Greece", "Maya Patel"].map((p, i) => (
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-3">
                <img
                  src={`https://randomuser.me/api/portraits/${
                    i % 2 === 0 ? "women" : "men"
                  }/${i + 10}.jpg`}
                  className="w-8 h-8 rounded-full"
                />
                <span>{p}</span>
              </div>

              <span className="text-teal-500 text-xs">In Treatment</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
