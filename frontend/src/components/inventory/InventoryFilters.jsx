export default function InventoryFilters({
  search,
  setSearch,
  status,
  setStatus,
}) {
  return (
    <div className="flex justify-between mb-4">
      <input
        type="text"
        placeholder="Search inventory..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none w-64"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="bg-gray-100 px-3 py-2 rounded-xl text-sm"
      >
        <option>All</option>
        <option>Available</option>
        <option>Low</option>
        <option>Out</option>
      </select>
    </div>
  );
}
