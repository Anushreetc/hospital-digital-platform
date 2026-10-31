import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHospital } from './HospitalContext';
import { HeroSection } from '../sections/HeroSection';
import { AboutSection } from '../sections/AboutSection';
import { HospitalGallery } from '../sections/HospitalGallery';
import { AppointmentSection } from '../sections/AppointmentSection';
import {
  HeartPulse,
  Brain,
  Bone,
  Baby,
  UserPlus,
  Activity,
  Stethoscope,
  Scissors,
  ArrowRight,
  ArrowUpRight,
  Phone,
  Ambulance,
  Bed,
  ShieldCheck,
  Award,
  Clock
} from 'lucide-react';

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'HeartPulse': return <HeartPulse className="w-6 h-6 text-rose-600" />;
    case 'Brain': return <Brain className="w-6 h-6 text-indigo-600" />;
    case 'Bone': return <Bone className="w-6 h-6 text-amber-600" />;
    case 'Baby': return <Baby className="w-6 h-6 text-cyan-600" />;
    case 'UserPlus': return <UserPlus className="w-6 h-6 text-emerald-600" />;
    case 'Scissors': return <Scissors className="w-6 h-6 text-red-600" />;
    default: return <Stethoscope className="w-6 h-6 text-blue-600" />;
  }
};

export const HomePage: React.FC = () => {
  const {
    hospitalInfo,
    departments,
    doctors,
    preselectedDoctorId,
    handleSelectDoctorForModal,
    handleBookDoctorDirectly
  } = useHospital();
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate('/appointment');
  };

  const handleFindDoctorClick = () => {
    navigate('/doctors');
  };

  const featuredDepartments = departments.slice(0, 6);
  const featuredDoctors = doctors.slice(0, 4);

  return (
    <div className="space-y-0">
      {/* 1. Hero Section with authentic OT photo & quick search */}
      <HeroSection
        hospitalInfo={hospitalInfo}
        doctors={doctors}
        departments={departments}
        onBookClick={handleBookClick}
        onFindDoctorClick={handleFindDoctorClick}
      />

      {/* 2. About Section with authentic building photo card */}
      <AboutSection hospitalInfo={hospitalInfo} />

      {/* 3. Featured Specialities Preview */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Centres of Clinical Excellence
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
                Specialised Medical Disciplines
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Advanced critical care, minimally invasive surgery, obstetrics and pediatrics with modern diagnostic backup.
              </p>
            </div>
            <Link
              to="/specialities"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shrink-0 shadow-sm self-start md:self-auto"
            >
              Explore all {departments.length || ''} Specialities <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDepartments.map((dept) => {
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
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {deptDoctors.length} {deptDoctors.length === 1 ? 'Specialist' : 'Specialists'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{dept.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {dept.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to="/specialities"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      Department details <ArrowRight size={13} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleBookDoctorDirectly(deptDoctors[0]?.id || '');
                        navigate('/appointment');
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-blue-600"
                    >
                      Book OPD
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Featured Doctors Preview */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Experienced Specialists
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
                Consult With Our Doctors
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Qualified consultants and surgeons dedicated to compassionate care for your family in Doddaballapura.
              </p>
            </div>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 shadow-sm self-start md:self-auto"
            >
              View all {doctors.length || ''} Doctors <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-white border border-blue-200 flex items-center justify-center font-bold text-xl text-blue-700 shadow-sm mb-4 overflow-hidden">
                    {doc.photoUrl ? (
                      <img src={doc.photoUrl} alt={doc.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      doc.name.replace('Dr. ', '').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-full mb-1">
                    {doc.departmentName || doc.specialization}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug truncate">{doc.name}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{doc.qualification}</p>

                  {doc.experienceYears && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                      <Award size={13} className="text-amber-500 shrink-0" />
                      <span>{doc.experienceYears}+ years experience</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectDoctorForModal(doc)}
                    className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleBookDoctorDirectly(doc.id);
                      navigate('/appointment');
                    }}
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    Book <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Authentic Hospital Spaces Gallery with Lightbox Popup */}
      <HospitalGallery />

      {/* 6. Emergency & Inpatient Quick Info Banner */}
      <section className="bg-gradient-to-r from-[#10294c] to-[#163e75] text-white py-14 px-4 sm:px-8 border-y border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                24/7 EMERGENCY &amp; INTENSIVE CARE
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Round-the-Clock Emergency Support
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Emergency resuscitation, trauma surgeon availability, advanced ICU, and Karnataka-wide ambulance dispatch.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3">
              <a
                href={`tel:${hospitalInfo.emergencyPhone}`}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                <Phone size={16} /> Emergency: {hospitalInfo.emergencyPhone}
              </a>
              <a
                href={`tel:${hospitalInfo.ambulancePhone || '+919353061993'}`}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm shadow-md transition-colors"
              >
                <Ambulance size={16} /> Ambulance: {hospitalInfo.ambulancePhone || '+91 93530 61993'}
              </a>
            </div>

            <div className="bg-white/10 rounded-2xl p-6 border border-white/10 space-y-3">
              <h4 className="font-bold text-sm text-amber-200">Key Patient Services</h4>
              <ul className="text-xs space-y-2 text-slate-200">
                <li className="flex items-center gap-2">
                  <Bed size={14} className="text-blue-300" /> 28 Beds (General, Semi-Private &amp; Private AC)
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-300" /> Cashless Mediclaim &amp; TPA Assistance
                </li>
                <li className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-300" /> In-house 24/7 Pharmacy &amp; Diagnostic Lab
                </li>
              </ul>
              <Link
                to="/patient-guide"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-200 hover:text-white pt-1"
              >
                View room tariffs &amp; guide →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Instant Appointment Booking Section */}
      <section id="appointment" className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Quick OPD Scheduling
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Book a Specialist Consultation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Schedule your hospital visit online to minimize waiting room time.
            </p>
          </div>

          <AppointmentSection
            departments={departments}
            doctors={doctors}
            preselectedDoctorId={preselectedDoctorId}
          />
        </div>
      </section>
    </div>
  );
};
