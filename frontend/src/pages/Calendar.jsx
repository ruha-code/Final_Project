import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, X } from "lucide-react";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const categoryColors = { ADMIN: "bg-teal-500", SYSTEM: "bg-green-400", TRAINING: "bg-gray-400" };

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
      const payload = { title: form.title, event_date, event_time: form.time || null, category: form.category };
      if (editData) await api.put(`/calendar/${editData.id}`, payload);
      else await api.post("/calendar", payload);
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save event:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[400px] space-y-5 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editData ? "Edit Event" : "Create Event"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200"><X size={18} /></button>
        </div>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" min="1" max={daysInMonth} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Day" className="rounded-xl bg-gray-100 px-4 py-2 text-sm" />
          <input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="HH:MM" className="rounded-xl bg-gray-100 px-4 py-2 text-sm" />
        </div>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm">
          <option value="ADMIN">ADMIN</option>
          <option value="SYSTEM">SYSTEM</option>
          <option value="TRAINING">TRAINING</option>
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-2 text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.title || !form.date} className="flex-1 rounded-xl bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-50">{saving ? "Saving..." : editData ? "Update" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const navigate = useNavigate();
  const { isAdmin, isDoctor } = useAuth();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isDoctor()) {
          const appointments = await api.get("/appointments/my");
          const doctorEvents = (appointments || []).map((item) => {
            const value = new Date(item.appointment_time);
            return {
              id: item.id,
              title: item.patient_name || "Patient",
              date: value.getDate(),
              time: value.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              category: item.status,
              patient_id: item.patient_id,
            };
          }).filter((item) => {
            const appointmentDate = new Date((appointments || []).find((entry) => entry.id === item.id)?.appointment_time);
            return appointmentDate.getMonth() + 1 === currentMonth && appointmentDate.getFullYear() === currentYear;
          });
          setEvents(doctorEvents);
          setError(null);
          return;
        }

        const data = await api.get(`/calendar?month=${currentMonth}&year=${currentYear}`);
        setEvents((data || []).map((item) => ({
          id: item.id,
          title: item.title,
          date: new Date(item.event_date).getDate(),
          time: item.event_time || "",
          category: item.category,
        })));
        setError(null);
      } catch (err) {
        setError("Failed to load calendar data");
      }
    };
    void fetchData();
  }, [currentMonth, currentYear, isDoctor, reloadKey]);

  const getEvents = (day) => events.filter((item) => item.date === day && (filter === "all" || item.category === filter.toUpperCase()));
  const triggerReload = () => setReloadKey((current) => current + 1);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
  };

  return (
    <>
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-[minmax(160px,200px)_1fr_210px] gap-6">
        <div className="space-y-5 rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="text-lg text-gray-400 hover:text-teal-500">{"<"}</button>
            <h3 className="text-center text-sm font-semibold">{MONTH_NAMES[currentMonth - 1]} {currentYear}</h3>
            <button onClick={nextMonth} className="text-lg text-gray-400 hover:text-teal-500">{">"}</button>
          </div>

          {isAdmin() && (
            <button onClick={() => { setEditingEvent(null); setModal("create"); }} className="w-full rounded-xl bg-teal-500 py-2.5 text-sm text-white hover:bg-teal-600">
              + New Event
            </button>
          )}

          <div className="space-y-2 text-sm">
            {(isDoctor() ? ["all", "scheduled", "ongoing", "completed", "cancelled"] : ["all", "admin", "system", "training"]).map((value) => (
              <div key={value} onClick={() => setFilter(value)} className={`cursor-pointer rounded-lg px-3 py-2 transition ${filter === value ? "bg-teal-50 text-teal-600" : "text-gray-600 hover:bg-gray-50"}`}>
                {value.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-2 grid grid-cols-7 px-2 text-xs text-gray-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 overflow-hidden rounded-xl border">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[7rem] border bg-gray-50/40" />
            ))}
            {days.map((day) => (
              <div key={day} onClick={() => { setSelectedDay(day); setSelectedEvent(null); }} className={`min-h-[7rem] cursor-pointer border p-2 transition-all ${selectedDay === day ? "bg-teal-50" : "hover:bg-gray-50"}`}>
                <p className="text-xs text-gray-400">{day}</p>
                <div className="mt-1 space-y-1">
                  {getEvents(day).slice(0, 3).map((event) => (
                    <div key={event.id} onClick={(nativeEvent) => { nativeEvent.stopPropagation(); setSelectedEvent(event); setSelectedDay(day); }} className={`truncate rounded-md px-2 py-1.5 text-[11px] text-white shadow-sm ${isDoctor() ? "bg-teal-500" : categoryColors[event.category] || "bg-gray-400"}`}>
                      {event.time ? `${event.time} ` : ""}{event.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h3 className="mb-4 font-medium">{isDoctor() ? "Appointments" : "Schedule Details"}</h3>
          {selectedEvent ? (
            <div className="space-y-3">
              <div className={`space-y-2 rounded-xl p-4 text-white ${isDoctor() ? "bg-teal-500" : categoryColors[selectedEvent.category] || "bg-gray-400"}`}>
                <p className="font-semibold">{selectedEvent.title}</p>
                {selectedEvent.time && <p className="text-sm">{selectedEvent.time}</p>}
                <p className="text-xs opacity-80">Day {selectedEvent.date}</p>
                <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-xs">{selectedEvent.category}</span>
              </div>

              {isDoctor() ? (
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate("/appointments")} className="w-full rounded-xl bg-teal-500 py-2 text-sm text-white hover:bg-teal-600">Open appointment</button>
                  <button onClick={() => navigate(`/patients/${selectedEvent.patient_id}`)} className="w-full rounded-xl bg-gray-100 py-2 text-sm text-gray-700 hover:bg-gray-200">View patient</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingEvent(selectedEvent); setModal("edit"); }} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gray-100 py-2 text-sm text-teal-600 hover:bg-teal-50"><Pencil size={14} /> Edit</button>
                  <button
                    onClick={async () => {
                      if (!window.confirm("Delete this event?")) return;
                      try {
                        await api.delete(`/calendar/${selectedEvent.id}`);
                        setSelectedEvent(null);
                        triggerReload();
                      } catch (err) {
                        console.error("Failed to delete event:", err);
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gray-100 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ) : selectedDay ? (
            <>
              <p className="mb-3 text-sm text-gray-400">Day {selectedDay}</p>
              {getEvents(selectedDay).length > 0 ? getEvents(selectedDay).map((event) => (
                <div key={event.id} onClick={() => setSelectedEvent(event)} className="mb-3 cursor-pointer rounded-xl bg-gray-50 p-3 hover:bg-gray-100">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-gray-400">{event.time || "No time set"}</p>
                </div>
              )) : <p className="text-sm text-gray-400">No items</p>}
            </>
          ) : (
            <p className="text-sm text-gray-400">Select a day</p>
          )}
        </div>
      </div>

      {modal && !isDoctor() && (
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
