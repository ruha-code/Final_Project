import { useState } from "react";
import { X } from "lucide-react";

import { formatAppointmentDateTime } from "../../utils/dateTime";
import { STATUS_LABELS } from "./appointmentStatus";
import { formatVisitType } from "./appointmentUtils";

export function CompleteModal({ onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b bg-green-50 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              Complete Appointment
            </h2>
            <p className="text-xs text-gray-500 sm:text-sm">
              Add notes before closing the visit.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Treatment summary, follow-up, prescriptions..."
            className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-xs text-gray-700 sm:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(notes || null)}
              disabled={loading}
              className="flex-1 rounded-xl bg-green-500 px-4 py-2.5 text-xs text-white hover:bg-green-600 disabled:opacity-60 sm:text-sm"
            >
              {loading ? "Completing..." : "Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmModal({ appointment, onClose, onConfirm, loading }) {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b bg-red-50 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              Delete Appointment
            </h2>
            <p className="text-xs text-gray-500 sm:text-sm">
              This action permanently removes the appointment record.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="rounded-2xl bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-800">{appointment.patient_name}</p>
            <p className="mt-1 text-gray-500">Doctor: {appointment.doctor_name}</p>
            <p className="text-gray-500">
              Status: {STATUS_LABELS[appointment.status] || appointment.status}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-xs text-gray-700 sm:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(appointment.id)}
              disabled={loading}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-xs text-white hover:bg-red-600 disabled:opacity-60 sm:text-sm"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentDetailsModal({ appointment, onClose }) {
  if (!appointment) return null;

  const dateTime = formatAppointmentDateTime(appointment.appointment_time);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              Appointment Details
            </h2>
            <p className="text-xs text-gray-500 sm:text-sm">
              {STATUS_LABELS[appointment.status] || appointment.status}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <DetailItem label="Patient" value={appointment.patient_name} />
            <DetailItem label="Doctor" value={appointment.doctor_name} />
            <DetailItem label="Date" value={dateTime.date} />
            <DetailItem label="Time" value={dateTime.time} />
            <DetailItem label="Visit Type" value={formatVisitType(appointment.appointment_type)} />
            <DetailItem label="Duration" value={`${appointment.duration_minutes || 30} minutes`} />
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Reason</p>
            <p className="mt-1 text-gray-700">{appointment.reason || "No reason provided"}</p>
          </div>

          {(appointment.notes || appointment.status === "COMPLETED") && (
            <div className="rounded-2xl bg-green-50 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Clinical Summary
              </p>
              <p className="mt-1 whitespace-pre-wrap text-gray-700">
                {appointment.notes || "No clinical notes were added."}
              </p>
            </div>
          )}

          {appointment.cancelled_at && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Cancellation
              </p>
              <p className="mt-1 text-gray-700">
                Cancelled on {formatAppointmentDateTime(appointment.cancelled_at).date} at{" "}
                {formatAppointmentDateTime(appointment.cancelled_at).time}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value || "N/A"}</p>
    </div>
  );
}
