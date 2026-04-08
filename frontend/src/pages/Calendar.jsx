import { useState } from "react";

const events = [
  {
    id: 1,
    title: "Team Meeting",
    date: 14,
    time: "09:00 - 10:00",
    color: "bg-teal-500",
  },
  {
    id: 2,
    title: "Workshop",
    date: 14,
    time: "13:00 - 15:00",
    color: "bg-gray-300",
  },
  {
    id: 3,
    title: "Radiology Check",
    date: 16,
    time: "08:00 - 10:00",
    color: "bg-green-200",
  },
];

function Calendar() {
  const [selectedDay, setSelectedDay] = useState(null);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getEvents = (day) => {
    return events.filter((e) => e.date === day);
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* CALENDAR */}
      <div className="col-span-3 bg-white p-6 rounded-2xl border">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">March 2025</h2>

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
            <div className="bg-gray-50 text-xs p-2 text-gray-400">{d}</div>
          ))}

          {days.map((day) => (
            <div
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`h-28 border p-2 cursor-pointer hover:bg-gray-50 transition ${
                selectedDay === day ? "bg-teal-50" : ""
              }`}
            >
              <p className="text-xs text-gray-400">{day}</p>

              <div className="space-y-1 mt-1">
                {getEvents(day).map((e) => (
                  <div
                    key={e.id}
                    className={`text-[10px] text-white px-2 py-1 rounded ${e.color}`}
                  >
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILS PANEL */}
      <div className="bg-white p-5 rounded-2xl border">
        <h3 className="font-medium mb-4">Schedule Details</h3>

        {selectedDay ? (
          <>
            <p className="text-sm text-gray-400 mb-2">
              Selected Day: {selectedDay}
            </p>

            {getEvents(selectedDay).length > 0 ? (
              getEvents(selectedDay).map((e) => (
                <div className="mb-3 p-3 bg-gray-50 rounded-xl">
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
