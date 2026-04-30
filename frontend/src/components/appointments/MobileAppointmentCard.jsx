import { formatAppointmentDateTime } from "../../utils/dateTime";
import {
  canCancelAppointment,
  canCompleteAppointment,
  formatVisitType,
} from "./appointmentUtils";
import {
  AdminAppointmentActions,
  AppointmentActionMenu,
} from "./AppointmentActions";
import {
  getDoctorPrimaryAction,
  getRelativeStartLabel,
} from "./appointmentDisplayUtils";
import StatusBadge from "./StatusBadge";

export default function MobileAppointmentCard({
  appointment,
  isPatientView,
  isDoctorView,
  isAdminView,
  actionLoading,
  openActionMenu,
  setOpenActionMenu,
  onCancel,
  onDoctorPrimaryAction,
  onComplete,
  onView,
}) {
  const dateTime = formatAppointmentDateTime(appointment.appointment_time);
  const canCancel = canCancelAppointment(appointment);
  const canComplete = isDoctorView && canCompleteAppointment(appointment);
  const startHint = getRelativeStartLabel(appointment.appointment_time);
  const doctorAction = isDoctorView ? getDoctorPrimaryAction(appointment.status) : null;

  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-none hover:bg-gray-50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {isPatientView ? appointment.doctor_name : appointment.patient_name}
          </p>
          <p className="truncate text-xs text-gray-400">
            {appointment.reason || "No reason provided"}
          </p>
          {startHint && appointment.status === "SCHEDULED" && (
            <p className="mt-0.5 text-xs font-medium text-teal-600">{startHint}</p>
          )}
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>
          {isPatientView
            ? appointment.doctor_specialty || "General physician"
            : appointment.doctor_name}
        </span>
        <span>{dateTime.date}</span>
        <span>{dateTime.time}</span>
        {!isPatientView && <span className="capitalize">{formatVisitType(appointment.appointment_type)}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {isPatientView && canCancel && (
          <CancelButton appointment={appointment} actionLoading={actionLoading} onCancel={onCancel} />
        )}
        {isPatientView && !canCancel && (
          <ViewButton appointment={appointment} actionLoading={actionLoading} onView={onView} />
        )}
        {isDoctorView && doctorAction && (
          <button
            onClick={() => {
              setOpenActionMenu(null);
              void onDoctorPrimaryAction(appointment);
            }}
            disabled={actionLoading === appointment.id}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-center text-xs font-medium transition disabled:opacity-60 ${doctorAction.tone}`}
          >
            {actionLoading === appointment.id ? "Updating..." : doctorAction.label}
          </button>
        )}
        {isDoctorView && (canCancel || canComplete) && (
          <AppointmentActionMenu
            appointment={appointment}
            actionLoading={actionLoading}
            canCancel={canCancel}
            canComplete={canComplete}
            openActionMenu={openActionMenu}
            setOpenActionMenu={setOpenActionMenu}
            onCancel={onCancel}
            onComplete={onComplete}
            align="bottom"
          />
        )}
        {isAdminView && (
          <div className="w-full">
            <AdminAppointmentActions
              appointment={appointment}
              actionLoading={actionLoading}
              setOpenActionMenu={setOpenActionMenu}
              onView={onView}
            />
          </div>
        )}
        {!doctorAction && !canCancel && !canComplete && !isAdminView && !isPatientView && (
          <span className="text-xs text-gray-300">No actions</span>
        )}
      </div>
    </div>
  );
}

function ViewButton({ appointment, actionLoading, onView }) {
  return (
    <button
      onClick={() => onView(appointment)}
      disabled={actionLoading === appointment.id}
      className="flex-1 rounded-lg bg-gray-100 px-3 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
    >
      View
    </button>
  );
}

function CancelButton({ appointment, actionLoading, onCancel }) {
  return (
    <button
      onClick={() => onCancel(appointment.id)}
      disabled={actionLoading === appointment.id}
      className="flex-1 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
    >
      {actionLoading === appointment.id ? "Updating..." : "Cancel"}
    </button>
  );
}
