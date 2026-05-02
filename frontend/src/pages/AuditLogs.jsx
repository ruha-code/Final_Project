import { useEffect, useMemo, useState } from "react";
import {
  Search,
  User,
  Activity,
  Calendar,
  Shield,
  Trash2,
} from "lucide-react";

import { api } from "../services/api";

const DEFAULT_PAGE_SIZE = 25;
const AUTO_REFRESH_INTERVAL_MS = 10000;

const ACTION_META = {
  REGISTER: { icon: User, color: "bg-green-100 text-green-700", label: "Registered" },
  LOGIN: { icon: User, color: "bg-blue-100 text-blue-700", label: "Logged in" },
  LOGOUT: { icon: User, color: "bg-gray-100 text-gray-700", label: "Logged out" },
  SETUP_PATIENT_PROFILE: {
    icon: User,
    color: "bg-purple-100 text-purple-700",
    label: "Created patient profile",
  },
  UPDATE_PATIENT_PROFILE: {
    icon: User,
    color: "bg-purple-100 text-purple-700",
    label: "Updated patient profile",
  },
  SETUP_DOCTOR_PROFILE: {
    icon: User,
    color: "bg-purple-100 text-purple-700",
    label: "Created doctor profile",
  },
  UPDATE_DOCTOR_PROFILE: {
    icon: User,
    color: "bg-purple-100 text-purple-700",
    label: "Updated doctor profile",
  },
  SET_DOCTOR_SCHEDULE: {
    icon: Calendar,
    color: "bg-teal-100 text-teal-700",
    label: "Updated doctor schedule",
  },
  BOOK_APPOINTMENT: {
    icon: Calendar,
    color: "bg-teal-100 text-teal-700",
    label: "Booked appointment",
  },
  CANCEL_APPOINTMENT: {
    icon: Calendar,
    color: "bg-red-100 text-red-700",
    label: "Cancelled appointment",
  },
  COMPLETE_APPOINTMENT: {
    icon: Calendar,
    color: "bg-green-100 text-green-700",
    label: "Completed appointment",
  },
  DEACTIVATE_USER: {
    icon: Shield,
    color: "bg-red-100 text-red-700",
    label: "Deactivated user",
  },
  ACTIVATE_USER: {
    icon: Shield,
    color: "bg-green-100 text-green-700",
    label: "Activated user",
  },
  DELETE_USER: {
    icon: Trash2,
    color: "bg-red-100 text-red-700",
    label: "Deleted user",
  },
  UPDATE_USER: {
    icon: User,
    color: "bg-blue-100 text-blue-700",
    label: "Updated user",
  },
  UPDATE_PATIENT: {
    icon: User,
    color: "bg-blue-100 text-blue-700",
    label: "Updated patient",
  },
  DELETE_PATIENT: {
    icon: Trash2,
    color: "bg-red-100 text-red-700",
    label: "Deleted patient",
  },
  UPDATE_DOCTOR: {
    icon: User,
    color: "bg-blue-100 text-blue-700",
    label: "Updated doctor",
  },
  DELETE_DOCTOR: {
    icon: Trash2,
    color: "bg-red-100 text-red-700",
    label: "Deleted doctor",
  },
  DELETE_APPOINTMENT: {
    icon: Trash2,
    color: "bg-red-100 text-red-700",
    label: "Deleted appointment",
  },
  VIEW_AUDIT_LOGS: {
    icon: Activity,
    color: "bg-gray-100 text-gray-700",
    label: "Viewed audit logs",
  },
  VIEW_ANALYTICS: {
    icon: Activity,
    color: "bg-gray-100 text-gray-700",
    label: "Viewed analytics",
  },
};

function humanizeAction(action) {
  if (!action) return "Unknown action";
  if (ACTION_META[action]?.label) return ACTION_META[action].label;
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// Мобильная карточка лога
function LogCard({ log }) {
  const effectiveAction = log.action_key || log.action;
  const Icon = ACTION_META[effectiveAction]?.icon || Activity;
  const color = ACTION_META[effectiveAction]?.color || "bg-gray-100 text-gray-700";
  const { date, time } = formatDateTime(log.created_at);
  const actorName =
    log.actor_name || (log.user_id ? `User #${log.user_id}` : "System");
  const actorMeta =
    log.actor_username
      ? `@${log.actor_username}`
      : log.actor_role || "";
  const targetLabel =
    log.target_label ||
    (log.entity_type && log.entity_id
      ? `${log.entity_type} #${log.entity_id}`
      : "-");

  return (
    <div className="flex flex-col gap-2 border-b p-4 last:border-none hover:bg-gray-50">
      {/* Действие + время */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${color}`}
        >
          <Icon size={12} />
          {log.action_label || humanizeAction(effectiveAction)}
        </span>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-800">{date}</p>
          <p className="text-xs text-gray-400">{time}</p>
        </div>
      </div>

      {/* Детали в сетке */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <p className="text-gray-400">Actor</p>
          <p className="truncate font-medium text-gray-700">{actorName}</p>
          {actorMeta && <p className="truncate text-gray-400">{actorMeta}</p>}
        </div>
        <div>
          <p className="text-gray-400">Target</p>
          <p className="truncate text-gray-700">{targetLabel}</p>
        </div>
        <div className="col-span-2 mt-1">
          <p className="text-gray-400">IP Address</p>
          <p className="font-mono text-gray-500">{log.ip_address || "Unknown"}</p>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const fetchLogs = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(DEFAULT_PAGE_SIZE));
        params.set(
          "timezone_offset_minutes",
          String(new Date().getTimezoneOffset()),
        );
        if (actionFilter) params.set("action", actionFilter);
        if (startDate) params.set("start_date", startDate);
        if (endDate) params.set("end_date", endDate);
        if (search) params.set("q", search);

        const data = await api.get(`/audit/audit-logs?${params.toString()}`);
        if (cancelled) return;
        setLogs(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number.isFinite(data?.total) ? data.total : 0);
        setPages(
          Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : 1,
        );
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to fetch audit logs");
        if (!silent) {
          setLogs([]);
          setTotal(0);
          setPages(1);
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };

    void fetchLogs();
    const intervalId = setInterval(() => {
      void fetchLogs({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [page, actionFilter, startDate, endDate, search]);

  useEffect(() => {
    if (page > pages) {
      setPage(pages);
    }
  }, [page, pages]);

  const actionOptions = useMemo(() => {
    const keys = new Set([
      ...Object.keys(ACTION_META),
      ...logs.map((log) => log.action_key || log.action),
    ]);
    return [...keys]
      .filter(Boolean)
      .sort((first, second) =>
        humanizeAction(first).localeCompare(humanizeAction(second)),
      )
      .map((action) => ({
        value: action,
        label: humanizeAction(action),
      }));
  }, [logs]);

  const clearFilters = () => {
    setPage(1);
    setActionFilter("");
    setStartDate("");
    setEndDate("");
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">

      {/* Заголовок + счётчик */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Audit Logs</h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Review security and activity events with consistent actor and target context.
          </p>
        </div>
        <div className="self-start sm:self-auto rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-gray-600">
          Total records:{" "}
          <span className="font-semibold text-gray-800">{total}</span>
        </div>
      </div>

      {/* Фильтры: колонка → 2 колонки → 5 колонок */}
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 md:grid-cols-5">
        {/* Поиск — на sm col-span-2, на md col-span-2 из 5 */}
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, actor, or IP..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-xl border bg-white py-2 pl-10 pr-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm"
        >
          <option value="">All actions</option>
          {actionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(event) => {
            setStartDate(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm"
          aria-label="Start date"
        />

        <input
          type="date"
          value={endDate}
          onChange={(event) => {
            setEndDate(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm"
          aria-label="End date"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl border bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Clear filters
        </button>
      </div>

      {/* Контент */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 text-xs sm:text-sm text-red-600">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 sm:p-10 text-center text-xs sm:text-sm text-gray-400">
          No logs found for the selected filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">

          {/* Таблица — только md+ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const effectiveAction = log.action_key || log.action;
                  const Icon = ACTION_META[effectiveAction]?.icon || Activity;
                  const color =
                    ACTION_META[effectiveAction]?.color ||
                    "bg-gray-100 text-gray-700";
                  const { date, time } = formatDateTime(log.created_at);
                  const actorName =
                    log.actor_name ||
                    (log.user_id ? `User #${log.user_id}` : "System");
                  const actorMeta =
                    log.actor_username
                      ? `@${log.actor_username}`
                      : log.actor_role || "";
                  const targetLabel =
                    log.target_label ||
                    (log.entity_type && log.entity_id
                      ? `${log.entity_type} #${log.entity_id}`
                      : "-");

                  return (
                    <tr
                      key={log.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{date}</p>
                        <p className="text-xs text-gray-400">{time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${color}`}
                        >
                          <Icon size={12} />
                          {log.action_label || humanizeAction(effectiveAction)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{actorName}</p>
                        {actorMeta && (
                          <p className="text-xs text-gray-400">{actorMeta}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {targetLabel}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.ip_address || "Unknown"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Карточки — только до md */}
          <div className="md:hidden">
            {logs.map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>
        </div>
      )}

      {/* Пагинация */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          Page {page} of {pages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
            className="flex-1 sm:flex-none rounded-xl border bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pages, current + 1))}
            disabled={page >= pages || loading}
            className="flex-1 sm:flex-none rounded-xl border bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
