export default function InventoryFilters({
  search,
  setSearch,
  status,
  setStatus,
  resultCount = 0,
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Search name, category, unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-80 rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none"
        />

        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">{resultCount} result(s)</p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl bg-gray-100 px-3 py-2 text-sm"
          >
            <option>All</option>
            <option>Available</option>
            <option>Low</option>
            <option>Out</option>
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-dashed bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Status rules: Out = 0 units, Low = at or below category threshold (Med 100, Consumables 50, Lab 20, Other 10), Available = above threshold.
      </div>
    </div>
  );
}
