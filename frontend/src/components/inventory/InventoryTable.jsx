import { useState, useEffect } from "react";
import { MoreVertical, Plus, X, Edit, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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

function ItemModal({ onClose, onSaved, editData }) {
  const [form, setForm] = useState({
    name: editData?.name || "",
    category: editData?.category || "MEDICATIONS",
    quantity: editData?.quantity || 0,
    unit: editData?.unit || "pcs",
    stock_percentage: editData?.stock_percentage || 0,
    status: editData?.status || "AVAILABLE",
    expires_at: editData?.expires_at ? editData.expires_at.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        quantity: form.quantity,
        unit: form.unit,
        stock_percentage: form.stock_percentage,
        status: form.status,
        ...(form.expires_at && { expires_at: form.expires_at }),
      };
      if (editData) {
        await api.put(`/inventory/${editData.id}`, payload);
      } else {
        await api.post("/inventory", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[480px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-teal-50 border-b">
          <h2 className="font-semibold">{editData ? "Edit" : "Add"} Inventory Item</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="MEDICATIONS">Medications</option>
                <option value="CONSUMABLES">Consumables</option>
                <option value="LABORATORY">Laboratory</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Unit</label>
              <input
                value={form.unit}
                onChange={(e) => setForm({...form, unit: e.target.value})}
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Expiry Date</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({...form, expires_at: e.target.value})}
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2 bg-teal-500 text-white rounded-xl text-sm hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : editData ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryTable({ search = "", status = "All", onRefresh }) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [editData, setEditData] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const triggerReload = () => setReloadKey((current) => current + 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchInventory = async () => {
        try {
          setLoading(true);
          const params = new URLSearchParams();
          if (search) params.set("search", search);
          if (status !== "All") params.set("status", status.toUpperCase());
          const query = params.toString();
          const data = await api.get(query ? `/inventory?${query}` : "/inventory");
          setItems(data);
        } catch (err) {
          console.error("Failed to fetch inventory:", err);
        } finally {
          setLoading(false);
        }
      };

      void fetchInventory();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, reloadKey]);

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
      <div className="grid grid-cols-5 px-6 py-3 text-xs text-gray-400 bg-gray-50">
        <span>Item</span>
        <span>Stock</span>
        <span>Expiry</span>
        <span>Status</span>
        <div className="flex justify-end">
          {isAdmin() && (
            <button
              onClick={() => { setEditData(null); setModal(true); }}
              className="text-teal-600 hover:bg-teal-50 px-2 py-1 rounded-lg flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>
      </div>

      {/* ROWS */}
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-5 items-center px-6 py-4 border-t hover:bg-gray-50 relative"
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

          {/* EXPIRY */}
          <span className={`text-xs ${item.expires_at && new Date(item.expires_at) <= new Date(Date.now() + 30*24*60*60*1000) ? "text-orange-500" : "text-gray-500"}`}>
            {item.expires_at ? new Date(item.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </span>

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
                <button
                  onClick={() => { setEditData(item); setModal(true); setActiveMenu(null); }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm("Delete this item?")) return;
                    try {
                      await api.delete(`/inventory/${item.id}`);
                      triggerReload();
                    } catch (err) { console.error(err); }
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                >
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

      {modal && (
        <ItemModal
          onClose={() => { setModal(null); setEditData(null); }}
          onSaved={() => {
            triggerReload();
            if (onRefresh) onRefresh();
          }}
          editData={editData}
        />
      )}
    </div>
  );
}
