import { formatAppointmentDateTime } from "../../utils/dateTime";

export const VALID_APPOINTMENT_STATUSES = new Set([
  "SCHEDULED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export function sanitizeAppointments(records) {
  if (!Array.isArray(records)) return [];
  const seen = new Set();

  return records.filter((item) => {
    if (!item || typeof item !== "object") return false;
    if (typeof item.id !== "number" || seen.has(item.id)) return false;
    if (!item.appointment_time || !VALID_APPOINTMENT_STATUSES.has(item.status)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

export function canCancelAppointment(appointment) {
  return appointment.status === "SCHEDULED" || appointment.status === "ONGOING";
}

export function canAdminDeleteAppointment(appointment) {
  return appointment.status === "CANCELLED";
}

export function canCompleteAppointment(appointment) {
  return appointment.status === "ONGOING";
}

export function formatVisitType(type) {
  return type?.toLowerCase().replace("_", " ") || "Consultation";
}

export function isUpcomingAppointment(appointment) {
  if (!appointment?.appointment_time) return false;
  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    return false;
  }
  return new Date(appointment.appointment_time).getTime() >= Date.now();
}

export function isHistoricalAppointment(appointment) {
  if (!appointment?.appointment_time) return false;
  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    return true;
  }
  return new Date(appointment.appointment_time).getTime() < Date.now();
}

export function isDoctorWorklistAppointment(appointment) {
  if (!appointment?.appointment_time) return false;
  if (appointment.status === "ONGOING") return true;
  return (
    appointment.status === "SCHEDULED" &&
    new Date(appointment.appointment_time).getTime() >= Date.now()
  );
}

export function appointmentMatchesSearch(appointment, searchValue) {
  if (!searchValue) return true;
  return [
    appointment.patient_name,
    appointment.doctor_name,
    appointment.doctor_specialty,
    appointment.reason,
  ].some((value) => value?.toLowerCase().includes(searchValue));
}

export function filterAppointmentsByRole(appointments, { filter, role, todayKey }) {
  return appointments
    .filter((appointment) => {
      if (role === "PATIENT") {
        if (filter === "UPCOMING") return isUpcomingAppointment(appointment);
        if (filter === "HISTORY") return isHistoricalAppointment(appointment);
        if (filter === "CANCELLED") return appointment.status === "CANCELLED";
        return true;
      }

      if (role === "DOCTOR") {
        if (filter === "WORKLIST") return isDoctorWorklistAppointment(appointment);
        if (filter === "TODAY") {
          return formatAppointmentDateTime(appointment.appointment_time).dateKey === todayKey;
        }
        if (filter === "HISTORY") return isHistoricalAppointment(appointment);
        if (filter === "ALL") return true;
        return appointment.status === filter;
      }

      if (filter === "TODAY") {
        return formatAppointmentDateTime(appointment.appointment_time).dateKey === todayKey;
      }
      if (filter === "ALL") return true;
      return appointment.status === filter;
    })
    .sort(
      (first, second) =>
        new Date(first.appointment_time).getTime() -
        new Date(second.appointment_time).getTime(),
    );
}

export function getAppointmentCounts(appointments, todayKey) {
  return {
    total: appointments.length,
    upcoming: appointments.filter(isUpcomingAppointment).length,
    history: appointments.filter(isHistoricalAppointment).length,
    worklist: appointments.filter(isDoctorWorklistAppointment).length,
    today: appointments.filter(
      (appointment) =>
        formatAppointmentDateTime(appointment.appointment_time).dateKey === todayKey,
    ).length,
    completed: appointments.filter((appointment) => appointment.status === "COMPLETED").length,
    scheduled: appointments.filter((appointment) => appointment.status === "SCHEDULED").length,
    ongoing: appointments.filter((appointment) => appointment.status === "ONGOING").length,
    cancelled: appointments.filter((appointment) => appointment.status === "CANCELLED").length,
  };
}

export function getNextAppointment(appointments) {
  return appointments
    .filter(isUpcomingAppointment)
    .sort(
      (first, second) =>
        new Date(first.appointment_time).getTime() -
        new Date(second.appointment_time).getTime(),
    )[0];
}

export function getAdminStats(counts) {
  return [
    { label: "All", value: counts.total, filterValue: "ALL" },
    { label: "Today", value: counts.today, filterValue: "TODAY" },
    { label: "Scheduled", value: counts.scheduled, filterValue: "SCHEDULED" },
    { label: "Ongoing", value: counts.ongoing, filterValue: "ONGOING" },
    { label: "Cancelled", value: counts.cancelled, filterValue: "CANCELLED" },
  ];
}

export function getEmptyStateCopy({ isPatientView, isDoctorView, filter, searchValue }) {
  if (isPatientView) return "Adjust your filters or book a new appointment to get started.";
  if (searchValue || filter !== "ALL") return "Adjust your search or filters to see more appointments.";
  if (isDoctorView) return "Appointments assigned to you will appear here when they are scheduled.";
  return "Appointments across the clinic will appear here once they are created.";
}
