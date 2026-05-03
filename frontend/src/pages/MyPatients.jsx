import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

import Badge from "../components/Badge";
import { api } from "../services/api";

const PATIENTS_GRID =
  "grid-cols-[minmax(0,1.7fr)_80px_minmax(0,1.1fr)_110px_110px_150px_150px]";

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "-";
  return Math.floor(
    (Date.now() - new Date(dateOfBirth).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MyPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setPageError("");
        const myAppointments = await api.get("/appointments/my");
        setAppointments(Array.isArray(myAppointments) ? myAppointments : []);

        const patientIds = [
          ...new Set((myAppointments || []).map((item) => item.patient_id)),
        ];

        const allPatients = await api.get("/patients");

        setPatients(
          (allPatients || []).filter((patient) =>
            patientIds.includes(patient.id)
          )
        );
      } catch (err) {
        setPageError(err.message || "Failed to load your patients.");
        console.error("Failed to fetch patients:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchPatients();
  }, []);

  const filtered = patients.filter((patient) => {
    const value = search.toLowerCase();

    const matchesSearch =
      !value ||
      patient.full_name?.toLowerCase().includes(value) ||
      patient.email?.toLowerCase().includes(value);

    const matchesFilter =
      !filter ||
      filter === "all" ||
      patient.patient_status === filter;

    return matchesSearch && matchesFilter;
  });

  const getPatientAppointments = (patientId) =>
    appointments
      .filter((a) => a.patient_id === patientId)
      .sort(
        (a, b) =>
          new Date(b.appointment_time).getTime() -
          new Date(a.appointment_time).getTime()
      );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 pb-10 px-3 sm:px-6">
      {/* HEADER */}
      <div className="rounded-3xl border bg-white p-5 sm:p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          My Patients
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Patients connected to your appointments.
        </p>
      </div>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients..."
          className="w-full flex-1 rounded-xl border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="IN_TREATMENT">In Treatment</option>
          <option value="ADMITTED">Admitted</option>
          <option value="DISCHARGED">Discharged</option>
        </select>
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
          No patients found.
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">

          {/* MOBILE / TABLET CARD VIEW */}
          <div className="divide-y lg:hidden">
            {filtered.map((patient) => {
              const patientAppointments = getPatientAppointments(patient.id);
              const upcoming = [...patientAppointments]
                .filter((a) => a.status !== "CANCELLED" && new Date(a.appointment_time).getTime() >= Date.now())
                .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime())[0];
              const previous = patientAppointments.find((a) => new Date(a.appointment_time).getTime() < Date.now());
              const formatDate = (value) =>
                value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-";

              return (
                <div key={patient.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                        {getInitials(patient.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900 text-sm">{patient.full_name}</p>
                        <p className="truncate text-xs text-gray-400">{patient.condition || "No condition"}</p>
                      </div>
                    </div>
                    <Badge
                      className={`shrink-0 px-2.5 py-1 text-xs rounded-full ${
                        patient.patient_status === "IN_TREATMENT"
                          ? "bg-teal-100 text-teal-700"
                          : patient.patient_status === "ADMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {patient.patient_status?.replace("_", " ") || "-"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <div>
                      <p className="text-gray-400">Age</p>
                      <p className="font-medium text-gray-700">{calcAge(patient.date_of_birth)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last visit</p>
                      <p className="font-medium text-gray-700">{formatDate(previous?.appointment_time)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Next visit</p>
                      <p className="font-medium text-gray-700">{formatDate(upcoming?.appointment_time)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="flex-1 rounded-lg bg-gray-100 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Open
                    </button>
                    {patient.patient_status !== "DISCHARGED" ? (
                      <button
                        onClick={() => navigate("/messages", { state: { patientId: patient.id } })}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-2 text-xs font-medium text-white hover:bg-teal-600"
                      >
                        <MessageSquare size={13} /> Message
                      </button>
                    ) : (
                      <span className="flex items-center px-3 text-xs text-gray-400">Read only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-[900px]">
              <div className={`grid ${PATIENTS_GRID} bg-gray-50 px-6 py-3 text-xs text-gray-400`}>
                <span>Patient</span>
                <span>Age</span>
                <span>Condition</span>
                <span>Last Visit</span>
                <span>Next Visit</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {filtered.map((patient) => {
                const patientAppointments = getPatientAppointments(patient.id);
                const upcoming = [...patientAppointments]
                  .filter((a) => a.status !== "CANCELLED" && new Date(a.appointment_time).getTime() >= Date.now())
                  .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime())[0];
                const previous = patientAppointments.find((a) => new Date(a.appointment_time).getTime() < Date.now());
                const formatDate = (value) =>
                  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-";

                return (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className={`grid ${PATIENTS_GRID} cursor-pointer items-center border-b px-6 py-4 hover:bg-gray-50`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                        {getInitials(patient.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{patient.full_name}</p>
                        <p className="truncate text-xs text-gray-400">{patient.email}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{calcAge(patient.date_of_birth)}</span>
                    <span className="truncate text-sm text-gray-600">{patient.condition || "-"}</span>
                    <span className="text-sm text-gray-500">{formatDate(previous?.appointment_time)}</span>
                    <span className="text-sm text-gray-500">{formatDate(upcoming?.appointment_time)}</span>
                    <Badge
                      className={`px-3 py-1 text-xs rounded-full ${
                        patient.patient_status === "IN_TREATMENT"
                          ? "bg-teal-100 text-teal-700"
                          : patient.patient_status === "ADMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {patient.patient_status?.replace("_", " ") || "-"}
                    </Badge>
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs hover:bg-gray-200"
                      >
                        Open
                      </button>
                      {patient.patient_status !== "DISCHARGED" ? (
                        <button
                          onClick={() => navigate("/messages", { state: { patientId: patient.id } })}
                          className="rounded-lg bg-teal-500 p-2 text-white hover:bg-teal-600"
                        >
                          <MessageSquare size={14} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Read only</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
