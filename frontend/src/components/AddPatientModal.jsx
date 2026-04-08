import { X } from "lucide-react";

export default function AddPatientModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-teal-50 rounded-t-2xl">
          <h2 className="font-semibold">Add New Patient</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* PERSONAL INFO */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Personal Info</h3>

            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Full Name" className="input" />

              <select className="input">
                <option>Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>

              <input type="date" className="input" />

              <input placeholder="Patient ID" className="input" />
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Contact Info</h3>

            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Phone" className="input" />
              <input placeholder="Email" className="input" />
              <input placeholder="Address" className="input col-span-2" />
            </div>
          </div>

          {/* MEDICAL */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Medical Info</h3>

            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Condition" className="input" />
              <input placeholder="Doctor" className="input" />

              <select className="input">
                <option>Patient Type</option>
                <option>Inpatient</option>
                <option>Outpatient</option>
              </select>

              <input type="date" className="input" />
            </div>
          </div>

          {/* NOTES */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Notes</h3>
            <textarea
              rows={3}
              className="input w-full"
              placeholder="Add notes..."
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-between pt-4 border-t">
            <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
              Save Draft
            </button>

            <button className="px-6 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600">
              Add Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
