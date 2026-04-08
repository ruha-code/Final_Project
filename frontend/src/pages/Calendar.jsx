import { useState } from "react";

const events = [
  {
    id: 1,
    title: "Department Meeting",
    date: 11,
    time: "08:30 - 09:30",
    category: "admin",
  },
  {
    id: 2,
    title: "System Maintenance",
    date: 12,
    time: "10:00 - 11:30",
    category: "system",
  },
  {
    id: 3,
    title: "Workshop",
    date: 14,
    time: "08:00 - 09:00",
    category: "training",
  },
  {
    id: 4,
    title: "Radiology Check",
    date: 16,
    time: "08:00 - 10:00",
    category: "system",
  },
  {
    id: 5,
    title: "KPI Review",
    date: 27,
    time: "15:00 - 16:30",
    category: "admin",
  },
];

const categoryColors = {
  admin: "bg-teal-500",
  system: "bg-green-300",
  training: "bg-gray-400",
};

function Calendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");

  const today = new Date().getDate();

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getEvents = (day) => {
    return events.filter(
      (e) => e.date === day && (filter === "all" || e.category === filter),
    );
  };

  return (
    <div className="grid grid-cols-6 gap-6">
      {/* LEFT PANEL */}
      <div className="bg-white p-5 rounded-2xl border space-y-5">
        <h3 className="font-semibold text-lg">March 2025</h3>

        <div>
          <p className="text-xs text-gray-400">Total schedules</p>
          <p className="text-2xl font-semibold">{events.length}</p>
        </div>

        {/* FILTER */}
        <div className="space-y-3 text-sm">
          {["all", "admin", "system", "training"].map((c) => (
            <div
              key={c}
              onClick={() => setFilter(c)}
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition ${
                filter === c ? "bg-teal-50 text-teal-600" : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-2 h-6 rounded ${
                  c === "all" ? "bg-gray-400" : categoryColors[c]
                }`}
              ></div>
              {c.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* CALENDAR */}
      <div className="col-span-4 bg-white p-5 rounded-2xl border">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">March 2025</h2>

          <div className="flex gap-2">
            <button className="px-3 py-1 bg-teal-500 text-white rounded-lg text-sm">
              Month
            </button>
            <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
              Week
            </button>
            <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
              Day
            </button>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-7 border rounded-xl overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div className="bg-teal-50 text-xs p-2 text-gray-500 font-medium">
              {d}
            </div>
          ))}

          {days.map((day) => (
            <div
              key={day}
              onClick={() => {
                setSelectedDay(day);
                setSelectedEvent(null);
              }}
              className={`h-28 border p-2 cursor-pointer transition relative
                ${day === today ? "bg-yellow-50" : ""}
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
                    className={`text-[10px] px-2 py-1 rounded text-white truncate cursor-pointer 
                      ${categoryColors[e.category]} hover:opacity-80`}
                  >
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-white p-5 rounded-2xl border">
        <h3 className="font-medium mb-4">Schedule Details</h3>

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
                  className="mb-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedEvent(e)}
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
  );
}

export default Calendar;
