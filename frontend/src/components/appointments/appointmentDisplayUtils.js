export function getRelativeStartLabel(appointmentTime) {
  if (!appointmentTime) return "";
  const appointmentDate = new Date(appointmentTime);
  const now = new Date();
  const diffMinutes = Math.round((appointmentDate.getTime() - now.getTime()) / 60000);

  if (diffMinutes < 0) return "";
  if (diffMinutes <= 5) return "Starting soon";
  if (diffMinutes <= 60) return `Starts in ${diffMinutes} min`;
  if (diffMinutes <= 360) return `Starts in ${Math.floor(diffMinutes / 60)} h`;
  if (appointmentDate.toDateString() === now.toDateString()) return "Later today";

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return appointmentDate.toDateString() === tomorrow.toDateString() ? "Tomorrow" : "";
}

export function getDoctorPrimaryAction(status) {
  switch (status) {
    case "SCHEDULED":
      return {
        label: "Start",
        tone: "border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100",
      };
    case "ONGOING":
      return {
        label: "Continue",
        tone: "border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100",
      };
    case "COMPLETED":
      return {
        label: "Summary",
        tone: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800",
      };
    case "CANCELLED":
      return {
        label: "Patient",
        tone: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800",
      };
    default:
      return null;
  }
}
