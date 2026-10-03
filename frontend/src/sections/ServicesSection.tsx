import React from 'react';
import { ServiceItem } from '../types';
import { Ambulance, Microscope, Syringe, Activity, Pill, Stethoscope, Baby, Shield, Heart } from 'lucide-react';

interface Props {
  services: ServiceItem[];
  onBookService: () => void;
}

const getServiceIcon = (iconName: string) => {
  switch (iconName) {
    case 'Ambulance': return <Ambulance className="w-6 h-6 text-rose-600" />;
    case 'Microscope': return <Microscope className="w-6 h-6 text-indigo-600" />;
    case 'Syringe': return <Syringe className="w-6 h-6 text-blue-600" />;
    case 'Activity': return <Activity className="w-6 h-6 text-emerald-600" />;
    case 'Pill': return <Pill className="w-6 h-6 text-amber-600" />;
    case 'Baby': return <Baby className="w-6 h-6 text-cyan-600" />;
    case 'Shield': return <Shield className="w-6 h-6 text-violet-600" />;
    default: return <Stethoscope className="w-6 h-6 text-blue-600" />;
  }
};

export const ServicesSection: React.FC<Props> = ({ services, onBookService }) => {
  return (
    <section id="services" className="py-12 sm:py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            Medical &amp; Diagnostic Services
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            24/7 Clinical &amp; Diagnostic Care
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            From 24/7 emergency trauma resuscitation and multi-disciplinary ICU care to in-house clinical tests with guaranteed Same-Day reports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-slate-50/70 rounded-2xl sm:rounded-3xl p-4 xs:p-5 sm:p-6 border border-slate-200/80 hover:bg-white hover:shadow-lg transition-all duration-300 space-y-3 sm:space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                  {getServiceIcon(srv.iconName)}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{srv.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{srv.shortDescription}</p>
                <div className="pt-2 text-[11px] xs:text-xs text-slate-500 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100">
                  {srv.fullDescription}
                </div>
              </div>

              <div className="pt-3 sm:pt-4">
                <button
                  onClick={onBookService}
                  className="w-full min-h-[42px] text-center py-2.5 px-3 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl font-bold text-xs transition-colors shadow-sm touch-manipulation cursor-pointer flex items-center justify-center"
                >
                  Schedule Service / Enquiry
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
