import React from 'react';
import { HospitalInfo } from '../types';
import { Award, CheckCircle2, HeartHandshake, Shield, Sparkles, Users } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
}

export const AboutSection: React.FC<Props> = ({ hospitalInfo }) => {
  return (
    <section id="about" className="py-12 sm:py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            About Our Institution
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            Excellence in Healthcare & Patient Compassion
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            Dedicated to providing state-of-the-art medical treatment, ethical healthcare practices, and personalized care for every patient.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5 sm:space-y-6">
            <h3 className="text-xl xs:text-2xl font-bold text-slate-900">
              Welcome to {hospitalInfo.name}
            </h3>
            <p className="text-xs xs:text-sm sm:text-base text-slate-600 leading-relaxed">
              Established in 2023, We Care Multispeciality Hospital and ICU brings together multiple medical and surgical disciplines under one modern 28-bed roof in Doddaballapura. Our hospital is built on the foundation of 24/7 doctor availability, round-the-clock intensive care, and rapid emergency ambulance response across Karnataka.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
              <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 sm:space-y-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">24/7 Doctor Availability</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Trained professionals like doctors and nurses work around the clock to provide immediate and attentive patient care.</p>
              </div>

              <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 sm:space-y-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Friendly & Caring Staff</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Warm, patient-first care delivered with compassion in 7 languages (Kannada, English, Hindi, Tamil, Telugu, Malayalam, Urdu).</p>
              </div>
            </div>

            <div className="space-y-2 pt-1 sm:pt-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Key Hospital Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>24/7 Emergency Care &amp; Ambulance Services</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multi-disciplinary 24/7 Intensive Care Unit (ICU)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>In-House Diagnostic Lab (Same-Day Reports)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cashless Hospitalization with MD India Insurance</span>
                </div>
              </div>
            </div>

            {/* Notice for patients */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important Information for Patients:</strong> Please bring your previous hospital summaries, diagnostic records, and past prescriptions to help our doctors provide the best personalized care.
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img
                src="/hospital_building.jpg"
                alt="We Care Multispeciality Hospital Building Front View"
                className="w-full h-56 sm:h-64 object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700/50">
                🏢 Sri Siddeshwara Complex, D Cross Main Rd, Doddaballapura
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 xs:gap-4">
              {hospitalInfo.statistics.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={`p-4 xs:p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-center space-y-1 sm:space-y-2 shadow-sm transition-all hover:scale-105 ${
                    idx % 2 === 0 ? 'bg-gradient-to-br from-blue-900 to-slate-900 text-white' : 'bg-blue-50 border border-blue-100 text-slate-900'
                  }`}
                >
                  <div className={`text-2xl xs:text-3xl sm:text-4xl font-extrabold ${idx % 2 === 0 ? 'text-blue-400' : 'text-blue-700'}`}>
                    {stat.value}
                  </div>
                  <div className={`text-[10px] xs:text-xs font-semibold uppercase tracking-wider ${idx % 2 === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
