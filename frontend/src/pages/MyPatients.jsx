import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

import Badge from "../components/Badge";
import { api } from "../services/api";

const PATIENTS_GRID = "grid-cols-[minmax(0,1.7fr)_80px_minmax(0,1.1fr)_110px_110px_150px_150px]";

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "-";
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function MyPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const myAppointments = await api.get("/appointments/my");
        setAppointments(Array.isArray(myAppointments) ? myAppointments : []);
        const patientIds = [...new Set((myAppointments || []).map((item) => item.patient_id))];
        const allPatients = await api.get("/patients");
        setPatients((allPatients || []).filter((patient) => patientIds.includes(patient.id)));
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchPatients();
  }, []);

  const filtered = patients.filter((patient) => {
    const value = search.toLowerCase();
    const matchesSearch = !value || patient.full_name?.toLowerCase().includes(value) || patient.email?.toLowerCase().includes(value);
    const matchesFilter = !filter || filter === "all" || patient.patient_status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" /></div>;
  }

  const getPatientAppointments = (patientId) =>
    appointments
      .filter((appointment) => appointment.patient_id === patientId)
      .sort((first, second) => new Date(second.appointment_time).getTime() - new Date(first.appointment_time).getTime());

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">My Patients</h1>
        <p className="mt-1 text-sm text-gray-500">Patients connected to your appointments.</p>
      </div>

      <div className="flex gap-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients..." className="flex-1 rounded-xl border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border bg-white px-4 py-2 text-sm">
          <option value="">All Status</option>
          <option value="IN_TREATMENT">In Treatment</option>
          <option value="ADMITTED">Admitted</option>
          <option value="DISCHARGED">Discharged</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">No patients found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className={`grid ${PATIENTS_GRID} border-b bg-gray-50 px-6 py-3 text-xs text-gray-400`}>
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
                  .filter((appointment) => appointment.status !== "CANCELLED" && new Date(appointment.appointment_time).getTime() >= Date.now())
                  .sort((first, second) => new Date(first.appointment_time).getTime() - new Date(second.appointment_time).getTime())[0];
                const previous = patientAppointments.find((appointment) => new Date(appointment.appointment_time).getTime() < Date.now());
                const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-";

                return (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className={`grid cursor-pointer ${PATIENTS_GRID} items-center border-b px-6 py-4 last:border-none transition hover:bg-gray-50 ${patient.patient_status === "DISCHARGED" ? "opacity-80" : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                        {getInitials(patient.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{patient.full_name}</p>
                        <p className="truncate text-xs text-gray-400">{patient.email}</p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-sm text-gray-500">{calcAge(patient.date_of_birth)}</span>
                    <span className="truncate text-sm text-gray-600">{patient.condition || "-"}</span>
                    <span className="whitespace-nowrap text-sm text-gray-500">{formatDate(previous?.appointment_time)}</span>
                    <span className="whitespace-nowrap text-sm text-gray-500">{formatDate(upcoming?.appointment_time)}</span>
                    <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${
                      patient.patient_status === "IN_TREATMENT"
                        ? "bg-teal-100 text-teal-700"
                        : patient.patient_status === "ADMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                    }`}>
                      {patient.patient_status?.replace("_", " ") || "-"}
                    </Badge>
                    <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => navigate(`/patients/${patient.id}`)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">Open Case</button>
                      {patient.patient_status !== "DISCHARGED" ? (
                        <button onClick={() => navigate("/messages", { state: { patientId: patient.id } })} className="rounded-lg bg-teal-500 px-2 py-1.5 text-white hover:bg-teal-600" aria-label="Chat">
                          <MessageSquare size={14} />
                        </button>
                      ) : (
                        <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400">Read only</span>
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
