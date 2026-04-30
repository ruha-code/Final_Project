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
    <div className="flex items-center justify-between rounded-2xl border bg-white p-4 sm:p-5">
      <div>
        <p className="text-xs text-gray-400 sm:text-sm">{title}</p>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">{value}</h2>
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${color}`}>
        {Icon && <Icon size={16} className="sm:h-[18px] sm:w-[18px]" />}
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

  const start = startDate
    ? DATE_FORMATTER.format(new Date(`${startDate}T00:00:00`))
    : "Earliest";
  const end = endDate
    ? DATE_FORMATTER.format(new Date(`${endDate}T00:00:00`))
    : "Today";
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
      <p className="text-gray-600">Total: {point.total}</p>
      <p className="text-gray-600">Completed: {point.completed}</p>
      <p className="text-gray-600">Scheduled: {point.scheduled}</p>
      <p className="text-gray-600">Ongoing: {point.ongoing}</p>
      <p className="text-gray-600">Cancelled: {point.cancelled}</p>
      <p className="mt-1 font-medium text-gray-700">Completion rate: {point.rate}%</p>
    </div>
  );
}

function getCompletionNote(doctor) {
  const rate = Math.round((doctor.completion_rate || 0) * 100);
  if (doctor.total === 0) return "No appointments in selected period";
  if (rate === 0) return "No completed appointments in selected period";
  return `${doctor.completed}/${doctor.total} completed - ${doctor.ongoing} ongoing - ${doctor.scheduled} scheduled`;
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
        setDoctorStats([]);
        setDemand([]);
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
          params.set(
            "timezone_offset_minutes",
            String(new Date().getTimezoneOffset()),
          );
        }

        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : "";

        const [stats, demandData] = await Promise.all([
          api.get(`/analytics/doctors${suffix}`),
          api.get(`/analytics/demand${suffix}`),
        ]);

        const enriched = (stats || []).map((item) => {
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
            completion_rate: Number(item.completion_rate) || 0,
            doctor_name: normalizeDoctorName(
              item.doctor_name || `Doctor #${item.doctor_id}`,
            ),
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

  const activeDoctorStats = useMemo(
    () => doctorStats.filter((item) => item.total > 0),
    [doctorStats],
  );

  const inactiveDoctorCount = doctorStats.length - activeDoctorStats.length;

  const sortedDoctorStats = useMemo(
    () =>
      [...activeDoctorStats].sort((left, right) => {
        if (right.completion_rate !== left.completion_rate) {
          return right.completion_rate - left.completion_rate;
        }
        if (right.total !== left.total) {
          return right.total - left.total;
        }
        return left.doctor_name.localeCompare(right.doctor_name);
      }),
    [activeDoctorStats],
  );

  const volumeSortedDoctorStats = useMemo(
    () =>
      [...activeDoctorStats].sort((left, right) => {
        if (right.total !== left.total) return right.total - left.total;
        if (right.completed !== left.completed) return right.completed - left.completed;
        return left.doctor_name.localeCompare(right.doctor_name);
      }),
    [activeDoctorStats],
  );

  const periodLabel = useMemo(
    () => formatPeriodLabel(startDate, endDate),
    [startDate, endDate],
  );

  const totalAppointments = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.total, 0),
    [doctorStats],
  );
  const totalCompleted = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.completed, 0),
    [doctorStats],
  );
  const totalScheduled = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.scheduled, 0),
    [doctorStats],
  );
  const totalOngoing = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.ongoing, 0),
    [doctorStats],
  );
  const totalCancelled = useMemo(
    () => doctorStats.reduce((sum, item) => sum + item.cancelled, 0),
    [doctorStats],
  );

  const clinicCompletionRate = useMemo(() => {
    if (totalAppointments === 0) return 0;
    return Math.round((totalCompleted / totalAppointments) * 100);
  }, [totalAppointments, totalCompleted]);

  const chartData = useMemo(
    () =>
      volumeSortedDoctorStats.map((item) => ({
        name: item.doctor_name,
        label: shortenLabel(item.doctor_name),
        total: item.total,
        completed: item.completed,
        scheduled: item.scheduled,
        ongoing: item.ongoing,
        cancelled: item.cancelled,
        rate: Math.round(item.completion_rate * 100),
      })),
    [volumeSortedDoctorStats],
  );

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Analytics</h1>
          <p className="text-xs text-gray-400 sm:text-sm">
            Clinic performance overview for {periodLabel}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-xl border bg-white px-3 py-2 text-xs sm:w-auto sm:text-sm"
            aria-label="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-xl border bg-white px-3 py-2 text-xs sm:w-auto sm:text-sm"
            aria-label="End date"
          />
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="w-full rounded-xl border bg-white px-4 py-2 text-xs text-gray-700 transition hover:bg-gray-50 sm:w-auto sm:text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 sm:text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
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
              title="Scheduled"
              value={totalScheduled}
              icon={Clock3}
              color="bg-amber-100 text-amber-600"
            />
            <StatCard
              title="Ongoing"
              value={totalOngoing}
              icon={Users}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Cancelled"
              value={totalCancelled}
              icon={XCircle}
              color="bg-red-100 text-red-500"
            />
            <StatCard
              title="Clinic Completion Rate"
              value={`${clinicCompletionRate}%`}
              icon={CheckCircle}
              color="bg-emerald-100 text-emerald-600"
            />
          </div>

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 sm:p-5 xl:col-span-2">
              <h3 className="mb-2 text-sm font-semibold sm:text-base">
                Doctor Appointment Mix
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Sorted by total appointment volume for the selected period.
              </p>

              {chartData.length === 0 ? (
                <p className="py-10 text-center text-xs text-gray-400 sm:text-sm">
                  No doctor performance data for the selected period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260} className="sm:!h-[300px]">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 52 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      angle={-32}
                      textAnchor="end"
                      interval={0}
                      height={72}
                    />
                    <YAxis tick={{ fontSize: 10 }} width={28} />
                    <Tooltip content={<PerformanceTooltip />} />
                    <Legend verticalAlign="top" height={28} />
                    <Bar
                      name="Completed"
                      dataKey="completed"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Scheduled"
                      dataKey="scheduled"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Ongoing"
                      dataKey="ongoing"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Cancelled"
                      dataKey="cancelled"
                      fill="#f87171"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-semibold sm:text-base">
                Completion Rates (Sorted)
              </h3>
              {inactiveDoctorCount > 0 && (
                <p className="mb-3 text-xs text-gray-500">
                  {inactiveDoctorCount} doctor{inactiveDoctorCount === 1 ? "" : "s"} had no appointments in this period and are hidden from the ranking.
                </p>
              )}

              <div className="space-y-3">
                {sortedDoctorStats.length === 0 ? (
                  <p className="text-xs text-gray-400 sm:text-sm">
                    No completion data.
                  </p>
                ) : (
                  sortedDoctorStats.map((doctor) => {
                    const rate = Math.round(doctor.completion_rate * 100);
                    return (
                      <div key={doctor.doctor_id}>
                        <div className="mb-1 flex justify-between text-xs text-gray-500">
                          <span
                            className="max-w-[150px] truncate sm:max-w-[180px]"
                            title={doctor.doctor_name}
                          >
                            {doctor.doctor_name}
                          </span>
                          <span className="ml-1 shrink-0">{rate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-teal-500"
                            style={{ width: `${Math.max(rate, 0)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {getCompletionNote(doctor)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
