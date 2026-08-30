import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I book an OPD appointment online?",
      a: "You can book directly via our website appointment form, use the Patient Portal after sign in, or click on the Kannada Voice Assistant button to speak your appointment details."
    },
    {
      q: "What should I bring for my first doctor consultation?",
      a: "Please carry any past medical records, diagnostic test reports, prescription history, and a valid photo ID for quick registration at reception."
    },
    {
      q: "Are 24/7 Emergency and ICU admissions available?",
      a: "Yes, our Emergency Department, ACLS ambulances, Trauma center, and ICUs operate round-the-clock without interruption."
    },
    {
      q: "How does the Kannada Voice Appointment Assistant work?",
      a: "Click on the floating voice assistant button. You can speak in Kannada (or English) to select your doctor, date, and preferred time. The system will guide you step-by-step and confirm your Appointment ID."
    },
    {
      q: "Can I cancel or reschedule my appointment?",
      a: "Yes, patients logged into the Patient Portal can cancel appointments directly, or you can call our reception desk at least 2 hours prior to your scheduled slot."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Patient Support & Information
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Find quick answers regarding appointments, emergency admissions, and visiting hours.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-slate-900 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 text-sm text-slate-600 border-t border-slate-100 leading-relaxed bg-slate-50/50">
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
