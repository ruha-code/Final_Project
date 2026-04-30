import { formatAppointmentDateTime } from "../../utils/dateTime";
import { canCancelAppointment, canCompleteAppointment, formatVisitType } from "./appointmentUtils";
import {
  AppointmentActionMenu,
  DoctorPrimaryActionButton,
} from "./AppointmentActions";
import {
  getDoctorPrimaryAction,
  getRelativeStartLabel,
} from "./appointmentDisplayUtils";
import StatusBadge from "./StatusBadge";

const GROUPS = ["IN_PROGRESS", "UPCOMING", "HISTORY"];

export default function DoctorAppointmentQueue({ appointments, ...actions }) {
  const groups = appointments.reduce(
    (result, appointment) => {
      result[getGroup(appointment)].push(appointment);
      return result;
    },
    { IN_PROGRESS: [], UPCOMING: [], HISTORY: [] },
  );

  return (
    <div className="hidden lg:block">
      {GROUPS.map((group) => (
        <DoctorQueueSection key={group} group={group} appointments={groups[group]} {...actions} />
      ))}
    </div>
  );
}

function DoctorQueueSection({ group, appointments, ...actions }) {
  const meta = getSectionMeta(group);
  const datedGroups = groupByDate(appointments);
  const isHistory = group === "HISTORY";

  return (
    <section className="border-b last:border-b-0">
      <div className={`flex items-end justify-between gap-4 px-5 py-3 ${isHistory ? "bg-white" : "bg-gray-50"}`}>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{meta.title}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{meta.description}</p>
        </div>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 ${isHistory ? "bg-gray-50" : "bg-white"}`}>
          {appointments.length}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="px-5 py-5 text-sm text-gray-400">{meta.empty}</div>
      ) : (
        <div className="divide-y">
          {datedGroups.map((dateGroup) => (
            <div key={`${group}-${dateGroup.key}`} className="grid grid-cols-[112px_minmax(0,1fr)]">
              <div className="border-r bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {dateGroup.label}
              </div>
              <div className="divide-y">
                {dateGroup.items.map((appointment) => (
                  <DoctorQueueRow key={appointment.id} appointment={appointment} {...actions} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DoctorQueueRow({ appointment, actionLoading, openActionMenu, setOpenActionMenu, onCancel, onDoctorPrimaryAction, onComplete }) {
  const dateTime = formatAppointmentDateTime(appointment.appointment_time);
  const canCancel = canCancelAppointment(appointment);
  const canComplete = canCompleteAppointment(appointment);
  const startHint = getRelativeStartLabel(appointment.appointment_time);

  return (
    <div className="group grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 transition hover:bg-gray-50">
      <div className="text-sm font-semibold text-gray-900">{dateTime.time}</div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <p className="truncate text-sm font-semibold text-gray-950">{appointment.patient_name}</p>
          <StatusBadge status={appointment.status} className="shrink-0" />
        </div>
        <p className="mt-1 truncate text-sm text-gray-400">{appointment.reason || "No reason provided"}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="capitalize text-gray-700">{formatVisitType(appointment.appointment_type)}</span>
          {startHint && appointment.status === "SCHEDULED" && (
            <><span className="h-1 w-1 rounded-full bg-gray-300" /><span className="font-medium text-teal-600">{startHint}</span></>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DoctorPrimaryActionButton
          appointment={appointment}
          actionLoading={actionLoading}
          action={getDoctorPrimaryAction(appointment.status)}
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
    </div>
  );
}

function getGroup(appointment) {
  if (appointment.status === "ONGOING") return "IN_PROGRESS";
  if (appointment.status === "SCHEDULED") return "UPCOMING";
  return "HISTORY";
}

function getSectionMeta(group) {
  if (group === "IN_PROGRESS") return { title: "In progress", description: "Visits currently open.", empty: "No ongoing visits." };
  if (group === "UPCOMING") return { title: "Upcoming", description: "Scheduled visits grouped by day.", empty: "No upcoming visits." };
  return { title: "History", description: "Completed and cancelled appointments.", empty: "No past appointments." };
}

function groupByDate(appointments) {
  return appointments.reduce((groups, appointment) => {
    const dateTime = formatAppointmentDateTime(appointment.appointment_time);
    const existing = groups.find((group) => group.key === dateTime.dateKey);
    if (existing) existing.items.push(appointment);
    else groups.push({ key: dateTime.dateKey, label: dateTime.date, items: [appointment] });
    return groups;
  }, []);
}
