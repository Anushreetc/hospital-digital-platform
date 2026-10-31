import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from './HospitalContext';
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
  ArrowRight,
  CheckCircle2,
  Phone
} from 'lucide-react';

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'HeartPulse': return <HeartPulse className="w-7 h-7 text-rose-600" />;
    case 'Brain': return <Brain className="w-7 h-7 text-indigo-600" />;
    case 'Bone': return <Bone className="w-7 h-7 text-amber-600" />;
    case 'Baby': return <Baby className="w-7 h-7 text-cyan-600" />;
    case 'UserPlus': return <UserPlus className="w-7 h-7 text-emerald-600" />;
    case 'Activity': return <Activity className="w-7 h-7 text-blue-600" />;
    case 'Wind': return <Wind className="w-7 h-7 text-teal-600" />;
    case 'Shield': return <Shield className="w-7 h-7 text-indigo-600" />;
    case 'Headphones': return <Headphones className="w-7 h-7 text-violet-600" />;
    case 'Scissors': return <Scissors className="w-7 h-7 text-red-600" />;
    case 'Droplets': return <Droplets className="w-7 h-7 text-sky-600" />;
    case 'Sparkles': return <Sparkles className="w-7 h-7 text-pink-600" />;
    default: return <Stethoscope className="w-7 h-7 text-blue-600" />;
  }
};

export const SpecialitiesPage: React.FC = () => {
  const { departments, doctors, hospitalInfo } = useHospital();
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#10294c] via-[#143d73] to-[#10294c] text-white py-14 px-4 sm:px-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">
            COMPREHENSIVE MULTI-SPECIALITY CARE
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-2 tracking-tight">
            Clinical Specialities &amp; Departments
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            From round-the-clock emergency and intensive care to advanced surgical disciplines, maternal care, orthopaedics and paediatrics, We Care provides integrated medical treatment in Doddaballapura.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Activity size={14} className="text-blue-300" /> {departments.length || 'Our'} Medical Disciplines
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={14} className="text-emerald-300" /> Advanced ICU &amp; OT
            </span>
            <a
              href={`tel:${hospitalInfo.emergencyPhone}`}
              className="flex items-center gap-1.5 bg-amber-500/20 text-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-500/30 transition-colors"
            >
              <Phone size={14} /> 24/7 Emergency Line: {hospitalInfo.emergencyPhone}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Specialities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const deptDoctors = doctors.filter(d => d.departmentId === dept.id);
            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      {getIconComponent(dept.iconName)}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      {deptDoctors.length} {deptDoctors.length === 1 ? 'Specialist' : 'Specialists'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {dept.description}
                  </p>

                  {deptDoctors.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <strong className="text-slate-800">Consultant Specialists:</strong>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {deptDoctors.map(d => (
                          <span key={d.id} className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                            {d.name} ({d.qualification})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/doctors')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View doctors <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/appointment')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Book Consultation
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
