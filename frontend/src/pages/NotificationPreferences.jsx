import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DEFAULT_FORM = {
  mute_message_notifications: false,
  mute_appointment_notifications: false,
  mute_calendar_notifications: false,
  appointment_reminder_hours: 48,
};

const TYPE_ORDER = ["MESSAGE", "APPOINTMENT", "CALENDAR"];

const TYPE_CONFIG = {
  MESSAGE: {
    field: "mute_message_notifications",
    label: "Messages",
    description: "Mute unread message alerts.",
  },
  APPOINTMENT: {
    field: "mute_appointment_notifications",
    label: "Appointments",
    description: "Mute upcoming appointment notifications.",
  },
  CALENDAR: {
    field: "mute_calendar_notifications",
    label: "Calendar",
    description: "Mute calendar alerts.",
  },
};

function getFallbackTypesByRole(role) {
  if (role === "ADMIN") return ["APPOINTMENT", "CALENDAR"];
  if (role === "DOCTOR") return ["MESSAGE", "APPOINTMENT"];
  return ["MESSAGE", "APPOINTMENT"];
}

function toInteger(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function NotificationPreferences() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [availableTypes, setAvailableTypes] = useState([]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await api.get("/notifications/preferences");

        setForm({
          mute_message_notifications: Boolean(data?.mute_message_notifications),
          mute_appointment_notifications: Boolean(data?.mute_appointment_notifications),
          mute_calendar_notifications: Boolean(data?.mute_calendar_notifications),
          appointment_reminder_hours: data?.appointment_reminder_hours ?? 48,
        });

        const serverTypes = Array.isArray(data?.available_notification_types)
          ? data.available_notification_types
          : [];

        setAvailableTypes(
          serverTypes.length > 0
            ? serverTypes
            : getFallbackTypesByRole(user?.role),
        );
      } catch (err) {
        setError(err.message || "Failed to load preferences");
        setAvailableTypes(getFallbackTypesByRole(user?.role));
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.role]);

  const handleToggle = (field) => {
    setError("");
    setSaved(false);
    setForm((c) => ({ ...c, [field]: !c[field] }));
  };

  const handleReminderChange = (e) => {
    setError("");
    setSaved(false);
    setForm((c) => ({
      ...c,
      appointment_reminder_hours: e.target.value,
    }));
  };

  const handleSave = async () => {
    setError("");
    setSaved(false);

    const reminderHours = toInteger(form.appointment_reminder_hours);

    if (reminderHours === null || reminderHours < 1 || reminderHours > 168) {
      setError("Reminder must be 1–168 hours.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        appointment_reminder_hours: reminderHours,
      };

      if (availableTypes.includes("MESSAGE")) {
        payload.mute_message_notifications = form.mute_message_notifications;
      }
      if (availableTypes.includes("APPOINTMENT")) {
        payload.mute_appointment_notifications = form.mute_appointment_notifications;
      }
      if (availableTypes.includes("CALENDAR")) {
        payload.mute_calendar_notifications = form.mute_calendar_notifications;
      }

      const updated = await api.put("/notifications/preferences", payload);

      setForm({
        mute_message_notifications: Boolean(updated?.mute_message_notifications),
        mute_appointment_notifications: Boolean(updated?.mute_appointment_notifications),
        mute_calendar_notifications: Boolean(updated?.mute_calendar_notifications),
        appointment_reminder_hours: updated?.appointment_reminder_hours ?? reminderHours,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save");
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

  const visibleTypeCards = TYPE_ORDER
    .filter((t) => availableTypes.includes(t))
    .map((t) => ({
      type: t,
      ...TYPE_CONFIG[t],
    }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 sm:px-0">

      {/* HEADER */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Control your alerts and reminders
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border bg-white p-4 sm:p-6">

        {/* TOGGLES */}
        <div className="space-y-3">
          {visibleTypeCards.map((card) => (
            <label
              key={card.type}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3"
            >
              <div>
                <p className="text-sm font-medium">{card.label}</p>
                <p className="text-xs text-gray-400">{card.description}</p>
              </div>

              <input
                type="checkbox"
                checked={Boolean(form[card.field])}
                onChange={() => handleToggle(card.field)}
                className="h-5 w-5 accent-teal-500 self-start sm:self-auto"
              />
            </label>
          ))}
        </div>

        {/* INPUT */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">
            Reminder (hours)
          </label>

          <input
            type="number"
            min="1"
            max="168"
            value={form.appointment_reminder_hours}
            onChange={handleReminderChange}
            className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
          />

          <p className="mt-1 text-xs text-gray-400">
            1–168 hours before appointment
          </p>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${
            saved
              ? "bg-green-500 text-white"
              : "bg-teal-500 text-white hover:bg-teal-600"
          } disabled:opacity-50`}
        >
          {saved ? (
            <>
              <Check size={18} /> Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={18} /> Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}