const roles = ["Support", "Specialists", "Nurses", "Doctors"];

const departments = [
  "General Medicine",
  "Pediatrics",
  "Cardiology",
  "Orthopedics",
  "Dermatology",
  "Neurology",
  "Radiology",
  "Maternity",
];

// levels for Y axis
const levels = [50, 45, 40, 35, 30, 25, 20, 15, 10, 5];

const data = departments.map(() =>
  roles.map(() => Math.floor(Math.random() * 50)),
);

function getColor(value) {
  if (value > 40) return "bg-teal-700";
  if (value > 30) return "bg-teal-500";
  if (value > 20) return "bg-teal-300";
  if (value > 10) return "bg-teal-200";
  return "bg-gray-200";
}

export default function DepartmentsChart() {
  return (
    <div className="bg-white rounded-2xl border p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h3 className="font-semibold">Staff Breakdown by Departments</h3>
          <p className="text-sm text-gray-400">Total All Staff</p>
          <p className="text-2xl font-bold text-teal-600">1,475</p>
        </div>

        {/* LEGEND */}
        <div className="flex gap-4 text-xs text-gray-500 items-center">
          {roles.map((r, i) => (
            <div key={r} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  i === 0
                    ? "bg-gray-300"
                    : i === 1
                      ? "bg-teal-200"
                      : i === 2
                        ? "bg-teal-400"
                        : "bg-teal-700"
                }`}
              />
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="flex gap-4">
        {/* Y AXIS */}
        <div className="flex flex-col justify-between text-xs text-gray-400 h-[300px]">
          {levels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="flex-1">
          {levels.map((level, rowIndex) => (
            <div key={level} className="flex gap-2 mb-2">
              {data.map((dep, colIndex) => {
                const value = dep[rowIndex % roles.length];

                return (
                  <div
                    key={colIndex}
                    className={`h-6 flex-1 rounded-lg ${getColor(
                      value,
                    )} hover:scale-105 transition`}
                  />
                );
              })}
            </div>
          ))}

          {/* X AXIS (departments) */}
          <div className="flex gap-2 mt-2">
            {departments.map((d) => (
              <div key={d} className="flex-1 text-xs text-gray-400 text-center">
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
