import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import {
  addDaysToDateString,
  buildLocalAppointmentTimestamp,
  formatDisplayShortDate,
  getBrowserTimezoneOffsetMinutes,
  getTodayLocalDate,
} from "../../utils/dateTime";
import { api } from "../../services/api";
import {
  ConfirmStep,
  DoctorStep,
  ModalBanner,
  StepProgress,
  TimeStep,
} from "./BookingModalSteps";

const VISIT_TYPES = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "SURGERY", label: "Procedure" },
];

export default function BookingModal({
  initialDoctorId,
  initialDate,
  initialTime,
  onClose,
  onBooked,
}) {
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

  const quickDates = useMemo(() => {
    const today = getTodayLocalDate();
    return [
      { label: "Today", value: today },
      { label: "Tomorrow", value: addDaysToDateString(today, 1) },
      {
        label: formatDisplayShortDate(addDaysToDateString(today, 2)),
        value: addDaysToDateString(today, 2),
      },
      {
        label: formatDisplayShortDate(addDaysToDateString(today, 3)),
        value: addDaysToDateString(today, 3),
      },
    ];
  }, []);

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

  const filteredDoctors = doctors.filter((doctor) => {
    const value = doctorSearch.trim().toLowerCase();
    if (!value) return true;
    return [doctor.full_name, doctor.specialty, doctor.department_name].some((item) =>
      item?.toLowerCase().includes(value),
    );
  });

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="shrink-0 border-b bg-teal-50 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                Book Appointment
              </h2>
              <p className="text-xs text-gray-500 sm:text-sm">
                Choose a doctor, pick a slot, confirm the visit.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white">
              <X size={18} />
            </button>
          </div>
          <StepProgress step={step} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4 sm:p-6">
            {error && <ModalBanner message={error} onClose={() => setError("")} />}
            {step === 1 && (
              <DoctorStep
                doctorSearch={doctorSearch}
                setDoctorSearch={setDoctorSearch}
                doctorsLoading={doctorsLoading}
                filteredDoctors={filteredDoctors}
                selectedDoctor={selectedDoctor}
                setSelectedDoctor={setSelectedDoctor}
                setError={setError}
                setStep={setStep}
              />
            )}
            {step === 2 && (
              <TimeStep
                selectedDoctor={selectedDoctor}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedSlot={selectedSlot}
                setSelectedSlot={setSelectedSlot}
                quickDates={quickDates}
                slots={slots}
                loading={loading}
                setError={setError}
                setStep={setStep}
              />
            )}
            {step === 3 && (
              <ConfirmStep
                selectedDoctor={selectedDoctor}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                appointmentType={appointmentType}
                setAppointmentType={setAppointmentType}
                reason={reason}
                setReason={setReason}
                visitTypes={VISIT_TYPES}
                loading={loading}
                setStep={setStep}
                handleBook={handleBook}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
