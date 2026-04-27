import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import Badge from "../components/Badge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1584982751601-97dcc096659c";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function DepartmentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPatient, isAdmin } = useAuth();
  const [department, setDepartment] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [savingAction, setSavingAction] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pageError, setPageError] = useState("");
  const [loadWarning, setLoadWarning] = useState("");

  const departmentId = Number(id);
  const doctors = allDoctors.filter((doctor) => Number(doctor.department_id) === departmentId);
  const unassignedDoctors = allDoctors.filter((doctor) => doctor.department_id === null || doctor.department_id === undefined);
  const doctorRosterUnavailable = Boolean(loadWarning) && allDoctors.length === 0;

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
      setPageError("");
      setLoadWarning("");
    }

    setActionError("");

    const [departmentResult, doctorsResult] = await Promise.allSettled([
      api.get(`/departments/${id}`),
      api.get("/doctors"),
    ]);

    if (departmentResult.status === "rejected") {
      const message = departmentResult.reason?.message || "Failed to load department";
      console.error("Failed to load department:", departmentResult.reason);

      if (showLoader) {
        setDepartment(null);
        setAllDoctors([]);
        setPageError(message);
        setLoading(false);
      } else {
        setActionError(message);
      }
      return;
    }

    setDepartment(departmentResult.value);
    setPageError("");

    if (doctorsResult.status === "fulfilled") {
      setAllDoctors(Array.isArray(doctorsResult.value) ? doctorsResult.value : []);
      setLoadWarning("");
    } else {
      const message = doctorsResult.reason?.message || "Doctor roster could not be loaded right now.";
      console.error("Failed to load department doctors:", doctorsResult.reason);

      if (showLoader) {
        setAllDoctors([]);
        setLoadWarning(message);
      } else {
        setActionError(message);
      }
    }

    if (showLoader) {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData(true);
  }, [fetchData]);

  const assignDoctor = async () => {
    if (!selectedDoctorId) return;
    setSavingAction(true);
    setActionError("");
    try {
      await api.put(`/doctors/${selectedDoctorId}`, { department_id: departmentId });
      setSelectedDoctorId("");
      await fetchData(false);
    } catch (err) {
      setActionError(err.message || "Failed to assign doctor");
    } finally {
      setSavingAction(false);
    }
  };

  const unassignDoctor = async (doctorId) => {
    setSavingAction(true);
    setActionError("");
    try {
      await api.put(`/doctors/${doctorId}`, { department_id: null });
      await fetchData(false);
    } catch (err) {
      setActionError(err.message || "Failed to remove doctor from department");
    } finally {
      setSavingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!department) {
    return <div className="text-gray-400 p-6">{pageError || "Department not found"}</div>;
  }

  return (
    <div className="space-y-6">
      {loadWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {loadWarning}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      <h1 className="text-2xl font-semibold">{department.name}</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <img
            src={department.image_url ? `${department.image_url}?auto=format&fit=crop&w=1200` : `${FALLBACK_IMG}?auto=format&fit=crop&w=1200`}
            className="w-full h-[300px] object-cover rounded-2xl"
            alt={department.name}
          />
        </div>

        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <h3 className="font-semibold text-lg">About</h3>
          <p className="text-sm text-gray-500">{department.description || "No description available."}</p>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <MapPin size={14} /> {department.location || "No location set"}
            </p>
            <p className="flex items-center gap-2">
              <Users size={14} /> {doctorRosterUnavailable ? "Team data unavailable" : `${doctors.length} Team Members`}
            </p>
          </div>

          {!doctorRosterUnavailable && doctors.length > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t">
              {doctors[0].avatar_url ? (
                <img src={doctors[0].avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-semibold">
                  {getInitials(doctors[0].full_name)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{doctors[0].full_name}</p>
                <p className="text-xs text-gray-400">{doctors[0].specialty || "Doctor"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Team ({doctorRosterUnavailable ? "--" : doctors.length})</h3>

          {isAdmin() && (
            <div className="mb-4 space-y-2 overflow-hidden rounded-xl border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Assign doctor to this department</p>
              <p className="text-xs text-gray-400">
                Single-department rule: only unassigned doctors can be added here. To move a doctor, remove them from their current department first.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={selectedDoctorId}
                  onChange={(event) => setSelectedDoctorId(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">Select doctor</option>
                  {unassignedDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name} - {doctor.specialty || "General"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={assignDoctor}
                  disabled={!selectedDoctorId || savingAction || doctorRosterUnavailable}
                  className="shrink-0 whitespace-nowrap rounded-lg bg-teal-500 px-3 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
              {doctorRosterUnavailable ? (
                <p className="text-xs text-amber-600">Doctor data is unavailable right now, so assignments are temporarily disabled.</p>
              ) : unassignedDoctors.length === 0 ? (
                <p className="text-xs text-amber-600">No unassigned doctors available.</p>
              ) : null}
            </div>
          )}

          {doctorRosterUnavailable ? (
            <p className="text-sm text-amber-700">The department loaded, but the doctor roster could not be loaded right now.</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-gray-400">No doctors assigned to this department</p>
          ) : (
            <div className="space-y-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3">
                  {doc.avatar_url ? (
                    <img src={doc.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-semibold">
                      {getInitials(doc.full_name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.full_name}</p>
                    <p className="text-xs text-gray-400">{doc.specialty || "General"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`rounded-lg px-2 py-1 text-xs ${doc.is_available ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-400"}`}>
                      {doc.is_available ? "Available" : "Away"}
                    </Badge>
                    {isAdmin() && (
                      <button
                        onClick={() => {
                          void unassignDoctor(doc.id);
                        }}
                        disabled={savingAction}
                        className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                    {isPatient() && (
                      <button
                        onClick={() => navigate("/appointments", { state: { bookDoctorId: doc.id } })}
                        disabled={!doc.is_available}
                        className="rounded-lg bg-teal-500 px-2.5 py-1 text-xs text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Performance</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Patient Satisfaction</span>
                <span className="font-medium">{department.patient_satisfaction || 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-teal-500 rounded-full transition-all" style={{ width: `${department.patient_satisfaction || 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Efficiency</span>
                <span className="font-medium">{department.efficiency || 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-teal-400 rounded-full transition-all" style={{ width: `${department.efficiency || 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Treatment Success</span>
                <span className="font-medium">{department.treatment_success || 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-teal-600 rounded-full transition-all" style={{ width: `${department.treatment_success || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Department Stats</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Total Doctors</span>
              <span className="font-semibold text-teal-600">{doctorRosterUnavailable ? "--" : doctors.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Available Now</span>
              <span className="font-semibold text-green-600">{doctorRosterUnavailable ? "--" : doctors.filter((d) => d.is_available).length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Avg Experience</span>
              <span className="font-semibold text-gray-700">
                {doctorRosterUnavailable
                  ? "--"
                  : `${doctors.length
                    ? Math.round(doctors.reduce((s, d) => s + (d.years_of_experience || 0), 0) / doctors.length)
                    : 0} yrs`}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Avg Rating</span>
              <span className="font-semibold text-yellow-600">
                {doctorRosterUnavailable
                  ? "--"
                  : doctors.length
                    ? (doctors.reduce((s, d) => s + (d.rating || 0), 0) / doctors.length).toFixed(1)
                    : "0.0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
