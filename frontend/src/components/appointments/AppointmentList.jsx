import { Calendar, Plus } from "lucide-react";

import AdminAppointmentsTable from "./AdminAppointmentsTable";
import AppointmentTable from "./AppointmentTable";
import DoctorAppointmentQueue from "./DoctorAppointmentQueue";
import MobileAppointmentCard from "./MobileAppointmentCard";

export default function AppointmentList({
  appointments,
  isPatientView,
  isDoctorView,
  isAdminView,
  actionLoading,
  openActionMenu,
  setOpenActionMenu,
  emptyStateCopy,
  searchValue,
  onBook,
  onCancel,
  onDoctorPrimaryAction,
  onComplete,
  onView,
}) {
  const actionProps = {
    actionLoading,
    openActionMenu,
    setOpenActionMenu,
    onCancel,
    onDoctorPrimaryAction,
    onComplete,
    onView,
  };

  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      {appointments.length === 0 ? (
        <EmptyAppointments
          isPatientView={isPatientView}
          searchValue={searchValue}
          emptyStateCopy={emptyStateCopy}
          onBook={onBook}
        />
      ) : (
        <>
          {isDoctorView && <DoctorAppointmentQueue appointments={appointments} {...actionProps} />}
          {isAdminView && (
            <AdminAppointmentsTable
              appointments={appointments}
              actionLoading={actionLoading}
              openActionMenu={openActionMenu}
              setOpenActionMenu={setOpenActionMenu}
              onCancel={onCancel}
              onView={onView}
            />
          )}
          {!isDoctorView && !isAdminView && (
            <AppointmentTable
              appointments={appointments}
              isPatientView={isPatientView}
              {...actionProps}
            />
          )}
          <MobileList
            appointments={appointments}
            isPatientView={isPatientView}
            isDoctorView={isDoctorView}
            isAdminView={isAdminView}
            {...actionProps}
          />
        </>
      )}
    </div>
  );
}

function EmptyAppointments({ isPatientView, searchValue, emptyStateCopy, onBook }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
        <Calendar size={28} />
      </div>
      <p className="text-base font-semibold text-gray-700">No appointments found</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-gray-400 sm:text-sm">
        {emptyStateCopy}
      </p>
      {isPatientView && !searchValue && (
        <button
          type="button"
          onClick={onBook}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600"
        >
          <Plus size={16} /> Book Appointment
        </button>
      )}
    </div>
  );
}

function MobileList({ appointments, isPatientView, isDoctorView, isAdminView, ...actionProps }) {
  return (
    <div className="divide-y lg:hidden">
      {appointments.map((appointment) => (
        <MobileAppointmentCard
          key={appointment.id}
          appointment={appointment}
          isPatientView={isPatientView}
          isDoctorView={isDoctorView}
          isAdminView={isAdminView}
          {...actionProps}
        />
      ))}
    </div>
  );
}
