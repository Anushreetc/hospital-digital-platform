import React, { useState } from 'react';
import { Doctor, Department } from '../types';
import { Award, ChevronRight, Search, Filter } from 'lucide-react';

interface Props {
  doctors: Doctor[];
  departments: Department[];
  onSelectDoctor: (doctor: Doctor) => void;
  onBookDoctor: (doctorId: string) => void;
}

export const DoctorsSection: React.FC<Props> = ({
  doctors,
  departments,
  onSelectDoctor,
  onBookDoctor
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDoctors = doctors.filter(d => {
    const matchesDept = selectedDeptId === 'ALL' || d.departmentId === selectedDeptId;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      (d.departmentName && d.departmentName.toLowerCase().includes(q)) ||
      d.qualification.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  return (
    <section id="doctors" className="py-20 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Our Medical Specialists
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Consult Experienced Doctors & Surgeons
          </h2>
          <p className="text-base text-slate-600">
            Highly qualified consultants with international fellowships and decades of clinical expertise.
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="max-w-md mx-auto mb-8 relative">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search doctor by name, specialization, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-2xl pl-12 pr-4 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-12">
          <button
            onClick={() => setSelectedDeptId('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedDeptId === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Departments ({doctors.length})
          </button>

          {departments.map((dept) => {
            const count = doctors.filter(d => d.departmentId === dept.id).length;
            if (count === 0) return null;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedDeptId === dept.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {dept.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Doctor Cards Directory Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 max-w-lg mx-auto">
            <Filter className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Doctors Match Your Search</h3>
            <p className="text-xs text-slate-500">
              Try searching with another keyword or clear department filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDeptId('ALL'); }}
              className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square mb-4 border border-slate-100">
                    <img
                      src={doc.photoUrl}
                      alt={doc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 border border-white/50 shadow-sm flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                      {doc.experienceYears} Yrs Exp
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                      {doc.departmentName || 'Specialist'}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {doc.name}
                    </h3>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{doc.designation}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{doc.qualification}</div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                    {doc.specialization}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectDoctor(doc)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors text-center"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => onBookDoctor(doc.id)}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors text-center flex items-center justify-center gap-1"
                  >
                    <span>Book Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
