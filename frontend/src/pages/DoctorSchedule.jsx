import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Clock, Save, Check } from "lucide-react";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState(
    DAYS.map((d) => ({
      day_of_week: d.value,
      start_time: "08:00",
      end_time: "17:00",
      is_available: d.value < 5, // Mon-Fri default
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if doctor has a profile
        const doctorProfile = await api.get("/doctors/me");
        setProfile(doctorProfile);

        // Load current schedule
        const slots = await api.get("/doctors/schedule");
        if (slots.length > 0) {
          setSchedule(
            DAYS.map((d) => {
              const existing = slots.find((s) => s.day_of_week === d.value);
              if (existing) {
                return {
                  day_of_week: d.value,
                  start_time: existing.start_time?.slice(0, 5) || "08:00",
                  end_time: existing.end_time?.slice(0, 5) || "17:00",
                  is_available: existing.is_available,
                };
              }
              return {
                day_of_week: d.value,
                start_time: "08:00",
                end_time: "17:00",
                is_available: false,
              };
            })
          );
        }
      } catch (err) {
        if (err.message?.includes("not found") || err.message?.includes("Set it up")) {
          setNeedsProfile(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateSlot = (dayIndex, field, value) => {
    setSchedule((prev) =>
      prev.map((s, i) => (i === dayIndex ? { ...s, [field]: value } : s))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const invalidSlot = schedule.find(s => s.is_available && s.start_time >= s.end_time);
    if (invalidSlot) {
      const dayLabel = DAYS.find(d => d.value === invalidSlot.day_of_week)?.label;
      setError(`Invalid time for ${dayLabel}: End time must be after start time`);
      setSaving(false);
      return;
    }

    try {
      const slotsToSend = schedule.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time + ":00",
        end_time: s.end_time + ":00",
        is_available: s.is_available,
      }));
      await api.post("/doctors/schedule", slotsToSend);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (needsProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-yellow-800 mb-2">Profile Required</h3>
          <p className="text-sm text-yellow-600">
            You need to set up your doctor profile before managing your schedule.
            Please contact an administrator to complete your profile setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">My Schedule</h2>
          <p className="text-sm text-gray-400">
            Manage your weekly availability
            {profile && ` — ${profile.consultation_duration_minutes} min sessions`}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition ${
            saved
              ? "bg-green-500 text-white"
              : "bg-teal-500 text-white hover:bg-teal-600"
          } disabled:opacity-50`}
        >
          {saved ? <><Check size={16} /> Saved</> : saving ? "Saving..." : <><Save size={16} /> Save Schedule</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Schedule Grid */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="grid grid-cols-4 px-6 py-3 text-xs text-gray-400 border-b bg-gray-50">
          <span>Day</span>
          <span>Start Time</span>
          <span>End Time</span>
          <span>Available</span>
        </div>

        {schedule.map((slot, index) => {
          const day = DAYS.find((d) => d.value === slot.day_of_week);
          return (
            <div
              key={slot.day_of_week}
              className={`grid grid-cols-4 px-6 py-4 items-center border-b last:border-none transition ${
                slot.is_available ? "bg-white" : "bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="font-medium text-sm">{day.label}</span>
              </div>

              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => updateSlot(index, "start_time", e.target.value)}
                disabled={!slot.is_available}
                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm outline-none w-32 disabled:opacity-50"
              />

              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => updateSlot(index, "end_time", e.target.value)}
                disabled={!slot.is_available}
                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm outline-none w-32 disabled:opacity-50"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slot.is_available}
                  onChange={(e) => updateSlot(index, "is_available", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                />
                <span className="text-sm text-gray-500">
                  {slot.is_available ? "Yes" : "No"}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-teal-50 rounded-xl p-4 text-sm text-teal-700">
        <p className="font-medium mb-1">How it works</p>
        <ul className="list-disc list-inside text-teal-600 space-y-1 text-xs">
          <li>Set your available hours for each day of the week</li>
          <li>Patients can book appointments during your available hours</li>
          <li>Appointment duration is based on your profile setting ({profile?.consultation_duration_minutes || 30} min)</li>
          <li>Uncheck a day to mark it as unavailable</li>
        </ul>
      </div>
    </div>
  );
}
