import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Search, Filter, User, Activity, Calendar, Settings, Shield } from "lucide-react";

const ACTION_ICONS = {
  REGISTER: User,
  LOGIN: User,
  SETUP_PATIENT_PROFILE: User,
  SETUP_DOCTOR_PROFILE: User,
  SET_DOCTOR_SCHEDULE: Calendar,
  BOOK_APPOINTMENT: Calendar,
  CANCEL_APPOINTMENT: Calendar,
  COMPLETE_APPOINTMENT: Calendar,
  DEACTIVATE_USER: Shield,
  ACTIVATE_USER: Shield,
  VIEW_AUDIT_LOGS: Activity,
  VIEW_ANALYTICS: Activity,
};

const ACTION_COLORS = {
  REGISTER: "bg-green-100 text-green-600",
  LOGIN: "bg-blue-100 text-blue-600",
  SETUP_PATIENT_PROFILE: "bg-purple-100 text-purple-600",
  SETUP_DOCTOR_PROFILE: "bg-purple-100 text-purple-600",
  SET_DOCTOR_SCHEDULE: "bg-teal-100 text-teal-600",
  BOOK_APPOINTMENT: "bg-teal-100 text-teal-600",
  CANCEL_APPOINTMENT: "bg-red-100 text-red-500",
  COMPLETE_APPOINTMENT: "bg-green-100 text-green-600",
  DEACTIVATE_USER: "bg-red-100 text-red-500",
  ACTIVATE_USER: "bg-green-100 text-green-600",
  VIEW_AUDIT_LOGS: "bg-gray-100 text-gray-600",
  VIEW_ANALYTICS: "bg-gray-100 text-gray-600",
};

const ACTION_LABELS = {
  REGISTER: "Registered",
  LOGIN: "Logged in",
  SETUP_PATIENT_PROFILE: "Set up patient profile",
  SETUP_DOCTOR_PROFILE: "Set up doctor profile",
  SET_DOCTOR_SCHEDULE: "Updated schedule",
  BOOK_APPOINTMENT: "Booked appointment",
  CANCEL_APPOINTMENT: "Cancelled appointment",
  COMPLETE_APPOINTMENT: "Completed appointment",
  DEACTIVATE_USER: "Deactivated user",
  ACTIVATE_USER: "Activated user",
  VIEW_AUDIT_LOGS: "Viewed audit logs",
  VIEW_ANALYTICS: "Viewed analytics",
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page);
        params.set("page_size", "50");
        if (actionFilter) params.set("action", actionFilter);
        if (dateFilter) params.set("start_date", dateFilter);
        
        const data = await api.get(`/audit/audit-logs?${params.toString()}`);
        setLogs(data.items || []);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, actionFilter, dateFilter]);

  const uniqueActions = [...new Set(logs.map((l) => l.action).filter(Boolean))];

  const filteredLogs = logs.filter((log) => {
    if (search && !log.action?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Audit Logs</h2>
        <p className="text-sm text-gray-400">System activity log</p>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border pl-10 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-white border px-4 py-2 rounded-xl text-sm"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>{ACTION_LABELS[action] || action}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="bg-white border px-4 py-2 rounded-xl text-sm"
        />
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
          No logs found
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Timestamp</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Action</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">User</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const Icon = ACTION_ICONS[log.action] || Activity;
                const color = ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600";
                return (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm">{formatDate(log.created_at)}</p>
                      <p className="text-xs text-gray-400">{formatTime(log.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${color}`}>
                        <Icon size={12} />
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      User #{log.user_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {page > 1 && (
        <button
          onClick={() => setPage(page - 1)}
          className="bg-white border px-4 py-2 rounded-xl text-sm"
        >
          Previous
        </button>
      )}
    </div>
  );
}