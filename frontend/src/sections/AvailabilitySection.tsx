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
    <section id="availability" className="py-12 sm:py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            Live OPD Schedules
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            Doctor Availability & Consultation Timings
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            Check weekly outpatient department hours for all specialists.
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-100 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Filter Schedule by Department:</span>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto min-h-[42px] bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3.5 sm:px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation cursor-pointer"
          >
            <option value="ALL">All Specialties</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Mobile horizontal scroll hint */}
        <div className="sm:hidden text-[11px] text-slate-500 mb-2 flex items-center justify-end gap-1 px-1">
          <span>👈 Swipe horizontally to view full table 👉</span>
        </div>

        {/* Availability Table Grid */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider">
                  <th className="py-3 sm:py-4 px-3.5 sm:px-6">Doctor & Designation</th>
                  <th className="py-3 sm:py-4 px-3.5 sm:px-6">Department</th>
                  <th className="py-3 sm:py-4 px-3.5 sm:px-6">OPD Days</th>
                  <th className="py-3 sm:py-4 px-3.5 sm:px-6">Consultation Hours</th>
                  <th className="py-3 sm:py-4 px-3.5 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <img src={doc.photoUrl} alt={doc.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{doc.name}</div>
                          <div className="text-[11px] text-slate-500">{doc.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                      {doc.departmentName}
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-semibold text-emerald-700 text-[11px] sm:text-xs">
                      Mon - Sat
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-[11px] sm:text-xs text-slate-600 font-medium">
                      10:00 AM – 01:00 PM & 04:00 PM – 07:00 PM
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-right">
                      <button
                        onClick={() => onBookDoctorSlot(doc.id, new Date().toISOString().split('T')[0], '10:00 AM')}
                        className="min-h-[38px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl transition-colors shadow-sm touch-manipulation cursor-pointer inline-flex items-center justify-center"
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
