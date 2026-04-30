import { Plus } from "lucide-react";
import { X } from "lucide-react";

import { formatAppointmentDateTime } from "../../utils/dateTime";
import AppointmentFilters from "./AppointmentFilters";
import AppointmentSummaryCards from "./AppointmentSummaryCards";

export function AppointmentBanner({ tone = "success", message, onClose }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";
  return (
    <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs sm:text-sm ${styles}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}

export function AppointmentPageHeader({ isPatientView, search, setSearch, onBook }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Appointments</h1>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          {isPatientView
            ? "Track visits, review history and book new appointments."
            : "Start upcoming visits, continue ongoing ones and keep your day moving."}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search appointments"
          className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400 sm:w-auto"
        />
        {isPatientView && (
          <button
            onClick={onBook}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600"
          >
            <Plus size={16} /> Book Appointment
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminAppointmentControls({ adminStats, filter, setFilter, search, setSearch }) {
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {adminStats.map((item) => (
            <button
              key={item.filterValue}
              type="button"
              onClick={() => setFilter(item.filterValue)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition ${
                filter === item.filterValue
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  filter === item.filterValue ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.value}
              </span>
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search patient, doctor, reason"
          className="w-full rounded-2xl bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 xl:w-80"
        />
      </div>
    </div>
  );
}

export function StaffAppointmentControls({
  isPatientView,
  isDoctorView,
  filter,
  setFilter,
  nextAppointment,
  counts,
}) {
  return (
    <>
      <AppointmentSummaryCards
        isPatientView={isPatientView}
        isDoctorView={isDoctorView}
        filter={filter}
        setFilter={setFilter}
        nextAppointmentLabel={getNextAppointmentLabel(nextAppointment)}
        nextAppointmentDescription={
          nextAppointment ? `With ${nextAppointment.doctor_name}` : "Book your next visit when you're ready."
        }
        worklistCount={counts.worklist}
        upcomingCount={counts.upcoming}
        historyCount={counts.history}
        todayCount={counts.today}
        scheduledCount={counts.scheduled}
        ongoingCount={counts.ongoing}
        completedCount={counts.completed}
        cancelledCount={counts.cancelled}
      />
      <AppointmentFilters
        isPatientView={isPatientView}
        isDoctorView={isDoctorView}
        filter={filter}
        setFilter={setFilter}
      />
    </>
  );
}

function getNextAppointmentLabel(appointment) {
  if (!appointment) return "None scheduled";
  const dateTime = formatAppointmentDateTime(appointment.appointment_time);
  return `${dateTime.date}, ${dateTime.time}`;
}
