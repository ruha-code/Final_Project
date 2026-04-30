export default function InventoryFilters({
  search,
  setSearch,
  status,
  setStatus,
  resultCount = 0,
}) {
  const STATUS_OPTIONS = [
    "All",
    "Available",
    "Low",
    "Out",
    "Expired",
    "Expiring Soon",
  ];

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <input
          type="text"
          placeholder="Search name, category, unit, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none xl:w-96"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-500">{resultCount} result(s)</p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl bg-gray-100 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-dashed bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Status rules: Expired overrides stock availability in the UI. Stock thresholds remain Med 100, Consumables 50, Lab 20, Other 10. Expiring Soon means within 30 days.
      </div>
    </div>
  );
}
