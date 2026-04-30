import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import AppointmentList from "../components/appointments/AppointmentList";
import { CompleteModal, DeleteConfirmModal } from "../components/appointments/AppointmentModals";
import BookingModal from "../components/appointments/BookingModal";
import {
  AdminAppointmentControls,
  AppointmentBanner,
  AppointmentPageHeader,
  StaffAppointmentControls,
} from "../components/appointments/AppointmentPageControls";
import {
  appointmentMatchesSearch,
  filterAppointmentsByRole,
  getAdminStats,
  getAppointmentCounts,
  getEmptyStateCopy,
  getNextAppointment,
  sanitizeAppointments,
} from "../components/appointments/appointmentUtils";
import { getTodayLocalDate } from "../utils/dateTime";

async function fetchAllAdminAppointments() {
  const data = await api.get("/appointments/admin/all?all=true");
  return sanitizeAppointments(Array.isArray(data?.items) ? data.items : []);
}

export default function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isDoctor, isPatient } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [filter, setFilter] = useState(
    isPatient() ? "UPCOMING" : isDoctor() ? "WORKLIST" : "ALL",
  );
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
  const openBooking = () => {
    setBookingContext({ doctorId: null, date: "", time: "" });
    setShowBooking(true);
  };

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
        const updatedAppointment = await api.put(`/appointments/${appointment.id}/start`);
        setFeedback({ tone: "success", message: "Appointment started." });
        triggerReload();
        openPatientCase({ ...appointment, ...updatedAppointment, status: "ONGOING" });
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
  const role = isPatient() ? "PATIENT" : isDoctor() ? "DOCTOR" : "ADMIN";
  const searchMatchedAppointments = appointments.filter((appointment) =>
    appointmentMatchesSearch(appointment, searchValue),
  );
  const filteredAppointments = filterAppointmentsByRole(searchMatchedAppointments, {
    filter,
    role,
    todayKey,
  });

  const countSource = searchValue ? searchMatchedAppointments : appointments;
  const counts = getAppointmentCounts(countSource, todayKey);
  const adminStats = getAdminStats(counts);
  const nextAppointment = getNextAppointment(countSource);
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

        {!isAdmin() && (
          <AppointmentPageHeader
            isPatientView={isPatient()}
            search={search}
            setSearch={setSearch}
            onBook={openBooking}
          />
        )}

        {pageError && (
          <AppointmentBanner tone="error" message={pageError} onClose={() => setPageError("")} />
        )}
        {feedback && (
          <AppointmentBanner
            tone={feedback.tone}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        )}

        {isAdmin() ? (
          <AdminAppointmentControls
            adminStats={adminStats}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
          />
        ) : (
          <StaffAppointmentControls
            isPatientView={isPatient()}
            isDoctorView={isDoctor()}
            filter={filter}
            setFilter={setFilter}
            nextAppointment={nextAppointment}
            counts={counts}
          />
        )}
        <AppointmentList
          appointments={filteredAppointments}
          isPatientView={isPatient()}
          isDoctorView={isDoctor()}
          isAdminView={isAdmin()}
          actionLoading={actionLoading}
          openActionMenu={openActionMenu}
          setOpenActionMenu={setOpenActionMenu}
          emptyStateCopy={emptyStateCopy}
          searchValue={searchValue}
          onBook={openBooking}
          onCancel={handleCancel}
          onDoctorPrimaryAction={handleDoctorPrimaryAction}
          onComplete={setCompleteModal}
          onDelete={setDeleteModal}
        />
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
