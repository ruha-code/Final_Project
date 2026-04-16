import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, MapPin, Users, Calendar, Star, Clock } from "lucide-react";
import { api } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function DoctorDetails() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load all doctors and find ours (backend has no GET /doctors/:id)
        const doctors = await api.get("/doctors");
        const found = doctors.find((d) => d.id === Number(id));
        setDoc(found || null);

        // Try to load available slots for the next 5 days to show schedule
        if (found) {
          const today = new Date();
          const scheduleData = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split("T")[0];
            try {
              const slotsRes = await api.get(`/doctors/${found.id}/available-slots?date=${dateStr}`);
              if (slotsRes.available_slots?.length > 0) {
                scheduleData.push({
                  date: dateStr,
                  dayName: d.toLocaleDateString("en-GB", { weekday: "long" }),
                  dateFormatted: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                  slots: slotsRes.available_slots,
                });
              }
            } catch {
              // ignore
            }
          }
          setSchedule(scheduleData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

      {/* SCHEDULE */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock size={16} /> Available Schedule (Next 7 Days)
        </h3>

        {schedule.length === 0 ? (
          <p className="text-sm text-gray-400">No available slots in the next 7 days.</p>
        ) : (
          <div className="space-y-4">
            {schedule.map((day) => (
              <div key={day.date}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">{day.dayName}</span>
                  <span className="text-xs text-gray-400">{day.dateFormatted}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((slot) => {
                    const t = new Date(slot);
                    return (
                      <span
                        key={slot}
                        className="px-3 py-1.5 bg-teal-50 text-teal-600 text-xs rounded-lg"
                      >
                        {t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
