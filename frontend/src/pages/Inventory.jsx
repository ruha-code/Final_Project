import { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowDown,
  Truck,
} from "lucide-react";

import InventoryTable from "../components/inventory/InventoryTable";
import InventoryChart from "../components/inventory/InventoryChart";
import InventoryFilters from "../components/inventory/InventoryFilters";
import { api } from "../services/api";

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-2xl font-bold mt-1">{value}</h2>
      </div>

      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon && <icon size={18} />}
      </div>
    </div>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [stats, setStats] = useState({
    total: 0,
    low: 0,
    out: 0,
    expiringSoon: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState({
    MEDICATIONS: 0,
    CONSUMABLES: 0,
    LABORATORY: 0,
    OTHER: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get("/inventory");
        const now = new Date();
        const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        setStats({
          total: data.length,
          low: data.filter((i) => i.status === "LOW").length,
          out: data.filter((i) => i.status === "OUT").length,
          expiringSoon: data.filter(
            (i) => i.expires_at && new Date(i.expires_at) <= in30days,
          ).length,
        });

        // Category breakdown
        const total = data.length || 1;
        const cats = {
          MEDICATIONS: 0,
          CONSUMABLES: 0,
          LABORATORY: 0,
          OTHER: 0,
        };
        data.forEach((i) => {
          const cat = i.category?.toUpperCase();
          if (cats[cat] !== undefined) cats[cat]++;
          else cats.OTHER++;
        });
        setCategoryBreakdown({
          MEDICATIONS: Math.round((cats.MEDICATIONS / total) * 100),
          CONSUMABLES: Math.round((cats.CONSUMABLES / total) * 100),
          LABORATORY: Math.round((cats.LABORATORY / total) * 100),
          OTHER: Math.round((cats.OTHER / total) * 100),
        });
      } catch (err) {
        console.error("Failed to fetch inventory stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* STATS */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={stats.total.toLocaleString()}
          icon={Package}
          color="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="Low Stock"
          value={stats.low}
          icon={AlertTriangle}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          title="Out of Stock"
          value={stats.out}
          icon={XCircle}
          color="bg-red-100 text-red-500"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          icon={Clock}
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* CHART + CATEGORY */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <InventoryChart />
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Category Breakdown</h3>

          <div className="flex gap-2 h-24">
            <div
              className="bg-teal-500 rounded-xl"
              style={{ width: `${categoryBreakdown.MEDICATIONS || 40}%` }}
            />
            <div
              className="bg-teal-300 rounded-xl"
              style={{ width: `${categoryBreakdown.CONSUMABLES || 30}%` }}
            />
            <div
              className="bg-teal-200 rounded-xl"
              style={{ width: `${categoryBreakdown.LABORATORY || 20}%` }}
            />
            <div
              className="bg-gray-200 rounded-xl"
              style={{ width: `${categoryBreakdown.OTHER || 10}%` }}
            />
          </div>

          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>Medications {categoryBreakdown.MEDICATIONS}%</p>
            <p>Consumables {categoryBreakdown.CONSUMABLES}%</p>
            <p>Laboratory {categoryBreakdown.LABORATORY}%</p>
            <p>Other {categoryBreakdown.OTHER}%</p>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 space-y-4">
          <InventoryFilters
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
          />

          <InventoryTable search={search} status={status} />
        </div>

        {/* ACTIVITIES */}
        <div className="bg-white rounded-2xl border p-5 flex flex-col">
          <h3 className="font-semibold mb-6">Inventory Activities</h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-teal-100 text-teal-600 flex items-center justify-center rounded-lg">
                <Package size={14} />
              </div>
              <p>50 gloves added</p>
            </div>

            <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-red-100 text-red-500 flex items-center justify-center rounded-lg">
                <ArrowDown size={14} />
              </div>
              <p>20 saline bottles removed</p>
            </div>

          
            <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg">
                <Truck size={14} />
              </div>
              <p>New shipment arrived</p>
            </div>

            {/* ITEM */}
            <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-lg">
                <AlertTriangle size={14} />
              </div>
              <p>Low stock alert triggered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
