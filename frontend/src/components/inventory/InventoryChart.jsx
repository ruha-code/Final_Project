import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../../services/api";

export default function InventoryChart({ reloadKey = 0 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const items = await api.get("/inventory");
        const byCategory = {};
        items.forEach((item) => {
          if (item.status === "EXPIRED") return;
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
        setData([]);
        setError(err.message || "Failed to load inventory chart.");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border p-5 flex items-center justify-center h-56">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border p-5">
        <h3 className="font-semibold mb-4">Stock by Category</h3>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-5">
        <h3 className="font-semibold mb-4">Stock by Category</h3>
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed bg-gray-50 px-4 text-sm text-gray-400">
          No inventory data to chart yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-5">
      <h3 className="font-semibold mb-4">Stock by Category</h3>
      <p className="mb-3 text-xs text-gray-500">Usable stock only. Expired items are excluded.</p>

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
