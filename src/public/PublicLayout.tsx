import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Navbar } from '../components/Navbar';
import { Footer } from '../sections/Footer';
import { HospitalAssistant } from '../components/HospitalAssistant';
import { DoctorDetailModal } from '../components/DoctorDetailModal';
import { ScrollToTop } from '../components/ScrollToTop';
import { useHospital } from './HospitalContext';
import './patient.css';

export const PublicLayout: React.FC = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const {
    hospitalInfo,
    departments,
    doctors,
    selectedDoctor,
    doctorAvail,
    setSelectedDoctor,
    handleBookDoctorDirectly,
  } = useHospital();

  const handleBookAppointment = () => {
    navigate('/appointment');
  };

  return (
    <div className="hospital-site min-h-screen flex flex-col bg-white font-sans text-slate-900">
      <ScrollToTop />
      <Navbar
        hospitalInfo={hospitalInfo}
        signedIn={Boolean(session && profile?.role === 'PATIENT')}
        onNavigateToAppointment={handleBookAppointment}
      />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer hospitalInfo={hospitalInfo} />

      <HospitalAssistant
        departments={departments}
        doctors={doctors}
        hospitalInfo={hospitalInfo}
      />

      <DoctorDetailModal
        doctor={selectedDoctor}
        availability={doctorAvail}
        onClose={() => setSelectedDoctor(null)}
        onBookAppointment={(doctorId) => {
          handleBookDoctorDirectly(doctorId);
          setSelectedDoctor(null);
          navigate('/appointment');
        }}
      />
    </div>
  );
};
