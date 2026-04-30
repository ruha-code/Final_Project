import { formatAppointmentDateTime } from "../../utils/dateTime";
import {
  canAdminDeleteAppointment,
  canCancelAppointment,
  formatVisitType,
} from "./appointmentUtils";
import { getRelativeStartLabel } from "./appointmentDisplayUtils";
import { AdminActionButton } from "./AppointmentActions";
import StatusBadge from "./StatusBadge";

const GRID_WITH_ACTIONS =
  "grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_88px_76px_112px_116px]";
const GRID_NO_ACTIONS =
  "grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_88px_76px_112px]";

export default function AdminAppointmentsTable({ appointments, actionLoading, onCancel, onDelete }) {
  const showActions = appointments.some(
    (appointment) => canCancelAppointment(appointment) || canAdminDeleteAppointment(appointment),
  );
  const grid = showActions ? GRID_WITH_ACTIONS : GRID_NO_ACTIONS;

  return (
    <div className="hidden overflow-x-auto lg:block">
      <div className="min-w-[980px]">
        <div
          className={`grid gap-4 border-b bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 ${grid}`}
        >
          <span>Patient</span>
          <span>Doctor</span>
          <span>Type</span>
          <span>Date</span>
          <span>Time</span>
          <span className="text-center">Status</span>
          {showActions && <span className="text-right">Actions</span>}
        </div>

        <div className="divide-y divide-gray-100">
          {appointments.map((appointment) => (
            <AdminAppointmentRow
              key={appointment.id}
              appointment={appointment}
              actionLoading={actionLoading}
              onCancel={onCancel}
              onDelete={onDelete}
              grid={grid}
              showActions={showActions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminAppointmentRow({ appointment, actionLoading, onCancel, onDelete, grid, showActions }) {
  const dateTime = formatAppointmentDateTime(appointment.appointment_time);
  const startHint = getRelativeStartLabel(appointment.appointment_time);

  return (
    <div className={`grid items-center gap-4 px-5 py-3 text-sm transition hover:bg-slate-50 ${grid}`}>
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
      {showActions && (
        <div className="flex items-center justify-end gap-2">
          <AdminActionButton
            appointment={appointment}
            actionLoading={actionLoading}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}
