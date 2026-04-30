import { useEffect, useState } from "react";
import { MoreVertical, Plus, X } from "lucide-react";

import Badge from "../Badge";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLES = {
  AVAILABLE: "bg-teal-100 text-teal-600",
  LOW: "bg-yellow-100 text-yellow-700",
  OUT: "bg-red-100 text-red-600",
  EXPIRED: "bg-red-100 text-red-600",
};

const STATUS_LABELS = {
  AVAILABLE: "Available",
  LOW: "Low",
  OUT: "Out",
  EXPIRED: "Expired",
};

const UNIT_OPTIONS_BY_CATEGORY = {
  MEDICATIONS: ["pcs", "boxes", "packs", "vials", "bottles", "ml", "l", "g", "kg"],
  CONSUMABLES: ["pcs", "boxes", "packs", "rolls", "kits"],
  LABORATORY: ["pcs", "kits", "vials", "bottles", "ml", "l"],
  OTHER: ["pcs", "boxes", "kits", "rolls", "vials", "bottles", "packs", "ml", "l", "g", "kg"],
};

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s\-()/.,+#]*$/;

function formatDate(value) {
  if (!value) return "No expiry date";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseIntegerInput(value) {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

function getAllowedUnits(category) {
  return UNIT_OPTIONS_BY_CATEGORY[category] || UNIT_OPTIONS_BY_CATEGORY.OTHER;
}

function isMeaningfulInventoryName(value) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length >= 2 && /[A-Za-z]/.test(cleaned) && NAME_PATTERN.test(cleaned);
}

function pluralizeDays(days) {
  return `${days} day${days === 1 ? "" : "s"}`;
}

function getExpirySummary(item) {
  if (!item?.expires_at) {
    return {
      dateLabel: "No expiry date",
      hint: "Shelf life not set",
      tone: "text-gray-500",
    };
  }

  if (item.is_expired) {
    const daysAgo = Math.max(1, Math.abs(item.days_until_expiry ?? 0));
    return {
      dateLabel: formatDate(item.expires_at),
      hint: `Expired ${pluralizeDays(daysAgo)} ago`,
      tone: "text-red-600",
    };
  }

  if (item.is_expiring_soon) {
    if (item.days_until_expiry === 0) {
      return {
        dateLabel: formatDate(item.expires_at),
        hint: "Expires today",
        tone: "text-orange-600",
      };
    }
    return {
      dateLabel: formatDate(item.expires_at),
      hint: `Expires in ${pluralizeDays(item.days_until_expiry ?? 0)}`,
      tone: "text-orange-600",
    };
  }

  return {
    dateLabel: formatDate(item.expires_at),
    hint: "Within shelf life",
    tone: "text-gray-500",
  };
}

function getPrimaryStatus(item) {
  if (item?.status === "EXPIRED" || item?.is_expired) {
    return {
      key: "EXPIRED",
      label: STATUS_LABELS.EXPIRED,
      style: STATUS_STYLES.EXPIRED,
    };
  }

  return {
    key: item?.status || "AVAILABLE",
    label: STATUS_LABELS[item?.status] || item?.status || "Available",
    style: STATUS_STYLES[item?.status] || "bg-gray-100 text-gray-500",
  };
}

function canAdjustExpiredItem(item) {
  return !item?.is_expired;
}

function ItemModal({ onClose, onSaved, editData }) {
  const [form, setForm] = useState({
    name: editData?.name || "",
    category: editData?.category || "MEDICATIONS",
    quantity: editData ? String(editData.quantity) : "",
    unit: editData?.unit || "pcs",
    expires_at: editData?.expires_at || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const unitOptions = getAllowedUnits(form.category);

  useEffect(() => {
    if (unitOptions.includes(form.unit)) return;
    setForm((current) => ({
      ...current,
      unit: unitOptions[0],
    }));
  }, [form.unit, unitOptions]);

  const handleSubmit = async () => {
    setError("");
    const quantity = parseIntegerInput(form.quantity);
    const maxAllowedDate = `${new Date().getFullYear() + 30}-12-31`;
    const cleanedName = form.name.trim().replace(/\s+/g, " ");

    if (!cleanedName) {
      setError("Name is required");
      return;
    }
    if (!isMeaningfulInventoryName(cleanedName)) {
      setError("Name must contain letters and be a readable item name, not only numbers");
      return;
    }
    if (quantity === null || quantity < 0) {
      setError("Quantity must be 0 or greater");
      return;
    }
    if (!unitOptions.includes(form.unit)) {
      setError(`Select a valid unit for ${form.category.toLowerCase()}`);
      return;
    }
    if (form.expires_at && (form.expires_at < "2000-01-01" || form.expires_at > maxAllowedDate)) {
      setError("Expiry date must be realistic");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: cleanedName,
        category: form.category,
        quantity,
        unit: form.unit,
        expires_at: form.expires_at || null,
      };

      if (editData) {
        await api.put(`/inventory/${editData.id}`, payload);
      } else {
        await api.post("/inventory", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-teal-50 px-6 py-4">
          <h2 className="font-semibold">{editData ? "Edit" : "Add"} Inventory Item</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div>
            <label className="mb-1 block text-sm text-gray-500">Name *</label>
            <input
              maxLength={150}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Face Masks, Saline Bottles"
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Use a human-readable name. Numbers-only names are not allowed.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-500">Category</label>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="MEDICATIONS">Medications</option>
                <option value="CONSUMABLES">Consumables</option>
                <option value="LABORATORY">Laboratory</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">Unit</label>
              <select
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
                className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Allowed for this category: {unitOptions.join(", ")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-500">Quantity</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">Expiry Date</label>
              <input
                type="date"
                min="2000-01-01"
                max={`${new Date().getFullYear() + 30}-12-31`}
                value={form.expires_at}
                onChange={(event) => setForm({ ...form, expires_at: event.target.value })}
                className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Stock status is calculated automatically from quantity, expiry, and category threshold.
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-2 text-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : editData ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockAdjustModal({ item, operation, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const actionLabel = operation === "INCREASE" ? "Restock" : "Use Stock";

  const handleSubmit = async () => {
    setError("");
    const parsedAmount = parseIntegerInput(amount);
    if (parsedAmount === null || parsedAmount <= 0) {
      setError("Enter a valid amount greater than zero");
      return;
    }
    if (operation === "DECREASE" && parsedAmount > item.quantity) {
      setError("Cannot use more than current stock");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/inventory/${item.id}/adjust`, {
        operation,
        amount: parsedAmount,
        reason: reason.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-teal-50 px-6 py-4">
          <h2 className="font-semibold">{actionLabel} - {item.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <p className="text-xs text-gray-500">Current stock: {item.quantity} {item.unit}</p>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Amount</label>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Optional note for the activity log"
              className="w-full resize-none rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-2 text-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemDetailsModal({ item, onClose }) {
  const expiry = getExpirySummary(item);
  const primaryStatus = getPrimaryStatus(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-teal-50 px-6 py-4">
          <h2 className="font-semibold">Inventory Item Details</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="font-medium">{item.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Category</p>
              <p>{item.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Quantity</p>
              <p>{item.quantity} {item.unit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p>{primaryStatus.label}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Stock Status</p>
              <p>{STATUS_LABELS[item.stock_status] || item.stock_status || primaryStatus.label}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Low Stock Threshold</p>
              <p>{item.low_stock_threshold} {item.unit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Stock Level</p>
              <p>{item.quantity} / {item.target_quantity} target ({item.stock_percentage}%)</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Expiry</p>
              <p>{expiry.dateLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Last Updated</p>
              <p>{new Date(item.updated_at).toLocaleString("en-GB")}</p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {expiry.hint}
          </div>

          {item.is_expired && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              This item is expired and should not appear as available stock in the UI.
            </p>
          )}
          {!item.is_expired && item.is_expiring_soon && (
            <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-600">
              {expiry.hint}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InventoryTable({
  search = "",
  status = "All",
  onMutation,
  onCountChange,
}) {
  const { isAdmin, isDoctor } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [editData, setEditData] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustOperation, setAdjustOperation] = useState("INCREASE");
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");

  const canManageItems = isAdmin();
  const canUseStock = isAdmin() || isDoctor();

  const triggerReload = () => setReloadKey((current) => current + 1);
  const handleMutation = () => {
    triggerReload();
    if (onMutation) onMutation();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchInventory = async () => {
        try {
          setLoading(true);
          setError("");
          const params = new URLSearchParams();
          if (search) params.set("search", search);
          if (status !== "All") {
            params.set("status", status.toUpperCase().replace(/\s+/g, "_"));
          }
          const query = params.toString();
          const data = await api.get(query ? `/inventory?${query}` : "/inventory");
          setItems(Array.isArray(data) ? data : []);
          if (onCountChange) onCountChange(Array.isArray(data) ? data.length : 0);
        } catch (err) {
          console.error("Failed to fetch inventory:", err);
          setItems([]);
          setError(err.message || "Failed to load inventory items.");
          if (onCountChange) onCountChange(0);
        } finally {
          setLoading(false);
        }
      };

      void fetchInventory();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, status, reloadKey, onCountChange]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="hidden grid-cols-5 bg-gray-50 px-6 py-3 text-xs text-gray-400 md:grid">
        <span>Item</span>
        <span>Stock</span>
        <span>Expiry</span>
        <span>Status</span>
        <div className="flex justify-end">
          {canManageItems && (
            <button
              onClick={() => {
                setEditData(null);
                setModal(true);
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-teal-600 hover:bg-teal-50"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3 text-xs text-gray-400 md:hidden">
        <span>Inventory Items</span>
        {canManageItems && (
          <button
            onClick={() => {
              setEditData(null);
              setModal(true);
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-teal-600 hover:bg-teal-50"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {items.map((item) => {
        const expiry = getExpirySummary(item);
        const primaryStatus = getPrimaryStatus(item);
        const canAdjustStock = canAdjustExpiredItem(item);

        return (
          <div
            key={item.id}
            className="relative grid grid-cols-1 gap-4 border-t px-6 py-4 hover:bg-gray-50 md:grid-cols-5 md:items-center"
          >
            <div className="flex items-center gap-3">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  className="h-10 w-10 rounded-lg object-cover"
                  alt={item.name}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-sm font-semibold text-teal-600">
                  {item.name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-400">{item.category}</p>
              </div>
            </div>

            <div>
              <p className="text-sm">{item.quantity} {item.unit}</p>
              <div className="mt-1 h-2 w-full max-w-36 rounded-full bg-gray-200">
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
              <p className="mt-1 text-[11px] text-gray-400">
                {item.quantity} / {item.target_quantity} target - low at {item.low_stock_threshold} {item.unit}
              </p>
            </div>

            <div className="text-xs">
              <p className={expiry.tone}>{expiry.dateLabel}</p>
              <p className={`text-[11px] ${expiry.tone}`}>{expiry.hint}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`rounded-full px-3 py-1 text-xs ${primaryStatus.style}`}>
                {primaryStatus.label}
              </Badge>
              {!item.is_expired && item.is_expiring_soon && (
                <Badge className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-600">
                  {item.days_until_expiry === 0 ? "Today" : "Soon"}
                </Badge>
              )}
            </div>

            <div className="relative flex justify-end">
              <button
                onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <MoreVertical size={16} />
              </button>

              {activeMenu === item.id && (
                <div className="absolute right-0 top-10 z-10 w-44 rounded-xl border bg-white shadow-md">
                  <button
                    onClick={() => {
                      setViewItem(item);
                      setActiveMenu(null);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    View
                  </button>

                  {canManageItems && (
                    <>
                      <button
                        onClick={() => {
                          setEditData(item);
                          setModal(true);
                          setActiveMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setAdjustItem(item);
                          setAdjustOperation("INCREASE");
                          setActiveMenu(null);
                        }}
                        disabled={!canAdjustStock}
                        title={!canAdjustStock ? "Expired items cannot be restocked until expiry is corrected." : undefined}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Restock
                      </button>
                    </>
                  )}

                  {canUseStock && (
                    <button
                      onClick={() => {
                        setAdjustItem(item);
                        setAdjustOperation("DECREASE");
                        setActiveMenu(null);
                      }}
                      disabled={!canAdjustStock || item.quantity <= 0}
                      title={!canAdjustStock ? "Expired items cannot be used as stock." : undefined}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Use Stock
                    </button>
                  )}

                  {canManageItems && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete ${item.name}?`)) return;
                        try {
                          await api.delete(`/inventory/${item.id}`);
                          handleMutation();
                        } catch (err) {
                          console.error(err);
                          setError(err.message || "Failed to delete inventory item.");
                        } finally {
                          setActiveMenu(null);
                        }
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!error && items.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400">
          No items found
        </div>
      )}

      {modal && (
        <ItemModal
          onClose={() => {
            setModal(null);
            setEditData(null);
          }}
          onSaved={handleMutation}
          editData={editData}
        />
      )}

      {viewItem && (
        <ItemDetailsModal
          item={viewItem}
          onClose={() => setViewItem(null)}
        />
      )}

      {adjustItem && (
        <StockAdjustModal
          item={adjustItem}
          operation={adjustOperation}
          onClose={() => setAdjustItem(null)}
          onSaved={handleMutation}
        />
      )}
    </div>
  );
}
