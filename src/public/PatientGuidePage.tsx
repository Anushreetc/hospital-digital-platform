import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from './HospitalContext';
import { TariffsSection } from '../sections/TariffsSection';
import { PatientGuideSection } from '../sections/PatientGuideSection';
import { FacilitiesSection } from '../sections/FacilitiesSection';
import { FaqSection } from '../sections/FaqSection';
import { ShieldCheck, Bed, FileText, Activity, Phone, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const PatientGuidePage: React.FC = () => {
  const { hospitalInfo, facilities } = useHospital();
  const navigate = useNavigate();

  const handleBook = () => {
    navigate('/appointment');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#10294c] via-[#143d73] to-[#10294c] text-white py-14 px-4 sm:px-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">
            PATIENT CARE &amp; VISITATION GUIDE
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-2 tracking-tight">
            Patient Care, Rooms &amp; Facilities
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Transparent room tariffs, admission protocols, Cashless / TPA insurance coverage, and visitor guidelines designed for a smooth and comfortable hospital experience.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Bed size={14} className="text-blue-300" /> 28 Inpatient Beds
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <ShieldCheck size={14} className="text-emerald-300" /> Transparent Pricing
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Activity size={14} className="text-blue-300" /> 24/7 ICU &amp; Emergency
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div>
        {/* Room Tariffs & Inpatient Accommodation */}
        <TariffsSection hospitalInfo={hospitalInfo} onBookClick={handleBook} />

        {/* Health Check & Diagnostic Packages Highlight */}
        <section id="packages" className="py-12 bg-white border-t border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Preventive Health Checkups
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Diagnostic &amp; Health Screening Packages
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Comprehensive blood investigations, organ health screening and specialist consultations at subsidized tariffs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Package 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                      PACKAGE - I
                    </span>
                    <span className="text-lg font-black text-slate-900">₹1,999/-</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Essential Health Profile</h3>
                  <p className="text-xs text-slate-500 mb-4">Complete routine screening for kidney, liver and blood health.</p>

                  <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-200 pt-3">
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Renal Function (Urea, Creatinine, Uric Acid)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Liver Function Test (Total Bilirubin, SGOT, SGPT)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Lipid Profile (Total Cholesterol, HDL, LDL)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Complete Blood Count &amp; ESR</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Fasting Blood Sugar &amp; Electrolytes</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleBook}
                  className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  Book Package <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Package 2 */}
              <div className="bg-blue-50/50 border-2 border-blue-500 rounded-2xl p-6 flex flex-col justify-between shadow-md relative">
                <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                  Most Popular
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                      PACKAGE - II
                    </span>
                    <span className="text-lg font-black text-slate-900">₹2,999/-</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Comprehensive Master Check</h3>
                  <p className="text-xs text-slate-500 mb-4">Advanced panel with HbA1c, vitamins, thyroid and inflammatory markers.</p>

                  <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-200 pt-3">
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Everything in Package I</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Glycated Hemoglobin (HbA1c 3-month sugar)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Thyroid Profile (T3, T4, TSH)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Vitamin B12 &amp; Vitamin D3</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Iron Profile (TIBC, UIBC, Ferritin)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> hs-CRP, Calcium &amp; ECG</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleBook}
                  className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  Book Master Package <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Package 3 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                      PACKAGE - III
                    </span>
                    <span className="text-lg font-black text-slate-900">₹2,399/-</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Metabolic &amp; Cardiac Screen</h3>
                  <p className="text-xs text-slate-500 mb-4">Focused screening for hypertension, diabetes, and heart indicators.</p>

                  <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-200 pt-3">
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Complete Lipid &amp; Cholesterol Panel</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> HbA1c &amp; Fasting Blood Sugar</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> Kidney &amp; Electrolytes Panel</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> 12-Lead Electrocardiogram (ECG)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /> General Physician Consultation</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleBook}
                  className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  Book Package <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Admission, Discharge & Visitor Guidelines */}
        <PatientGuideSection hospitalInfo={hospitalInfo} onBookClick={handleBook} />

        {/* Hospital Facilities */}
        <FacilitiesSection facilities={facilities} />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </div>
    </div>
  );
};
