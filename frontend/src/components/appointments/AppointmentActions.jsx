import { MoreVertical, Trash2 } from "lucide-react";

export function AppointmentActionMenu({
  appointment,
  actionLoading,
  canCancel,
  canComplete,
  openActionMenu,
  setOpenActionMenu,
  onCancel,
  onComplete,
  align = "top",
}) {
  const hasMenu = canCancel || canComplete;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() =>
          hasMenu &&
          setOpenActionMenu(openActionMenu === appointment.id ? null : appointment.id)
        }
        disabled={actionLoading === appointment.id || !hasMenu}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-60 ${
          !hasMenu ? "invisible pointer-events-none" : ""
        }`}
        aria-label="More actions"
      >
        <MoreVertical size={14} />
      </button>
      {openActionMenu === appointment.id && (
        <div
          className={`absolute right-0 z-10 w-36 overflow-hidden rounded-xl border bg-white shadow-lg ${
            align === "bottom" ? "bottom-10" : "top-11"
          }`}
        >
          {canComplete && (
            <button
              type="button"
              onClick={() => {
                setOpenActionMenu(null);
                onComplete(appointment.id);
              }}
              className="block w-full px-3 py-2 text-left text-xs font-medium text-green-700 hover:bg-green-50"
            >
              Complete
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => {
                setOpenActionMenu(null);
                void onCancel(appointment.id);
              }}
              className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DoctorPrimaryActionButton({
  appointment,
  actionLoading,
  action,
  setOpenActionMenu,
  onDoctorPrimaryAction,
  className = "h-9 w-28 rounded-xl px-3 font-semibold",
}) {
  if (!action) return <span className="h-9 w-28 shrink-0" aria-hidden="true" />;

  return (
    <button
      onClick={() => {
        setOpenActionMenu(null);
        void onDoctorPrimaryAction(appointment);
      }}
      disabled={actionLoading === appointment.id}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap text-center text-xs transition disabled:opacity-60 ${className} ${action.tone}`}
    >
      {actionLoading === appointment.id ? "Updating..." : action.label}
    </button>
  );
}

export function AdminActionButton({ appointment, actionLoading, onCancel, onDelete }) {
  if (appointment.status === "CANCELLED") {
    return (
      <button
        onClick={() => onDelete(appointment)}
        disabled={actionLoading === appointment.id}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        aria-label="Delete appointment"
      >
        <Trash2 size={12} /> Delete
      </button>
    );
  }

  if (appointment.status !== "SCHEDULED" && appointment.status !== "ONGOING") return null;

  return (
    <button
      onClick={() => void onCancel(appointment.id)}
      disabled={actionLoading === appointment.id}
      className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-center text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
    >
      {actionLoading === appointment.id ? "Updating..." : "Cancel"}
    </button>
  );
}
