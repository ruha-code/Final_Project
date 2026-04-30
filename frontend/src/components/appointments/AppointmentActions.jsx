import { CheckCircle2, MoreVertical, XCircle } from "lucide-react";

const MENU_TONES = {
  default: "text-gray-600 hover:bg-gray-50",
  success: "text-green-700 hover:bg-green-50",
  danger: "text-red-600 hover:bg-red-50",
  teal: "text-teal-700 hover:bg-teal-50",
};

export function AppointmentActionMenu({
  appointment,
  actionLoading,
  canCancel,
  canComplete,
  openActionMenu,
  setOpenActionMenu,
  onCancel,
  onComplete,
  items,
  align = "top",
}) {
  const menuItems = items || [
    canComplete && {
      label: "Complete",
      icon: CheckCircle2,
      tone: "success",
      onClick: () => onComplete(appointment.id),
    },
    canCancel && {
      label: "Cancel",
      icon: XCircle,
      tone: "danger",
      onClick: () => onCancel(appointment.id),
    },
  ].filter(Boolean);
  const hasMenu = menuItems.length > 0;

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
          className={`absolute right-0 z-10 w-44 overflow-hidden rounded-xl border bg-white shadow-lg ${
            align === "bottom" ? "bottom-10" : "top-11"
          }`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpenActionMenu(null);
                  void item.onClick();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium ${
                  MENU_TONES[item.tone] || MENU_TONES.default
                }`}
              >
                {Icon && <Icon size={13} />}
                {item.label}
              </button>
            );
          })}
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

export function AdminAppointmentActions({
  appointment,
  actionLoading,
  setOpenActionMenu,
  onView,
}) {
  return (
    <div className="flex w-full items-center justify-center">
      <button
        type="button"
        onClick={() => {
          setOpenActionMenu(null);
          onView(appointment);
        }}
        disabled={actionLoading === appointment.id}
        className="inline-flex h-9 w-[88px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        View
      </button>
    </div>
  );
}
