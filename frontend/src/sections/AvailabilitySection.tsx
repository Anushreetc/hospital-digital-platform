import React, { useState } from 'react';
import { Doctor, Department, DoctorAvailability } from '../types';
import { Calendar, Clock, Filter, Stethoscope } from 'lucide-react';

interface Props {
  doctors: Doctor[];
  departments: Department[];
  onBookDoctorSlot: (doctorId: string, date: string, time: string) => void;
}

export const AvailabilitySection: React.FC<Props> = ({
  doctors,
  departments,
  onBookDoctorSlot
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const filteredDocs = selectedDept === 'ALL'
    ? doctors
    : doctors.filter(d => d.departmentId === selectedDept);

  return (
    <section id="availability" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Live OPD Schedules
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Doctor Availability & Consultation Timings
          </h2>
          <p className="text-base text-slate-600">
            Check weekly outpatient department hours for all specialists.
          </p>
        </div>

        {/* Filter */}
        <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Schedule by Department:</span>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-sm rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Specialties</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Availability Table Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Doctor & Designation</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">OPD Days</th>
                  <th className="py-4 px-6">Consultation Hours</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={doc.photoUrl} alt={doc.name} className="w-10 h-10 rounded-full object-cover border" />
                        <div>
                          <div className="font-bold text-slate-900">{doc.name}</div>
                          <div className="text-xs text-slate-500">{doc.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {doc.departmentName}
                    </td>
                    <td className="py-4 px-6 font-semibold text-emerald-700 text-xs">
                      Mon - Sat
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      10:00 AM – 01:00 PM & 04:00 PM – 07:00 PM
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onBookDoctorSlot(doc.id, new Date().toISOString().split('T')[0], '10:00 AM')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                      >
                        Book Slot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
