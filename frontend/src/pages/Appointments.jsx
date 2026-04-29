import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar, ChevronLeft, ChevronRight, Clock,
  MoreVertical, Plus, Trash2, X,
} from "lucide-react";

import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  buildLocalAppointmentTimestamp,
  formatAppointmentDateTime,
  formatDisplayDate,
  getBrowserTimezoneOffsetMinutes,
  getTodayLocalDate,
} from "../utils/dateTime";

const STATUS_STYLES = {
  COMPLETED: "bg-green-50 text-green-700",
  ONGOING: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-purple-50 text-purple-700",
  CANCELLED: "bg-red-50 text-red-600",
};

const STATUS_LABELS = {
  COMPLETED: "Completed",
  ONGOING: "Ongoing",
  SCHEDULED: "Scheduled",
  CANCELLED: "Cancelled",
};

const PATIENT_APPOINTMENT_GRID =
  "grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)_100px_90px_120px_120px]";
const DOCTOR_APPOINTMENT_GRID =
  "grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_100px_90px_130px_220px]";
const VALID_APPOINTMENT_STATUSES = new Set([
  "SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED",
]);

function sanitizeAppointments(records) {
  if (!Array.isArray(records)) return [];
  const seen = new Set();
  return records.filter((item) => {
    if (!item || typeof item !== "object") return false;
    if (typeof item.id !== "number" || seen.has(item.id)) return false;
    if (!item.appointment_time || !VALID_APPOINTMENT_STATUSES.has(item.status)) return false;
    seen.add(item.id);
    return true;
  });
}

async function fetchAllAdminAppointments() {
  const data = await api.get("/appointments/admin/all?all=true");
  return sanitizeAppointments(Array.isArray(data?.items) ? data.items : []);
}

function StatusBadge({ status, className = "" }) {
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

function SummaryCard({ title, value, description, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 sm:p-5 text-left shadow-sm transition ${
        onClick ? "hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md" : ""
      } ${active ? "border-teal-400 ring-2 ring-teal-100" : "border-gray-200"}`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">{description}</p>
    </button>
  );
}

function Banner({ tone = "success", message, onClose }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs sm:text-sm ${styles}`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}

function CompleteModal({ onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 pb-0 sm:pb-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b bg-green-50 px-4 sm:px-6 py-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Complete Appointment
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
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
              className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-xs sm:text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(notes || null)}
              disabled={loading}
              className="flex-1 rounded-xl bg-green-500 px-4 py-2.5 text-xs sm:text-sm text-white hover:bg-green-600 disabled:opacity-60"
            >
              {loading ? "Completing..." : "Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ appointment, onClose, onConfirm, loading }) {
  if (!appointment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 pb-0 sm:pb-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b bg-red-50 px-4 sm:px-6 py-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Delete Appointment
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
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
              className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-xs sm:text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(appointment.id)}
              disabled={loading}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-xs sm:text-sm text-white hover:bg-red-600 disabled:opacity-60"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ initialDoctorId, initialDate, initialTime, onClose, onBooked }) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate || "");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(initialTime || "");
  const [appointmentType, setAppointmentType] = useState("CONSULTATION");
  const [reason, setReason] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true);
        const data = await api.get("/doctors");
        setDoctors(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load doctors");
      } finally {
        setDoctorsLoading(false);
      }
    };
    void fetchDoctors();
  }, []);

  useEffect(() => {
    if (!initialDoctorId || doctors.length === 0) return;
    const doctor = doctors.find((item) => item.id === Number(initialDoctorId));
    if (!doctor) return;
    setSelectedDoctor(doctor);
    setStep(initialDate ? 2 : 1);
  }, [doctors, initialDate, initialDoctorId]);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    const loadSlots = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await api.get(
          `/doctors/${selectedDoctor.id}/available-slots?date=${selectedDate}&timezone_offset_minutes=${getBrowserTimezoneOffsetMinutes()}`,
        );
        const nextSlots = data?.available_slots || [];
        setSlots(nextSlots);
        if (initialTime && nextSlots.includes(initialTime)) {
          setSelectedSlot(initialTime);
          setStep(3);
          return;
        }
        setSelectedSlot((current) =>
          current && !nextSlots.includes(current) ? "" : current,
        );
      } catch (err) {
        setSlots([]);
        setError(err.message || "Failed to load time slots");
      } finally {
        setLoading(false);
      }
    };
    void loadSlots();
  }, [initialTime, selectedDate, selectedDoctor]);

  const handleBook = async () => {
    if (!selectedDoctor) return setError("Select a doctor first");
    if (!selectedDate) return setError("Select a date first");
    if (!selectedSlot) return setError("Select a time slot");
    try {
      setLoading(true);
      setError("");
      await api.post("/appointments", {
        doctor_id: selectedDoctor.id,
        appointment_time: buildLocalAppointmentTimestamp(selectedDate, selectedSlot),
        appointment_type: appointmentType,
        reason: reason.trim() || null,
      });
      onBooked("Appointment booked successfully.");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const value = doctorSearch.trim().toLowerCase();
    if (!value) return true;
    return (
      doctor.full_name?.toLowerCase().includes(value) ||
      doctor.specialty?.toLowerCase().includes(value) ||
      doctor.department_name?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 pb-0 sm:pb-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
        <div className="border-b bg-teal-50 px-4 sm:px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Book Appointment
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Choose doctor, time and visit type.
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-white">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((value) => (
              <div
                key={value}
                className={`h-1.5 flex-1 rounded-full ${
                  value <= step ? "bg-teal-500" : "bg-teal-100"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="space-y-4 p-4 sm:p-6">
            {error && <Banner tone="error" message={error} onClose={() => setError("")} />}

            {step === 1 && (
              <div className="space-y-4">
                <input
                  value={doctorSearch}
                  onChange={(event) => setDoctorSearch(event.target.value)}
                  placeholder="Search by doctor, specialty or department"
                  className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
                <div className="max-h-64 sm:max-h-80 space-y-3 overflow-y-auto pr-1">
                  {doctorsLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                      No doctors match your search.
                    </div>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`flex w-full items-center gap-3 sm:gap-4 rounded-2xl border px-4 py-3 sm:py-4 text-left ${
                          selectedDoctor?.id === doctor.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-teal-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-sm font-semibold text-teal-700">
                          {doctor.full_name
                            ?.split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {doctor.full_name}
                          </p>
                          <p className="truncate text-xs sm:text-sm text-gray-500">
                            {doctor.specialty || "General physician"}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {doctor.department_name || "No department assigned"}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!selectedDoctor) return setError("Select a doctor to continue");
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm text-white hover:bg-teal-600"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <input
                  type="date"
                  min={getTodayLocalDate()}
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedSlot("");
                  }}
                  className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock size={16} /> Available slots
                  </div>
                  {!selectedDate ? (
                    <p className="text-sm text-gray-400">
                      Choose a date to see available times.
                    </p>
                  ) : loading ? (
                    <div className="flex justify-center py-6">
                      <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-teal-500" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No bookable slots are available for this date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm ${
                            selectedSlot === slot
                              ? "bg-teal-500 text-white"
                              : "bg-white text-gray-700 hover:bg-teal-50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedSlot) return setError("Select a time slot to continue");
                      setStep(3);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm text-white hover:bg-teal-600"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-3 rounded-2xl bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Doctor</span>
                    <span className="font-medium text-gray-900 text-right truncate">
                      {selectedDoctor?.full_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Specialty</span>
                    <span className="font-medium text-gray-900 text-right truncate">
                      {selectedDoctor?.specialty || "General physician"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Date</span>
                    <span className="font-medium text-gray-900">
                      {formatDisplayDate(selectedDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Time</span>
                    <span className="font-medium text-gray-900">{selectedSlot}</span>
                  </div>
                </div>
                <select
                  value={appointmentType}
                  onChange={(event) => setAppointmentType(event.target.value)}
                  className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="SURGERY">Surgery</option>
                </select>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder="Describe symptoms or the reason for your visit"
                  className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={loading}
                    className="rounded-xl bg-teal-500 px-6 py-2.5 text-sm text-white hover:bg-teal-600 disabled:opacity-60"
                  >
                    {loading ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function isUpcomingAppointment(appointment) {
  if (!appointment?.appointment_time) return false;
  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") return false;
  return new Date(appointment.appointment_time).getTime() >= Date.now();
}

function isHistoricalAppointment(appointment) {
  if (!appointment?.appointment_time) return false;
  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return true;
  return new Date(appointment.appointment_time).getTime() < Date.now();
}

function getRelativeStartLabel(appointmentTime) {
  if (!appointmentTime) return "";
  const appointmentDate = new Date(appointmentTime);
  const now = new Date();
  const diffMs = appointmentDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 0) return "";
  if (diffMinutes <= 5) return "Starting soon";
  if (diffMinutes <= 60) return `Starts in ${diffMinutes} min`;
  if (diffMinutes <= 360) {
    const diffHours = Math.floor(diffMinutes / 60);
    return `Starts in ${diffHours} h`;
  }
  const isSameDay = appointmentDate.toDateString() === now.toDateString();
  if (isSameDay) return "Later today";
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (appointmentDate.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return "";
}

function getDoctorPrimaryAction(status) {
  switch (status) {
    case "SCHEDULED":
      return { label: "Start Appointment", tone: "bg-teal-500 text-white hover:bg-teal-600" };
    case "ONGOING":
      return { label: "Continue", tone: "bg-blue-50 text-blue-700 hover:bg-blue-100" };
    case "COMPLETED":
      return { label: "View Summary", tone: "bg-gray-100 text-gray-700 hover:bg-gray-200" };
    case "CANCELLED":
      return { label: "View Patient", tone: "bg-gray-100 text-gray-700 hover:bg-gray-200" };
    default:
      return null;
  }
}

function getEmptyStateCopy({ isPatientView, isDoctorView, filter, searchValue }) {
  if (isPatientView) {
    return "Adjust your filters or book a new appointment to get started.";
  }
  if (searchValue || filter !== "ALL") {
    return "Adjust your search or filters to see more appointments.";
  }
  if (isDoctorView) {
    return "Appointments assigned to you will appear here when they are scheduled.";
  }
  return "Appointments across the clinic will appear here once they are created.";
}

// Мобильная карточка записи
function AppointmentCard({
  appointment, isPatient, isDoctor, isAdmin,
  actionLoading, openActionMenu, setOpenActionMenu,
  handleCancel, handleDoctorPrimaryAction,
  setCompleteModal, setDeleteModal,
}) {
  const dateTime = formatAppointmentDateTime(appointment.appointment_time);
  const canCancel = appointment.status === "SCHEDULED" || appointment.status === "ONGOING";
  const canComplete = isDoctor && appointment.status === "ONGOING";
  const startHint = getRelativeStartLabel(appointment.appointment_time);
  const doctorPrimaryAction = isDoctor ? getDoctorPrimaryAction(appointment.status) : null;
  const hasDoctorMenu = isDoctor && (canCancel || canComplete);
  const canAdminCancel = isAdmin && canCancel;
  const canAdminDelete = isAdmin && appointment.status === "CANCELLED";
  const showNoAdminActions = isAdmin && !canAdminCancel && !canAdminDelete;

  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-none hover:bg-gray-50">
      {/* Верхняя строка: имя + статус */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900 text-sm">
            {isPatient ? appointment.doctor_name : appointment.patient_name}
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

      {/* Детали */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {isPatient ? (
          <span>{appointment.doctor_specialty || "General physician"}</span>
        ) : (
          <span>{appointment.doctor_name}</span>
        )}
        <span>{dateTime.date}</span>
        <span>{dateTime.time}</span>
        {!isPatient && appointment.appointment_type && (
          <span className="capitalize">
            {appointment.appointment_type.toLowerCase().replace("_", " ")}
          </span>
        )}
      </div>

      {/* Действия */}
      <div className="flex flex-wrap gap-2">
        {isPatient && canCancel && (
          <button
            onClick={() => handleCancel(appointment.id)}
            disabled={actionLoading === appointment.id}
            className="flex-1 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
          >
            {actionLoading === appointment.id ? "Updating..." : "Cancel"}
          </button>
        )}

        {isDoctor && doctorPrimaryAction && (
          <button
            onClick={() => {
              setOpenActionMenu(null);
              void handleDoctorPrimaryAction(appointment);
            }}
            disabled={actionLoading === appointment.id}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-center text-xs font-medium transition disabled:opacity-60 ${doctorPrimaryAction.tone}`}
          >
            {actionLoading === appointment.id ? "Updating..." : doctorPrimaryAction.label}
          </button>
        )}

        {isDoctor && hasDoctorMenu && (
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenActionMenu(
                  openActionMenu === appointment.id ? null : appointment.id,
                )
              }
              disabled={actionLoading === appointment.id}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-60"
            >
              <MoreVertical size={14} />
            </button>
            {openActionMenu === appointment.id && (
              <div className="absolute right-0 bottom-10 z-10 w-36 overflow-hidden rounded-xl border bg-white shadow-lg">
                {canComplete && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenu(null);
                      setCompleteModal(appointment.id);
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
                      void handleCancel(appointment.id);
                    }}
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {canAdminCancel && (
          <button
            onClick={() => void handleCancel(appointment.id)}
            disabled={actionLoading === appointment.id}
            className="flex-1 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
          >
            {actionLoading === appointment.id ? "Updating..." : "Cancel"}
          </button>
        )}

        {canAdminDelete && (
          <button
            onClick={() => setDeleteModal(appointment)}
            disabled={actionLoading === appointment.id}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 size={12} />
          </button>
        )}

        {(showNoAdminActions ||
          (!doctorPrimaryAction && !canCancel && !canComplete && !isAdmin)) && (
          <span className="text-xs text-gray-300">No actions</span>
        )}
      </div>
    </div>
  );
}

export default function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isDoctor, isPatient } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [filter, setFilter] = useState(isPatient() ? "UPCOMING" : "ALL");
  const [search, setSearch] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingContext, setBookingContext] = useState({
    doctorId: null, date: "", time: "",
  });

  const triggerReload = () => setReloadKey((current) => current + 1);

  useEffect(() => {
    const state = location.state;
    if (!state?.bookDoctorId) return;
    setBookingContext({
      doctorId: state.bookDoctorId,
      date: state.bookDate || "",
      time: state.bookTime || "",
    });
    setShowBooking(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setPageError("");
        if (isAdmin()) {
          const data = await fetchAllAdminAppointments();
          setAppointments(data);
          return;
        }
        const data = await api.get("/appointments/my");
        setAppointments(
          sanitizeAppointments(Array.isArray(data) ? data : []),
        );
      } catch (err) {
        setPageError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
    void fetchAppointments();
  }, [isAdmin, reloadKey]);

  const handleCancel = async (appointmentId) => {
    try {
      setActionLoading(appointmentId);
      if (isAdmin()) await api.put(`/appointments/${appointmentId}/admin-cancel`);
      else await api.put(`/appointments/${appointmentId}/cancel`);
      setFeedback({ tone: "success", message: "Appointment updated successfully." });
      triggerReload();
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Failed to cancel appointment" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (notes) => {
    try {
      setActionLoading(completeModal);
      await api.put(`/appointments/${completeModal}/complete`, { notes });
      setFeedback({ tone: "success", message: "Appointment marked as completed." });
      setCompleteModal(null);
      triggerReload();
    } catch (err) {
      setFeedback({
        tone: "error",
        message: err.message || "Failed to complete appointment",
      });
      setCompleteModal(null);
    } finally {
      setActionLoading(null);
    }
  };

  const openPatientCase = (appointment) => {
    navigate(`/patients/${appointment.patient_id}`, {
      state: {
        appointmentId: appointment.id,
        appointmentStatus: appointment.status,
      },
    });
  };

  const handleDoctorPrimaryAction = async (appointment) => {
    if (appointment.status === "SCHEDULED") {
      try {
        setActionLoading(appointment.id);
        await api.put(`/appointments/${appointment.id}/start`);
        triggerReload();
        navigate(`/patients/${appointment.patient_id}`, {
          state: { appointmentId: appointment.id, appointmentStatus: "ONGOING" },
        });
      } catch (err) {
        setFeedback({
          tone: "error",
          message: err.message || "Failed to start appointment",
        });
      } finally {
        setActionLoading(null);
      }
      return;
    }
    openPatientCase(appointment);
  };

  const handleDelete = async (appointmentId) => {
    try {
      setActionLoading(appointmentId);
      await api.delete(`/appointments/${appointmentId}`);
      setFeedback({ tone: "success", message: "Appointment deleted successfully." });
      setDeleteModal(null);
      triggerReload();
    } catch (err) {
      setFeedback({
        tone: "error",
        message: err.message || "Failed to delete appointment",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const todayKey = getTodayLocalDate();
  const searchValue = search.trim().toLowerCase();
  const searchMatchedAppointments = appointments.filter(
    (appointment) =>
      !searchValue ||
      appointment.patient_name?.toLowerCase().includes(searchValue) ||
      appointment.doctor_name?.toLowerCase().includes(searchValue) ||
      appointment.doctor_specialty?.toLowerCase().includes(searchValue) ||
      appointment.reason?.toLowerCase().includes(searchValue),
  );

  const filteredAppointments = searchMatchedAppointments
    .filter((appointment) => {
      if (isPatient()) {
        if (filter === "UPCOMING") return isUpcomingAppointment(appointment);
        if (filter === "HISTORY") return isHistoricalAppointment(appointment);
        if (filter === "CANCELLED") return appointment.status === "CANCELLED";
        return true;
      }
      if (filter === "TODAY")
        return (
          formatAppointmentDateTime(appointment.appointment_time).dateKey === todayKey
        );
      if (filter === "ALL") return true;
      return appointment.status === filter;
    })
    .sort(
      (first, second) =>
        new Date(first.appointment_time).getTime() -
        new Date(second.appointment_time).getTime(),
    );

  const countSource = searchValue ? searchMatchedAppointments : appointments;
  const nextAppointment = countSource
    .filter(isUpcomingAppointment)
    .sort(
      (first, second) =>
        new Date(first.appointment_time).getTime() -
        new Date(second.appointment_time).getTime(),
    )[0];
  const upcomingCount = countSource.filter(isUpcomingAppointment).length;
  const historyCount = countSource.filter(isHistoricalAppointment).length;
  const todayCount = countSource.filter(
    (appointment) =>
      formatAppointmentDateTime(appointment.appointment_time).dateKey === todayKey,
  ).length;
  const completedCount = countSource.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;
  const scheduledCount = countSource.filter(
    (appointment) => appointment.status === "SCHEDULED",
  ).length;
  const ongoingCount = countSource.filter(
    (appointment) => appointment.status === "ONGOING",
  ).length;
  const emptyStateCopy = getEmptyStateCopy({
    isPatientView: isPatient(),
    isDoctorView: isDoctor(),
    filter,
    searchValue,
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-5 md:space-y-6">

        {/* Шапка */}
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 sm:p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Appointments</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {isPatient()
                ? "Track visits, review history and book new appointments."
                : isDoctor()
                  ? "Start upcoming visits, continue ongoing ones and keep your day moving."
                  : "Monitor and administer all appointments in the system."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search appointments"
              className="w-full sm:w-auto rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
            {isPatient() && (
              <button
                onClick={() => {
                  setBookingContext({ doctorId: null, date: "", time: "" });
                  setShowBooking(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600"
              >
                <Plus size={16} /> Book Appointment
              </button>
            )}
          </div>
        </div>

        {pageError && (
          <Banner tone="error" message={pageError} onClose={() => setPageError("")} />
        )}
        {feedback && (
          <Banner
            tone={feedback.tone}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        )}

        {/* Summary Cards */}
        {isPatient() ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <SummaryCard
              title="Next Appointment"
              value={
                nextAppointment
                  ? `${formatAppointmentDateTime(nextAppointment.appointment_time).date}, ${formatAppointmentDateTime(nextAppointment.appointment_time).time}`
                  : "None scheduled"
              }
              description={
                nextAppointment
                  ? `With ${nextAppointment.doctor_name}`
                  : "Book your next visit when you're ready."
              }
            />
            <SummaryCard
              title="Upcoming"
              value={upcomingCount}
              description="Future appointments that are still active."
            />
            <SummaryCard
              title="History"
              value={historyCount}
              description="Completed, past or cancelled appointments."
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Today"
              value={todayCount}
              description="Appointments happening today."
              active={filter === "TODAY"}
              onClick={() => setFilter("TODAY")}
            />
            <SummaryCard
              title="Scheduled"
              value={scheduledCount}
              description="Upcoming visits waiting to start."
              active={filter === "SCHEDULED"}
              onClick={() => setFilter("SCHEDULED")}
            />
            <SummaryCard
              title="Ongoing"
              value={ongoingCount}
              description="Appointments currently in progress."
              active={filter === "ONGOING"}
              onClick={() => setFilter("ONGOING")}
            />
            <SummaryCard
              title="Completed"
              value={completedCount}
              description="Visits already completed."
              active={filter === "COMPLETED"}
              onClick={() => setFilter("COMPLETED")}
            />
          </div>
        )}

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2">
          {(isPatient()
            ? [
                { value: "UPCOMING", label: "Upcoming" },
                { value: "HISTORY", label: "History" },
                { value: "CANCELLED", label: "Cancelled" },
              ]
            : [
                { value: "ALL", label: "All" },
                { value: "TODAY", label: "Today" },
                { value: "SCHEDULED", label: "Scheduled" },
                { value: "ONGOING", label: "Ongoing" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                filter === option.value
                  ? "bg-teal-500 text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Таблица / Карточки */}
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          {filteredAppointments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar className="mx-auto mb-3 text-gray-300" size={28} />
              <p className="text-base font-medium text-gray-600">No appointments found</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-400">{emptyStateCopy}</p>
            </div>
          ) : (
            <>
              {/* Таблица — только lg+ */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="min-w-[900px]">
                  <div
                    className={`grid gap-4 border-b bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 ${
                      isPatient() ? PATIENT_APPOINTMENT_GRID : DOCTOR_APPOINTMENT_GRID
                    }`}
                  >
                    {isPatient() ? (
                      <>
                        <span>Doctor</span>
                        <span>Specialty</span>
                        <span>Date</span>
                        <span>Time</span>
                        <span className="text-center">Status</span>
                        <span className="text-center">Actions</span>
                      </>
                    ) : (
                      <>
                        <span>Patient</span>
                        <span>Doctor</span>
                        <span>Type</span>
                        <span>Date</span>
                        <span>Time</span>
                        <span className="text-center">Status</span>
                        <span className="text-center">Actions</span>
                      </>
                    )}
                  </div>
                  <div className="divide-y">
                    {filteredAppointments.map((appointment) => {
                      const dateTime = formatAppointmentDateTime(
                        appointment.appointment_time,
                      );
                      const canCancel =
                        appointment.status === "SCHEDULED" ||
                        appointment.status === "ONGOING";
                      const canComplete =
                        isDoctor() && appointment.status === "ONGOING";
                      const startHint = getRelativeStartLabel(
                        appointment.appointment_time,
                      );
                      const doctorPrimaryAction = isDoctor()
                        ? getDoctorPrimaryAction(appointment.status)
                        : null;
                      const hasDoctorMenu = isDoctor() && (canCancel || canComplete);
                      const canAdminCancel = isAdmin() && canCancel;
                      const canAdminDelete =
                        isAdmin() && appointment.status === "CANCELLED";
                      const showNoAdminActions =
                        isAdmin() && !canAdminCancel && !canAdminDelete;
                      return (
                        <div
                          key={appointment.id}
                          className={`grid items-center gap-4 px-6 py-4 text-sm ${
                            isPatient()
                              ? PATIENT_APPOINTMENT_GRID
                              : DOCTOR_APPOINTMENT_GRID
                          }`}
                        >
                          {isPatient() ? (
                            <>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">
                                  {appointment.doctor_name}
                                </p>
                                <p className="truncate text-xs text-gray-400">
                                  {appointment.reason || "No reason provided"}
                                </p>
                              </div>
                              <span className="truncate text-gray-500">
                                {appointment.doctor_specialty || "General physician"}
                              </span>
                              <span className="whitespace-nowrap text-gray-500">
                                {dateTime.date}
                              </span>
                              <span className="whitespace-nowrap text-gray-500">
                                {dateTime.time}
                              </span>
                              <div className="flex items-center justify-center">
                                <StatusBadge status={appointment.status} />
                              </div>
                              <div className="flex items-center justify-center">
                                {canCancel ? (
                                  <button
                                    onClick={() => handleCancel(appointment.id)}
                                    disabled={actionLoading === appointment.id}
                                    className="min-w-[92px] rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                                  >
                                    {actionLoading === appointment.id
                                      ? "Updating..."
                                      : "Cancel"}
                                  </button>
                                ) : (
                                  <span className="text-center text-xs text-gray-300">
                                    No actions
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">
                                  {appointment.patient_name}
                                </p>
                                <p className="truncate text-xs text-gray-400">
                                  {appointment.reason || "No reason provided"}
                                </p>
                                {startHint && appointment.status === "SCHEDULED" && (
                                  <p className="mt-1 text-xs font-medium text-teal-600">
                                    {startHint}
                                  </p>
                                )}
                              </div>
                              <span className="truncate text-gray-700">
                                {appointment.doctor_name}
                              </span>
                              <span className="truncate capitalize text-gray-500">
                                {appointment.appointment_type
                                  ?.toLowerCase()
                                  .replace("_", " ")}
                              </span>
                              <span className="whitespace-nowrap text-gray-500">
                                {dateTime.date}
                              </span>
                              <span className="whitespace-nowrap text-gray-500">
                                {dateTime.time}
                              </span>
                              <div className="flex items-center justify-center">
                                <StatusBadge status={appointment.status} />
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                {isDoctor() && doctorPrimaryAction && (
                                  <button
                                    onClick={() => {
                                      setOpenActionMenu(null);
                                      void handleDoctorPrimaryAction(appointment);
                                    }}
                                    disabled={actionLoading === appointment.id}
                                    className={`w-fit whitespace-nowrap rounded-lg px-3 py-1.5 text-center text-xs font-medium transition disabled:opacity-60 ${doctorPrimaryAction.tone}`}
                                  >
                                    {actionLoading === appointment.id
                                      ? "Updating..."
                                      : doctorPrimaryAction.label}
                                  </button>
                                )}
                                {isDoctor() && (
                                  <div className="relative shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        hasDoctorMenu &&
                                        setOpenActionMenu(
                                          openActionMenu === appointment.id
                                            ? null
                                            : appointment.id,
                                        )
                                      }
                                      disabled={
                                        actionLoading === appointment.id ||
                                        !hasDoctorMenu
                                      }
                                      className={`rounded-lg border border-gray-200 px-2 py-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-60 ${
                                        !hasDoctorMenu
                                          ? "invisible pointer-events-none"
                                          : ""
                                      }`}
                                      aria-label="More actions"
                                    >
                                      <MoreVertical size={14} />
                                    </button>
                                    {openActionMenu === appointment.id && (
                                      <div className="absolute right-0 top-11 z-10 w-36 overflow-hidden rounded-xl border bg-white shadow-lg">
                                        {canComplete && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenu(null);
                                              setCompleteModal(appointment.id);
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
                                              void handleCancel(appointment.id);
                                            }}
                                            className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {canAdminCancel && (
                                  <button
                                    onClick={() => void handleCancel(appointment.id)}
                                    disabled={actionLoading === appointment.id}
                                    className="min-w-[92px] rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                                  >
                                    {actionLoading === appointment.id
                                      ? "Updating..."
                                      : "Cancel"}
                                  </button>
                                )}
                                {canAdminDelete && (
                                  <button
                                    onClick={() => setDeleteModal(appointment)}
                                    disabled={actionLoading === appointment.id}
                                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                                    aria-label="Delete appointment"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                                {showNoAdminActions && (
                                  <span className="text-xs text-gray-300">No actions</span>
                                )}
                                {!doctorPrimaryAction &&
                                  !canCancel &&
                                  !canComplete &&
                                  !isAdmin() && (
                                    <span className="text-xs text-gray-300">
                                      No actions
                                    </span>
                                  )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Карточки — только до lg */}
              <div className="lg:hidden divide-y">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    isPatient={isPatient()}
                    isDoctor={isDoctor()}
                    isAdmin={isAdmin()}
                    actionLoading={actionLoading}
                    openActionMenu={openActionMenu}
                    setOpenActionMenu={setOpenActionMenu}
                    handleCancel={handleCancel}
                    handleDoctorPrimaryAction={handleDoctorPrimaryAction}
                    setCompleteModal={setCompleteModal}
                    setDeleteModal={setDeleteModal}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showBooking && (
        <BookingModal
          initialDoctorId={bookingContext.doctorId}
          initialDate={bookingContext.date}
          initialTime={bookingContext.time}
          onClose={() => setShowBooking(false)}
          onBooked={(message) => {
            setFeedback({ tone: "success", message });
            triggerReload();
          }}
        />
      )}

      {completeModal && (
        <CompleteModal
          onClose={() => setCompleteModal(null)}
          onConfirm={handleComplete}
          loading={actionLoading === completeModal}
        />
      )}

      {deleteModal && (
        <DeleteConfirmModal
          appointment={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          loading={actionLoading === deleteModal.id}
        />
      )}
    </>
  );
}