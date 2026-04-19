import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, Mail, MapPin, Phone, Star } from "lucide-react";

import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  addDaysToDateString,
  formatDisplayShortDate,
  getBrowserTimezoneOffsetMinutes,
  getTodayLocalDate,
} from "../utils/dateTime";

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((value) => value[0]).join("").slice(0, 2).toUpperCase();
}

export default function DoctorDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPatient } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        setError("");
        const doctorData = await api.get(`/doctors/${id}`);
        setDoctor(doctorData);

        const today = getTodayLocalDate();
        const nextDaysResults = await Promise.allSettled(
          Array.from({ length: 7 }, (_, index) => {
            const date = addDaysToDateString(today, index);
            return api
              .get(`/doctors/${id}/available-slots?date=${date}&timezone_offset_minutes=${getBrowserTimezoneOffsetMinutes()}`)
              .then((result) => ({
                date,
                slots: result?.available_slots || [],
              }));
          }),
        );

        const nextDays = nextDaysResults
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value);

        const availableDays = nextDays.filter((item) => item.slots.length > 0);
        setSchedule(availableDays);
        if (availableDays[0]) {
          setSelectedDate(availableDays[0].date);
        }
      } catch (err) {
        setError(err.message || "Failed to load doctor");
      } finally {
        setLoading(false);
      }
    };

    void fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!doctor) {
    return <div className="rounded-2xl bg-white p-6 text-sm text-gray-500">Doctor not found.</div>;
  }

  const selectedDay = schedule.find((item) => item.date === selectedDate);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.2fr_0.9fr]">
        <div className="rounded-3xl border bg-white p-6 text-center shadow-sm">
          {doctor.avatar_url ? (
            <img src={doctor.avatar_url} alt={doctor.full_name} className="mx-auto h-32 w-32 rounded-3xl object-cover" />
          ) : (
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-teal-100 text-3xl font-bold text-teal-700">
              {initials(doctor.full_name)}
            </div>
          )}
          <h1 className="mt-4 text-xl font-semibold text-gray-900">{doctor.full_name}</h1>
          <p className="text-sm text-gray-500">{doctor.specialty || "General physician"}</p>
          <p className="mt-1 text-xs text-gray-400">{doctor.department_name || "No department assigned"}</p>
          <Badge className={`mt-4 rounded-lg px-3 py-1 text-xs font-medium ${doctor.is_available ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {doctor.is_available ? "Accepting bookings" : "Unavailable"}
          </Badge>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">About</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">{doctor.bio || "No bio available yet."}</p>
          <div className="mt-6 grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
            <p className="flex items-center gap-2"><Phone size={16} className="text-teal-500" /> {doctor.phone || "No phone provided"}</p>
            <p className="flex items-center gap-2"><Mail size={16} className="text-teal-500" /> {doctor.email}</p>
            <p className="flex items-center gap-2 sm:col-span-2"><MapPin size={16} className="text-teal-500" /> {doctor.department_name || "No department assigned"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">Consultation</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{doctor.consultation_duration_minutes} min</p>
          </div>
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">Experience</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{doctor.years_of_experience || 0}+ yrs</p>
          </div>
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400"><Star size={14} className="text-yellow-500" /> Rating</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{doctor.rating?.toFixed(1) || "0.0"}</p>
            <p className="mt-1 text-sm text-gray-500">Patient rating</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Clock size={18} /> Available Slots</h2>
            <p className="text-sm text-gray-500">Select a time and continue straight to booking.</p>
          </div>
          {isPatient() && (
            <button
              onClick={() => navigate("/appointments", { state: { bookDoctorId: doctor.id, bookDate: selectedDate, bookTime: selectedSlot } })}
              disabled={!selectedDate || !selectedSlot}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Calendar size={16} /> Book Appointment
            </button>
          )}
        </div>

        {schedule.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No available slots in the next 7 days.</p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              {schedule.map((item) => (
                <button
                  key={item.date}
                  onClick={() => {
                    setSelectedDate(item.date);
                    setSelectedSlot("");
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm ${selectedDate === item.date ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  <span>{formatDisplayShortDate(item.date)}</span>
                  <span className="text-xs opacity-80">{item.slots.length} slots</span>
                </button>
              ))}
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">
                {selectedDate ? `Available times for ${formatDisplayShortDate(selectedDate)}` : "Select a date"}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(selectedDay?.slots || []).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl px-3 py-2 text-sm ${selectedSlot === slot ? "bg-teal-500 text-white" : "bg-white text-gray-700 hover:bg-teal-50"}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {selectedDay && selectedDay.slots.length === 0 && (
                <p className="text-sm text-gray-400">No slots for this day.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
