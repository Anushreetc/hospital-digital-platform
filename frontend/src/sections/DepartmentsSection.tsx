import React from 'react';
import { Department, Doctor } from '../types';
import { HeartPulse, Brain, Bone, Baby, UserPlus, Activity, Stethoscope, ArrowRight } from 'lucide-react';

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
    default: return <Stethoscope className="w-6 h-6 text-blue-600" />;
  }
};

export const DepartmentsSection: React.FC<Props> = ({
  departments,
  doctors,
  onSelectDepartment
}) => {
  return (
    <section id="departments" className="py-20 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Specialized Medical Disciplines
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Our Centers of Clinical Excellence
          </h2>
          <p className="text-base text-slate-600">
            Comprehensive medical specialties equipped with modern diagnostic technology and experienced consultants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {departments.map((dept) => {
            const docCount = doctors.filter(d => d.departmentId === dept.id).length;

            return (
              <div
                key={dept.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-colors">
                      {getIconComponent(dept.iconName)}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 rounded-full transition-colors">
                      {docCount} Specialist{docCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <button
                    onClick={() => onSelectDepartment(dept.id)}
                    className="w-full flex items-center justify-between text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors group-hover:translate-x-1 duration-200"
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
