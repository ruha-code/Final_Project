import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
  COMPLETED: "text-green-600 bg-green-50",
  ONGOING: "text-blue-600 bg-blue-50",
  SCHEDULED: "text-purple-600 bg-purple-50",
  CANCELLED: "text-red-500 bg-red-50",
};

const STATUS_LABELS = {
  COMPLETED: "Completed",
  ONGOING: "Ongoing",
  SCHEDULED: "Scheduled",
  CANCELLED: "Canceled",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-md font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-500"}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function StatCard({ title, value, change, desc, color }) {
  return (
    <div className="bg-white rounded-xl border px-4 py-3 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <p className="text-xs text-gray-400">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <h3 className="text-xl font-semibold">{value}</h3>
        <span className={`text-xs font-medium ${color}`}>{change}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

function Appointments() {
  const { isAdmin, isDoctor } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        let data;
        if (isAdmin() || isDoctor()) {
          data = await api.get("/appointments/admin/all?page=1&page_size=100");
          setAppointments(data.items || []);
        } else {
          data = await api.get("/appointments/my");
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [isAdmin, isDoctor]);

  const today = new Date().toDateString();

  const todayCount = appointments.filter(
    (a) => new Date(a.appointment_time).toDateString() === today,
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "COMPLETED",
  ).length;
  const ongoingCount = appointments.filter(
    (a) => a.status === "ONGOING",
  ).length;
  const cancelledCount = appointments.filter(
    (a) => a.status === "CANCELLED",
  ).length;

  const filtered = appointments.filter((item) => {
    const matchFilter =
      filter === "All"
        ? true
        : item.status === filter.toUpperCase().replace("CANCELED", "CANCELLED");
    const matchSearch = item.patient_name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Appointments</h2>
            <p className="text-sm text-gray-400">
              {isAdmin() || isDoctor() ? "Manage all appointments" : "View your appointments"}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 transition"
          />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            title="Today"
            value={todayCount}
            change=""
            desc="Appointments"
            color="text-green-500"
          />
          <StatCard
            title="Completed"
            value={completedCount}
            change=""
            desc="Finished"
            color="text-green-500"
          />
          <StatCard
            title="Ongoing"
            value={ongoingCount}
            change=""
            desc="In progress"
            color="text-blue-500"
          />
          <StatCard
            title="Canceled"
            value={cancelledCount}
            change=""
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
          <div className="grid grid-cols-6 px-6 py-3 text-xs text-gray-400 border-b">
            <span>Patient</span>
            <span>Doctor</span>
            <span>Type</span>
            <span>Date</span>
            <span>Time</span>
            <span>Status</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No appointments found
            </div>
          ) : (
            filtered.map((item) => {
              const { date, time } = formatDateTime(item.appointment_time);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-6 px-6 py-4 items-center hover:bg-gray-50 transition-all duration-200 border-b last:border-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-semibold">
                      {item.patient_name?.charAt(0) || "?"}
                    </div>
                    <p className="font-medium">{item.patient_name}</p>
                  </div>

                  <span className="text-gray-500 text-sm">
                    {item.doctor_name}
                  </span>
                  <span className="text-gray-500 text-sm capitalize">
                    {item.appointment_type?.toLowerCase()}
                  </span>
                  <span className="text-gray-500 text-sm">{date}</span>
                  <span className="text-gray-500 text-sm">{time}</span>
                  <StatusBadge status={item.status} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Appointments;
