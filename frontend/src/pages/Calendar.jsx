import { useState } from "react";

const initialEvents = [
  {
    id: 1,
    title: "Department Meeting",
    date: 11,
    time: "08:30 - 09:30",
    category: "admin",
  },
];

const categoryColors = {
  admin: "bg-teal-500",
  system: "bg-green-400",
  training: "bg-gray-400",
};

function Calendar() {
  const [events, setEvents] = useState(initialEvents);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    category: "admin",
  });

  const today = new Date().getDate();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getEvents = (day) => {
    return events.filter(
      (e) => e.date === day && (filter === "all" || e.category === filter),
    );
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    setEvents([
      ...events,
      {
        ...newEvent,
        id: Date.now(),
        date: Number(newEvent.date),
      },
    ]);

    setShowModal(false);
    setNewEvent({ title: "", date: "", time: "", category: "admin" });
  };

  return (
    <>
      <div className="grid grid-cols-6 gap-6">
        {/* LEFT */}
        <div className="bg-white p-5 rounded-2xl border space-y-5">
          <h3 className="font-semibold text-lg">March 2026</h3>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-teal-500 text-white py-2.5 rounded-xl text-sm hover:bg-teal-600 transition"
          >
            + New Event
          </button>

          <div className="space-y-2 text-sm">
            {["all", "admin", "system", "training"].map((c) => (
              <div
                key={c}
                onClick={() => setFilter(c)}
                className={`cursor-pointer px-3 py-2 rounded-lg transition ${
                  filter === c
                    ? "bg-teal-50 text-teal-600"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                {c.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* CALENDAR */}
        <div className="col-span-4 bg-white p-5 rounded-2xl border">
          {/* DAYS HEADER */}
          <div className="grid grid-cols-7 text-xs text-gray-400 mb-2 px-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* GRID */}
          <div className="grid grid-cols-7 border rounded-xl overflow-hidden">
            {days.map((day) => (
              <div
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setSelectedEvent(null);
                }}
                className={`h-28 border p-2 cursor-pointer transition-all
                  ${day === today ? "bg-yellow-50 border-yellow-200" : ""}
                  ${selectedDay === day ? "bg-teal-50" : "hover:bg-gray-50"}
                `}
              >
                <p className="text-xs text-gray-400">{day}</p>

                <div className="mt-1 space-y-1">
                  {getEvents(day).map((e) => (
                    <div
                      key={e.id}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelectedEvent(e);
                        setSelectedDay(day);
                      }}
                      className={`text-[11px] px-2 py-1.5 rounded-md text-white truncate
                        shadow-sm hover:scale-[1.02] hover:shadow cursor-pointer
                        ${categoryColors[e.category]}
                      `}
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
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-2xl shadow-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold">Create Event</h2>

            <input
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className="w-full bg-gray-100 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Day"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
              />

              <input
                placeholder="Time"
                value={newEvent.time}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, time: e.target.value })
                }
                className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
              />
            </div>

            <button
              onClick={handleAddEvent}
              className="w-full bg-teal-500 text-white py-2 rounded-xl"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Calendar;
