import React from 'react';
import { HospitalInfo } from '../types';
import { CalendarCheck, Mic, PhoneCall, Search, ShieldCheck, Award, Clock } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
  onBookClick: () => void;
  onVoiceClick: () => void;
  onFindDoctorClick: () => void;
}

export const HeroSection: React.FC<Props> = ({
  hospitalInfo,
  onBookClick,
  onVoiceClick,
  onFindDoctorClick
}) => {
  return (
    <section id="home" className="relative pt-6 pb-12 sm:pt-12 sm:pb-20 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-100/60 via-slate-50 to-white">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-72 h-72 sm:w-96 sm:h-96 bg-blue-100/70 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-100/50 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Content & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>NABH & NABL Accredited Super Specialty</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.2]">
              Trusted Healthcare <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">
                For Your Whole Family
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
              Experience world-class clinical excellence, advanced surgical suites, and compassionate patient-first medical care delivered by top medical specialists 24/7.
            </p>

            {/* CTAs - Mobile & Laptop Responsive */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onBookClick}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Book Appointment</span>
              </button>

              <a
                href={`tel:${hospitalInfo.phone || '+918023456789'}`}
                onClick={(e) => {
                  if (!window.navigator.userAgent.match(/Mobi|Android|iPhone/i)) {
                    e.preventDefault();
                    onVoiceClick();
                  }
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <PhoneCall className="w-5 h-5 text-white animate-pulse" />
                <span>Call AI Assistant</span>
              </a>

              <button
                onClick={onFindDoctorClick}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-5 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Search className="w-4 h-4 text-slate-600" />
                <span>Find a Doctor</span>
              </button>

              <a
                href={`tel:${hospitalInfo.emergencyPhone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-rose-600 hover:text-rose-700 font-bold text-xs sm:text-sm px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Helpline: {hospitalInfo.phone}</span>
              </a>
            </div>

            {/* Trust Badges - Responsive Grid */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-slate-700">
              <div className="flex items-center gap-3 p-2 bg-white/60 sm:bg-transparent rounded-xl">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base">15+ Depts</div>
                  <div className="text-xs text-slate-500">Super Specialties</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-white/60 sm:bg-transparent rounded-xl">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base">45+ Doctors</div>
                  <div className="text-xs text-slate-500">Senior Consultants</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-white/60 sm:bg-transparent rounded-xl">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base">24/7 Care</div>
                  <div className="text-xs text-slate-500">ICU & Emergency</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
                alt="Hospital Facility"
                className="w-full h-64 sm:h-80 md:h-[420px] object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Active Emergency Services
                    </span>
                    <span>Bengaluru, KA</span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">Advanced Medical & ICU Infrastructure</h3>
                  <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed">Equipped with 3T MRI, 128-slice CT scan, modular laminar flow OTs, and round-the-clock cardiac care.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
