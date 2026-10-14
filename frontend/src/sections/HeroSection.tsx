import React from 'react';
import { HospitalInfo } from '../types';
import { CalendarCheck, PhoneCall, ShieldCheck, Stethoscope, Users, Clock, Bed } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
  onBookClick: () => void;
  onFindDoctorClick: () => void;
}

export const HeroSection: React.FC<Props> = ({
  hospitalInfo,
  onBookClick
}) => {
  return (
    <>
      {/* 1. Full-Screen Hospital Background Hero Section */}
      <section
        id="home"
        className="relative min-h-[calc(100svh-4.5rem)] flex items-center overflow-hidden bg-[#101B33]"
      >
        {/* Separate Background Image Layer with subtle 3-4px blur and slight scale to eliminate edge artifacts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div
            className="absolute inset-0 bg-cover bg-center sm:bg-[center_35%] scale-105 filter blur-[3.5px] transition-transform duration-1000"
            style={{ backgroundImage: `url('/images/hospital_building_pro.jpg')` }}
          />
          {/* Subtle Dark Navy Gradient Overlay (45%–60% darkness, tuned for readability while keeping facade recognizable) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#101B33]/92 via-[#101B33]/75 to-[#101B33]/50 sm:to-[#101B33]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101B33] via-transparent to-[#101B33]/40" />
        </div>

        {/* Foreground Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 flex flex-col justify-center">
          <div className="max-w-3xl space-y-5 sm:space-y-6 text-left">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>24/7 Emergency • Multispeciality Care • Doddaballapura</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.14]">
              We Care Multispeciality <br className="hidden sm:inline" />
              <span className="text-white">Hospital &amp; ICU</span>
            </h1>

            {/* Secondary Heading */}
            <p className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-300 tracking-tight">
              Advanced Healthcare. Compassionate Care.
            </p>

            {/* Description */}
            <p className="text-sm xs:text-base sm:text-lg text-slate-200/90 font-normal leading-relaxed max-w-2xl">
              Providing comprehensive medical and surgical care with dedicated specialists, advanced ICU facilities, and round-the-clock emergency support in Doddaballapura.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-3 sm:pt-4">
              <button
                onClick={onBookClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg shadow-blue-900/50 hover:shadow-blue-600/40 transition-all active:scale-95 cursor-pointer min-h-[48px]"
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Book an Appointment</span>
              </button>

              <a
                href={`tel:${hospitalInfo.emergencyPhone || '+1 307 414 9229'}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border-2 border-white/80 hover:bg-white/10 text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl transition-all active:scale-95 cursor-pointer min-h-[48px] backdrop-blur-xs"
              >
                <PhoneCall className="w-5 h-5 text-red-400 shrink-0" />
                <span>24/7 Emergency Helpline</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Hospital Information Strip Below Hero */}
      <section className="bg-white border-y border-slate-200/80 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Highlight 1: 12 Departments */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-2 sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center shrink-0 text-blue-600">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">12 Departments</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium">Specialized Medical Disciplines</div>
              </div>
            </div>

            {/* Highlight 2: 13+ Doctors */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-2 pt-4 sm:pt-2 sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">13+ Doctors</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium">Attending Consultants &amp; Surgeons</div>
              </div>
            </div>

            {/* Highlight 3: 24/7 Emergency Care */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-2 pt-4 sm:pt-2 sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100/80 flex items-center justify-center shrink-0 text-red-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">24/7 Emergency Care</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium">Round-the-Clock ICU &amp; Trauma</div>
              </div>
            </div>

            {/* Highlight 4: 28 Beds */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-2 pt-4 sm:pt-2 sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center shrink-0 text-purple-600">
                <Bed className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">28 Beds</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium">Dedicated Inpatient Facility</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
