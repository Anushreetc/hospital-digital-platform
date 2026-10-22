import React from 'react';
import { useHospital } from './HospitalContext';
import { AppointmentSection } from '../sections/AppointmentSection';
import { CalendarCheck, ShieldCheck, Clock, Phone, Stethoscope } from 'lucide-react';

export const AppointmentPage: React.FC = () => {
  const { departments, doctors, preselectedDoctorId, hospitalInfo } = useHospital();

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#10294c] via-[#143d73] to-[#10294c] text-white py-14 px-4 sm:px-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">
            INSTANT ONLINE CONSULTATION SCHEDULER
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-2 tracking-tight">
            Book an Appointment
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Select your preferred specialist or medical department, pick an available morning or evening OPD slot, and confirm your visit without long queues.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <CalendarCheck size={14} className="text-blue-300" /> Confirmed OPD Slot
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Clock size={14} className="text-blue-300" /> Minimal Wait Time
            </span>
            <a
              href={`tel:${hospitalInfo.emergencyPhone}`}
              className="flex items-center gap-1.5 bg-rose-500/20 text-rose-200 px-3 py-1.5 rounded-full hover:bg-rose-500/30 transition-colors"
            >
              <Phone size={14} /> For Emergencies, Call: {hospitalInfo.emergencyPhone}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <AppointmentSection
          departments={departments}
          doctors={doctors}
          preselectedDoctorId={preselectedDoctorId}
        />
      </div>
    </div>
  );
};
