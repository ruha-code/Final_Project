import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Stethoscope,
  X,
} from "lucide-react";

import { formatDisplayDate, getTodayLocalDate } from "../../utils/dateTime";

export function ModalBanner({ message, onClose }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 sm:text-sm">
      <span>{message}</span>
      <button type="button" onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}

export function StepProgress({ step }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {["Doctor", "Time", "Confirm"].map((label, index) => {
        const active = index + 1 <= step;
        return (
          <div key={label}>
            <div className={`h-1.5 rounded-full ${active ? "bg-teal-500" : "bg-teal-100"}`} />
            <p className={`mt-1 text-[11px] ${active ? "text-teal-700" : "text-gray-400"}`}>{label}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DoctorStep({ doctorSearch, setDoctorSearch, doctorsLoading, filteredDoctors, selectedDoctor, setSelectedDoctor, setError, setStep }) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={doctorSearch}
          onChange={(event) => setDoctorSearch(event.target.value)}
          placeholder="Search by doctor, specialty or department"
          className="w-full rounded-2xl bg-gray-100 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1 sm:max-h-80">
        {doctorsLoading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" /></div>
        ) : filteredDoctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">No doctors match your search.</div>
        ) : (
          filteredDoctors.map((doctor) => (
            <DoctorOption key={doctor.id} doctor={doctor} selected={selectedDoctor?.id === doctor.id} onSelect={() => setSelectedDoctor(doctor)} />
          ))
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
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
  );
}

export function TimeStep({ selectedDoctor, selectedDate, setSelectedDate, selectedSlot, setSelectedSlot, quickDates, slots, loading, setError, setStep }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700"><Stethoscope size={18} /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{selectedDoctor?.full_name}</p>
            <p className="truncate text-xs text-gray-500">{selectedDoctor?.specialty || "General physician"}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickDates.map((date) => (
          <DateButton key={date.value} date={date} selectedDate={selectedDate} setSelectedDate={setSelectedDate} setSelectedSlot={setSelectedSlot} />
        ))}
      </div>
      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400"><CalendarDays size={14} /> Pick another date</span>
        <input type="date" min={getTodayLocalDate()} value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setSelectedSlot(""); }} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
      </label>
      <Slots selectedDate={selectedDate} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} slots={slots} loading={loading} />
      <StepButtons back={() => setStep(1)} next={() => { if (!selectedSlot) return setError("Select a time slot to continue"); setStep(3); }} />
    </div>
  );
}

export function ConfirmStep({ selectedDoctor, selectedDate, selectedSlot, appointmentType, setAppointmentType, reason, setReason, visitTypes, loading, setStep, handleBook }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl bg-gray-50 p-4 text-sm">
        <SummaryRow label="Doctor" value={selectedDoctor?.full_name} />
        <SummaryRow label="Specialty" value={selectedDoctor?.specialty || "General physician"} />
        <SummaryRow label="Date" value={formatDisplayDate(selectedDate)} />
        <SummaryRow label="Time" value={selectedSlot} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {visitTypes.map((type) => (
          <button key={type.value} type="button" onClick={() => setAppointmentType(type.value)} className={`rounded-2xl border px-3 py-3 text-sm ${appointmentType === type.value ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{type.label}</button>
        ))}
      </div>
      <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Describe symptoms or the reason for your visit" className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700"><ChevronLeft size={16} /> Back</button>
        <button type="button" onClick={handleBook} disabled={loading} className="rounded-xl bg-teal-500 px-6 py-2.5 text-sm text-white hover:bg-teal-600 disabled:opacity-60">{loading ? "Booking..." : "Confirm Booking"}</button>
      </div>
    </div>
  );
}

function DoctorOption({ doctor, selected, onSelect }) {
  return <button type="button" onClick={onSelect} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${selected ? "border-teal-500 bg-teal-50 shadow-sm" : "border-gray-200 hover:border-teal-200 hover:bg-gray-50"}`}><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-sm font-semibold text-teal-700">{getInitials(doctor.full_name)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-gray-900">{doctor.full_name}</p><p className="truncate text-sm text-gray-500">{doctor.specialty || "General physician"}</p><p className="truncate text-xs text-gray-400">{doctor.department_name || "No department assigned"}</p></div>{selected && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white"><Check size={16} /></div>}</button>;
}

function DateButton({ date, selectedDate, setSelectedDate, setSelectedSlot }) {
  return <button type="button" onClick={() => { setSelectedDate(date.value); setSelectedSlot(""); }} className={`rounded-2xl border px-3 py-2 text-sm ${selectedDate === date.value ? "border-teal-500 bg-teal-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-teal-50"}`}>{date.label}</button>;
}

function Slots({ selectedDate, selectedSlot, setSelectedSlot, slots, loading }) {
  if (!selectedDate) return <SlotBox>Choose a date to see available times.</SlotBox>;
  if (loading) return <div className="rounded-2xl bg-gray-50 p-4"><div className="flex justify-center py-6"><div className="h-7 w-7 animate-spin rounded-full border-b-2 border-teal-500" /></div></div>;
  if (slots.length === 0) return <SlotBox>No bookable slots are available for this date.</SlotBox>;
  return <div className="rounded-2xl bg-gray-50 p-4"><SlotTitle /><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((slot) => <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} className={`rounded-xl px-2 py-2 text-xs sm:px-3 sm:text-sm ${selectedSlot === slot ? "bg-teal-500 text-white" : "bg-white text-gray-700 hover:bg-teal-50"}`}>{slot}</button>)}</div></div>;
}

function SlotBox({ children }) {
  return <div className="rounded-2xl bg-gray-50 p-4"><SlotTitle /><p className="text-sm text-gray-400">{children}</p></div>;
}

function SlotTitle() {
  return <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700"><Clock size={16} /> Available slots</div>;
}

function StepButtons({ back, next }) {
  return <div className="flex items-center justify-between"><button type="button" onClick={back} className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700"><ChevronLeft size={16} /> Back</button><button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm text-white hover:bg-teal-600">Next <ChevronRight size={16} /></button></div>;
}

function SummaryRow({ label, value }) {
  return <div className="flex items-center justify-between gap-2"><span className="shrink-0 text-gray-500">{label}</span><span className="truncate text-right font-medium text-gray-900">{value}</span></div>;
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
