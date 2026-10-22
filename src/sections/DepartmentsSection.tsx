import React from 'react';
import { Department, Doctor } from '../types';
import {
  HeartPulse,
  Brain,
  Bone,
  Baby,
  UserPlus,
  Activity,
  Stethoscope,
  Wind,
  Shield,
  Headphones,
  Scissors,
  Droplets,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Props {
  departments: Department[];
  doctors: Doctor[];
  onSelectDepartment: (deptId: string) => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'HeartPulse': return <HeartPulse className="w-6 h-6 text-rose-600" />;
    case 'Brain': return <Brain className="w-6 h-6 text-indigo-600" />;
    case 'Bone': return <Bone className="w-6 h-6 text-amber-600" />;
    case 'Baby': return <Baby className="w-6 h-6 text-cyan-600" />;
    case 'UserPlus': return <UserPlus className="w-6 h-6 text-emerald-600" />;
    case 'Activity': return <Activity className="w-6 h-6 text-blue-600" />;
    case 'Wind': return <Wind className="w-6 h-6 text-teal-600" />;
    case 'Shield': return <Shield className="w-6 h-6 text-indigo-600" />;
    case 'Headphones': return <Headphones className="w-6 h-6 text-violet-600" />;
    case 'Scissors': return <Scissors className="w-6 h-6 text-red-600" />;
    case 'Droplets': return <Droplets className="w-6 h-6 text-sky-600" />;
    case 'Sparkles': return <Sparkles className="w-6 h-6 text-pink-600" />;
    default: return <Stethoscope className="w-6 h-6 text-blue-600" />;
  }
};

export const DepartmentsSection: React.FC<Props> = ({
  departments,
  doctors,
  onSelectDepartment
}) => {
  return (
    <section id="departments" className="py-12 sm:py-20 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            Specialized Medical Disciplines
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            Our Centers of Clinical Excellence
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            Comprehensive medical specialties equipped with modern diagnostic technology and experienced consultants.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {departments.map((dept) => {
            const docCount = doctors.filter(d => d.departmentId === dept.id).length;

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 xs:p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 group-hover:bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors">
                      {getIconComponent(dept.iconName)}
                    </div>
                    <span className="text-[11px] xs:text-xs font-bold px-2.5 py-1 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 rounded-full transition-colors">
                      {docCount} Specialist{docCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2 line-clamp-3 leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100">
                  <button
                    onClick={() => onSelectDepartment(dept.id)}
                    className="w-full min-h-[44px] flex items-center justify-between text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors group-hover:translate-x-1 duration-200 touch-manipulation cursor-pointer"
                  >
                    <span>View Doctors & Book</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
