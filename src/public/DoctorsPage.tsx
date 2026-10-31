import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from './HospitalContext';
import { Search, Filter, Award, ArrowUpRight, Phone, Stethoscope, Clock, ShieldCheck } from 'lucide-react';

export const DoctorsPage: React.FC = () => {
  const { doctors, departments, handleSelectDoctorForModal, handleBookDoctorDirectly, hospitalInfo } = useHospital();
  const navigate = useNavigate();
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDoctors = doctors.filter((d) => {
    const matchesDept = selectedDeptId === 'ALL' || d.departmentId === selectedDeptId;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      (d.departmentName && d.departmentName.toLowerCase().includes(q)) ||
      d.qualification.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const onBookDoctor = (doctorId: string) => {
    handleBookDoctorDirectly(doctorId);
    navigate('/appointment');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#10294c] via-[#143d73] to-[#10294c] text-white py-14 px-4 sm:px-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">
            WE CARE CLINICAL FACULTY
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-2 tracking-tight">
            Find Your Specialist Doctor
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Consult experienced doctors, surgeons and specialists across {departments.length || 'our'} disciplines in Doddaballapura. Dedicated OPD consultations, daily rounds and 24/7 emergency response.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Stethoscope size={14} className="text-blue-300" /> {doctors.length || 'Our'} Specialists
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Clock size={14} className="text-blue-300" /> Morning &amp; Evening OPD
            </span>
            <a
              href={`tel:${hospitalInfo.emergencyPhone}`}
              className="flex items-center gap-1.5 bg-amber-500/20 text-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-500/30 transition-colors"
            >
              <Phone size={14} /> 24/7 Emergency: {hospitalInfo.emergencyPhone}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-4 sm:p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctor by name, speciality, degree..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <Filter className="text-slate-400 w-4 h-4 shrink-0 hidden sm:block" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 hidden sm:block">
                Speciality:
              </span>
              <button
                type="button"
                onClick={() => setSelectedDeptId('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                  selectedDeptId === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Specialities
              </button>
              {departments.map((dept) => (
                <button
                  type="button"
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    selectedDeptId === dept.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center font-bold text-xl text-blue-700 shrink-0 border border-blue-200/60 shadow-inner overflow-hidden">
                    {doc.photoUrl ? (
                      <img src={doc.photoUrl} alt={doc.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      doc.name.replace('Dr. ', '').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide uppercase mb-1">
                      {doc.departmentName || doc.specialization}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.qualification}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  {doc.designation && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-700">{doc.designation}</span>
                    </div>
                  )}

                  {doc.experienceYears ? (
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-amber-500 shrink-0" />
                      <span>{doc.experienceYears}+ years clinical experience</span>
                    </div>
                  ) : null}

                  {doc.languages && doc.languages.length > 0 ? (
                    <div className="text-[11px] text-slate-400">
                      Languages: {doc.languages.join(', ')}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectDoctorForModal(doc)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => onBookDoctor(doc.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  Book Appointment <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-lg">No doctors found</h4>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search query or speciality filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDeptId('ALL');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
