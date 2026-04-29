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
        if (err.message?.includes("not found")) {
          setNeedsProfile(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateSlot = (dayIndex, field, value) => {
    setSchedule((current) =>
      current.map((slot, index) =>
        index === dayIndex ? { ...slot, [field]: value } : slot,
      ),
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const invalidSlot = schedule.find(
      (slot) => slot.is_available && slot.start_time >= slot.end_time,
    );

    if (invalidSlot) {
      const dayLabel = DAYS.find((d) => d.value === invalidSlot.day_of_week)?.label;
      setError(`Invalid time for ${dayLabel}`);
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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  if (needsProfile) {
    return (
      <div className="mx-auto max-w-2xl px-3 sm:px-0">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-yellow-800">Profile Required</h3>
          <p className="text-sm text-yellow-700">
            You need a doctor profile before managing schedule.
          </p>
        </div>
      </div>
    );
  }

  const sessionDuration = profile?.consultation_duration_minutes || 30;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 sm:px-0">

      {/* HEADER */}
      <div className="rounded-3xl border bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">My Schedule</h2>
            <p className="text-sm text-gray-500 mt-1">
              Weekly availability for booking system
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition w-full sm:w-auto ${
              saved ? "bg-green-500 text-white" : "bg-teal-500 text-white hover:bg-teal-600"
            } disabled:opacity-50`}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? "Saved" : saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs text-gray-400">Session Duration</p>
          <p className="text-2xl font-semibold mt-2">{sessionDuration} min</p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs text-gray-400">Available Days</p>
          <p className="text-2xl font-semibold mt-2">
            {schedule.filter((s) => s.is_available).length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs text-gray-400">Breaks</p>
          <p className="text-2xl font-semibold mt-2">Soon</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TABLE WRAPPER (RESPONSIVE FIX) */}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">

        {/* HEADER ROW */}
        <div className="min-w-[700px] grid grid-cols-[1fr_0.85fr_0.85fr_0.8fr_0.8fr] bg-gray-50 px-4 sm:px-6 py-3 text-xs text-gray-400 uppercase">
          <span>Day</span>
          <span>Start</span>
          <span>End</span>
          <span>Slots</span>
          <span>Available</span>
        </div>

        {/* ROWS */}
        {schedule.map((slot, index) => {
          const day = DAYS.find((d) => d.value === slot.day_of_week);
          const slotCount = slot.is_available
            ? countGeneratedSlots(slot.start_time, slot.end_time, sessionDuration)
            : 0;

          return (
            <div
              key={slot.day_of_week}
              className="min-w-[700px] grid grid-cols-[1fr_0.85fr_0.85fr_0.8fr_0.8fr] items-center border-b px-4 sm:px-6 py-4"
            >
              <div className="flex items-center gap-2">
                <Clock size={14} />
                {day?.label}
              </div>

              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => updateSlot(index, "start_time", e.target.value)}
                disabled={!slot.is_available}
                className="w-full sm:w-32 rounded-lg bg-gray-100 px-2 py-2 text-sm"
              />

              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => updateSlot(index, "end_time", e.target.value)}
                disabled={!slot.is_available}
                className="w-full sm:w-32 rounded-lg bg-gray-100 px-2 py-2 text-sm"
              />

              <div className="text-sm text-gray-600">
                {slot.is_available ? `${slotCount} slots` : "-"}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={slot.is_available}
                  onChange={(e) =>
                    updateSlot(index, "is_available", e.target.checked)
                  }
                />
                Yes
              </label>
            </div>
          );
        })}
      </div>

    </div>
  );
}