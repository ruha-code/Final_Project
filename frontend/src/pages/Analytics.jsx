import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, CheckCircle, XCircle, MapPin } from "lucide-react";
import { api } from "../services/api";

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-2xl font-bold mt-1">{value}</h2>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {Icon && <Icon size={18} />}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [doctorStats, setDoctorStats] = useState([]);
  const [demand, setDemand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [doctors, demandData] = await Promise.all([
          api.get("/analytics/doctors"),
          api.get("/analytics/demand"),
        ]);
        setDoctorStats(doctors);
        setDemand(demandData.sort((a, b) => b.count - a.count).slice(0, 10));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const totalAppointments = doctorStats.reduce((s, d) => s + d.total, 0);
  const totalCompleted = doctorStats.reduce((s, d) => s + d.completed, 0);
  const totalCancelled = doctorStats.reduce((s, d) => s + d.cancelled, 0);
  const avgCompletion = doctorStats.length
    ? Math.round((doctorStats.reduce((s, d) => s + d.completion_rate, 0) / doctorStats.length) * 100)
    : 0;

  const chartData = doctorStats.map((d) => ({
    name: `Doctor ${d.doctor_id}`,
    completed: d.completed,
    cancelled: d.cancelled,
    rate: Math.round(d.completion_rate * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-gray-400">Clinic performance overview</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Total Appointments" value={totalAppointments} icon={TrendingUp} color="bg-teal-100 text-teal-600" />
        <StatCard title="Completed" value={totalCompleted} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard title="Cancelled" value={totalCancelled} icon={XCircle} color="bg-red-100 text-red-500" />
        <StatCard title="Avg Completion Rate" value={`${avgCompletion}%`} icon={Users} color="bg-blue-100 text-blue-600" />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-3 gap-6">
        {/* Doctor Performance */}
        <div className="col-span-2 bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Doctor Performance</h3>
          {chartData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [value, name === "completed" ? "Completed" : "Cancelled"]}
                />
                <Bar dataKey="completed" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Completion Rate per Doctor */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Completion Rates</h3>
          <div className="space-y-3">
            {doctorStats.length === 0 ? (
              <p className="text-gray-400 text-sm">No data</p>
            ) : (
              doctorStats.map((d) => (
                <div key={d.doctor_id}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Doctor {d.doctor_id}</span>
                    <span>{Math.round(d.completion_rate * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-teal-500 rounded-full"
                      style={{ width: `${Math.round(d.completion_rate * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Demand heatmap table */}
      <div className="bg-white rounded-2xl border p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin size={16} className="text-teal-500" /> Top Demand Areas
        </h3>
        {demand.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No demand data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="text-left py-2 font-medium">H3 Index</th>
                  <th className="text-left py-2 font-medium">Latitude</th>
                  <th className="text-left py-2 font-medium">Longitude</th>
                  <th className="text-left py-2 font-medium">Appointments</th>
                  <th className="text-left py-2 font-medium">Demand</th>
                </tr>
              </thead>
              <tbody>
                {demand.map((d) => (
                  <tr key={d.h3_index} className="border-t hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs text-gray-500">{d.h3_index}</td>
                    <td className="py-3">{d.center_lat.toFixed(4)}</td>
                    <td className="py-3">{d.center_lon.toFixed(4)}</td>
                    <td className="py-3 font-semibold">{d.count}</td>
                    <td className="py-3">
                      <div className="h-2 bg-gray-100 rounded-full w-24">
                        <div
                          className="h-2 bg-teal-500 rounded-full"
                          style={{ width: `${Math.min((d.count / (demand[0]?.count || 1)) * 100, 100)}%` }}
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
    </div>
  );
}
