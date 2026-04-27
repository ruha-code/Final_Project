import { useMemo } from "react";

function getBarColor(index) {
  const palette = [
    "bg-teal-600",
    "bg-teal-500",
    "bg-teal-400",
    "bg-cyan-500",
    "bg-cyan-400",
    "bg-slate-400",
  ];
  return palette[index % palette.length];
}

export default function DepartmentsChart({ departments = [], loading = false, error = "" }) {
  const chartData = useMemo(
    () =>
      [...departments]
        .map((department) => ({
          id: department.id,
          name: department.name || "Unknown",
          teamMembers: department.staff_count || 0,
        }))
        .sort((left, right) => right.teamMembers - left.teamMembers)
        .slice(0, 8),
    [departments],
  );

  const totalTeamMembers = chartData.reduce((sum, department) => sum + department.teamMembers, 0);
  const maxTeamMembers = Math.max(...chartData.map((department) => department.teamMembers), 1);
  const allZero = chartData.length > 0 && chartData.every((department) => department.teamMembers === 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border p-6 flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h3 className="font-semibold">Team by Department</h3>
          <p className="text-sm text-gray-400">Doctors assigned per department</p>
          <p className="text-2xl font-bold text-teal-600">{totalTeamMembers}</p>
        </div>
      </div>

      {error ? (
        <p className="py-12 text-center text-sm text-red-500">
          Unable to load department chart data right now.
        </p>
      ) : chartData.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No departments available yet.</p>
      ) : allZero ? (
        <p className="py-12 text-center text-sm text-gray-400">
          No doctors are assigned to departments yet.
        </p>
      ) : (
        <div className="space-y-3">
          {chartData.map((department, index) => {
            const percent = Math.round((department.teamMembers / maxTeamMembers) * 100);
            const width = department.teamMembers > 0 ? Math.max(percent, 8) : 0;
            return (
              <div key={department.id} className="grid grid-cols-[180px_1fr_48px] items-center gap-3">
                <p className="truncate text-sm text-gray-600" title={department.name}>
                  {department.name}
                </p>
                <div className="h-3 rounded-full bg-gray-100">
                  <div
                    className={`h-3 rounded-full ${getBarColor(index)}`}
                    style={{ width: `${width}%` }}
                    title={`${department.teamMembers} doctors`}
                  />
                </div>
                <p className="text-right text-sm font-semibold text-gray-700">{department.teamMembers}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
