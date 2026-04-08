import { useState } from "react";
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
        <Icon size={18} />
      </div>
    </div>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  return (
    <div className="space-y-6">
      {/* HEADER */}
      {/* как будто не нужен подумаю еще <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-gray-400">Manage your data easily</p>
      </div> */}

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value="1,280"
          icon={Package}
          color="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="Low Stock"
          value="34"
          icon={AlertTriangle}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          title="Out of Stock"
          value="7"
          icon={XCircle}
          color="bg-red-100 text-red-500"
        />
        <StatCard
          title="Expiring Soon"
          value="19"
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
            <div className="bg-teal-500 w-2/5 rounded-xl" />
            <div className="bg-teal-300 w-1/4 rounded-xl" />
            <div className="bg-teal-200 w-1/6 rounded-xl" />
            <div className="bg-gray-200 w-1/6 rounded-xl" />
          </div>

          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>Medications 40%</p>
            <p>Consumables 30%</p>
            <p>Lab 20%</p>
            <p>Other 10%</p>
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
            {/* ITEM */}
            <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-teal-100 text-teal-600 flex items-center justify-center rounded-lg">
                <Package size={14} />
              </div>
              <p>50 gloves added</p>
            </div>

            {/* ITEM */}
            <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-red-100 text-red-500 flex items-center justify-center rounded-lg">
                <ArrowDown size={14} />
              </div>
              <p>20 saline bottles removed</p>
            </div>

            {/* ITEM */}
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
