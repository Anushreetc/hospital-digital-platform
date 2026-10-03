import React from 'react';
import { Doctor, DoctorAvailability } from '../types';
import { X, Calendar, Clock, Award, Globe, IndianRupee, Stethoscope, CheckCircle } from 'lucide-react';

interface Props {
  doctor: Doctor | null;
  availability: DoctorAvailability | null;
  onClose: () => void;
  onBookAppointment: (doctorId: string) => void;
}

export const DoctorDetailModal: React.FC<Props> = ({
  doctor,
  availability,
  onClose,
  onBookAppointment
}) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-[95vw] sm:w-full max-h-[92vh] overflow-y-auto p-4 xs:p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer z-10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left pt-2 sm:pt-0">
          <img
            src={doctor.photoUrl}
            alt={doctor.name}
            className="w-24 h-24 xs:w-28 xs:h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-md border-2 border-slate-100 shrink-0"
          />

          <div className="space-y-1.5 sm:space-y-2">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              {doctor.departmentName || 'Medical Specialist'}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 break-words">{doctor.name}</h3>
            <div className="text-xs sm:text-sm font-semibold text-slate-700">{doctor.designation}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">{doctor.qualification}</div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-medium text-emerald-700 pt-1">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{doctor.experienceYears} Years Clinical Experience</span>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 border-t border-slate-100 pt-4 sm:pt-6">
          {/* Specialization & Bio */}
          <div>
            <h4 className="text-[10px] xs:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 sm:mb-2">Specialization & Expertise</h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
              {doctor.specialization}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] xs:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 sm:mb-2">Biography & Background</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
          </div>

          {/* Languages & Fee */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] xs:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Languages Spoken
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {doctor.languages.join(', ')}
              </div>
            </div>

            {doctor.consultationFee && (
              <div className="p-3 sm:p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-[10px] xs:text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  OPD Consultation Fee
                </div>
                <div className="text-sm font-bold text-emerald-900">
                  ₹{doctor.consultationFee}
                </div>
              </div>
            )}
          </div>

          {/* OPD Availability Preview */}
          <div>
            <h4 className="text-[10px] xs:text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 sm:mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              OPD Weekly Schedule
            </h4>
            {availability && availability.weeklySchedule.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                {availability.weeklySchedule.map((sched) => (
                  <div key={sched.dayOfWeek} className="p-2 sm:p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100">
                    <div className="font-bold text-slate-900">{sched.dayOfWeek}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {sched.slots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 sm:p-3 rounded-lg">
                Mon - Sat OPD Available (10:00 AM - 01:00 PM)
              </div>
            )}
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                onBookAppointment(doctor.id);
              }}
              className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Book Appointment with {doctor.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
