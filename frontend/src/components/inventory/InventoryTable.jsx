import { useState } from "react";
import { MoreVertical } from "lucide-react";

const data = [
  {
    id: 1,
    name: "Surgical Gloves",
    category: "Consumables",
    stock: 80,
    quantity: "320 boxes",
    status: "Available",
    image: "пока что пусто, потом добавлю",
  },
  {
    id: 2,
    name: "Paracetamol",
    category: "Medications",
    stock: 20,
    quantity: "24 boxes",
    status: "Low",
    image: "пока что пусто, потом добавлю",
  },
  {
    id: 3,
    name: "COVID Test Kit",
    category: "Laboratory",
    stock: 0,
    quantity: "0 packs",
    status: "Out",
    image: "пока что пусто, потом добавлю",
  },
];

export default function InventoryTable({ search = "", status = "All" }) {
  const [activeMenu, setActiveMenu] = useState(null);

  const filtered = data
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => (status === "All" ? true : item.status === status));

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
      {filtered.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-4 items-center px-6 py-4 border-t hover:bg-gray-50 relative"
        >
          {/* ITEM */}
          <div className="flex items-center gap-3">
            <img
              src={item.image}
              className="w-10 h-10 rounded-lg object-cover"
            />

            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-400">{item.category}</p>
            </div>
          </div>

          {/* STOCK */}
          <div>
            <p className="text-sm">{item.quantity}</p>

            <div className="h-2 bg-gray-200 rounded-full mt-1 w-32">
              <div
                className="h-2 bg-teal-500 rounded-full"
                style={{ width: `${item.stock}%` }}
              />
            </div>
          </div>

          {/* STATUS */}
          <span
            className={`text-xs px-3 py-1 rounded-full w-fit ${
              item.status === "Available"
                ? "bg-teal-100 text-teal-600"
                : item.status === "Low"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-red-100 text-red-500"
            }`}
          >
            {item.status}
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

            {/* DROPDOWN */}
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

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No items found
        </div>
      )}
    </div>
  );
}
