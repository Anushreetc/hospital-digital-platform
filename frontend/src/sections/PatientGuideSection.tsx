import React from 'react';
import { HospitalInfo } from '../types';
import {
  Clock,
  UserCheck,
  Languages,
  AlertTriangle,
  FileCheck2,
  PhoneCall,
  Calendar,
  Users2,
  ShieldAlert,
  HeartHandshake
} from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
  onBookClick?: () => void;
}

export const PatientGuideSection: React.FC<Props> = ({ hospitalInfo, onBookClick }) => {
  const registrationSteps = [
    {
      step: 1,
      title: "Select Category",
      desc: "Choose between OPD Consultation or New Inpatient / Emergency Registration at the reception desk."
    },
    {
      step: 2,
      title: "Present ID & Details",
      desc: "Provide your Government ID (Aadhaar Card, Voter ID) and primary contact details to the registrar."
    },
    {
      step: 3,
      title: "Complete Registration",
      desc: "Fill in basic patient medical history, previous illness summary, or emergency contacts."
    },
    {
      step: 4,
      title: "Pay Consultation Fee",
      desc: "Pay the nominal registration and doctor consultation fees via Cash, UPI, Card, or Net Banking."
    },
    {
      step: 5,
      title: "Receive UHID & OPD Card",
      desc: "Collect your permanent UHID (Unique Hospital ID) card and proceed to the designated consultation room."
    }
  ];

  const languages = hospitalInfo.supportedLanguages || [
    "English",
    "Kannada (ಕನ್ನಡ)",
    "Hindi (हिंदी)",
    "Tamil (தமிழ்)",
    "Telugu (తెలుగు)",
    "Malayalam (മലയാളം)",
    "Urdu (اردو)"
  ];

  return (
    <section id="patient-guide" className="py-12 sm:py-20 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            Patient Information & Visiting Protocol
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            How Hospital Admission & Visiting Works
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            A smooth, structured experience for new patients, inpatient family members, and visitors at We Care Multispeciality Hospital and ICU Doddaballapura.
          </p>
        </div>

        {/* 1. Step-by-Step New Patient Registration */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-sm mb-10 sm:mb-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Step-By-Step Workflow</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                New Patient OPD Registration Process
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              <span>Mandatory: Carry Aadhaar Card &amp; Past Reports</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 pt-6">
            {registrationSteps.map((s) => (
              <div
                key={s.step}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    {s.step}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-3 group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Step 0{s.step} of 05
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Visiting Hours & Restrictions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-10 sm:mb-14">
          {/* Visiting Hours Cards */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                    Official Hospital Visiting Hours
                  </h3>
                  <p className="text-xs text-slate-500">Restricted timings ensure uninterrupted patient rest and healing.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {/* General Visiting */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">General & Private Wards</div>
                    <div className="text-sm font-extrabold text-blue-700 mt-0.5">
                      9:00 AM – 11:00 AM &amp; 6:00 PM – 7:00 PM
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md">
                    2 Slots Daily
                  </span>
                </div>

                {/* ICU Visiting */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">ICU Critical Care Unit</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      5:00 PM – 6:00 PM (Strictly Supervised)
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-rose-600 text-white px-2.5 py-1 rounded-md">
                    Strict 1 Hour
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center gap-2.5">
                <Users2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span><strong>Visitor Limit:</strong> Exactly <strong>2 visitors allowed per patient</strong> at any time to maintain a sanitized environment.</span>
              </div>
            </div>
          </div>

          {/* Visitor Restrictions & Infection Control */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                    Visitor Restrictions & Safety Rules
                  </h3>
                  <p className="text-xs text-slate-500">Infection control rules protect vulnerable hospital patients.</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                  <span><strong>Age Limit:</strong> Only persons <strong>above 12 years of age</strong> are permitted in inpatient and ICU patient zones.</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                  <span><strong>Restricted Items:</strong> Electric gadgets, hot kettles, and flammable items are strictly prohibited inside patient wards.</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                  <span><strong>Sanitization & Hygiene:</strong> Visitors must wash hands or sanitize and wear masks when entering ICU and wards.</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                  <span><strong>Appointment Rescheduling:</strong> Appointment cancellation or rescheduling is processed directly with our front desk coordinators.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 7 Multilingual Languages Supported & Friendly Staff Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <HeartHandshake className="w-3.5 h-3.5" />
                What Makes Us Different
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black">
                Friendly Staff & Multilingual Patient Care in 7 Languages
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                At We Care Hospital, doctors and nursing personnel communicate fluently in 7 regional languages, ensuring every patient and attendant feels completely understood and respected.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <span>Supported Languages by Doctors & Staff:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
