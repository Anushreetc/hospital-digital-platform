import React from 'react';
import { HospitalInfo } from '../types';
import { ShieldCheck, CheckCircle2, HeartHandshake, Activity, Award, ArrowRight } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
}

export const AboutSection: React.FC<Props> = ({ hospitalInfo }) => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Authentic Hospital Building Photograph */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white group">
              <img
                src="/images/hospital_building_pro.jpg"
                alt="We Care Multispeciality Hospital & ICU Building"
                className="w-full h-80 sm:h-[440px] object-cover group-hover:scale-103 transition-transform duration-700"
              />
              {/* Subtle Tag Overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101B33]/90 text-white text-xs font-bold shadow-md backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Established 2023 • 24/7 Facility</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-[#101B33]/90 via-[#101B33]/50 to-transparent text-white">
                <div className="text-xs font-semibold text-blue-300">Doddaballapura, Karnataka</div>
                <div className="text-sm sm:text-base font-bold text-white">Sri Siddeshwara Complex, D Cross Main Rd</div>
              </div>
            </div>
          </div>

          {/* Right Column: About Hospital Content & Healthcare Values */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>About We Care Multispeciality Hospital</span>
              </div>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Clinical Excellence &amp; Compassionate Healing in Doddaballapura
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Established in 2023, <strong>We Care Multispeciality Hospital &amp; ICU</strong> brings together 12 specialized medical disciplines and 13+ experienced clinicians under a modern 28-bed infrastructure. Our institution operates on an unwavering standard of round-the-clock doctor availability, dedicated intensive care, and rapid emergency ambulance response across Karnataka.
            </p>

            {/* 4 Key Strengths Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>24/7 Attending Physicians</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trained emergency physicians, duty medical officers, and intensive care nurses on site 24 hours a day.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>Multi-Bed Advanced ICU</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  State-of-the-art multipara telemetry monitoring, invasive ventilator support, and crash-cart resuscitation.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>In-House Lab &amp; Pharmacy</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Same-day diagnostic biochemistry and hematology reports backed by round-the-clock prescription pharmacy.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <HeartHandshake className="w-4 h-4 shrink-0" />
                  <span>Cashless TPA Desk</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hassle-free pre-authorization and cashless hospitalization for empaneled insurance providers (MD India, etc.).
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 flex items-center gap-4">
              <a
                href="#departments"
                className="inline-flex items-center gap-2 bg-[#101B33] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <span>Explore Medical Departments</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-slate-700 hover:text-blue-600 font-semibold text-xs sm:text-sm px-3 py-3 transition-colors"
              >
                <span>Hospital Location &amp; Directions</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
