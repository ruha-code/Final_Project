import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Search } from "lucide-react";

import { api } from "../services/api";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function getDateRange(days) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
}

function toDateInputValue(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPeriodLabel(startDate, endDate) {
  if (!startDate || !endDate) return "Select a date range";
  return `${DATE_FORMATTER.format(new Date(`${startDate}T00:00:00`))} - ${DATE_FORMATTER.format(new Date(`${endDate}T00:00:00`))}`;
}

function toTitleToken(token) {
  if (!token) return "";
  return token
    .split("-")
    .map((piece) => {
      if (!piece) return "";
      return piece.charAt(0).toUpperCase() + piece.slice(1).toLowerCase();
    })
    .join("-");
}

function normalizeDoctorName(value) {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Unknown doctor";
  if (/^Doctor\s*#\d+/i.test(raw)) return raw;

  const withoutPrefix = raw.replace(/^dr\.?\s*/i, "");
  const normalizedBody = withoutPrefix
    .split(" ")
    .map((token) => toTitleToken(token))
    .join(" ")
    .trim();

  if (!normalizedBody) return "Unknown doctor";
  return `Dr. ${normalizedBody}`;
}

function formatPercent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function getDefaultOverview() {
  return {
    summary: {
      total_appointments: 0,
      completed: 0,
      cancelled: 0,
      scheduled: 0,
      ongoing: 0,
      completion_rate: 0,
      cancellation_rate: 0,
      total_doctors: 0,
      active_doctors: 0,
      inactive_doctors: 0,
      available_doctors: 0,
      overloaded_doctors: 0,
    },
    trend: [],
    trend_granularity: "day",
    trend_label: "Daily trend",
    departments: [],
  };
}

function SectionCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MetricCell({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 sm:hidden">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-2 text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-slate-600">Total: {formatCompactNumber(point.total)}</p>
      <p className="text-slate-600">Completed: {formatCompactNumber(point.completed)}</p>
      <p className="text-slate-600">Scheduled: {formatCompactNumber(point.scheduled)}</p>
      <p className="text-slate-600">Cancelled: {formatCompactNumber(point.cancelled)}</p>
    </div>
  );
}

function FilterPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function Analytics() {
  const presets = useMemo(
    () => ({
      last7: getDateRange(7),
      last30: getDateRange(30),
      last90: getDateRange(90),
    }),
    [],
  );
  const defaultRange = presets.last30;
  const [overview, setOverview] = useState(getDefaultOverview);
  const [doctorStats, setDoctorStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorView, setDoctorView] = useState("attention");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const deferredDoctorSearch = useDeferredValue(doctorSearch.trim().toLowerCase());
  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const dateRangeMissing = Boolean(!startDate || !endDate);

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      if (dateRangeInvalid) {
        setOverview(getDefaultOverview());
        setDoctorStats([]);
        setLoading(false);
        setError("Start date must be earlier than or equal to end date.");
        return;
      }

      if (dateRangeMissing) {
        setOverview(getDefaultOverview());
        setDoctorStats([]);
        setLoading(false);
        setError("Select both start and end dates.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("start_date", startDate);
        params.set("end_date", endDate);
        params.set("timezone_offset_minutes", String(new Date().getTimezoneOffset()));

        const suffix = `?${params.toString()}`;
        const [overviewData, stats] = await Promise.all([
          api.get(`/analytics/overview${suffix}`),
          api.get(`/analytics/doctors${suffix}`),
        ]);

        if (cancelled) return;

        setOverview(overviewData || getDefaultOverview());
        setDoctorStats(
          Array.isArray(stats)
            ? stats.map((item) => {
                const total = Number(item.total) || 0;
                const completed = Number(item.completed) || 0;
                const cancelled = Number(item.cancelled) || 0;
                const scheduled = Number(item.scheduled) || 0;
                const ongoing = Number(item.ongoing) || 0;

                return {
                  ...item,
                  total,
                  completed,
                  cancelled,
                  scheduled,
                  ongoing,
                  pending: Number(item.pending) || 0,
                  completion_rate: Number(item.completion_rate) || 0,
                  cancellation_rate: total > 0 ? cancelled / total : 0,
                  doctor_name: normalizeDoctorName(
                    item.doctor_name || `Doctor #${item.doctor_id}`,
                  ),
                  department_name: item.department_name || "Unassigned",
                  is_available: Boolean(item.is_available),
                };
              })
            : [],
        );
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load analytics data");
        setOverview(getDefaultOverview());
        setDoctorStats([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [dateRangeInvalid, dateRangeMissing, endDate, startDate]);

  const periodLabel = useMemo(
    () => formatPeriodLabel(startDate, endDate),
    [endDate, startDate],
  );

  const summary = overview?.summary || getDefaultOverview().summary;
  const departments = useMemo(
    () => (Array.isArray(overview?.departments) ? overview.departments : []),
    [overview],
  );
  const trendData = useMemo(
    () => (Array.isArray(overview?.trend) ? overview.trend : []),
    [overview],
  );

  const departmentOptions = useMemo(() => {
    const names = new Set(departments.map((item) => item.department_name || "Unassigned"));
    return ["all", ...[...names].sort((left, right) => left.localeCompare(right))];
  }, [departments]);

  const filteredDoctors = useMemo(() => {
    return doctorStats.filter((doctor) => {
      if (
        departmentFilter !== "all" &&
        (doctor.department_name || "Unassigned") !== departmentFilter
      ) {
        return false;
      }

      if (!deferredDoctorSearch) return true;
      const haystack = [
        doctor.doctor_name,
        doctor.department_name,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(deferredDoctorSearch);
    });
  }, [deferredDoctorSearch, departmentFilter, doctorStats]);

  const doctorRows = useMemo(() => {
    const rows = [...filteredDoctors];

    if (doctorView === "top") {
      return rows
        .filter((doctor) => doctor.total > 0)
        .sort((left, right) => {
          if (right.completion_rate !== left.completion_rate) {
            return right.completion_rate - left.completion_rate;
          }
          if (right.total !== left.total) return right.total - left.total;
          return left.doctor_name.localeCompare(right.doctor_name);
        });
    }

    if (doctorView === "busiest") {
      return rows
        .filter((doctor) => doctor.total > 0)
        .sort((left, right) => {
          if (right.total !== left.total) return right.total - left.total;
          return left.doctor_name.localeCompare(right.doctor_name);
        });
    }

    if (doctorView === "inactive") {
      return rows
        .filter((doctor) => doctor.total === 0)
        .sort((left, right) => left.doctor_name.localeCompare(right.doctor_name));
    }

    return rows
      .filter((doctor) => doctor.total > 0)
      .sort((left, right) => {
        if (right.cancellation_rate !== left.cancellation_rate) {
          return right.cancellation_rate - left.cancellation_rate;
        }
        if (left.completion_rate !== right.completion_rate) {
          return left.completion_rate - right.completion_rate;
        }
        if (right.total !== left.total) return right.total - left.total;
        return left.doctor_name.localeCompare(right.doctor_name);
      });
  }, [doctorView, filteredDoctors]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-500">{periodLabel}</p>
            </div>
            <div className="inline-flex w-fit items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
              {overview?.trend_label === "Monthly trend" ? "Monthly view" : "Daily view"}
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap gap-2">
              <FilterPill
                active={startDate === presets.last7.start && endDate === presets.last7.end}
                onClick={() => {
                  setStartDate(presets.last7.start);
                  setEndDate(presets.last7.end);
                }}
              >
                Last 7 days
              </FilterPill>
              <FilterPill
                active={startDate === defaultRange.start && endDate === defaultRange.end}
                onClick={() => {
                  setStartDate(defaultRange.start);
                  setEndDate(defaultRange.end);
                }}
              >
                Last 30 days
              </FilterPill>
              <FilterPill
                active={startDate === presets.last90.start && endDate === presets.last90.end}
                onClick={() => {
                  setStartDate(presets.last90.start);
                  setEndDate(presets.last90.end);
                }}
              >
                Last 90 days
              </FilterPill>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                aria-label="Start date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                aria-label="End date"
              />
              <button
                type="button"
                onClick={() => {
                  setStartDate(defaultRange.start);
                  setEndDate(defaultRange.end);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Appointments"
              value={formatCompactNumber(summary.total_appointments)}
            />
            <StatCard
              title="Completion"
              value={formatPercent(summary.completion_rate)}
            />
            <StatCard
              title="Cancellation"
              value={formatPercent(summary.cancellation_rate)}
            />
            <StatCard
              title="Active Doctors"
              value={`${formatCompactNumber(summary.active_doctors)}/${formatCompactNumber(summary.total_doctors)}`}
            />
          </div>

          <SectionCard title="Trend">
              {trendData.length === 0 ? (
                <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                  No trend data available.
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={18}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        width={36}
                      />
                      <Tooltip content={<TrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#14b8a6"
                        fill="url(#trendTotal)"
                        strokeWidth={2.25}
                        name="Total"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#0f766e"
                        fillOpacity={0}
                        strokeWidth={1.75}
                        name="Completed"
                      />
                      <Area
                        type="monotone"
                        dataKey="cancelled"
                        stroke="#ef4444"
                        fillOpacity={0}
                        strokeWidth={1.75}
                        name="Cancelled"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

          <SectionCard title="Departments">
            {departments.length === 0 ? (
              <p className="text-sm text-slate-400">
                No department data.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {departments.slice(0, 8).map((department) => (
                  <div
                    key={`${department.department_name}-${department.department_id ?? "none"}`}
                    className="grid gap-3 py-3 sm:grid-cols-[minmax(180px,1fr)_100px_100px_100px] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {department.department_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatCompactNumber(department.active_doctors)}/
                        {formatCompactNumber(department.doctor_count)} active doctors
                      </p>
                    </div>
                    <MetricCell label="Appts" value={formatCompactNumber(department.total)} />
                    <MetricCell label="Done" value={formatPercent(department.completion_rate)} />
                    <MetricCell label="Cancel" value={formatPercent(department.cancellation_rate)} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Doctors"
            actions={
              <div className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                {formatCompactNumber(doctorRows.length)} shown
              </div>
            }
          >
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                <FilterPill active={doctorView === "attention"} onClick={() => setDoctorView("attention")}>
                  Needs attention
                </FilterPill>
                <FilterPill active={doctorView === "top"} onClick={() => setDoctorView("top")}>
                  Top performers
                </FilterPill>
                <FilterPill active={doctorView === "busiest"} onClick={() => setDoctorView("busiest")}>
                  Busiest
                </FilterPill>
                <FilterPill active={doctorView === "inactive"} onClick={() => setDoctorView("inactive")}>
                  Inactive
                </FilterPill>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative min-w-[240px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={doctorSearch}
                    onChange={(event) => setDoctorSearch(event.target.value)}
                    placeholder="Search doctor or department"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                >
                  {departmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All departments" : option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {doctorRows.length === 0 ? (
              <p className="text-sm text-slate-400">
                No doctors match the current filters.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="max-h-[560px] overflow-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Doctor</th>
                        <th className="px-4 py-3 font-medium">Department</th>
                        <th className="px-4 py-3 font-medium">Volume</th>
                        <th className="px-4 py-3 font-medium">Completion</th>
                        <th className="px-4 py-3 font-medium">Cancelled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {doctorRows.map((doctor) => {
                        const completedWidth =
                          doctor.total > 0
                            ? Math.max(6, Math.round(doctor.completion_rate * 100))
                            : 0;
                        return (
                          <tr key={doctor.doctor_id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-4 align-top">
                              <div className="min-w-[180px]">
                                <p className="text-sm font-semibold text-slate-900">
                                  {doctor.doctor_name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatCompactNumber(doctor.scheduled)} scheduled,{" "}
                                  {formatCompactNumber(doctor.ongoing)} ongoing
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-slate-600">
                              {doctor.department_name}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatCompactNumber(doctor.total)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatCompactNumber(doctor.completed)} completed
                              </p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="min-w-[170px]">
                                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                  <span className="font-semibold text-slate-900">
                                    {formatPercent(doctor.completion_rate)}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatCompactNumber(doctor.completed)}/
                                    {formatCompactNumber(doctor.total)}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100">
                                  <div
                                    className="h-2 rounded-full bg-teal-500"
                                    style={{ width: `${completedWidth}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatPercent(doctor.cancellation_rate)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatCompactNumber(doctor.cancelled)} cancelled
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
