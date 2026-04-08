import { useState } from "react";

const initialData = [
  {
    id: 1,
    name: "Erica Smith",
    phone: "+7 777 123 4567",
    doctor: "Dr. Nina",
    type: "Consultation",
    date: "12 March",
    time: "08:30 - 09:00",
    status: "Completed",
  },
  {
    id: 2,
    name: "John Doe",
    phone: "+7 701 555 8899",
    doctor: "Dr. Alex",
    type: "Follow-up",
    date: "13 March",
    time: "09:00 - 09:30",
    status: "Ongoing",
  },
  {
    id: 3,
    name: "Petya Smith",
    phone: "+7 705 333 1122",
    doctor: "Dr. Amanda",
    type: "Surgery",
    date: "14 March",
    time: "10:00 - 11:30",
    status: "Canceled",
  },
];

function StatusBadge({ status }) {
  const styles = {
    Completed: "text-green-600 bg-green-50",
    Ongoing: "text-blue-600 bg-blue-50",
    Scheduled: "text-purple-600 bg-purple-50",
    Canceled: "text-red-500 bg-red-50",
  };

  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-md font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({ title, value, change, desc, color }) {
  return (
    <div
      className="bg-white rounded-xl border px-4 py-3 
                    hover:shadow-md hover:-translate-y-1 
                    transition-all duration-200"
    >
      <p className="text-xs text-gray-400">{title}</p>

      <div className="flex items-end justify-between mt-1">
        <h3 className="text-xl font-semibold">{value}</h3>
        <span className={`text-xs font-medium ${color}`}>{change}</span>
      </div>

      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}

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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Appointments</h2>
            <p className="text-sm text-gray-400">Manage all appointments</p>
          </div>

          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border px-4 py-2 rounded-xl text-sm outline-none 
                       focus:ring-2 focus:ring-teal-400 transition"
          />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            title="Today"
            value="52"
            change="+2.45%"
            desc="Appointments"
            color="text-green-500"
          />
          <StatCard
            title="Completed"
            value="28"
            change="+0.5%"
            desc="Finished"
            color="text-green-500"
          />
          <StatCard
            title="Ongoing"
            value="18"
            change="-0.25%"
            desc="In progress"
            color="text-red-400"
          />
          <StatCard
            title="Canceled"
            value="6"
            change="+1.3%"
            desc="Missed"
            color="text-red-400"
          />
        </div>

        {/* FILTER */}
        <div className="flex gap-2">
          {["All", "Completed", "Ongoing", "Scheduled", "Canceled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filter === f
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-white border text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* HEADER */}
          <div className="grid grid-cols-6 px-6 py-3 text-xs text-gray-400 border-b">
            <span>Patient</span>
            <span>Phone</span>
            <span>Doctor</span>
            <span>Type</span>
            <span>Date</span>
            <span>Status</span>
          </div>

          {/* ROWS */}
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-6 px-6 py-4 items-center 
                         hover:bg-gray-50 hover:shadow-sm 
                         transition-all duration-200 cursor-pointer 
                         border-b last:border-none"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 
                                flex items-center justify-center font-semibold"
                >
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>

              <span className="text-gray-500 text-sm">{item.phone}</span>
              <span className="text-gray-500 text-sm">{item.doctor}</span>
              <span className="text-gray-500 text-sm">{item.type}</span>
              <span className="text-gray-500 text-sm">{item.date}</span>

              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Appointments;
