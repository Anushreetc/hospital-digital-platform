import React from 'react';
import { useHospital } from './HospitalContext';
import { ContactSection } from '../sections/ContactSection';
import { Phone, MapPin, Ambulance, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactPage: React.FC = () => {
  const { hospitalInfo } = useHospital();

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#10294c] via-[#143d73] to-[#10294c] text-white py-14 px-4 sm:px-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">
            24/7 HELPLINE &amp; LOCATION GUIDE
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-2 tracking-tight">
            Location, Emergency &amp; Contact
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Conveniently situated at D-Cross Main Road, Doddaballapura, opposite Federal Bank. Open 24/7 with dedicated emergency trauma staff, ICU intensivist team, and ambulance service.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
            <a
              href={`tel:${hospitalInfo.emergencyPhone}`}
              className="flex items-center gap-1.5 bg-rose-600 text-white font-bold px-4 py-2 rounded-full hover:bg-rose-700 transition-colors shadow-sm"
            >
              <Phone size={14} /> Emergency: {hospitalInfo.emergencyPhone}
            </a>
            <a
              href={`tel:${hospitalInfo.ambulancePhone || '+919353061993'}`}
              className="flex items-center gap-1.5 bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-full hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Ambulance size={14} /> Ambulance: {hospitalInfo.ambulancePhone || '+91 93530 61993'}
            </a>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-full">
              <Clock size={14} className="text-blue-300" /> Open 24 Hours / 7 Days
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Address &amp; Landmark</h3>
              <p className="text-xs text-slate-600">{hospitalInfo.address}</p>
            </div>
          </div>
          <Link
            to="/appointment"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            Schedule Consultation <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Contact details & Map section */}
        <ContactSection hospitalInfo={hospitalInfo} />
      </div>
    </div>
  );
};
