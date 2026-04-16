import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../../services/api";

export default function InventoryChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const items = await api.get("/inventory");
        const byCategory = {};
        items.forEach((item) => {
          const cat = item.category || "OTHER";
          byCategory[cat] = (byCategory[cat] || 0) + item.quantity;
        });
        const chartData = Object.entries(byCategory).map(([name, usage]) => ({
          name,
          usage,
        }));
        setData(chartData);
      } catch (err) {
        console.error("Failed to fetch inventory chart:", err);
        setData([
          { name: "MEDICATIONS", usage: 0 },
          { name: "CONSUMABLES", usage: 0 },
          { name: "LABORATORY", usage: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border p-5 flex items-center justify-center h-56">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-5">
      <h3 className="font-semibold mb-4">Stock by Category</h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
          <Tooltip />
          <Bar dataKey="usage" radius={[6, 6, 0, 0]} fill="#14b8a6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
