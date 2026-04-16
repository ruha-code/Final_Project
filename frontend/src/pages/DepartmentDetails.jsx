import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import { api } from "../services/api";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1584982751601-97dcc096659c";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function DepartmentDetails() {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dep, allDoctors] = await Promise.all([
          api.get(`/departments/${id}`),
          api.get(`/doctors?department_id=${id}`),
        ]);
        setDepartment(dep);
        setDoctors(allDoctors || []);
      } catch (err) {
        console.error("Failed to load department:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!department) return <div className="text-gray-400 p-6">Department not found</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <h1 className="text-2xl font-semibold">{department.name}</h1>

      {/* TOP BLOCK */}
      <div className="grid grid-cols-3 gap-6">
        {/* IMAGE */}
        <div className="col-span-2">
          <img
            src={department.image_url ? `${department.image_url}?auto=format&fit=crop&w=1200` : `${FALLBACK_IMG}?auto=format&fit=crop&w=1200`}
            className="w-full h-[300px] object-cover rounded-2xl"
            alt={department.name}
          />
        </div>

        {/* INFO */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <h3 className="font-semibold text-lg">About</h3>
          <p className="text-sm text-gray-500">{department.description || "No description available."}</p>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <MapPin size={14} /> {department.location || "No location set"}
            </p>
            <p className="flex items-center gap-2">
              <Users size={14} /> {department.staff_count || doctors.length} Staff
            </p>
          </div>

          {/* Head doctor (first in list or department head) */}
          {doctors.length > 0 && (
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

      {/* LOWER GRID */}
      <div className="grid grid-cols-3 gap-6">
        {/* TEAM */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Team ({doctors.length})</h3>

          {doctors.length === 0 ? (
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
                  <span className={`text-xs px-2 py-1 rounded-lg ${doc.is_available ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-400"}`}>
                    {doc.is_available ? "Available" : "Away"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PERFORMANCE */}
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

        {/* QUICK STATS */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Department Stats</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Total Doctors</span>
              <span className="font-semibold text-teal-600">{doctors.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Available Now</span>
              <span className="font-semibold text-green-600">{doctors.filter((d) => d.is_available).length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Avg Experience</span>
              <span className="font-semibold text-gray-700">
                {doctors.length
                  ? Math.round(doctors.reduce((s, d) => s + (d.years_of_experience || 0), 0) / doctors.length)
                  : 0} yrs
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Avg Rating</span>
              <span className="font-semibold text-yellow-600">
                {doctors.length
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
