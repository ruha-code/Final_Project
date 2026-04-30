import { useEffect, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
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

function formatQuantity(value, unit) {
  if (value === null || value === undefined) return unit ? `0 ${unit}` : "0";
  return unit ? `${value} ${unit}` : `${value}`;
}

function getActorLabel(entry) {
  const actorName = entry?.actor_name || entry?.actor_username || (entry?.user_id ? `User #${entry.user_id}` : "System");
  return entry?.actor_role ? `${actorName} - ${entry.actor_role}` : actorName;
}

function getActivityText(entry) {
  const action = entry?.action;
  const extraData = entry?.extra_data || {};
  const itemName = extraData.item_name || entry?.target_label || "item";
  const amountLabel = formatQuantity(extraData.amount, extraData.unit);
  const remainingLabel = formatQuantity(
    extraData.quantity_after ?? extraData.quantity ?? 0,
    extraData.unit,
  );

  if (action === "INVENTORY_ADD") {
    return `Added ${itemName} with ${formatQuantity(extraData.quantity ?? 0, extraData.unit)}`;
  }
  if (action === "INVENTORY_REMOVE") {
    return `Deleted ${itemName}`;
  }
  if (action === "INVENTORY_LOW") {
    return `Low stock alert for ${itemName} (${remainingLabel} left)`;
  }
  if (action === "INVENTORY_UPDATE" && extraData.operation === "INCREASE") {
    return `Restocked ${amountLabel} of ${itemName}`;
  }
  if (action === "INVENTORY_UPDATE" && extraData.operation === "DECREASE") {
    return `Used ${amountLabel} of ${itemName}`;
  }
  if (action === "INVENTORY_UPDATE") {
    return `Updated ${itemName}`;
  }
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

function StatCard({ title, value, icon: Icon, color, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border bg-white p-4 text-left transition hover:border-teal-200 hover:shadow-sm sm:p-5 ${
        active ? "border-teal-300 ring-2 ring-teal-100" : "border-gray-200"
      }`}
    >
      <div>
        <p className="text-xs text-gray-400 sm:text-sm">{title}</p>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">{value}</h2>
      </div>

      <div className={`flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${color}`}>
        {Icon && <Icon size={18} />}
      </div>
    </button>
  );
}

export default function Inventory() {
  const { isAdmin, isDoctor } = useAuth();
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

        setStats({
          total: data.length,
          low: data.filter((item) => item.status === "LOW").length,
          out: data.filter((item) => item.status === "OUT").length,
          expired: data.filter((item) => item.status === "EXPIRED").length,
          expiringSoon: data.filter((item) => item.status !== "EXPIRED" && item.is_expiring_soon).length,
        });

        const total = data.length || 1;
        const counts = {
          MEDICATIONS: 0,
          CONSUMABLES: 0,
          LABORATORY: 0,
          OTHER: 0,
        };

        data.forEach((item) => {
          const category = item.category?.toUpperCase();
          if (counts[category] !== undefined) counts[category] += 1;
          else counts.OTHER += 1;
        });

        setCategoryBreakdown({
          MEDICATIONS: Math.round((counts.MEDICATIONS / total) * 100),
          CONSUMABLES: Math.round((counts.CONSUMABLES / total) * 100),
          LABORATORY: Math.round((counts.LABORATORY / total) * 100),
          OTHER: Math.round((counts.OTHER / total) * 100),
        });
      } catch (err) {
        setStatsError(err.message || "Failed to load inventory summary.");
      }
    };

    const fetchActivities = async () => {
      setActivitiesError("");
      try {
        const data = await api.get("/inventory/activities?limit=10");
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        setActivities([]);
        setActivitiesError(err.message || "Failed to load inventory activity.");
      }
    };

    void fetchStats();
    void fetchActivities();
  }, [refreshKey]);

  return (
    <div className="space-y-6 px-3 pb-10 sm:px-0">
      <div className="rounded-2xl border border-dashed bg-white px-4 py-3 text-sm text-gray-600">
        {isDoctor() && "Doctors can view inventory and use stock. "}
        {isAdmin() && "Admins keep full control of adding, editing, restocking, and deleting items. "}
        Expired items are surfaced separately so they no longer appear as available stock in the page UI.
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Total Items"
          value={stats.total}
          icon={Package}
          color="bg-teal-100 text-teal-600"
          active={status === "All"}
          onClick={() => setStatus("All")}
        />
        <StatCard
          title="Low Stock"
          value={stats.low}
          icon={AlertTriangle}
          color="bg-yellow-100 text-yellow-600"
          active={status === "Low"}
          onClick={() => setStatus("Low")}
        />
        <StatCard
          title="Out of Stock"
          value={stats.out}
          icon={XCircle}
          color="bg-red-100 text-red-500"
          active={status === "Out"}
          onClick={() => setStatus("Out")}
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          icon={Clock}
          color="bg-blue-100 text-blue-600"
          active={status === "Expiring Soon"}
          onClick={() => setStatus("Expiring Soon")}
        />
        <StatCard
          title="Expired"
          value={stats.expired}
          icon={CalendarX2}
          color="bg-red-100 text-red-600"
          active={status === "Expired"}
          onClick={() => setStatus("Expired")}
        />
      </div>

      {statsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {statsError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryChart reloadKey={refreshKey} />
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h3 className="mb-4 font-semibold">Category Breakdown</h3>

          <div className="flex h-20 gap-2 sm:h-24">
            <div className="rounded-xl bg-teal-500" style={{ width: `${categoryBreakdown.MEDICATIONS}%` }} />
            <div className="rounded-xl bg-teal-300" style={{ width: `${categoryBreakdown.CONSUMABLES}%` }} />
            <div className="rounded-xl bg-teal-200" style={{ width: `${categoryBreakdown.LABORATORY}%` }} />
            <div className="rounded-xl bg-gray-200" style={{ width: `${categoryBreakdown.OTHER}%` }} />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Share of items by category. Percentages update after inventory changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
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

        <div className="rounded-2xl border bg-white p-5">
          <h3 className="mb-4 font-semibold">Recent Activities</h3>

          {activitiesError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {activitiesError}
            </div>
          )}

          <div className="space-y-2 text-sm">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400">No recent activities</p>
            ) : (
              activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.action, activity.extra_data);
                const color = getActivityColor(activity.action, activity.extra_data);

                return (
                  <div key={activity.id || index} className="rounded-lg p-2 hover:bg-gray-50">
                    <div className="flex gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                        <Icon size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800">{getActivityText(activity)}</p>
                        <p className="mt-1 text-[11px] text-gray-500">{getActorLabel(activity)}</p>
                        {activity.extra_data?.reason && (
                          <p className="mt-1 text-[11px] text-gray-400">Reason: {activity.extra_data.reason}</p>
                        )}
                        <p className="mt-1 text-[11px] text-gray-400">{formatActivityTime(activity.created_at)}</p>
                      </div>
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
