import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Pencil, Trash2, X } from "lucide-react";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const categoryColors = {
  ADMIN: "bg-teal-500",
  SYSTEM: "bg-green-400",
  TRAINING: "bg-gray-400",
};

function EventModal({ onClose, onSaved, editData, currentYear, currentMonth, daysInMonth }) {
  const [form, setForm] = useState({
    title: editData?.title || "",
    date: editData?.date || "",
    time: editData?.time || "",
    category: editData?.category || "ADMIN",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    const day = String(form.date).padStart(2, "0");
    const month = String(currentMonth).padStart(2, "0");
    const event_date = `${currentYear}-${month}-${day}`;

    try {
      const payload = {
        title: form.title,
        event_date,
        event_time: form.time || null,
        category: form.category,
      };
      if (editData) {
        await api.put(`/calendar/${editData.id}`, payload);
      } else {
        await api.post("/calendar", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save event:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-2xl shadow-xl p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{editData ? "Edit Event" : "Create Event"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <input
          placeholder="Event title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-gray-100 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Day (1-31)"
            type="number"
            min="1"
            max={daysInMonth}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
          />
          <input
            placeholder="Time (HH:MM)"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
          />
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full bg-gray-100 px-4 py-2 rounded-xl text-sm"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="SYSTEM">SYSTEM</option>
          <option value="TRAINING">TRAINING</option>
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 py-2 rounded-xl text-sm">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title || !form.date}
            className="flex-1 bg-teal-500 text-white py-2 rounded-xl text-sm hover:bg-teal-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : editData ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Calendar() {
  const { isAdmin } = useAuth();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = now.getDate();
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === (now.getMonth() + 1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.get(`/calendar?month=${currentMonth}&year=${currentYear}`);
        const converted = data.map((e) => ({
          id: e.id,
          title: e.title,
          date: new Date(e.event_date).getDate(),
          time: e.event_time || "",
          category: e.category,
        }));
        setEvents(converted);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load calendar events");
      }
    };
    void fetchEvents();
  }, [currentMonth, currentYear, reloadKey]);

  const triggerReload = () => setReloadKey((k) => k + 1);

  const getEvents = (day) =>
    events.filter((e) => e.date === day && (filter === "all" || e.category === filter.toUpperCase()));

  const handleDelete = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/calendar/${eventId}`);
      setSelectedEvent(null);
      triggerReload();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setModal("edit");
  };

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}
      <div className="grid grid-cols-6 gap-6">
        {/* LEFT */}
        <div className="bg-white p-5 rounded-2xl border space-y-5">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="text-gray-400 hover:text-teal-500 text-lg">‹</button>
            <h3 className="font-semibold text-sm text-center">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="text-gray-400 hover:text-teal-500 text-lg">›</button>
          </div>

          {isAdmin() && (
            <button
              onClick={() => { setEditingEvent(null); setModal("create"); }}
              className="w-full bg-teal-500 text-white py-2.5 rounded-xl text-sm hover:bg-teal-600 transition"
            >
              + New Event
            </button>
          )}

          <div className="space-y-2 text-sm">
            {["all", "admin", "system", "training"].map((c) => (
              <div
                key={c}
                onClick={() => setFilter(c)}
                className={`cursor-pointer px-3 py-2 rounded-lg transition ${filter === c ? "bg-teal-50 text-teal-600" : "hover:bg-gray-50 text-gray-600"}`}
              >
                {c.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* CALENDAR */}
        <div className="col-span-4 bg-white p-5 rounded-2xl border">
          <div className="grid grid-cols-7 text-xs text-gray-400 mb-2 px-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border rounded-xl overflow-hidden">
            {days.map((day) => (
              <div
                key={day}
                onClick={() => { setSelectedDay(day); setSelectedEvent(null); }}
                className={`h-28 border p-2 cursor-pointer transition-all
                  ${isCurrentMonth && day === today ? "bg-yellow-50 border-yellow-200" : ""}
                  ${selectedDay === day ? "bg-teal-50" : "hover:bg-gray-50"}
                `}
              >
                <p className="text-xs text-gray-400">{day}</p>
                <div className="mt-1 space-y-1">
                  {getEvents(day).map((e) => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setSelectedDay(day); }}
                      className={`text-[11px] px-2 py-1.5 rounded-md text-white truncate shadow-sm hover:scale-[1.02] hover:shadow cursor-pointer ${categoryColors[e.category] || "bg-gray-400"}`}
                    >
                      {e.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white p-5 rounded-2xl border">
          <h3 className="mb-4 font-medium">Schedule Details</h3>
          {selectedEvent ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl space-y-2 ${categoryColors[selectedEvent.category] || "bg-gray-400"} text-white`}>
                <p className="font-semibold">{selectedEvent.title}</p>
                {selectedEvent.time && <p className="text-sm">{selectedEvent.time}</p>}
                <p className="text-xs opacity-80">Day {selectedEvent.date}</p>
                <span className="inline-block text-xs bg-white/20 px-2 py-0.5 rounded-md">
                  {selectedEvent.category}
                </span>
              </div>

              {isAdmin() && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(selectedEvent)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-teal-50 text-teal-600 rounded-xl text-sm transition"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEvent.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-red-50 text-red-500 rounded-xl text-sm transition"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ) : selectedDay ? (
            <>
              <p className="text-sm text-gray-400 mb-3">Day {selectedDay}</p>
              {getEvents(selectedDay).length > 0 ? (
                getEvents(selectedDay).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="mb-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                  >
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-gray-400">{e.time || "No time set"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No events</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Select a day</p>
          )}
        </div>
      </div>

      {modal && (
        <EventModal
          onClose={() => { setModal(null); setEditingEvent(null); }}
          onSaved={() => { triggerReload(); setSelectedEvent(null); }}
          editData={modal === "edit" ? editingEvent : null}
          currentYear={currentYear}
          currentMonth={currentMonth}
          daysInMonth={daysInMonth}
        />
      )}
    </>
  );
}

export default Calendar;
