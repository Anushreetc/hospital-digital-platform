import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Navbar } from '../components/Navbar';
import { Footer } from '../sections/Footer';
import { HospitalAssistant } from '../components/HospitalAssistant';
import { CallAgent } from '../components/CallAgent';
import { DoctorDetailModal } from '../components/DoctorDetailModal';
import { ScrollToTop } from '../components/ScrollToTop';
import { useHospital } from './HospitalContext';
import './patient.css';

export const PublicLayout: React.FC = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const [callAgentOpen, setCallAgentOpen] = useState(false);

  const {
    hospitalInfo,
    departments,
    doctors,
    selectedDoctor,
    doctorAvail,
    setSelectedDoctor,
    handleBookDoctorDirectly,
  } = useHospital();

  useEffect(() => {
    const handleOpenCall = () => setCallAgentOpen(true);
    window.addEventListener('open-voice-call', handleOpenCall);
    window.addEventListener('open-call-agent', handleOpenCall);
    return () => {
      window.removeEventListener('open-voice-call', handleOpenCall);
      window.removeEventListener('open-call-agent', handleOpenCall);
    };
  }, []);

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

      <CallAgent
        isOpen={callAgentOpen}
        onClose={() => setCallAgentOpen(false)}
        hospitalInfo={hospitalInfo}
        doctors={doctors}
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
