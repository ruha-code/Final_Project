import { useEffect, useState } from "react";
import { Check, Clock, Save } from "lucide-react";

import { api } from "../services/api";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

function countGeneratedSlots(start, end, duration) {
  if (!start || !end || !duration) return 0;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  if (startTotal >= endTotal) return 0;
  return Math.floor((endTotal - startTotal) / duration);
}

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      day_of_week: day.value,
      start_time: "08:00",
      end_time: "17:00",
      is_available: day.value < 5,
    })),
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
        const doctorProfile = await api.get("/doctors/me");
        setProfile(doctorProfile);

        const slots = await api.get("/doctors/schedule");
        if (slots.length > 0) {
          setSchedule(
            DAYS.map((day) => {
              const existing = slots.find((slot) => slot.day_of_week === day.value);
              return existing
                ? {
                    day_of_week: day.value,
                    start_time: existing.start_time?.slice(0, 5) || "08:00",
                    end_time: existing.end_time?.slice(0, 5) || "17:00",
                    is_available: existing.is_available,
                  }
                : {
                    day_of_week: day.value,
                    start_time: "08:00",
                    end_time: "17:00",
                    is_available: false,
                  };
            }),
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
    void fetchData();
  }, []);

  const updateSlot = (dayIndex, field, value) => {
    setSchedule((current) => current.map((slot, index) => (index === dayIndex ? { ...slot, [field]: value } : slot)));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const invalidSlot = schedule.find((slot) => slot.is_available && slot.start_time >= slot.end_time);
    if (invalidSlot) {
      const dayLabel = DAYS.find((day) => day.value === invalidSlot.day_of_week)?.label;
      setError(`Invalid time for ${dayLabel}: end time must be after start time.`);
      setSaving(false);
      return;
    }

    try {
      await api.post(
        "/doctors/schedule",
        schedule.map((slot) => ({
          day_of_week: slot.day_of_week,
          start_time: `${slot.start_time}:00`,
          end_time: `${slot.end_time}:00`,
          is_available: slot.is_available,
        })),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" /></div>;
  }

  if (needsProfile) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-yellow-800">Profile Required</h3>
          <p className="text-sm text-yellow-700">You need a doctor profile before managing schedule and booking availability.</p>
        </div>
      </div>
    );
  }

  const sessionDuration = profile?.consultation_duration_minutes || 30;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">My Schedule</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your weekly availability controls which booking slots patients can see.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition ${saved ? "bg-green-500 text-white" : "bg-teal-500 text-white hover:bg-teal-600"} disabled:opacity-50`}
          >
            {saved ? <><Check size={16} /> Saved</> : saving ? "Saving..." : <><Save size={16} /> Save Schedule</>}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Session Duration</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{sessionDuration} min</p>
          <p className="mt-2 text-sm text-gray-500">Used to generate appointment slots from your working hours.</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Available Days</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{schedule.filter((slot) => slot.is_available).length}</p>
          <p className="mt-2 text-sm text-gray-500">Only checked days are visible for booking.</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Breaks</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">Soon</p>
          <p className="mt-2 text-sm text-gray-500">Lunch breaks are not configurable yet, so keep them in mind when setting hours.</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_0.85fr_0.85fr_0.8fr_0.8fr] border-b bg-gray-50 px-6 py-3 text-xs uppercase tracking-wide text-gray-400">
          <span>Day</span>
          <span>Start Time</span>
          <span>End Time</span>
          <span>Slots</span>
          <span>Available</span>
        </div>

        {schedule.map((slot, index) => {
          const day = DAYS.find((item) => item.value === slot.day_of_week);
          const slotCount = slot.is_available
            ? countGeneratedSlots(slot.start_time, slot.end_time, sessionDuration)
            : 0;

          return (
            <div key={slot.day_of_week} className={`grid grid-cols-[1fr_0.85fr_0.85fr_0.8fr_0.8fr] items-center border-b px-6 py-4 last:border-none ${slot.is_available ? "bg-white" : "bg-gray-50/70"}`}>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="font-medium text-sm text-gray-800">{day?.label}</span>
              </div>

              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => updateSlot(index, "start_time", e.target.value)}
                disabled={!slot.is_available}
                className="w-32 rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
              />

              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => updateSlot(index, "end_time", e.target.value)}
                disabled={!slot.is_available}
                className="w-32 rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
              />

              <div className="text-sm text-gray-600">
                {slot.is_available ? `${slotCount} slots` : "-"}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={slot.is_available}
                  onChange={(e) => updateSlot(index, "is_available", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                />
                {slot.is_available ? "Yes" : "No"}
              </label>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-700">
        <p className="mb-1 font-medium">How schedule affects booking</p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-teal-700">
          <li>Only available days are used to generate booking slots.</li>
          <li>Each day is split by your session duration of {sessionDuration} minutes.</li>
          <li>If a day is unavailable, patients cannot book that day.</li>
          <li>Start time must always be earlier than end time.</li>
        </ul>
      </div>
    </div>
  );
}
