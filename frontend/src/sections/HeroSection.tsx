import React from 'react';
import { HospitalInfo } from '../types';
import { CalendarCheck, Mic, PhoneCall, Search, ShieldCheck, Award, Clock } from 'lucide-react';
import { unlockBrowserAudio } from '../services/kannadaTts';

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
  const handleVoiceCallClick = () => {
    unlockBrowserAudio();
    onVoiceClick();
  };

  return (
    <section id="home" className="relative pt-4 pb-10 xs:pt-6 xs:pb-12 sm:pt-12 sm:pb-20 md:pt-16 md:pb-24 overflow-hidden bg-slate-900 text-white">
      {/* Ambient Blurred Hospital Photo Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <img 
          src="/images/hospital_building_pro.jpg" 
          alt="Background" 
          className="w-full h-full object-cover blur-3xl opacity-25 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Column: Content & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] xs:text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-blue-600 shrink-0" />
              <span>24/7 Emergency, ICU &amp; Multi-Specialty Care • Doddaballapura</span>
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] break-words">
              We Care Multispeciality <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
                Hospital &amp; ICU Doddaballapura
              </span>
            </h1>

            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Bringing specialized medical and surgical excellence under one roof — 24/7 doctor availability, dedicated 28-bed infrastructure, advanced intensive care (ICU), and round-the-clock ambulance coverage across Karnataka.
            </p>

            {/* CTAs - Mobile & Laptop Responsive */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onBookClick}
                className="w-full sm:w-auto min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer touch-manipulation"
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Book Appointment</span>
              </button>

              <a
                href={`tel:${hospitalInfo.emergencyPhone || '+1 307 414 9229'}`}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900 font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm active:scale-95 touch-manipulation"
              >
                <PhoneCall className="w-5 h-5 text-slate-500" />
                <span>24/7 Helpline: {hospitalInfo.phone || '+1 307 414 9229'}</span>
              </a>
            </div>

            {/* Trust Badges - 4 Column Grid */}
            <div className="pt-4 sm:pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-slate-200">
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-sm">
                <div className="w-9 h-9 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/30 font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs sm:text-sm">12 Depts</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Specialties</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-sm">
                <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs sm:text-sm">13+ Doctors</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Consultants</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-sm">
                <div className="w-9 h-9 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/30 font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs sm:text-sm">24/7 Care</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Doctors &amp; ICU</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-sm">
                <div className="w-9 h-9 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/30 font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs sm:text-sm">28 Beds</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Facility</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Blurred Hospital Showcase Card */}
          <div className="lg:col-span-5 relative mt-2 sm:mt-4 lg:mt-0">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-950 p-2 group">
              {/* Blurred Photo Layer inside Card */}
              <div className="relative h-64 xs:h-72 sm:h-96 md:h-[460px] rounded-xl sm:rounded-2xl overflow-hidden">
                <img
                  src="/images/hospital_building_pro.jpg"
                  alt="We Care Multispeciality Hospital Building"
                  className="w-full h-full object-cover blur-sm scale-105 group-hover:scale-110 transition-all duration-700 brightness-[0.75]"
                />

                {/* Overlay Dark Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/30"></div>

                {/* Floating Content / Glassmorphism Panel on top of blurred building photo */}
                <div className="absolute inset-0 z-10 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-bold shadow-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>24/7 ICU &amp; Emergency Campus</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-blue-600/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold">
                      Verified Center
                    </div>
                  </div>

                  <div className="space-y-2.5 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-white shadow-2xl">
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
                      <span>📍 Doddaballapura, Karnataka</span>
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                      We Care Multi Speciality Hospital &amp; ICU
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Sri Siddeshwara Complex, D Cross Main Rd, near Federal Bank.
                    </p>
                    <div className="pt-1 flex items-center justify-between border-t border-slate-700/60 text-[11px] text-slate-300">
                      <span>🚑 Ambulance: +91 93530 61993</span>
                      <span className="text-emerald-400 font-bold">28 Beds Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
