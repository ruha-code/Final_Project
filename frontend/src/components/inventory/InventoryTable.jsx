import { useState, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { api } from "../../services/api";

const STATUS_STYLES = {
  AVAILABLE: "bg-teal-100 text-teal-600",
  LOW: "bg-yellow-100 text-yellow-600",
  OUT: "bg-red-100 text-red-500",
};

const STATUS_LABELS = {
  AVAILABLE: "Available",
  LOW: "Low",
  OUT: "Out",
};

export default function InventoryTable({ search = "", status = "All" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status !== "All") params.set("status", status.toUpperCase());
        const data = await api.get(`/inventory?${params.toString()}`);
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchInventory, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      {/* HEADER */}
      <div className="grid grid-cols-4 px-6 py-3 text-xs text-gray-400 bg-gray-50">
        <span>Item</span>
        <span>Stock</span>
        <span>Status</span>
        <span></span>
      </div>

      {/* ROWS */}
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-4 items-center px-6 py-4 border-t hover:bg-gray-50 relative"
        >
          {/* ITEM */}
          <div className="flex items-center gap-3">
            {item.image_url ? (
              <img
                src={item.image_url}
                className="w-10 h-10 rounded-lg object-cover"
                alt={item.name}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-sm">
                {item.name?.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-400 capitalize">
                {item.category?.toLowerCase()}
              </p>
            </div>
          </div>

          {/* STOCK */}
          <div>
            <p className="text-sm">
              {item.quantity} {item.unit}
            </p>
            <div className="h-2 bg-gray-200 rounded-full mt-1 w-32">
              <div
                className={`h-2 rounded-full ${
                  item.stock_percentage > 25
                    ? "bg-teal-500"
                    : item.stock_percentage > 0
                      ? "bg-yellow-400"
                      : "bg-red-400"
                }`}
                style={{ width: `${item.stock_percentage}%` }}
              />
            </div>
          </div>

          {/* STATUS */}
          <span
            className={`text-xs px-3 py-1 rounded-full w-fit ${STATUS_STYLES[item.status] || "bg-gray-100 text-gray-500"}`}
          >
            {STATUS_LABELS[item.status] || item.status}
          </span>

          {/* ACTION */}
          <div className="relative flex justify-end">
            <button
              onClick={() =>
                setActiveMenu(activeMenu === item.id ? null : item.id)
              }
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical size={16} />
            </button>

            {activeMenu === item.id && (
              <div className="absolute right-0 top-10 bg-white border rounded-xl shadow-md w-32 z-10">
                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  View
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  Edit
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No items found
        </div>
      )}
    </div>
  );
}
