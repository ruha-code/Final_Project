import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  Clock3,
} from "lucide-react";

import { api } from "../services/api";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white p-5">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="mt-1 text-2xl font-bold">{value}</h2>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {Icon && <Icon size={18} />}
      </div>
    </div>
  );
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

function formatPeriodLabel(startDate, endDate) {
  if (!startDate && !endDate) return "All time";

  const start = startDate ? DATE_FORMATTER.format(new Date(`${startDate}T00:00:00`)) : "Earliest";
  const end = endDate ? DATE_FORMATTER.format(new Date(`${endDate}T00:00:00`)) : "Today";
  return `${start} - ${end}`;
}

function shortenLabel(value, maxLength = 16) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}...`;
}

function PerformanceTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border bg-white p-3 text-xs shadow-sm">
      <p className="mb-2 text-sm font-semibold text-gray-800">{point.name}</p>
      <p className="text-gray-600">Completed: {point.completed}</p>
      <p className="text-gray-600">Cancelled: {point.cancelled}</p>
      <p className="text-gray-600">Pending: {point.pending}</p>
      <p className="mt-1 font-medium text-gray-700">Completion rate: {point.rate}%</p>
    </div>
  );
}

function getCompletionNote(doctor) {
  const rate = Math.round((doctor.completion_rate || 0) * 100);
  if (doctor.total === 0) return "No appointments in selected period";
  if (rate === 0) return "No completed appointments in selected period";
  return `${doctor.completed}/${doctor.total} appointments completed`;
}

export default function Analytics() {
  const [doctorStats, setDoctorStats] = useState([]);
  const [demand, setDemand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  useEffect(() => {
    const fetchAll = async () => {
      if (dateRangeInvalid) {
        setLoading(false);
        setError("Start date must be earlier than or equal to end date.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (startDate) params.set("start_date", startDate);
        if (endDate) params.set("end_date", endDate);
        if (startDate || endDate) {
          params.set("timezone_offset_minutes", String(new Date().getTimezoneOffset()));
        }

        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : "";

        const [stats, demandData] = await Promise.all([
          api.get(`/analytics/doctors${suffix}`),
          api.get(`/analytics/demand${suffix}`),
        ]);

        const enriched = stats.map((item) => {
          const total = Number(item.total) || 0;
          const completed = Number(item.completed) || 0;
          const cancelled = Number(item.cancelled) || 0;
          const pending = Number.isFinite(item.pending)
            ? Number(item.pending)
            : Math.max(total - completed - cancelled, 0);

          return {
            ...item,
            total,
            completed,
            cancelled,
            pending,
            completion_rate: Number(item.completion_rate) || 0,
            doctor_name: normalizeDoctorName(item.doctor_name || `Doctor #${item.doctor_id}`),
          };
        });

        setDoctorStats(enriched);
        setDemand(
          [...(demandData || [])]
            .sort((left, right) => Number(right.count || 0) - Number(left.count || 0))
            .slice(0, 10),
        );
      } catch (err) {
        setError(err.message || "Failed to load analytics data");
        setDoctorStats([]);
        setDemand([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [startDate, endDate, dateRangeInvalid]);

  const sortedDoctorStats = useMemo(
    () =>
      [...doctorStats].sort((left, right) => {
        if (right.completion_rate !== left.completion_rate) {
          return right.completion_rate - left.completion_rate;
        }
        if (right.total !== left.total) {
          return right.total - left.total;
        }
        return left.doctor_name.localeCompare(right.doctor_name);
      }),
    [doctorStats],
  );

  const periodLabel = useMemo(() => formatPeriodLabel(startDate, endDate), [startDate, endDate]);

  const totalAppointments = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.total, 0),
    [doctorStats],
  );
  const totalCompleted = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.completed, 0),
    [doctorStats],
  );
  const totalCancelled = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.cancelled, 0),
    [doctorStats],
  );
  const totalPending = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.pending, 0),
    [doctorStats],
  );

  const avgCompletion = useMemo(() => {
    if (doctorStats.length === 0) return 0;
    return Math.round(
      (doctorStats.reduce((sum, item) => sum + (item.completion_rate || 0), 0) /
        doctorStats.length) *
        100,
    );
  }, [doctorStats]);

  const chartData = useMemo(
    () =>
      sortedDoctorStats.map((item) => ({
        name: item.doctor_name,
        label: shortenLabel(item.doctor_name),
        completed: item.completed,
        cancelled: item.cancelled,
        pending: item.pending,
        rate: Math.round(item.completion_rate * 100),
      })),
    [sortedDoctorStats],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-gray-400">Clinic performance overview for {periodLabel}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
            aria-label="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
            aria-label="End date"
          />
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="rounded-xl border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Appointments"
              value={totalAppointments}
              icon={TrendingUp}
              color="bg-teal-100 text-teal-600"
            />
            <StatCard
              title="Completed"
              value={totalCompleted}
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Cancelled"
              value={totalCancelled}
              icon={XCircle}
              color="bg-red-100 text-red-500"
            />
            <StatCard
              title="Pending"
              value={totalPending}
              icon={Clock3}
              color="bg-amber-100 text-amber-600"
            />
            <StatCard
              title="Avg Completion Rate"
              value={`${avgCompletion}%`}
              icon={Users}
              color="bg-blue-100 text-blue-600"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border bg-white p-5">
              <h3 className="mb-4 font-semibold">Doctor Performance</h3>
              {chartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  No doctor performance data for the selected period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 52 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      angle={-32}
                      textAnchor="end"
                      interval={0}
                      height={72}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<PerformanceTooltip />} />
                    <Legend verticalAlign="top" height={28} />
                    <Bar
                      name="Completed"
                      dataKey="completed"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Cancelled"
                      dataKey="cancelled"
                      fill="#f87171"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Pending"
                      dataKey="pending"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <h3 className="mb-4 font-semibold">Completion Rates (Sorted)</h3>
              <div className="space-y-3">
                {sortedDoctorStats.length === 0 ? (
                  <p className="text-sm text-gray-400">No completion data.</p>
                ) : (
                  sortedDoctorStats.map((doctor) => {
                    const rate = Math.round(doctor.completion_rate * 100);
                    return (
                      <div key={doctor.doctor_id}>
                        <div className="mb-1 flex justify-between text-xs text-gray-500">
                          <span className="max-w-[180px] truncate" title={doctor.doctor_name}>
                            {doctor.doctor_name}
                          </span>
                          <span className="ml-1 flex-shrink-0">{rate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-teal-500"
                            style={{ width: `${Math.max(rate, 0)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">{getCompletionNote(doctor)}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <MapPin size={16} className="text-teal-500" /> Top Demand Areas
            </h3>
            {demand.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                No location-based demand data for this period. This usually means appointments have
                no mapped location.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-400">
                      <th className="py-2 text-left font-medium">H3 Index</th>
                      <th className="py-2 text-left font-medium">Latitude</th>
                      <th className="py-2 text-left font-medium">Longitude</th>
                      <th className="py-2 text-left font-medium">Appointments</th>
                      <th className="py-2 text-left font-medium">Demand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demand.map((item) => (
                      <tr key={item.h3_index} className="border-t hover:bg-gray-50">
                        <td className="py-3 font-mono text-xs text-gray-500">{item.h3_index}</td>
                        <td className="py-3">{item.center_lat?.toFixed(4)}</td>
                        <td className="py-3">{item.center_lon?.toFixed(4)}</td>
                        <td className="py-3 font-semibold">{item.count}</td>
                        <td className="py-3">
                          <div className="h-2 w-24 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-teal-500"
                              style={{
                                width: `${Math.min(
                                  (item.count / (demand[0]?.count || 1)) * 100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
