import { formatAppointmentDateTime } from "../../utils/dateTime";
import {
  canCancelAppointment,
  canCompleteAppointment,
  formatVisitType,
} from "./appointmentUtils";
import {
  AppointmentActionMenu,
  DoctorPrimaryActionButton,
} from "./AppointmentActions";
import {
  getDoctorPrimaryAction,
  getRelativeStartLabel,
} from "./appointmentDisplayUtils";
import StatusBadge from "./StatusBadge";

const PATIENT_GRID =
  "grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)_100px_90px_120px_120px]";
const STAFF_GRID =
  "grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_100px_90px_130px_160px]";

export default function AppointmentTable({
  appointments,
  isPatientView,
  actionLoading,
  openActionMenu,
  setOpenActionMenu,
  onCancel,
  onDoctorPrimaryAction,
  onComplete,
  onView,
}) {
  const grid = isPatientView ? PATIENT_GRID : STAFF_GRID;

  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[900px]">
          <TableHeader isPatientView={isPatientView} grid={grid} />
          <div className="divide-y">
            {appointments.map((appointment) => (
              <TableRow
                key={appointment.id}
                appointment={appointment}
                isPatientView={isPatientView}
                grid={grid}
                actionLoading={actionLoading}
                openActionMenu={openActionMenu}
                setOpenActionMenu={setOpenActionMenu}
                onCancel={onCancel}
                onDoctorPrimaryAction={onDoctorPrimaryAction}
                onComplete={onComplete}
                onView={onView}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET CARD VIEW */}
      <div className="divide-y lg:hidden">
        {appointments.map((appointment) => (
          <MobileCard
            key={appointment.id}
            appointment={appointment}
            isPatientView={isPatientView}
            actionLoading={actionLoading}
            openActionMenu={openActionMenu}
            setOpenActionMenu={setOpenActionMenu}
            onCancel={onCancel}
            onDoctorPrimaryAction={onDoctorPrimaryAction}
            onComplete={onComplete}
            onView={onView}
          />
        ))}
      </div>
    </>
  );
}

function MobileCard({
  appointment,
  isPatientView,
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
  const canComplete = canCompleteAppointment(appointment);
  const doctorAction = getDoctorPrimaryAction(appointment.status);
  const startHint = getRelativeStartLabel(appointment.appointment_time);

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900 text-sm">
            {isPatientView ? appointment.doctor_name : appointment.patient_name}
          </p>
          <p className="truncate text-xs text-gray-400">
            {isPatientView
              ? (appointment.doctor_specialty || "General physician")
              : (appointment.reason || "No reason provided")}
          </p>
          {!isPatientView && appointment.doctor_name && (
            <p className="truncate text-xs text-gray-500 mt-0.5">
              {appointment.doctor_name} · {formatVisitType(appointment.appointment_type)}
            </p>
          )}
          {!isPatientView && appointment.status === "SCHEDULED" && startHint && (
            <p className="text-xs font-medium text-teal-600 mt-0.5">{startHint}</p>
          )}
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 shrink-0">
          {dateTime.date}, {dateTime.time}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {isPatientView ? (
            canCancel ? (
              <button
                onClick={() => onCancel(appointment.id)}
                disabled={actionLoading === appointment.id}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
              >
                {actionLoading === appointment.id ? "Updating..." : "Cancel"}
              </button>
            ) : (
              <button
                onClick={() => onView(appointment)}
                disabled={actionLoading === appointment.id}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
              >
                View
              </button>
            )
          ) : (
            <>
              <DoctorPrimaryActionButton
                appointment={appointment}
                actionLoading={actionLoading}
                action={doctorAction}
                setOpenActionMenu={setOpenActionMenu}
                onDoctorPrimaryAction={onDoctorPrimaryAction}
                className="h-8 rounded-lg px-3 text-xs font-semibold"
              />
              {(canCancel || canComplete) && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TableHeader({ isPatientView, grid }) {
  return (
    <div className={`grid gap-4 border-b bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 ${grid}`}>
      {isPatientView ? (
        <>
          <span>Doctor</span>
          <span>Specialty</span>
        </>
      ) : (
        <>
          <span>Patient</span>
          <span>Doctor</span>
          <span>Type</span>
        </>
      )}
      <span>Date</span>
      <span>Time</span>
      <span className="text-center">Status</span>
      <span className="text-center">Actions</span>
    </div>
  );
}

function TableRow({ appointment, isPatientView, grid, actionLoading, ...actions }) {
  const dateTime = formatAppointmentDateTime(appointment.appointment_time);

  return (
    <div className={`grid items-center gap-4 px-6 py-4 text-sm ${grid}`}>
      {isPatientView ? (
        <PatientCells
          appointment={appointment}
          dateTime={dateTime}
          actionLoading={actionLoading}
          onCancel={actions.onCancel}
          onView={actions.onView}
        />
      ) : (
        <StaffCells appointment={appointment} dateTime={dateTime} actionLoading={actionLoading} {...actions} />
      )}
    </div>
  );
}

function PatientCells({ appointment, dateTime, actionLoading, onCancel, onView }) {
  const canCancel = canCancelAppointment(appointment);

  return (
    <>
      <AppointmentName name={appointment.doctor_name} reason={appointment.reason} />
      <span className="truncate text-gray-500">{appointment.doctor_specialty || "General physician"}</span>
      <DateStatusCells appointment={appointment} dateTime={dateTime} />
      <div className="flex items-center justify-center">
        {canCancel ? (
          <CancelButton appointment={appointment} actionLoading={actionLoading} onCancel={onCancel} />
        ) : (
          <button
            type="button"
            onClick={() => onView(appointment)}
            disabled={actionLoading === appointment.id}
            className="min-w-[92px] rounded-lg bg-gray-100 px-3 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
          >
            View
          </button>
        )}
      </div>
    </>
  );
}

function StaffCells({ appointment, dateTime, actionLoading, openActionMenu, setOpenActionMenu, onCancel, onDoctorPrimaryAction, onComplete }) {
  const canCancel = canCancelAppointment(appointment);
  const canComplete = canCompleteAppointment(appointment);
  const doctorAction = getDoctorPrimaryAction(appointment.status);
  const startHint = getRelativeStartLabel(appointment.appointment_time);

  return (
    <>
      <AppointmentName name={appointment.patient_name} reason={appointment.reason} hint={appointment.status === "SCHEDULED" ? startHint : ""} />
      <span className="truncate text-gray-700">{appointment.doctor_name}</span>
      <span className="truncate capitalize text-gray-500">{formatVisitType(appointment.appointment_type)}</span>
      <DateStatusCells appointment={appointment} dateTime={dateTime} />
      <div className="flex min-w-[160px] items-center justify-end gap-2">
        <DoctorPrimaryActionButton
          appointment={appointment}
          actionLoading={actionLoading}
          action={doctorAction}
          setOpenActionMenu={setOpenActionMenu}
          onDoctorPrimaryAction={onDoctorPrimaryAction}
        />
        {(canCancel || canComplete) && (
          <AppointmentActionMenu
            appointment={appointment}
            actionLoading={actionLoading}
            canCancel={canCancel}
            canComplete={canComplete}
            openActionMenu={openActionMenu}
            setOpenActionMenu={setOpenActionMenu}
            onCancel={onCancel}
            onComplete={onComplete}
          />
        )}
      </div>
    </>
  );
}

function AppointmentName({ name, reason, hint }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-gray-900">{name}</p>
      <p className="truncate text-xs text-gray-400">{reason || "No reason provided"}</p>
      {hint && <p className="mt-1 text-xs font-medium text-teal-600">{hint}</p>}
    </div>
  );
}

function DateStatusCells({ appointment, dateTime }) {
  return (
    <>
      <span className="whitespace-nowrap text-gray-500">{dateTime.date}</span>
      <span className="whitespace-nowrap text-gray-500">{dateTime.time}</span>
      <div className="flex items-center justify-center">
        <StatusBadge status={appointment.status} />
      </div>
    </>
  );
}

function CancelButton({ appointment, actionLoading, onCancel }) {
  return (
    <button
      onClick={() => onCancel(appointment.id)}
      disabled={actionLoading === appointment.id}
      className="min-w-[92px] rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
    >
      {actionLoading === appointment.id ? "Updating..." : "Cancel"}
    </button>
  );
}
