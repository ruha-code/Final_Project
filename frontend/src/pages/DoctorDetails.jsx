import { useCallback, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mail, Phone, Star, Clock, Award, ChevronLeft, Calendar } from "lucide-react";
import Badge from "../components/Badge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getNextDays(count) {
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayNames[d.getDay()],
      fullDate: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    });
  }
  return days;
}

export default function DoctorDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPatient, isAdmin } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(true);
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
      setScheduleLoading(false);
      return;
    }

    setScheduleLoading(true);
    const days = getNextDays(5);
    const offset = new Date().getTimezoneOffset();

    const results = await Promise.allSettled(
      days.map((day) =>
        api.get(
          `/doctors/${id}/available-slots?date=${day.date}&timezone_offset_minutes=${offset}`,
        ),
      ),
    );

    const map = {};
    results.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value?.available_slots) {
        map[days[i].date] = result.value.available_slots;
      }
    });

    setSchedule(map);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-gray-400 p-6">
        {pageError || "Doctor not found"}
      </div>
    );
  }

  const totalAppointments = doctor.total_appointments || 0;
  const completedAppointments = doctor.completed_appointments || 0;
  const completionRate = totalAppointments > 0
    ? Math.round((completedAppointments / totalAppointments) * 100)
    : 0;

  const days = getNextDays(5);

  return (
    <div className="space-y-6 px-4 lg:px-0">
      {/* Back button */}
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

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-2xl sm:text-3xl font-bold text-teal-700">
                {getInitials(doctor.full_name)}
              </div>

              <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold">
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
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">{doctor.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {doctor.bio && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold mb-2">About</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-4 md:p-5">
            <h3 className="font-semibold text-sm mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Visits</span>
                <span className="font-medium">{totalAppointments}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium">{completedAppointments}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Consultation</span>
                <span className="font-medium">
                  {doctor.consultation_duration_minutes || 30} min
                </span>
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
              className="w-full rounded-xl bg-teal-500 text-white py-3 text-sm font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {doctor.is_available ? "Book Appointment" : "Currently Unavailable"}
            </button>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border p-4 md:p-6">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Calendar size={16} /> Availability — Next 5 Days
        </h3>

        {!doctor.is_available ? (
          <p className="text-sm text-gray-400">This doctor is currently unavailable.</p>
        ) : scheduleLoading ? (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-teal-500" />
            Loading schedule...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {days.map((day) => {
              const slots = schedule[day.date] || [];
              const hasSlots = slots.length > 0;
              return (
                <div
                  key={day.date}
                  className={`rounded-xl border p-3 ${
                    hasSlots
                      ? "bg-teal-50 border-teal-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p className="text-xs font-medium text-gray-700">{day.label}</p>
                  <p className="text-xs text-gray-400">{day.fullDate}</p>
                  {hasSlots ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-teal-600 font-medium">
                        {slots.length} slot{slots.length > 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {slots.slice(0, 3).map((slot) => (
                          <span
                            key={slot}
                            className="text-xs bg-white px-1.5 py-0.5 rounded text-gray-600"
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

      {/* Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-4 md:p-6">
          <h3 className="font-semibold text-sm mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Patient Satisfaction</span>
                <span className="font-medium">
                  {doctor.rating ? `${(doctor.rating / 5 * 100).toFixed(0)}%` : "N/A"}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{
                    width: doctor.rating ? `${(doctor.rating / 5) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Availability</span>
                <span className="font-medium">
                  {doctor.is_available ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    doctor.is_available ? "bg-teal-500 w-full" : "bg-gray-300 w-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 md:p-6">
          <h3 className="font-semibold text-sm mb-4">Doctor Info</h3>
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
