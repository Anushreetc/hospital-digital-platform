import React, { useState } from 'react';
import { HospitalInfo, RoomTariff } from '../types';
import { Bed, ShieldCheck, CreditCard, CheckCircle2, FileText, AlertCircle, Sparkles, Building2, PhoneCall } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
  onBookClick?: () => void;
}

export const TariffsSection: React.FC<Props> = ({ hospitalInfo, onBookClick }) => {
  const [activeTab, setActiveTab] = useState<'TARIFFS' | 'INSURANCE'>('TARIFFS');

  const tariffs: RoomTariff[] = hospitalInfo.roomTariffs || [
    {
      category: "General Ward",
      pricePerDay: 2500,
      description: "Comfortable, sanitized inpatient ward with continuous 24/7 nursing and vital monitoring.",
      features: ["Round-the-clock Nursing Care", "Comfortable Hospital Bed", "Clean Shared Restroom", "Daily Doctor Visits", "Nutritious Diet Support"]
    },
    {
      category: "Semi-Private Room",
      pricePerDay: 3500,
      description: "Twin-sharing air-conditioned room with attendant accommodation for patient comfort.",
      features: ["Air Conditioning (AC)", "Dedicated Attendant Bed", "Curtained Patient Privacy", "Daily Specialist Rounds", "Nurse Call System"]
    },
    {
      category: "Private Room",
      pricePerDay: 4000,
      description: "Independent air-conditioned private suite with attached amenities and attendant comfort.",
      features: ["Air Conditioning (AC)", "Attendant Bed & Recliner", "Attached Private Restroom", "Television & Cable", "Personal Nurse Assistance"]
    },
    {
      category: "Intensive Care Unit (ICU)",
      pricePerDay: 6000,
      description: "Advanced multidisciplinary critical care suite with continuous hemodynamic monitoring.",
      features: ["Full Climate Control / AC", "Multidisciplinary Intensivist Team", "Advanced Continuous Monitoring", "High Staff-to-Patient Ratio", "Rapid Resuscitation Protocol"]
    }
  ];

  const insuranceDocs = hospitalInfo.insuranceInfo?.documentsRequired || [
    "Identity Proof (Aadhaar Card, Voter ID, Passport)",
    "Address Proof",
    "Age Proof",
    "Previous Medical Reports & Doctor Notes",
    "Passport Size Photographs",
    "Duly Signed Insurance Pre-Authorization / Proposal Form"
  ];

  const paymentModes = hospitalInfo.insuranceInfo?.paymentMethods || [
    "Cash",
    "UPI (GPay, PhonePe, Paytm, BHIM)",
    "Debit Cards",
    "Credit Cards",
    "Net Banking"
  ];

  return (
    <section id="tariffs" className="py-12 sm:py-20 bg-gradient-to-b from-white via-slate-50 to-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" />
            Inpatient Facilities &amp; Insurance Support
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            Inpatient Rooms &amp; Cashless Insurance Desk
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            Overview of inpatient room categories and key inclusions. Specific room tariffs and treatment packages are discussed directly at the hospital admission desk.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1 border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('TARIFFS')}
              className={`px-4 xs:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'TARIFFS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bed className="w-4 h-4" />
              <span>Inpatient Room Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('INSURANCE')}
              className={`px-4 xs:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'INSURANCE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Cashless Insurance & TPAs</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Room Tariffs */}
        {activeTab === 'TARIFFS' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {tariffs.map((t, idx) => {
                const isICU = t.category.toLowerCase().includes('icu');
                return (
                  <div
                    key={t.category}
                    className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                      isICU
                        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border-blue-600/50 shadow-xl shadow-blue-900/20'
                        : 'bg-white text-slate-900 border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300'
                    }`}
                  >
                    {isICU && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-xl text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Critical Care
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isICU ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          <Bed className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`font-extrabold text-base sm:text-lg ${isICU ? 'text-white' : 'text-slate-900'}`}>
                            {t.category}
                          </h3>
                          <span className={`text-[11px] ${isICU ? 'text-blue-300' : 'text-slate-500'}`}>
                            Inpatient Care
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                          <span>Pricing Discussed at Hospital Desk</span>
                        </div>
                        <p className={`text-xs mt-3 leading-relaxed ${isICU ? 'text-slate-300' : 'text-slate-600'}`}>
                          {t.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className={`text-[11px] font-bold uppercase tracking-wider ${isICU ? 'text-blue-300' : 'text-slate-700'}`}>
                          Key Inclusions:
                        </div>
                        <ul className="space-y-1.5">
                          {t.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2 text-xs">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                  isICU ? 'text-emerald-400' : 'text-emerald-600'
                                }`}
                              />
                              <span className={isICU ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100/10">
                      <a
                        href={`tel:${hospitalInfo.phone}`}
                        className={`w-full min-h-[40px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isICU
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Enquire Admission</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note banner */}
            <div className="p-4 sm:p-5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  <strong>High Staff-to-Patient Ratio:</strong> Our Intensive Care Unit maintains dedicated 1:1 and 1:2 specialist nursing ratios for critical patient surveillance.
                </span>
              </div>
              <div className="text-[11px] font-semibold text-blue-800 shrink-0">
                Total Hospital Beds: <strong>{hospitalInfo.totalBeds || 28} Beds</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cashless Insurance & TPAs */}
        {activeTab === 'INSURANCE' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left Column: TPA Info */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                <div className="p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Cashless Health Insurance Facility
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    We Care Multispeciality Hospital and ICU Doddaballapura offers cashless admission and claims support in partnership with verified Third Party Administrators (TPAs) and health insurance providers.
                  </p>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Empaneled TPA / Insurance Providers
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-extrabold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      MD India Health Insurance TPA
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Our insurance desk assists with cashless pre-authorization and reimbursement claims for all major health policies.
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <div className="text-xs font-bold text-slate-900">
                      Accepted Payment Methods at Hospital Desk
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {paymentModes.map((mode) => (
                        <span
                          key={mode}
                          className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Required Documents */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                <div className="p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Documents Required for Cashless Pre-Authorization
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Please submit the following original and photocopies at our TPA / Admission Desk for quick approval:
                  </p>

                  <div className="space-y-2.5 pt-1">
                    {insuranceDocs.map((doc, idx) => (
                      <div
                        key={doc}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-800"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{doc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Pre-Authorization Required:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      Yes (Mandatory for Cashless)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
