import React from 'react';
import { FacilityItem } from '../types';
import { Building, Sparkles } from 'lucide-react';

interface Props {
  facilities: FacilityItem[];
}

export const FacilitiesSection: React.FC<Props> = ({ facilities }) => {
  return (
    <section id="facilities" className="py-20 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Infrastructure & Care Environment
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Advanced Medical Infrastructure & Patient Suites
          </h2>
          <p className="text-base text-slate-600">
            Designed for maximum patient comfort, infection control, and rapid diagnostic response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 group grid grid-cols-1 sm:grid-cols-12"
            >
              <div className="sm:col-span-5 h-56 sm:h-full relative overflow-hidden bg-slate-100">
                <img
                  src={fac.imageUrl}
                  alt={fac.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {fac.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {fac.description}
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  24/7 Managed & Maintained
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
