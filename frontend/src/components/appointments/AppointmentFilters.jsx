const PATIENT_FILTERS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "HISTORY", label: "History" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STAFF_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "TODAY", label: "Today" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const DOCTOR_FILTERS = [
  { value: "WORKLIST", label: "Worklist" },
  { value: "TODAY", label: "Today" },
  { value: "ONGOING", label: "In progress" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "HISTORY", label: "History" },
  { value: "ALL", label: "All" },
];

export default function AppointmentFilters({
  isPatientView,
  isDoctorView,
  filter,
  setFilter,
}) {
  const options = isPatientView
    ? PATIENT_FILTERS
    : isDoctorView
      ? DOCTOR_FILTERS
      : STAFF_FILTERS;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isDoctorView && (
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Focus
        </span>
      )}
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setFilter(option.value)}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
            filter === option.value
              ? "bg-teal-500 text-white"
              : "bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
