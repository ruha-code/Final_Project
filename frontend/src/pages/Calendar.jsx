import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const categoryColors = {
  ADMIN: "bg-teal-500",
  SYSTEM: "bg-green-400",
  TRAINING: "bg-gray-400",
};

function Calendar() {
  const { isAdmin } = useAuth();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", category: "ADMIN" });
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

  const getEvents = (day) =>
    events.filter((e) => e.date === day && (filter === "all" || e.category === filter.toUpperCase()));

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    const day = String(newEvent.date).padStart(2, "0");
    const month = String(currentMonth).padStart(2, "0");
    const event_date = `${currentYear}-${month}-${day}`;

    try {
      await api.post("/calendar", {
        title: newEvent.title,
        event_date,
        event_time: newEvent.time || null,
        category: newEvent.category,
      });
      setReloadKey((current) => current + 1);
    } catch (err) {
      console.error(err);
    }

    setShowModal(false);
    setNewEvent({ title: "", date: "", time: "", category: "ADMIN" });
  };

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
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
              onClick={() => setShowModal(true)}
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
            <div className="bg-teal-500 text-white p-4 rounded-xl space-y-2">
              <p className="font-semibold">{selectedEvent.title}</p>
              <p className="text-sm">{selectedEvent.time}</p>
              <p className="text-xs">Day {selectedEvent.date}</p>
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
                    <p className="text-xs text-gray-400">{e.time}</p>
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

      {/* MODAL */}
      {isAdmin() && showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-2xl shadow-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold">Create Event</h2>
            <input
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full bg-gray-100 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Day (1-31)"
                type="number"
                min="1"
                max={daysInMonth}
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
              />
              <input
                placeholder="Time (HH:MM)"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
              />
            </div>
            <select
              value={newEvent.category}
              onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              className="w-full bg-gray-100 px-4 py-2 rounded-xl text-sm"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="TRAINING">TRAINING</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2 rounded-xl text-sm">
                Cancel
              </button>
              <button onClick={handleAddEvent} className="flex-1 bg-teal-500 text-white py-2 rounded-xl text-sm">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Calendar;
