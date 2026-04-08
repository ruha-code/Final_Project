import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", usage: 30 },
  { day: "Tue", usage: 50 },
  { day: "Wed", usage: 70 },
  { day: "Thu", usage: 60 },
  { day: "Fri", usage: 85 },
  { day: "Sat", usage: 65 },
  { day: "Sun", usage: 75 },
];

export default function InventoryChart() {
  return (
    <div className="bg-white rounded-2xl border p-5">
      <h3 className="font-semibold mb-4">Inventory Usage Trend</h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
          <Tooltip />
          <Bar dataKey="usage" radius={[6, 6, 0, 0]} fill="#14b8a6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
