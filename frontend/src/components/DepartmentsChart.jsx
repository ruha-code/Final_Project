import { useState, useEffect } from "react";
import { api } from "../services/api";

const teamSizes = ["Large team", "Core team", "Lean team"];

function getColor(value) {
  if (value > 40) return "bg-teal-700";
  if (value > 30) return "bg-teal-500";
  if (value > 20) return "bg-teal-300";
  if (value > 10) return "bg-teal-200";
  return "bg-gray-200";
}

export default function DepartmentsChart() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/departments")
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalTeamMembers = departments.reduce(
    (sum, department) => sum + (department.staff_count || 0),
    0,
  );

  const maxTeamMembers = Math.max(...departments.map((d) => d.staff_count || 0), 1);
  const levels = [50, 45, 40, 35, 30, 25, 20, 15, 10, 5];
  const chartData = departments.slice(0, 6).map((dep) => ({
    name: dep.name || "Unknown",
    teamMembers: dep.staff_count || 0,
    percentage: Math.round((dep.staff_count || 0) / maxTeamMembers * 100),
  }));

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
          <p className="text-sm text-gray-400">Total Team Members</p>
          <p className="text-2xl font-bold text-teal-600">{totalTeamMembers}</p>
        </div>

        <div className="flex gap-4 text-xs text-gray-500 items-center">
          {teamSizes.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  i === 0
                    ? "bg-gray-300"
                    : i === 1
                      ? "bg-teal-300"
                      : "bg-teal-600"
                }`}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col justify-between text-xs text-gray-400 h-[300px]">
          {levels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        <div className="flex-1">
          {levels.map((level) => (
            <div key={level} className="flex gap-2 mb-2">
              {chartData.map((dep, colIndex) => {
                const barHeight = dep.percentage >= level ? 100 : ((dep.percentage / level) * 100);
                return (
                  <div
                    key={colIndex}
                    className={`h-6 flex-1 rounded-lg ${getColor(dep.teamMembers)}`}
                    style={{ 
                      opacity: barHeight >= 100 ? 1 : barHeight > 0 ? 0.3 : 0 
                    }}
                    title={`${dep.name}: ${dep.teamMembers} team members`}
                  />
                );
              })}
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            {chartData.map((d) => (
              <div key={d.name} className="flex-1 text-xs text-gray-400 text-center truncate">
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
