import React, { useState } from 'react';
import { Doctor, Department } from '../types';
import { Clock, Filter, AlertCircle, PhoneCall, CalendarCheck } from 'lucide-react';

interface Props {
  doctors: Doctor[];
  departments: Department[];
  onBookDoctorSlot: (doctorId: string, date: string, time: string) => void;
}

interface ScheduleSpec {
  opdDays: string;
  consultationHours: string;
  badgeStyle: string;
  actionText: string;
  actionClass: string;
}

// Master schedules defined according to the hospital operational specification PDF
const pdfSchedulesByDoctorId: Record<string, ScheduleSpec> = {
  // Row 1 in PDF: Dr. Chiranjeevi
  'doc-101': {
    opdDays: 'Routine Daily',
    consultationHours: '10:00 AM – 1:00/2:00 PM & 5:00 PM – 8:00/9:00 PM',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    actionText: 'Book Slot',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  // Row 2 in PDF: Dr. Rameshwari
  'doc-102': {
    opdDays: 'Routine Daily',
    consultationHours: '1:30 PM – 2:00 PM (Daily assured slot)',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    actionText: 'Book Slot',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  // Row 3 in PDF: Dr. Sudarshan
  'doc-109': {
    opdDays: 'Routine Daily',
    consultationHours: '1:30 PM – 2:00 PM (Early arrival on queue from 11 AM)',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    actionText: 'Book Slot',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  // Row 4 in PDF: Dr. Rajiv / Rajeev
  'doc-103': {
    opdDays: 'Evening Regular',
    consultationHours: 'Evening Sessions (Daily OPD & Post-Op Review)',
    badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    actionText: 'Book Slot',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  // Row 5 in PDF: Dr. Manasa
  'doc-105': {
    opdDays: 'Evening Regular',
    consultationHours: 'Evening Sessions (Daily OPD)',
    badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    actionText: 'Book Slot',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  // Row 6 in PDF: Dr. Shreyas / Sri Harsha
  'doc-104': {
    opdDays: 'On-Call Specialist',
    consultationHours: 'On-Call (Organ conditions, appendicitis, acute pain)',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    actionText: 'Book (3-Hr Notice)',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  // Row 7 in PDF: Dr. Ravikiran
  'doc-107': {
    opdDays: 'On-Call Specialist',
    consultationHours: 'On-Call (Critical renal intervention & surgical needs)',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    actionText: 'Book (3-Hr Notice)',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  // Row 8 in PDF: Dr. Ramegowda / Ramya Reddy
  'doc-110': {
    opdDays: 'On-Call Specialist',
    consultationHours: 'On-Call (Trauma, RTA, emergency facial CT/scan review)',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    actionText: 'Book (3-Hr Notice)',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  // Row 9 in PDF: Dr. Hariprakash
  'doc-113': {
    opdDays: 'On-Call Specialist',
    consultationHours: 'On-Call (Trauma, head injury, neurological consults)',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    actionText: 'Book (3-Hr Notice)',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  // Row 10 in PDF: Dr. Ganesh Pratap
  'doc-112': {
    opdDays: 'On-Call Specialist',
    consultationHours: 'On-Call (Respiratory distress, pulmonary evaluation)',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    actionText: 'Book (3-Hr Notice)',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  // Row 11 in PDF: Dr. Swarag
  'doc-106': {
    opdDays: 'On-Call Specialist',
    consultationHours: 'On-Call (Specialist intake and referral evaluation)',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    actionText: 'Book (3-Hr Notice)',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  // Row 12 in PDF: Dr. Ramu / Amod
  'doc-108': {
    opdDays: 'Operating Facility',
    consultationHours: 'In-house pre-op and surgical theater coverage',
    badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200',
    actionText: 'In-House OT',
    actionClass: 'bg-slate-700 hover:bg-slate-800 text-white'
  },
  // Row 13: Dr. Vishwanth
  'doc-111': {
    opdDays: 'On-Call Specialist',
    consultationHours: 'On-Call (Critical renal & urological intervention)',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    actionText: 'Book (3-Hr Notice)',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  }
};

// Sequential order matching the PDF rows 1 through 12
const pdfDoctorIdOrder = [
  'doc-101', // 1. Dr. Chiranjeevi
  'doc-102', // 2. Dr. Rameshwari
  'doc-109', // 3. Dr. Sudarshan
  'doc-103', // 4. Dr. Rajiv
  'doc-105', // 5. Dr. Manasa
  'doc-104', // 6. Dr. Shreyas / Sri Harsha
  'doc-107', // 7. Dr. Ravikiran
  'doc-110', // 8. Dr. Ramegowda / Ramya Reddy
  'doc-113', // 9. Dr. Hariprakash
  'doc-112', // 10. Dr. Ganesh Pratap
  'doc-106', // 11. Dr. Swarag
  'doc-108', // 12. Dr. Ramu / Amod
  'doc-111'  // 13. Dr. Vishwanth
];

export const AvailabilitySection: React.FC<Props> = ({
  doctors,
  departments,
  onBookDoctorSlot
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Sort doctors so they appear in the exact 1-to-1 order of the PDF specification
  const sortedDoctors = [...doctors].sort((a, b) => {
    const idxA = pdfDoctorIdOrder.indexOf(a.id);
    const idxB = pdfDoctorIdOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  const filteredDocs = selectedDept === 'ALL'
    ? sortedDoctors
    : sortedDoctors.filter(d => d.departmentId === selectedDept);

  return (
    <section id="availability" className="py-12 sm:py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            OPD Schedules & Specialist Rosters
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            Doctor Availability & Consultation Timings
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            Consultation rosters, standard OPD hours, and on-call operational models for all hospital specialists. Please confirm current availability with reception; the booking form checks live slots when connected.
          </p>
        </div>

        {/* 3-Hour Prior Booking Mandate Banner from PDF Specification */}
        <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>3-Hour Prior Booking Mandate:</strong> All routine and review consultations require a minimum of 3 hours advance booking to mobilize attending specialists. Emergency Services operate 24/7.
            </span>
          </div>
          <a
            href="tel:+918867755541"
            className="inline-flex items-center gap-1.5 font-bold text-amber-800 hover:text-amber-950 underline shrink-0 text-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            24/7 Emergency Line
          </a>
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
            <table className="w-full min-w-[700px] text-left text-xs sm:text-sm border-collapse">
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
                {filteredDocs.map((doc) => {
                  const schedule = pdfSchedulesByDoctorId[doc.id] || {
                    opdDays: 'On-Call Specialist',
                    consultationHours: 'On-Call (Specialist intake and referral evaluation)',
                    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
                    actionText: 'Book (3-Hr Notice)',
                    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white'
                  };

                  return (
                    <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <span aria-hidden="true" className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-700 font-bold shrink-0">{doc.name.replace(/^Dr\.?\s*/, '').split(' ').slice(0,2).map(n=>n[0]).join('')}</span>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{doc.name}</div>
                            <div className="text-[11px] text-slate-500">{doc.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        {doc.departmentName}
                      </td>
                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border font-bold text-[11px] sm:text-xs whitespace-nowrap ${schedule.badgeStyle}`}>
                          {schedule.opdDays}
                        </span>
                      </td>
                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-[11px] sm:text-xs text-slate-700 font-medium max-w-[280px]">
                        {schedule.consultationHours}
                      </td>
                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-right">
                        <button
                          onClick={() => onBookDoctorSlot(doc.id, new Date().toISOString().split('T')[0], '10:00 AM')}
                          className={`min-h-[38px] text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-sm touch-manipulation cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${schedule.actionClass}`}
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>{schedule.actionText}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
