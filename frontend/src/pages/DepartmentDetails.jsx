import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import Badge from "../components/Badge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1584982751601-97dcc096659c";

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

  const doctors = allDoctors.filter(
    (doctor) => Number(doctor.department_id) === departmentId
  );

  const unassignedDoctors = allDoctors.filter(
    (doctor) => doctor.department_id === null || doctor.department_id === undefined
  );

  const fetchData = useCallback(
    async (showLoader = true) => {
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
        const message =
          departmentResult.reason?.message || "Failed to load department";

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
        setAllDoctors(
          Array.isArray(doctorsResult.value) ? doctorsResult.value : []
        );
        setLoadWarning("");
      } else {
        setAllDoctors([]);
        setLoadWarning(
          doctorsResult.reason?.message ||
            "Doctor roster could not be loaded right now."
        );
      }

      if (showLoader) setLoading(false);
    },
    [id]
  );

  useEffect(() => {
    void fetchData(true);
  }, [fetchData]);

  const assignDoctor = async () => {
    if (!selectedDoctorId) return;

    setSavingAction(true);
    setActionError("");

    try {
      await api.put(`/doctors/${selectedDoctorId}`, {
        department_id: departmentId,
      });

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
      await api.put(`/doctors/${doctorId}`, {
        department_id: null,
      });

      await fetchData(false);
    } catch (err) {
      setActionError(err.message || "Failed to remove doctor");
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
    return (
      <div className="text-gray-400 p-6">
        {pageError || "Department not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      {/* WARNINGS */}
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

      {/* TITLE */}
      <h1 className="text-xl md:text-2xl font-semibold">
        {department.name}
      </h1>

      {/* TOP SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <img
            src={
              department.image_url
                ? `${department.image_url}?auto=format&fit=crop&w=1200`
                : `${FALLBACK_IMG}?auto=format&fit=crop&w=1200`
            }
            className="w-full h-52 md:h-[300px] object-cover rounded-2xl"
            alt={department.name}
          />
        </div>

        <div className="bg-white rounded-2xl border p-4 md:p-5 space-y-4">
          <h3 className="font-semibold text-lg">About</h3>

          <p className="text-sm text-gray-500">
            {department.description || "No description available."}
          </p>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <MapPin size={14} /> {department.location || "No location set"}
            </p>
            <p className="flex items-center gap-2">
              <Users size={14} /> {doctors.length} Team Members
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TEAM */}
        <div className="bg-white rounded-2xl border p-4 md:p-5">
          <h3 className="font-semibold mb-4">
            Team ({doctors.length})
          </h3>

          {/* ASSIGN */}
          {isAdmin() && (
            <div className="mb-4 space-y-3 rounded-xl border bg-gray-50 p-3">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="">Select doctor</option>
                {unassignedDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </option>
                ))}
              </select>

              <button
                onClick={assignDoctor}
                disabled={!selectedDoctorId || savingAction}
                className="w-full sm:w-auto rounded-lg bg-teal-500 px-3 py-2 text-sm text-white"
              >
                Assign
              </button>
            </div>
          )}

          {/* DOCTORS */}
          <div className="space-y-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 flex-wrap md:flex-nowrap"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {doc.full_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.specialty || "General"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={`rounded-lg px-2 py-1 text-xs ${
                      doc.is_available
                        ? "bg-teal-100 text-teal-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {doc.is_available ? "Available" : "Away"}
                  </Badge>

                  {isAdmin() && (
                    <button
                      onClick={() => unassignDoctor(doc.id)}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  )}

                  {isPatient() && (
                    <button
                      onClick={() =>
                        navigate("/appointments", {
                          state: { bookDoctorId: doc.id },
                        })
                      }
                      disabled={!doc.is_available}
                      className="text-xs bg-teal-500 text-white px-2 py-1 rounded"
                    >
                      Book
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE */}
        <div className="bg-white rounded-2xl border p-4 md:p-5">
          <h3 className="font-semibold mb-4">Performance</h3>

          {doctors.length === 0 ? (
            <p className="text-xs text-gray-400">No doctors assigned yet.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Availability</span>
                  <span className="font-medium">
                    {Math.round((doctors.filter((d) => d.is_available).length / doctors.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{
                      width: `${(doctors.filter((d) => d.is_available).length / doctors.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Avg Rating</span>
                  <span className="font-medium">
                    {doctors.some((d) => d.rating > 0)
                      ? (doctors.reduce((sum, d) => sum + (d.rating || 0), 0) / doctors.filter((d) => d.rating > 0).length).toFixed(1)
                      : "N/A"}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: doctors.some((d) => d.rating > 0)
                        ? `${((doctors.reduce((sum, d) => sum + (d.rating || 0), 0) / doctors.filter((d) => d.rating > 0).length) / 5) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Available</span>
                  <span className="font-medium text-teal-600">
                    {doctors.filter((d) => d.is_available).length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Away</span>
                  <span className="font-medium text-gray-400">
                    {doctors.filter((d) => !d.is_available).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="bg-white rounded-2xl border p-4 md:p-5">
          <h3 className="font-semibold mb-4">Department Stats</h3>

          <div className="space-y-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Team Size</p>
              <p className="mt-1 text-lg font-semibold">{doctors.length}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Specialties</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {[...new Set(doctors.map((d) => d.specialty).filter(Boolean))].slice(0, 4).map((s) => (
                  <span key={s} className="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                    {s}
                  </span>
                ))}
                {[...new Set(doctors.map((d) => d.specialty).filter(Boolean))].length > 4 && (
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    +{[...new Set(doctors.map((d) => d.specialty).filter(Boolean))].length - 4}
                  </span>
                )}
                {[...new Set(doctors.map((d) => d.specialty).filter(Boolean))].length === 0 && (
                  <span className="text-xs text-gray-400">None listed</span>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Location</p>
              <p className="mt-1 text-sm font-medium">{department.location || "Not set"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Created</p>
              <p className="mt-1 text-sm font-medium">
                {department.created_at
                  ? new Date(department.created_at).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}