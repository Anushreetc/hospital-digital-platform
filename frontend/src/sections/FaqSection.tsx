import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Where is We Care Multispeciality Hospital and ICU located?",
      a: "We are located at D Cross Main Rd, near Federal Bank, Doddaballapura, Karnataka - 561203. You can reach our front desk at +91 88677 55541 or access our location directly on Google Maps."
    },
    {
      q: "Are 24/7 Emergency, ICU, and Ambulance services available?",
      a: "Yes. Our emergency casualty room, trauma stabilization team, 24/7 Intensive Care Unit (ICU), and ambulance fleet operate round-the-clock covering Doddaballapura and all across Karnataka (Ambulance Hotline: +91 93530 61993)."
    },
    {
      q: "What are the room tariffs per day?",
      a: "Our room tariffs are transparent: General Ward is ₹2,500/day; Semi-Private Room (AC with attendant bed) is ₹3,500/day; Private Room (AC with attendant bed) is ₹4,000/day; and the Intensive Care Unit (ICU) is ₹6,000/day with multidisciplinary specialist care and continuous monitoring."
    },
    {
      q: "Does the hospital offer cashless health insurance?",
      a: "Yes, we accept health insurance and provide cashless pre-authorization through MD India Health Insurance and partnered TPAs. Please bring your identity proof (Aadhaar), address proof, age proof, previous medical summaries, and passport photographs."
    },
    {
      q: "What are the visiting hours and guidelines for inpatient wards?",
      a: "General Ward visiting hours are 9:00 AM – 11:00 AM and 6:00 PM – 7:00 PM. ICU visiting is strictly 5:00 PM – 6:00 PM. A maximum of 2 visitors per patient are permitted at any time. Visitors must be over 12 years of age, and electric/flammable items are not permitted."
    },
    {
      q: "How does a new patient register at the hospital?",
      a: "New patients can register at our reception desk: present your Aadhaar Card, complete the registration form, pay the registration and consultation fee, and receive your permanent UHID card. Appointments can also be booked by phone (+91 88677 55541) or via our Kannada AI Voice Assistant."
    },
    {
      q: "What languages do the hospital staff and doctors speak?",
      a: "Our doctors and medical staff support 7 languages: English, Kannada (ಕನ್ನಡ), Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), Malayalam (മലയാളം), and Urdu (اردو)."
    }
  ];

  return (
    <section id="faq" className="py-12 sm:py-20 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            Patient Support & Information
          </div>
          <h2 className="text-2xl xs:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Find quick answers regarding appointments, emergency admissions, and visiting hours.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full min-h-[48px] p-3.5 sm:p-5 text-left font-bold text-slate-900 flex justify-between items-center gap-3 hover:bg-slate-50 transition-colors touch-manipulation cursor-pointer"
                >
                  <span className="text-xs sm:text-base leading-snug">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="p-3.5 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
