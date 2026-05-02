import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const AUTO_REFRESH_INTERVAL_MS = 15000;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const ADMIN_CATEGORY_META = {
  ADMIN: { label: "Admin Meetings", color: "bg-teal-500" },
  SYSTEM: { label: "System & Maintenance", color: "bg-emerald-500" },
  TRAINING: { label: "Training Sessions", color: "bg-slate-500" },
};
const DOCTOR_STATUS_META = {
  SCHEDULED: { label: "Scheduled", color: "bg-blue-500" },
  ONGOING: { label: "Ongoing", color: "bg-teal-500" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", color: "bg-rose-500" },
};

const pad2 = (value) => String(value).padStart(2, "0");

function formatEventTime(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const matched = value.match(/^(\d{1,2}):(\d{2})/);
    if (matched) return `${matched[1].padStart(2, "0")}:${matched[2]}`;
  }
  return String(value);
}

function normalizeTitle(value) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled event";
  if (cleaned === cleaned.toLowerCase()) {
    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return cleaned;
}

function parseIsoDate(isoDate) {
  const parts = String(isoDate || "").split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((part) => Number(part));
  if (!year || !month || !day) return null;
  return { year, month, day, iso: `${year}-${pad2(month)}-${pad2(day)}` };
}

function getTodayIso() {
  const today = new Date();
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
}

function formatFullDate(isoDate) {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return "";
  return new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatSelectedDate(year, month, day) {
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getCategoryLabel(category, doctorMode) {
  if (doctorMode) return DOCTOR_STATUS_META[category]?.label || category;
  return ADMIN_CATEGORY_META[category]?.label || category;
}

function getEventColor(category, doctorMode) {
  if (doctorMode) return DOCTOR_STATUS_META[category]?.color || "bg-teal-500";
  return ADMIN_CATEGORY_META[category]?.color || "bg-gray-500";
}

function EventModal({ onClose, onSaved, editData, defaultDate }) {
  const todayIso = getTodayIso();
  const originalDateValue = editData?.dateValue || null;
  const allowExistingPastDate = Boolean(
    originalDateValue && originalDateValue < todayIso,
  );
  const [form, setForm] = useState({
    title: editData?.title || "",
    date: editData?.dateValue || defaultDate,
    time: formatEventTime(editData?.time) || "",
    category: editData?.category || "ADMIN",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title || !form.date) return;
    if (
      form.date < todayIso &&
      (!allowExistingPastDate || form.date !== originalDateValue)
    ) {
      setError("Events cannot be scheduled in the past.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: normalizeTitle(form.title),
        event_date: form.date,
        event_time: form.time || null,
        category: form.category,
      };
      const savedEvent = editData
        ? await api.put(`/calendar/${editData.id}`, payload)
        : await api.post("/calendar", payload);
      onSaved(savedEvent);
      onClose();
    } catch (err) {
      console.error("Failed to save event:", err);
      setError(err.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm px-4 pb-0 sm:pb-4">
      <div className="w-full max-w-[400px] space-y-5 rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold">
            {editData ? "Edit Event" : "Create Event"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {editData ? "Editing for" : "Creating for"} {formatFullDate(form.date)}
        </p>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-500">
            {error}
          </p>
        )}
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Event title"
          className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            min={allowExistingPastDate ? originalDateValue : todayIso}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-sm"
          />
          <input
            type="time"
            step="60"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-sm"
          />
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm"
        >
          {Object.entries(ADMIN_CATEGORY_META).map(([value, info]) => (
            <option key={value} value={value}>{info.label}</option>
          ))}
        </select>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 py-2 text-xs sm:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title || !form.date}
            className="flex-1 rounded-xl bg-teal-500 py-2 text-xs sm:text-sm text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : editData ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ eventTitle, deleting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-0 sm:pb-4">
      <div className="w-full max-w-[360px] rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Delete Event</h3>
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          Are you sure you want to delete "{eventTitle}"?
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-xl bg-gray-100 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-500 py-2 text-xs sm:text-sm text-white hover:bg-red-600 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const navigate = useNavigate();
  const { isAdmin, isDoctor } = useAuth();
  const now = new Date();
  const todayIso = getTodayIso();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Mobile accordion for the sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mobile details panel
  const [detailsOpen, setDetailsOpen] = useState(false);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        if (isDoctor()) {
          const appointments = await api.get("/appointments/my");
          if (cancelled) return;
          const doctorEvents = (appointments || [])
            .map((item) => {
              const value = new Date(item.appointment_time);
              const dateValue = `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
              return {
                id: item.id,
                title: normalizeTitle(item.patient_name || "Patient"),
                date: value.getDate(),
                dateValue,
                time: formatEventTime(
                  value.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                ),
                category: String(item.status || "").toUpperCase(),
                patient_id: item.patient_id,
              };
            })
            .filter((item) => {
              const parsed = parseIsoDate(item.dateValue);
              return parsed && parsed.month === currentMonth && parsed.year === currentYear;
            });
          setEvents(doctorEvents);
          setError(null);
          return;
        }

        const data = await api.get(`/calendar?month=${currentMonth}&year=${currentYear}`);
        if (cancelled) return;
        const normalized = (data || [])
          .map((item) => {
            const parsed = parseIsoDate(item.event_date);
            if (!parsed) return null;
            return {
              id: item.id,
              title: normalizeTitle(item.title),
              date: parsed.day,
              dateValue: parsed.iso,
              time: formatEventTime(item.event_time),
              category: String(item.category || "ADMIN").toUpperCase(),
            };
          })
          .filter(Boolean);
        setEvents(normalized);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load calendar data:", err);
        setError("Failed to load calendar data");
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };
    void fetchData();
    const intervalId = setInterval(() => {
      void fetchData({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [currentMonth, currentYear, isDoctor, reloadKey]);

  const filteredMonthCount = useMemo(
    () =>
      events.filter(
        (item) => filter === "all" || item.category === filter.toUpperCase(),
      ).length,
    [events, filter],
  );

  useEffect(() => {
    if (selectedEvent && !events.some((item) => item.id === selectedEvent.id)) {
      setSelectedEvent(null);
    }
  }, [events, selectedEvent]);

  const activeFilters = isDoctor()
    ? [
        { value: "all", label: "All Appointments" },
        { value: "scheduled", label: "Scheduled" },
        { value: "ongoing", label: "Ongoing" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ]
    : [
        { value: "all", label: "All Events" },
        { value: "admin", label: ADMIN_CATEGORY_META.ADMIN.label },
        { value: "system", label: ADMIN_CATEGORY_META.SYSTEM.label },
        { value: "training", label: ADMIN_CATEGORY_META.TRAINING.label },
      ];

  const getEvents = (day) =>
    events
      .filter(
        (item) =>
          item.date === day &&
          (filter === "all" || item.category === filter.toUpperCase()),
      )
      .sort((left, right) => {
        const leftTime = left.time || "99:99";
        const rightTime = right.time || "99:99";
        return leftTime.localeCompare(rightTime);
      });

  const triggerReload = () => setReloadKey((current) => current + 1);

  const createDefaultDate = useMemo(() => {
    if (!selectedDay) return todayIso;
    const selectedDateValue = `${currentYear}-${pad2(currentMonth)}-${pad2(selectedDay)}`;
    return selectedDateValue >= todayIso ? selectedDateValue : todayIso;
  }, [currentMonth, currentYear, selectedDay, todayIso]);

  const clearSelection = () => {
    setSelectedDay(null);
    setSelectedEvent(null);
    setDetailsOpen(false);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    if (
      selectedEvent &&
      value !== "all" &&
      selectedEvent.category !== value.toUpperCase()
    ) {
      setSelectedEvent(null);
    }
    setSidebarOpen(false);
  };

  const handleEventSaved = (savedEvent) => {
    const parsed = parseIsoDate(savedEvent?.event_date);
    if (parsed) {
      setSelectedDay(parsed.day);
      setSelectedEvent(null);
      setCurrentYear(parsed.year);
      setCurrentMonth(parsed.month);
    } else {
      clearSelection();
    }
    triggerReload();
  };

  const prevMonth = () => {
    clearSelection();
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
  };

  const nextMonth = () => {
    clearSelection();
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
  };

  // Details panel
  const detailsPanel = (
    <div className="space-y-3">
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : selectedEvent ? (
        <>
          <div
            className={`space-y-2 rounded-xl p-4 text-white ${getEventColor(selectedEvent.category, isDoctor())}`}
          >
            <p className="font-semibold">{selectedEvent.title}</p>
            {selectedEvent.time && <p className="text-sm">{selectedEvent.time}</p>}
            <p className="text-xs opacity-90">{formatFullDate(selectedEvent.dateValue)}</p>
            <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-xs">
              {getCategoryLabel(selectedEvent.category, isDoctor())}
            </span>
          </div>
          {isDoctor() ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/appointments")}
                className="w-full rounded-xl bg-teal-500 py-2 text-sm text-white hover:bg-teal-600"
              >
                Open appointment
              </button>
              <button
                onClick={() => navigate(`/patients/${selectedEvent.patient_id}`)}
                className="w-full rounded-xl bg-gray-100 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                View patient
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingEvent(selectedEvent); setModal("edit"); }}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gray-100 py-2 text-sm text-teal-600 hover:bg-teal-50"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => setDeleteCandidate(selectedEvent)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gray-100 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </>
      ) : selectedDay ? (
        <>
          <p className="text-xs sm:text-sm text-gray-500">
            {formatSelectedDate(currentYear, currentMonth, selectedDay)}
          </p>
          {getEvents(selectedDay).length > 0 ? (
            getEvents(selectedDay).map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="cursor-pointer rounded-xl bg-gray-50 p-3 hover:bg-gray-100"
              >
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-gray-400">
                  {event.time || "No time set"} -{" "}
                  {getCategoryLabel(event.category, isDoctor())}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No items</p>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">Select a day</p>
      )}
    </div>
  );

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Mobile header: month navigation and actions */}
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-lg text-gray-400 hover:text-teal-500">
            {"<"}
          </button>
          <h3 className="text-sm font-semibold">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h3>
          <button onClick={nextMonth} className="text-lg text-gray-400 hover:text-teal-500">
            {">"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin() && (
            <button
              onClick={() => { setEditingEvent(null); setModal("create"); }}
              className="rounded-xl bg-teal-500 px-3 py-1.5 text-xs text-white hover:bg-teal-600"
            >
              + New Event
            </button>
          )}
      {/* Mobile filter accordion trigger */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-1 rounded-xl border bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            Filters {sidebarOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Mobile filter accordion */}
      {sidebarOpen && (
        <div className="mb-3 rounded-2xl border bg-white p-4 lg:hidden">
          <div className="flex flex-wrap gap-2 text-sm">
            {activeFilters.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                  filter === option.value
                    ? "bg-teal-50 text-teal-600 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {!isDoctor() && (
            <div className="mt-3 flex flex-wrap gap-3 border-t pt-3">
              {Object.entries(ADMIN_CATEGORY_META).map(([category, meta]) => (
                <div key={category} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                  <span>{meta.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_210px] md:gap-5 lg:grid-cols-[minmax(160px,200px)_1fr_210px] lg:gap-6">

        {/* Left sidebar */}
        <div className="hidden lg:block space-y-5 rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="text-lg text-gray-400 hover:text-teal-500">
              {"<"}
            </button>
            <h3 className="text-center text-sm font-semibold">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="text-lg text-gray-400 hover:text-teal-500">
              {">"}
            </button>
          </div>

          {isAdmin() && (
            <button
              onClick={() => { setEditingEvent(null); setModal("create"); }}
              className="w-full rounded-xl bg-teal-500 py-2.5 text-sm text-white hover:bg-teal-600"
            >
              + New Event
            </button>
          )}

          <div className="space-y-2 text-sm">
            {activeFilters.map((option) => (
              <div
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                className={`cursor-pointer rounded-lg px-3 py-2 transition ${
                  filter === option.value
                    ? "bg-teal-50 text-teal-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>

          {!isDoctor() && (
            <div className="border-t pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Color Legend
              </p>
              <div className="space-y-2">
                {Object.entries(ADMIN_CATEGORY_META).map(([category, meta]) => (
                  <div key={category} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                    <span>{meta.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar grid */}
        <div className="rounded-2xl border bg-white p-3 sm:p-5">
          {!loading && filteredMonthCount === 0 && (
            <div className="mb-3 rounded-xl border border-dashed bg-gray-50 px-3 py-2 text-xs text-gray-500">
              No matching events for {MONTH_NAMES[currentMonth - 1]} {currentYear}.
            </div>
          )}
          <div className="mb-2 grid grid-cols-7 px-1 sm:px-2 text-xs text-gray-400">
            {[
              { full: "Sun", short: "Su" },
              { full: "Mon", short: "Mo" },
              { full: "Tue", short: "Tu" },
              { full: "Wed", short: "We" },
              { full: "Thu", short: "Th" },
              { full: "Fri", short: "Fr" },
              { full: "Sat", short: "Sa" },
            ].map((day) => (
              <div key={day.full}>
                <span className="hidden sm:inline">{day.full}</span>
                <span className="sm:hidden">{day.short}</span>
              </div>
            ))}
          </div>
          {loading ? (
            <div className="flex h-64 sm:h-[28rem] items-center justify-center rounded-xl border">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-teal-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 overflow-hidden rounded-xl border">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[3.5rem] sm:min-h-[5rem] lg:min-h-[7rem] border bg-gray-50/40"
                />
              ))}
              {days.map((day) => {
                const dayEvents = getEvents(day);
                const previewEvents = dayEvents.slice(0, 2);
                const hiddenCount = dayEvents.length - previewEvents.length;

                return (
                  <div
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedEvent(null);
                      setDetailsOpen(true);
                    }}
                    className={`min-h-[3.5rem] sm:min-h-[5rem] lg:min-h-[7rem] cursor-pointer border p-1 sm:p-2 transition-all ${
                      selectedDay === day
                        ? "bg-teal-100 ring-2 ring-inset ring-teal-400"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <p
                      className={`inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs ${
                        selectedDay === day
                          ? "bg-teal-500 text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {day}
                    </p>
                    {/* Events are hidden on the smallest screens */}
                    <div className="mt-1 hidden sm:block space-y-1">
                      {previewEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(nativeEvent) => {
                            nativeEvent.stopPropagation();
                            setSelectedEvent(event);
                            setSelectedDay(day);
                            setDetailsOpen(true);
                          }}
                          className={`truncate rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-[11px] text-white shadow-sm ${getEventColor(event.category, isDoctor())}`}
                        >
                          {event.time ? `${event.time} ` : ""}
                          {event.title}
                        </div>
                      ))}
                      {hiddenCount > 0 && (
                        <p className="px-1 text-[10px] font-medium text-gray-500">
                          +{hiddenCount} more
                        </p>
                      )}
                    </div>
                    {/* On mobile, show dots only when events exist */}
                    {dayEvents.length > 0 && (
                      <div className="mt-1 flex gap-0.5 sm:hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className={`h-1.5 w-1.5 rounded-full ${getEventColor(event.category, isDoctor())}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-gray-400">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right details panel */}
        <div className="hidden lg:block rounded-2xl border bg-white p-5">
          <h3 className="mb-4 font-medium">
            {isDoctor() ? "Appointments" : "Schedule Details"}
          </h3>
          {detailsPanel}
        </div>
      </div>

      {/* Mobile details panel appears from the bottom when a day is selected */}
      {detailsOpen && (selectedDay || selectedEvent) && (
        <div className="mt-3 lg:hidden rounded-2xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {isDoctor() ? "Appointments" : "Schedule Details"}
            </h3>
            <button
              onClick={() => { clearSelection(); setDetailsOpen(false); }}
              className="rounded-lg p-1 hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
          {detailsPanel}
        </div>
      )}

      {modal && !isDoctor() && (
        <EventModal
          onClose={() => { setModal(null); setEditingEvent(null); }}
          onSaved={handleEventSaved}
          editData={modal === "edit" ? editingEvent : null}
          defaultDate={createDefaultDate}
        />
      )}

      {deleteCandidate && (
        <DeleteConfirmModal
          eventTitle={deleteCandidate.title}
          deleting={deleting}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              await api.delete(`/calendar/${deleteCandidate.id}`);
              if (selectedEvent?.id === deleteCandidate.id) {
                setSelectedEvent(null);
              }
              setDeleteCandidate(null);
              triggerReload();
            } catch (err) {
              console.error("Failed to delete event:", err);
              setError(err.message || "Failed to delete event");
            } finally {
              setDeleting(false);
            }
          }}
        />
      )}
    </>
  );
}
