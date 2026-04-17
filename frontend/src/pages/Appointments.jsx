import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { X, Plus, ChevronRight, ChevronLeft, Clock, Calendar, Trash2 } from "lucide-react";

const STATUS_STYLES = {
  COMPLETED: "text-green-600 bg-green-50",
  ONGOING: "text-blue-600 bg-blue-50",
  SCHEDULED: "text-purple-600 bg-purple-50",
  CANCELLED: "text-red-500 bg-red-50",
};

const STATUS_LABELS = {
  COMPLETED: "Completed",
  ONGOING: "Ongoing",
  SCHEDULED: "Scheduled",
  CANCELLED: "Canceled",
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function StatCard({ title, value, desc, color }) {
  return (
    <div className="bg-white rounded-xl border px-4 py-3 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <p className="text-xs text-gray-400">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <h3 className="text-xl font-semibold">{value}</h3>
        <span className={`text-xs font-medium ${color}`}></span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return { date: "—", time: "—" };
  const d = new Date(isoString);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

/* ───── Complete Notes Modal ───── */
function CompleteModal({ onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-green-50 border-b">
          <h2 className="font-semibold text-lg">Complete Appointment</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Add completion notes (optional) before marking this appointment as completed.</p>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Treatment summary, prescriptions, follow-up instructions..."
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(notes || null)}
              disabled={loading}
              className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Completing..." : "Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Booking Modal ───── */
function BookingModal({ onClose, onBooked }) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState("CONSULTATION");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  useEffect(() => {
    api.get("/doctors").then(setDoctors).catch((err) => {
      console.error(err);
      setError("Failed to load doctors list");
    });
  }, []);

  const loadSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const data = await api.get(`/doctors/${doctorId}/available-slots?date=${date}`);
      setSlots(data.available_slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedDoctor) loadSlots(selectedDoctor.id, date);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const timeStr = selectedSlot.endsWith("Z") || selectedSlot.includes("+")
        ? selectedSlot
        : selectedSlot + "+00:00";
      await api.post("/appointments", {
        doctor_id: selectedDoctor.id,
        appointment_time: timeStr,
        appointment_type: appointmentType,
        reason: reason || null,
      });
      onBooked();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((d) =>
    d.full_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    (d.specialty || "").toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[560px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-teal-50 border-b">
          <div>
            <h2 className="font-semibold text-lg">Book Appointment</h2>
            <p className="text-xs text-gray-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-teal-500" : "bg-gray-200"}`} />
          ))}
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Select a Doctor</h3>
              <input
                placeholder="Search by name or specialty..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredDoctors.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No doctors found</p>
                ) : (
                  filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                        selectedDoctor?.id === doc.id ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-semibold text-sm">
                        {doc.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{doc.full_name}</p>
                        <p className="text-xs text-gray-400">{doc.specialty || "General"} — {doc.department_name || "No dept"}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg ${doc.is_available ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {doc.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => selectedDoctor && setStep(2)}
                  disabled={!selectedDoctor}
                  className="px-5 py-2 bg-teal-500 text-white rounded-xl text-sm disabled:opacity-50 flex items-center gap-1 hover:bg-teal-600"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <Calendar size={16} /> Select Date & Time
              </h3>
              <p className="text-sm text-gray-400">
                Doctor: <span className="text-gray-700 font-medium">{selectedDoctor.full_name}</span>
                {" "}({selectedDoctor.consultation_duration_minutes} min sessions)
              </p>

              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />

              {selectedDate && (
                <div>
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <Clock size={14} /> Available Slots
                  </p>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center">
                      No available slots on this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {slots.map((slot) => {
                        const t = new Date(slot);
                        const label = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 rounded-lg text-sm transition ${
                              selectedSlot === slot ? "bg-teal-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm flex items-center gap-1">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => selectedSlot && setStep(3)}
                  disabled={!selectedSlot}
                  className="px-5 py-2 bg-teal-500 text-white rounded-xl text-sm disabled:opacity-50 flex items-center gap-1 hover:bg-teal-600"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Confirm Details</h3>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Doctor</span>
                  <span className="font-medium">{selectedDoctor.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="font-medium">{new Date(selectedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time</span>
                  <span className="font-medium">{new Date(selectedSlot).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-medium">{selectedDoctor.consultation_duration_minutes} min</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Appointment Type</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none"
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="SURGERY">Surgery</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Reason (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Describe your symptoms or reason for visit..."
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm flex items-center gap-1">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={handleBook}
                  disabled={loading}
                  className="px-6 py-2 bg-teal-500 text-white rounded-xl text-sm hover:bg-teal-600 disabled:opacity-50"
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Main Appointments Page ───── */
function Appointments() {
  const { isAdmin, isDoctor, isPatient } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState("");
  const [completeModal, setCompleteModal] = useState(null); // appointmentId | null
  const [reloadKey, setReloadKey] = useState(0);
  const triggerReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        let data;
        if (isAdmin()) {
          data = await api.get("/appointments/admin/all?page=1&page_size=100");
          setAppointments(data.items || []);
        } else {
          data = await api.get("/appointments/my");
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchAppointments();
  }, [isAdmin, isDoctor, reloadKey]);

  const handleCancel = async (id) => {
    if (actionLoading) return;
    setActionLoading(id);
    setActionError("");
    try {
      if (isAdmin()) {
        await api.put(`/appointments/${id}/admin-cancel`);
      } else {
        await api.put(`/appointments/${id}/cancel`);
      }
      triggerReload();
    } catch (err) {
      setActionError(err.message || "Failed to cancel appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (notes) => {
    const id = completeModal;
    setActionLoading(id);
    setActionError("");
    try {
      await api.put(`/appointments/${id}/complete`, { notes });
      setCompleteModal(null);
      triggerReload();
    } catch (err) {
      setActionError(err.message || "Failed to complete appointment");
      setCompleteModal(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    if (actionLoading) return;
    setActionLoading(id);
    setActionError("");
    try {
      await api.delete(`/appointments/${id}`);
      triggerReload();
    } catch (err) {
      setActionError(err.message || "Failed to delete appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const today = new Date().toDateString();
  const todayCount = appointments.filter((a) => new Date(a.appointment_time).toDateString() === today).length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const ongoingCount = appointments.filter((a) => a.status === "ONGOING").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

  const filtered = appointments.filter((item) => {
    const matchFilter = filter === "All" ? true : item.status === filter.toUpperCase().replace("CANCELED", "CANCELLED");
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (item.patient_name?.toLowerCase().includes(q)) ||
      (item.doctor_name?.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Appointments</h2>
              <p className="text-sm text-gray-400">
                {isAdmin() ? "Manage all appointments" : isDoctor() ? "Your patient appointments" : "Your appointments"}
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 transition"
              />
              {isPatient() && (
                <button
                  onClick={() => setShowBooking(true)}
                  className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-600 flex items-center gap-1"
                >
                  <Plus size={16} /> Book Appointment
                </button>
              )}
            </div>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
              <span>{actionError}</span>
              <button onClick={() => setActionError("")} className="ml-4 text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            <StatCard title="Today" value={todayCount} desc="Appointments" color="text-green-500" />
            <StatCard title="Completed" value={completedCount} desc="Finished" color="text-green-500" />
            <StatCard title="Ongoing" value={ongoingCount} desc="In progress" color="text-blue-500" />
            <StatCard title="Canceled" value={cancelledCount} desc="Missed" color="text-red-400" />
          </div>

          <div className="flex gap-2">
            {["All", "Scheduled", "Ongoing", "Completed", "Canceled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filter === f ? "bg-teal-500 text-white shadow-sm" : "bg-white border text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 px-6 py-3 text-xs text-gray-400 border-b">
              <span>Patient</span>
              <span>Doctor</span>
              <span>Type</span>
              <span>Date</span>
              <span>Time</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No appointments found</div>
            ) : (
              filtered.map((item) => {
                const { date, time } = formatDateTime(item.appointment_time);
                const canCancel = item.status === "SCHEDULED" || item.status === "ONGOING";
                const canComplete = isDoctor() && item.status !== "COMPLETED" && item.status !== "CANCELLED";

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-7 px-6 py-4 items-center hover:bg-gray-50 transition-all duration-200 border-b last:border-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-semibold">
                        {item.patient_name?.charAt(0) || "?"}
                      </div>
                      <p className="font-medium text-sm">{item.patient_name}</p>
                    </div>

                    <span className="text-gray-500 text-sm">{item.doctor_name}</span>
                    <span className="text-gray-500 text-sm capitalize">{item.appointment_type?.toLowerCase()}</span>
                    <span className="text-gray-500 text-sm">{date}</span>
                    <span className="text-gray-500 text-sm">{time}</span>
                    <StatusBadge status={item.status} />

                    <div className="flex gap-2">
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          disabled={actionLoading === item.id}
                          className="text-xs px-3 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {canComplete && (
                        <button
                          onClick={() => setCompleteModal(item.id)}
                          disabled={actionLoading === item.id}
                          className="text-xs px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}
                      {isAdmin() && item.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={actionLoading === item.id}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      {!canCancel && !canComplete && !isAdmin() && (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal
          onClose={() => setShowBooking(false)}
          onBooked={triggerReload}
        />
      )}

      {completeModal && (
        <CompleteModal
          onClose={() => setCompleteModal(null)}
          onConfirm={handleComplete}
          loading={actionLoading === completeModal}
        />
      )}
    </>
  );
}

export default Appointments;
