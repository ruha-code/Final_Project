import { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  CalendarX2,
  ArrowDown,
  ArrowUp,
  Truck,
} from "lucide-react";

import InventoryTable from "../components/inventory/InventoryTable";
import InventoryChart from "../components/inventory/InventoryChart";
import InventoryFilters from "../components/inventory/InventoryFilters";
import { api } from "../services/api";

function getActivityIcon(action, extraData) {
  if (action === "INVENTORY_UPDATE" && extraData?.operation === "INCREASE") return ArrowUp;
  if (action === "INVENTORY_UPDATE" && extraData?.operation === "DECREASE") return ArrowDown;
  if (action?.includes("ADD")) return Package;
  if (action?.includes("REMOVE")) return ArrowDown;
  if (action?.includes("LOW")) return AlertTriangle;
  return Truck;
}

function getActivityColor(action, extraData) {
  if (action === "INVENTORY_UPDATE" && extraData?.operation === "INCREASE") return "bg-teal-100 text-teal-600";
  if (action === "INVENTORY_UPDATE" && extraData?.operation === "DECREASE") return "bg-red-100 text-red-500";
  if (action?.includes("ADD")) return "bg-teal-100 text-teal-600";
  if (action?.includes("REMOVE")) return "bg-red-100 text-red-500";
  if (action?.includes("LOW")) return "bg-yellow-100 text-yellow-600";
  return "bg-blue-100 text-blue-600";
}

function getActivityText(entry) {
  const action = entry?.action;
  const extraData = entry?.extra_data || {};
  if (action === "INVENTORY_ADD") return `Added ${extraData.item_name || "item"}`;
  if (action === "INVENTORY_REMOVE") return `Deleted ${extraData.item_name || "item"}`;
  if (action === "INVENTORY_LOW") return `Low stock alert: ${extraData.item_name || "item"}`;
  if (action === "INVENTORY_UPDATE" && extraData.operation === "INCREASE") {
    return `Restocked ${extraData.amount} ${extraData.item_name || ""}`.trim();
  }
  if (action === "INVENTORY_UPDATE" && extraData.operation === "DECREASE") {
    return `Used ${extraData.amount} ${extraData.item_name || ""}`.trim();
  }
  if (action === "INVENTORY_UPDATE") return `Updated ${extraData.item_name || "item"}`;
  return "Inventory updated";
}

function formatActivityTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-2xl font-bold mt-1">{value}</h2>
      </div>

      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        {Icon && <Icon size={18} />}
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
    expired: 0,
    expiringSoon: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState({
    MEDICATIONS: 0,
    CONSUMABLES: 0,
    LABORATORY: 0,
    OTHER: 0,
  });
  const [activities, setActivities] = useState([]);
  const [statsError, setStatsError] = useState("");
  const [activitiesError, setActivitiesError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsError("");
      try {
        const data = await api.get("/inventory");
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        setStats({
          total: data.length,
          low: data.filter((i) => i.status === "LOW").length,
          out: data.filter((i) => i.status === "OUT").length,
          expired: data.filter(
            (i) => i.expires_at && new Date(`${i.expires_at}T00:00:00`) < now,
          ).length,
          expiringSoon: data.filter(
            (i) => i.expires_at
              && new Date(`${i.expires_at}T00:00:00`) >= now
              && new Date(`${i.expires_at}T00:00:00`) <= in30days,
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
        setStatsError(err.message || "Failed to load inventory summary.");
      }
    };

    const fetchActivities = async () => {
      setActivitiesError("");
      try {
        const data = await api.get("/audit/audit-logs?page=1&page_size=10&q=INVENTORY_");
        const inventoryActivities = (data.items || [])
          .filter((item) => item.action?.startsWith("INVENTORY_"))
          .slice(0, 10);
        setActivities(inventoryActivities);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setActivities([]);
        setActivitiesError(err.message || "Failed to load recent inventory activity.");
      }
    };

    void fetchStats();
    void fetchActivities();
  }, [refreshKey]);

  const hasInventoryItems = stats.total > 0;

  return (
    <div className="space-y-6">
      {statsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {statsError}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-5 gap-6">
        <StatCard
          title="Total Items"
          value={statsError ? "—" : stats.total.toLocaleString()}
          icon={Package}
          color="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="Low Stock"
          value={statsError ? "—" : stats.low}
          icon={AlertTriangle}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          title="Out of Stock"
          value={statsError ? "—" : stats.out}
          icon={XCircle}
          color="bg-red-100 text-red-500"
        />
        <StatCard
          title="Expiring Soon"
          value={statsError ? "—" : stats.expiringSoon}
          icon={Clock}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Expired"
          value={statsError ? "—" : stats.expired}
          icon={CalendarX2}
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* CHART + CATEGORY */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <InventoryChart reloadKey={refreshKey} />
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Category Breakdown</h3>

          {statsError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Category breakdown is unavailable right now.
            </div>
          ) : !hasInventoryItems ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed bg-gray-50 px-4 text-sm text-gray-400">
              No inventory items to break down yet.
            </div>
          ) : (
            <>
              <div className="flex gap-2 h-24">
                <div
                  className="bg-teal-500 rounded-xl"
                  style={{ width: `${categoryBreakdown.MEDICATIONS}%` }}
                />
                <div
                  className="bg-teal-300 rounded-xl"
                  style={{ width: `${categoryBreakdown.CONSUMABLES}%` }}
                />
                <div
                  className="bg-teal-200 rounded-xl"
                  style={{ width: `${categoryBreakdown.LABORATORY}%` }}
                />
                <div
                  className="bg-gray-200 rounded-xl"
                  style={{ width: `${categoryBreakdown.OTHER}%` }}
                />
              </div>

              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>Medications {categoryBreakdown.MEDICATIONS}%</p>
                <p>Consumables {categoryBreakdown.CONSUMABLES}%</p>
                <p>Laboratory {categoryBreakdown.LABORATORY}%</p>
                <p>Other {categoryBreakdown.OTHER}%</p>
              </div>
            </>
          )}
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
            resultCount={resultCount}
          />

          <InventoryTable
            search={search}
            status={status}
            onMutation={() => setRefreshKey((value) => value + 1)}
            onCountChange={setResultCount}
          />
        </div>

        {/* ACTIVITIES */}
        <div className="bg-white rounded-2xl border p-5 flex flex-col">
          <h3 className="font-semibold mb-6">Recent Activities</h3>

          <div className="space-y-2 text-sm">
            {activitiesError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {activitiesError}
              </p>
            ) : activities.length === 0 ? (
              <p className="text-gray-400 text-xs">No recent activities</p>
            ) : (
              activities.map((a, i) => {
                const Icon = getActivityIcon(a.action, a.extra_data);
                const color = getActivityColor(a.action, a.extra_data);
                return (
                  <div key={a.id || i} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${color}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <p>{getActivityText(a)}</p>
                      <p className="text-[11px] text-gray-400">{formatActivityTime(a.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
