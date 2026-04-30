import Badge from "../Badge";
import { STATUS_LABELS } from "./appointmentStatus";

const STATUS_STYLES = {
  COMPLETED: "bg-green-50 text-green-700",
  ONGOING: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-purple-50 text-purple-700",
  CANCELLED: "bg-red-50 text-red-600",
};

export default function StatusBadge({ status, className = "" }) {
  return (
    <Badge
      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-500"
      } ${className}`}
    >
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}
