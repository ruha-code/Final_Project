import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, Calendar, ChevronLeft, Mail, Phone, Star } from "lucide-react";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { addDaysToDateString, getTodayLocalDate } from "../utils/dateTime";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getNextDays(count) {
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = getTodayLocalDate();

  for (let i = 0; i < count; i += 1) {
    const date = addDaysToDateString(today, i);
    const [year, month, day] = date.split("-").map(Number);
    const currentDate = new Date(year, month - 1, day);

    days.push({
      date,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayNames[currentDate.getDay()],
      fullDate: currentDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    });
  }

  return days;
}

export default function DoctorDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPatient } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await api.get(`/doctors/${id}`);
      setDoctor(data);
    } catch (err) {
      setDoctor(null);
      setPageError(err.message || "Failed to load doctor");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchSchedule = useCallback(async () => {
    if (!doctor?.is_available) {
      setSchedule({});
      setScheduleError("");
      setScheduleLoading(false);
      return;
    }

    setScheduleLoading(true);
    setScheduleError("");

    const days = getNextDays(5);
    const offset = new Date().getTimezoneOffset();
    const results = await Promise.allSettled(
      days.map((day) =>
        api.get(
          `/doctors/${id}/available-slots?date=${day.date}&timezone_offset_minutes=${offset}`,
        ),
      ),
    );

    const nextSchedule = {};
    let successfulDays = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && Array.isArray(result.value?.available_slots)) {
        nextSchedule[days[index].date] = result.value.available_slots;
        successfulDays += 1;
      }
    });

    setSchedule(nextSchedule);
    if (successfulDays === 0 && days.length > 0) {
      setScheduleError("Failed to load upcoming availability.");
    }
    setScheduleLoading(false);
  }, [doctor?.is_available, id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (doctor) {
      void fetchSchedule();
    }
  }, [doctor, fetchSchedule]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6 text-gray-400">
        {pageError || "Doctor not found"}
      </div>
    );
  }

  const days = getNextDays(5);
  const totalAppointments = doctor.total_appointments || 0;
  const scheduledAppointments = doctor.scheduled_appointments || 0;
  const ongoingAppointments = doctor.ongoing_appointments || 0;
  const completedAppointments = doctor.completed_appointments || 0;
  const cancelledAppointments = doctor.cancelled_appointments || 0;
  const resolvedAppointments = completedAppointments + cancelledAppointments;
  const completionRate = resolvedAppointments > 0
    ? Math.round((completedAppointments / resolvedAppointments) * 100)
    : 0;
  const satisfactionPercent = doctor.rating
    ? Math.round((doctor.rating / 5) * 100)
    : 0;
  const totalOpenSlots = days.reduce(
    (total, day) => total + (schedule[day.date]?.length || 0),
    0,
  );
  const daysWithOpenSlots = days.reduce(
    (count, day) => count + ((schedule[day.date]?.length || 0) > 0 ? 1 : 0),
    0,
  );
  const availabilityCoverage = doctor.is_available && !scheduleLoading && !scheduleError
    ? Math.round((daysWithOpenSlots / days.length) * 100)
    : 0;

  return (
    <div className="space-y-6 px-4 lg:px-0">
      <button
        onClick={() => navigate("/doctors")}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600"
      >
        <ChevronLeft size={16} /> Back to Doctors
      </button>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {pageError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border bg-white p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-2xl font-bold text-teal-700 sm:h-28 sm:w-28 sm:text-3xl">
                {getInitials(doctor.full_name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-semibold sm:text-2xl">
                    {doctor.full_name}
                  </h1>
                  <Badge
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      doctor.is_available
                        ? "bg-teal-100 text-teal-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {doctor.is_available ? "Available" : "Away"}
                  </Badge>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {doctor.specialty || "General Physician"}
                </p>

                {doctor.department_name && (
                  <p className="mt-1 text-xs text-gray-400">
                    {doctor.department_name}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
                  {doctor.email && (
                    <span className="flex items-center gap-2">
                      <Mail size={14} /> {doctor.email}
                    </span>
                  )}
                  {doctor.phone && (
                    <span className="flex items-center gap-2">
                      <Phone size={14} /> {doctor.phone}
                    </span>
                  )}
                </div>

                {doctor.years_of_experience != null && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <Award size={14} />
                    <span>{doctor.years_of_experience} years experience</span>
                  </div>
                )}

                {doctor.rating != null && doctor.rating > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Star size={14} className="fill-amber-500 text-amber-500" />
                    <span className="text-sm font-medium">{doctor.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {doctor.bio && (
              <div className="mt-6 border-t pt-6">
                <h3 className="mb-2 text-sm font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-gray-600">{doctor.bio}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 md:p-5">
            <h3 className="mb-4 text-sm font-semibold">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Total Appointments</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{totalAppointments}</p>
              </div>
              <div className="rounded-xl bg-green-50 px-3 py-2">
                <p className="text-xs text-gray-500">Completed</p>
                <p className="mt-1 text-lg font-semibold text-green-700">
                  {completedAppointments}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 px-3 py-2">
                <p className="text-xs text-gray-500">Scheduled</p>
                <p className="mt-1 text-lg font-semibold text-blue-700">
                  {scheduledAppointments}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2">
                <p className="text-xs text-gray-500">Ongoing</p>
                <p className="mt-1 text-lg font-semibold text-amber-700">
                  {ongoingAppointments}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 px-3 py-2">
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="mt-1 text-lg font-semibold text-rose-700">
                  {cancelledAppointments}
                </p>
              </div>
              <div className="rounded-xl bg-teal-50 px-3 py-2">
                <p className="text-xs text-gray-500">Completion Rate</p>
                <p className="mt-1 text-lg font-semibold text-teal-700">{completionRate}%</p>
                <p className="text-[11px] text-gray-400">
                  {resolvedAppointments
                    ? `${completedAppointments} of ${resolvedAppointments} resolved`
                    : "No resolved appointments yet"}
                </p>
              </div>
            </div>
          </div>

          {isPatient() && (
            <button
              onClick={() =>
                navigate("/appointments", {
                  state: { bookDoctorId: doctor.id },
                })
              }
              disabled={!doctor.is_available}
              className="w-full rounded-xl bg-teal-500 py-3 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {doctor.is_available ? "Book Appointment" : "Currently Unavailable"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 md:p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Calendar size={16} /> Availability - Next 5 Days
        </h3>

        {!doctor.is_available ? (
          <p className="text-sm text-gray-400">This doctor is currently unavailable.</p>
        ) : scheduleLoading ? (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-teal-500" />
            Loading schedule...
          </div>
        ) : scheduleError ? (
          <p className="text-sm text-red-500">{scheduleError}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {days.map((day) => {
              const slots = schedule[day.date] || [];
              const hasSlots = slots.length > 0;

              return (
                <div
                  key={day.date}
                  className={`rounded-xl border p-3 ${
                    hasSlots
                      ? "border-teal-200 bg-teal-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p className="text-xs font-medium text-gray-700">{day.label}</p>
                  <p className="text-xs text-gray-400">{day.fullDate}</p>
                  {hasSlots ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-teal-600">
                        {slots.length} slot{slots.length > 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {slots.slice(0, 3).map((slot) => (
                          <span
                            key={slot}
                            className="rounded bg-white px-1.5 py-0.5 text-xs text-gray-600"
                          >
                            {slot}
                          </span>
                        ))}
                        {slots.length > 3 && (
                          <span className="text-xs text-gray-400">+{slots.length - 3}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">No slots</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 md:p-6">
          <h3 className="mb-4 text-sm font-semibold">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-500">Patient Satisfaction</span>
                <span className="font-medium">
                  {doctor.rating ? `${doctor.rating.toFixed(1)} / 5` : "N/A"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{ width: `${satisfactionPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-500">Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {resolvedAppointments
                  ? `${completedAppointments} completed out of ${resolvedAppointments} resolved appointments`
                  : "Waiting for completed or cancelled appointments to measure resolution"}
              </p>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-500">Days With Open Slots</span>
                <span className="font-medium">
                  {!doctor.is_available
                    ? "Unavailable"
                    : scheduleLoading
                    ? "Loading..."
                    : scheduleError
                    ? "Unavailable data"
                    : `${daysWithOpenSlots}/${days.length}`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${
                    doctor.is_available ? "bg-teal-500" : "bg-gray-300"
                  }`}
                  style={{ width: `${availabilityCoverage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {!doctor.is_available
                  ? "Availability is turned off for this doctor."
                  : scheduleLoading
                  ? "Checking upcoming availability..."
                  : scheduleError
                  ? "Could not load the next 5 days of open slots."
                  : `${totalOpenSlots} open slot${totalOpenSlots === 1 ? "" : "s"} across the next 5 days`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 md:p-6">
          <h3 className="mb-4 text-sm font-semibold">Doctor Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">License</span>
              <span className="font-medium">
                {doctor.license_number || "Not provided"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">License Status</span>
              <Badge
                className={`rounded-lg px-2 py-0.5 text-xs ${
                  doctor.license_status === "APPROVED" || doctor.license_status === "VERIFIED"
                    ? "bg-green-100 text-green-700"
                    : doctor.license_status === "PENDING"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {doctor.license_status === "VERIFIED" ? "Verified" : doctor.license_status || "Unknown"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Consultation Duration</span>
              <span className="font-medium">
                {doctor.consultation_duration_minutes || 30} minutes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Member Since</span>
              <span className="font-medium">
                {doctor.created_at
                  ? new Date(doctor.created_at).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
