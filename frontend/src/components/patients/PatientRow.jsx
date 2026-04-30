import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";

import Badge from "../Badge";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "—";
  return Math.floor(
    (Date.now() - new Date(dateOfBirth).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  );
}

export default function PatientRow({ patient, appointments }) {
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  const patientAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.patient_id === patient.id)
        .sort(
          (a, b) =>
            new Date(b.appointment_time).getTime() -
            new Date(a.appointment_time).getTime()
        ),
    [appointments, patient.id]
  );

  const upcoming = useMemo(
    () =>
      [...patientAppointments]
        .filter(
          (a) =>
            a.status !== "CANCELLED" &&
            new Date(a.appointment_time).getTime() >= now
        )
        .sort(
          (a, b) =>
            new Date(a.appointment_time).getTime() -
            new Date(b.appointment_time).getTime()
        )[0],
    [patientAppointments, now]
  );

  const previous = useMemo(
    () =>
      patientAppointments.find(
        (a) => new Date(a.appointment_time).getTime() < now
      ),
    [patientAppointments, now]
  );

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })
      : "—";

  return (
    <div
      onClick={() => navigate(`/patients/${patient.id}`)}
      className="grid cursor-pointer items-center border-b bg-white px-6 py-4 hover:bg-slate-50"
      style={{
        gridTemplateColumns:
          "minmax(0,1.7fr) 80px minmax(0,1.1fr) 110px 110px 140px 60px",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
          {getInitials(patient.full_name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {patient.full_name}
          </p>
          <p className="truncate text-xs text-gray-400">{patient.email}</p>
        </div>
      </div>

      <span className="text-sm text-gray-500">
        {calcAge(patient.date_of_birth)}
      </span>

      <span className="truncate text-sm text-gray-600">
        {patient.condition || "—"}
      </span>

      <span className="text-sm text-gray-500">
        {formatDate(previous?.appointment_time)}
      </span>

      <span className="text-sm text-gray-500">
        {formatDate(upcoming?.appointment_time)}
      </span>

      <Badge
        className={`px-3 py-1 text-xs rounded-full ${
          patient.patient_status === "IN_TREATMENT"
            ? "bg-teal-100 text-teal-700"
            : patient.patient_status === "ADMITTED"
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {patient.patient_status?.replace("_", " ") || "—"}
      </Badge>

      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        {patient.patient_status !== "DISCHARGED" ? (
          <button
            onClick={() =>
              navigate("/messages", { state: { patientId: patient.id } })
            }
            className="rounded-lg bg-teal-500 p-2 text-white hover:bg-teal-600 transition-colors"
            aria-label="Message patient"
          >
            <MessageSquare size={14} />
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic">Read only</span>
        )}
      </div>
    </div>
  );
}
