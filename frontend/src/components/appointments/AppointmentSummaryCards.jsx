function SummaryCard({ title, value, description, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition sm:p-5 ${
        onClick ? "hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md" : ""
      } ${active ? "border-teal-400 ring-2 ring-teal-100" : "border-gray-200"}`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900 sm:mt-2 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">{description}</p>
    </button>
  );
}

export default function AppointmentSummaryCards({
  isPatientView,
  isDoctorView,
  filter,
  setFilter,
  nextAppointmentLabel,
  nextAppointmentDescription,
  worklistCount,
  upcomingCount,
  historyCount,
  todayCount,
  scheduledCount,
  ongoingCount,
  completedCount,
  cancelledCount,
}) {
  if (isPatientView) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <SummaryCard
          title="Next Appointment"
          value={nextAppointmentLabel}
          description={nextAppointmentDescription}
          active={filter === "UPCOMING"}
          onClick={() => setFilter("UPCOMING")}
        />
        <SummaryCard
          title="Upcoming"
          value={upcomingCount}
          description="Future appointments that are still active."
          active={filter === "UPCOMING"}
          onClick={() => setFilter("UPCOMING")}
        />
        <SummaryCard
          title="History"
          value={historyCount}
          description="Completed, past or cancelled appointments."
          active={filter === "HISTORY"}
          onClick={() => setFilter("HISTORY")}
        />
      </div>
    );
  }

  if (isDoctorView) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Worklist"
          value={worklistCount}
          description="Active and upcoming visits."
          active={filter === "WORKLIST"}
          onClick={() => setFilter("WORKLIST")}
        />
        <SummaryCard
          title="Today"
          value={todayCount}
          description="Appointments happening today."
          active={filter === "TODAY"}
          onClick={() => setFilter("TODAY")}
        />
        <SummaryCard
          title="In Progress"
          value={ongoingCount}
          description="Visits currently open."
          active={filter === "ONGOING"}
          onClick={() => setFilter("ONGOING")}
        />
        <SummaryCard
          title="Completed"
          value={completedCount}
          description="Visits already completed."
          active={filter === "COMPLETED"}
          onClick={() => setFilter("COMPLETED")}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      <SummaryCard
        title="Today"
        value={todayCount}
        description="Appointments happening today."
        active={filter === "TODAY"}
        onClick={() => setFilter("TODAY")}
      />
      <SummaryCard
        title="Scheduled"
        value={scheduledCount}
        description="Upcoming visits waiting to start."
        active={filter === "SCHEDULED"}
        onClick={() => setFilter("SCHEDULED")}
      />
      <SummaryCard
        title="Ongoing"
        value={ongoingCount}
        description="Appointments currently in progress."
        active={filter === "ONGOING"}
        onClick={() => setFilter("ONGOING")}
      />
      <SummaryCard
        title="Completed"
        value={completedCount}
        description="Visits already completed."
        active={filter === "COMPLETED"}
        onClick={() => setFilter("COMPLETED")}
      />
      <SummaryCard
        title="Cancelled"
        value={cancelledCount}
        description="Removed visits ready for cleanup."
        active={filter === "CANCELLED"}
        onClick={() => setFilter("CANCELLED")}
      />
    </div>
  );
}
