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
    <section id="home" className="relative pt-4 pb-10 xs:pt-6 xs:pb-12 sm:pt-12 sm:pb-20 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-100/60 via-slate-50 to-white">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-60 h-60 sm:w-96 sm:h-96 bg-blue-100/70 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-60 h-60 sm:w-96 sm:h-96 bg-emerald-100/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Column: Content & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] xs:text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-blue-600 shrink-0" />
              <span>24/7 Emergency, ICU &amp; Multi-Specialty Care • Doddaballapura</span>
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.18] break-words">
              We Care Multispeciality <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600">
                Hospital &amp; ICU Doddaballapura
              </span>
            </h1>

            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
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
            <div className="pt-4 sm:pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-slate-700">
              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm">12 Depts</div>
                  <div className="text-[10px] sm:text-xs text-slate-500">Specialties</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm">13+ Doctors</div>
                  <div className="text-[10px] sm:text-xs text-slate-500">Consultants</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm">24/7 Care</div>
                  <div className="text-[10px] sm:text-xs text-slate-500">Doctors &amp; ICU</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100 font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm">28 Beds</div>
                  <div className="text-[10px] sm:text-xs text-slate-500">Facility</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 relative mt-2 sm:mt-4 lg:mt-0">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white">
              <img
                src="/hospital_building.jpg"
                alt="We Care Multispeciality Hospital & ICU Doddaballapura Building"
                className="w-full h-56 xs:h-64 sm:h-80 md:h-[420px] object-cover hover:scale-105 transition-transform duration-700"
              />

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
