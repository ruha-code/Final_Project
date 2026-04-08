import { useState } from "react";

const initialData = [
  {
    id: 1,
    name: "Erica Smith",
    doctor: "Dr. Nina",
    type: "Consultation",
    date: "12 March",
    status: "Completed",
  },
  {
    id: 2,
    name: "John Doe",
    doctor: "Dr. Alex",
    type: "Follow-up",
    date: "13 March",
    status: "Ongoing",
  },
  {
    id: 3,
    name: "Petya Smith",
    doctor: "Dr. Amanda",
    type: "Surgery",
    date: "14 March",
    status: "Canceled",
  },
  {
    id: 4,
    name: "Daniel Wong",
    doctor: "Dr. Nina",
    type: "Consultation",
    date: "15 March",
    status: "Completed",
  },
  {
    id: 5,
    name: "Sara Kim",
    doctor: "Dr. Alex",
    type: "Follow-up",
    date: "16 March",
    status: "Ongoing",
  },
  {
    id: 6,
    name: "Michael Brown",
    doctor: "Dr. Amanda",
    type: "Surgery",
    date: "17 March",
    status: "Completed",
  },
];

function Appointments() {
  const [appointments] = useState(initialData);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredData = appointments.filter((item) => {
    const matchFilter = filter === "All" ? true : item.status === filter;

    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Appointments</h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400"
          />

          <button className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600 transition">
            + New
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3">
        {["All", "Completed", "Ongoing", "Canceled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === f
                ? "bg-teal-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        {/* HEADER */}
        <div className="grid grid-cols-5 bg-gray-50 text-xs text-gray-500 px-6 py-3">
          <span>Patient</span>
          <span>Doctor</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {/* DATA */}
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-5 items-center px-6 py-4 border-t hover:bg-gray-50 transition"
            >
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500">{item.doctor}</span>
              <span className="text-gray-500">{item.type}</span>
              <span className="text-gray-500">{item.date}</span>

              <span
                className={`text-xs px-3 py-1 rounded-full w-fit ${
                  item.status === "Completed"
                    ? "bg-green-100 text-green-600"
                    : item.status === "Ongoing"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-red-100 text-red-500"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-400">
            No appointments found
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointments;
