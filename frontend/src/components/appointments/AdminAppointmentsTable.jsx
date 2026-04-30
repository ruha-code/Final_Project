import { formatAppointmentDateTime } from "../../utils/dateTime";
import { formatVisitType } from "./appointmentUtils";
import { getRelativeStartLabel } from "./appointmentDisplayUtils";
import { AdminAppointmentActions } from "./AppointmentActions";
import StatusBadge from "./StatusBadge";

const GRID_WITH_ACTIONS =
  "grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_minmax(0,0.9fr)_88px_76px_112px_128px]";

export default function AdminAppointmentsTable({
  appointments,
  actionLoading,
  setOpenActionMenu,
  onView,
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <div className="min-w-[980px]">
        <div
          className={`grid gap-4 border-b bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 ${GRID_WITH_ACTIONS}`}
        >
          <span>Patient</span>
          <span>Doctor</span>
          <span>Type</span>
          <span>Date</span>
          <span>Time</span>
          <span className="text-center">Status</span>
          <span className="text-center">Actions</span>
        </div>

        <div className="divide-y divide-gray-100">
          {appointments.map((appointment) => (
            <AdminAppointmentRow
              key={appointment.id}
              appointment={appointment}
              actionLoading={actionLoading}
              setOpenActionMenu={setOpenActionMenu}
              onView={onView}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminAppointmentRow({
  appointment,
  actionLoading,
  setOpenActionMenu,
  onView,
}) {
  const dateTime = formatAppointmentDateTime(appointment.appointment_time);
  const startHint = getRelativeStartLabel(appointment.appointment_time);

  return (
    <div className={`grid items-center gap-4 px-5 py-3 text-sm transition hover:bg-slate-50 ${GRID_WITH_ACTIONS}`}>
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-900">{appointment.patient_name}</p>
        <p className="truncate text-xs text-gray-400">{appointment.reason || "No reason provided"}</p>
        {startHint && appointment.status === "SCHEDULED" && (
          <p className="mt-1 text-xs font-medium text-teal-600">{startHint}</p>
        )}
      </div>
      <span className="truncate text-gray-700">{appointment.doctor_name}</span>
      <span className="truncate capitalize text-gray-500">{formatVisitType(appointment.appointment_type)}</span>
      <span className="whitespace-nowrap text-gray-500">{dateTime.date}</span>
      <span className="whitespace-nowrap text-gray-500">{dateTime.time}</span>
      <div className="flex items-center justify-center">
        <StatusBadge status={appointment.status} />
      </div>
      <AdminAppointmentActions
        appointment={appointment}
        actionLoading={actionLoading}
        setOpenActionMenu={setOpenActionMenu}
        onView={onView}
      />
    </div>
  );
}
