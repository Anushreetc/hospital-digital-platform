import React from 'react';
import { HospitalInfo } from '../types';
import { Award, CheckCircle2, HeartHandshake, Shield, Sparkles, Users } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
}

export const AboutSection: React.FC<Props> = ({ hospitalInfo }) => {
  return (
    <section id="about" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            About Our Institution
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Excellence in Healthcare & Patient Compassion
          </h2>
          <p className="text-base text-slate-600">
            Dedicated to providing state-of-the-art medical treatment, ethical healthcare practices, and personalized care for every patient.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">
              Welcome to {hospitalInfo.name}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Established with a commitment to clinical precision and patient safety, {hospitalInfo.name} brings together top specialists, cutting-edge surgical suites, and round-the-clock emergency infrastructure under one roof.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900">Our Mission</h4>
                <p className="text-xs text-slate-600">To deliver compassionate, world-class healthcare with uncompromised clinical excellence and ethical standard.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900">Our Vision</h4>
                <p className="text-xs text-slate-600">To be the most trusted super-specialty medical institute recognized for patient outcomes and innovation.</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-900 text-sm">Key Strengths & Accreditations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                {hospitalInfo.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{cert}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>24/7 ACLS Emergency & Cardiac Ambulance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Modular OT with HEPA Air Laminar Flow</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {hospitalInfo.statistics.map((stat, idx) => (
              <div
                key={stat.label}
                className={`p-6 rounded-3xl text-center space-y-2 shadow-sm transition-all hover:scale-105 ${
                  idx % 2 === 0 ? 'bg-gradient-to-br from-blue-900 to-slate-900 text-white' : 'bg-blue-50 border border-blue-100 text-slate-900'
                }`}
              >
                <div className={`text-3xl sm:text-4xl font-extrabold ${idx % 2 === 0 ? 'text-blue-400' : 'text-blue-700'}`}>
                  {stat.value}
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${idx % 2 === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
