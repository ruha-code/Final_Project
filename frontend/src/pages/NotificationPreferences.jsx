import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";

import { api } from "../services/api";

const DEFAULT_FORM = {
  mute_message_notifications: false,
  mute_appointment_notifications: false,
  mute_inventory_notifications: false,
  mute_calendar_notifications: false,
  appointment_reminder_hours: 48,
};

function toInteger(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function NotificationPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await api.get("/notifications/preferences");
        setForm({
          mute_message_notifications: Boolean(data?.mute_message_notifications),
          mute_appointment_notifications: Boolean(data?.mute_appointment_notifications),
          mute_inventory_notifications: Boolean(data?.mute_inventory_notifications),
          mute_calendar_notifications: Boolean(data?.mute_calendar_notifications),
          appointment_reminder_hours: data?.appointment_reminder_hours ?? 48,
        });
      } catch (err) {
        setError(err.message || "Failed to load notification preferences");
      } finally {
        setLoading(false);
      }
    };

    void fetchPreferences();
  }, []);

  const handleToggle = (field) => {
    setError("");
    setSaved(false);
    setForm((current) => ({ ...current, [field]: !current[field] }));
  };

  const handleReminderChange = (event) => {
    const nextValue = event.target.value;
    setError("");
    setSaved(false);
    setForm((current) => ({
      ...current,
      appointment_reminder_hours: nextValue,
    }));
  };

  const handleSave = async () => {
    setError("");
    setSaved(false);

    const reminderHours = toInteger(form.appointment_reminder_hours);
    if (reminderHours === null || reminderHours < 1 || reminderHours > 168) {
      setError("Reminder timing must be a number from 1 to 168 hours.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        mute_message_notifications: form.mute_message_notifications,
        mute_appointment_notifications: form.mute_appointment_notifications,
        mute_inventory_notifications: form.mute_inventory_notifications,
        mute_calendar_notifications: form.mute_calendar_notifications,
        appointment_reminder_hours: reminderHours,
      };
      const updated = await api.put("/notifications/preferences", payload);
      setForm({
        mute_message_notifications: Boolean(updated?.mute_message_notifications),
        mute_appointment_notifications: Boolean(updated?.mute_appointment_notifications),
        mute_inventory_notifications: Boolean(updated?.mute_inventory_notifications),
        mute_calendar_notifications: Boolean(updated?.mute_calendar_notifications),
        appointment_reminder_hours: updated?.appointment_reminder_hours ?? reminderHours,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save notification preferences");
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Notification Preferences</h2>
        <p className="text-sm text-gray-400">
          Choose which notification types to mute and when appointment reminders appear.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border bg-white p-6">
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Messages</p>
              <p className="text-xs text-gray-400">Mute unread message alerts.</p>
            </div>
            <input
              type="checkbox"
              checked={form.mute_message_notifications}
              onChange={() => handleToggle("mute_message_notifications")}
              className="h-4 w-4 accent-teal-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Appointments</p>
              <p className="text-xs text-gray-400">Mute upcoming appointment notifications.</p>
            </div>
            <input
              type="checkbox"
              checked={form.mute_appointment_notifications}
              onChange={() => handleToggle("mute_appointment_notifications")}
              className="h-4 w-4 accent-teal-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Inventory</p>
              <p className="text-xs text-gray-400">Mute low stock and out-of-stock alerts.</p>
            </div>
            <input
              type="checkbox"
              checked={form.mute_inventory_notifications}
              onChange={() => handleToggle("mute_inventory_notifications")}
              className="h-4 w-4 accent-teal-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Calendar</p>
              <p className="text-xs text-gray-400">Mute upcoming calendar event alerts.</p>
            </div>
            <input
              type="checkbox"
              checked={form.mute_calendar_notifications}
              onChange={() => handleToggle("mute_calendar_notifications")}
              className="h-4 w-4 accent-teal-500"
            />
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">
            Appointment reminder timing (hours)
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
            Range: 1 to 168 hours before the appointment.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 transition ${
            saved ? "bg-green-500 text-white" : "bg-teal-500 text-white hover:bg-teal-600"
          } disabled:opacity-50`}
        >
          {saved ? (
            <>
              <Check size={18} />
              Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={18} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
