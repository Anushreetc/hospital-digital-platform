import React from 'react';
import { ServiceItem } from '../types';
import { Ambulance, Microscope, Syringe, Activity, Pill, Stethoscope, Check } from 'lucide-react';

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
    default: return <Stethoscope className="w-6 h-6 text-blue-600" />;
  }
};

export const ServicesSection: React.FC<Props> = ({ services, onBookService }) => {
  return (
    <section id="services" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Medical & Healthcare Facilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            24/7 Clinical & Diagnostic Services
          </h2>
          <p className="text-base text-slate-600">
            From emergency trauma response to high-precision NABL pathology lab tests and critical care ICUs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 hover:bg-white hover:shadow-lg transition-all duration-300 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                  {getServiceIcon(srv.iconName)}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{srv.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{srv.shortDescription}</p>
                <div className="pt-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-100">
                  {srv.fullDescription}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onBookService}
                  className="w-full text-center py-2.5 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl font-bold text-xs transition-colors shadow-sm"
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
