import React, { useState, useEffect } from 'react';
import { HospitalInfo, Department, ServiceItem, FacilityItem, Doctor, DoctorAvailability, AuthUser } from './types';
import { apiClient } from './services/apiClient';
import { Mic } from 'lucide-react';

import { Navbar } from './components/Navbar';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { DepartmentsSection } from './sections/DepartmentsSection';
import { ServicesSection } from './sections/ServicesSection';
import { DoctorsSection } from './sections/DoctorsSection';
import { DoctorDetailModal } from './components/DoctorDetailModal';
import { AvailabilitySection } from './sections/AvailabilitySection';
import { FacilitiesSection } from './sections/FacilitiesSection';
import { AppointmentSection } from './sections/AppointmentSection';
import { ContactSection } from './sections/ContactSection';
import { FaqSection } from './sections/FaqSection';
import { Footer } from './sections/Footer';
import { VoiceAgentWidget } from './components/VoiceAgentWidget';
import { AuthRoleModal } from './components/AuthRoleModal';

import { AuthPages } from './pages/AuthPages';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { ManagementDashboard } from './pages/ManagementDashboard';

export const App: React.FC = () => {
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Modals & Navigation
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorAvail, setDoctorAvail] = useState<DoctorAvailability | null>(null);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | undefined>(undefined);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [voiceWidgetOpen, setVoiceWidgetOpen] = useState(false);

  // Auth State
  const [activeAuthRole, setActiveAuthRole] = useState<'PATIENT' | 'DOCTOR' | 'MANAGEMENT' | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<'PUBLIC' | 'AUTH' | 'PORTAL'>('PUBLIC');

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      const [info, depts, srvs, facs, docs] = await Promise.all([
        apiClient.getHospitalInfo(),
        apiClient.getDepartments(),
        apiClient.getServices(),
        apiClient.getFacilities(),
        apiClient.getDoctors()
      ]);
      setHospitalInfo(info);
      setDepartments(depts);
      setServices(srvs);
      setFacilities(facs);
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load hospital data:', err);
    }
  };

  const handleSelectDoctorForModal = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    try {
      const avail = await apiClient.getDoctorAvailability(doc.id);
      setDoctorAvail(avail);
    } catch (err) {
      setDoctorAvail(null);
    }
  };

  const handleBookDoctorDirectly = (doctorId: string) => {
    setPreselectedDoctorId(doctorId);
    const element = document.getElementById('appointment');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectRoleFromModal = (role: 'PATIENT' | 'DOCTOR' | 'MANAGEMENT') => {
    setAuthModalOpen(false);
    setActiveAuthRole(role);
    setCurrentView('AUTH');
  };

  const handleLoginSuccess = (token: string, user: any, role: string) => {
    setCurrentUser({
      userId: user.id || user.userId,
      email: user.email || user.username,
      role: role as any,
      name: user.name
    });
    setCurrentView('PORTAL');
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital_auth_token');
    setCurrentUser(null);
    setActiveAuthRole(null);
    setCurrentView('PUBLIC');
  };

  if (!hospitalInfo) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-bold tracking-wide">Loading Hospital Digital Platform...</div>
        </div>
      </div>
    );
  }

  // Render Portal Views
  if (currentView === 'PORTAL' && currentUser) {
    if (currentUser.role === 'PATIENT') {
      return <PatientDashboard user={currentUser} onLogout={handleLogout} onNavigateHome={() => setCurrentView('PUBLIC')} />;
    } else if (currentUser.role === 'DOCTOR') {
      return <DoctorDashboard user={currentUser} onLogout={handleLogout} onNavigateHome={() => setCurrentView('PUBLIC')} />;
    } else {
      return <ManagementDashboard user={currentUser} onLogout={handleLogout} onNavigateHome={() => setCurrentView('PUBLIC')} />;
    }
  }

  // Render Auth Forms
  if (currentView === 'AUTH' && activeAuthRole) {
    return (
      <AuthPages
        role={activeAuthRole}
        onSuccessLogin={handleLoginSuccess}
        onBackToWebsite={() => setCurrentView('PUBLIC')}
      />
    );
  }

  // Render Main Public Website
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar
        hospitalInfo={hospitalInfo}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenVoiceWidget={() => setVoiceWidgetOpen(true)}
        onNavigateToAppointment={() => handleBookDoctorDirectly('')}
      />

      <main className="flex-1">
        <HeroSection
          hospitalInfo={hospitalInfo}
          onBookClick={() => handleBookDoctorDirectly('')}
          onVoiceClick={() => setVoiceWidgetOpen(true)}
          onFindDoctorClick={() => {
            const el = document.getElementById('doctors');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <AboutSection hospitalInfo={hospitalInfo} />

        <DepartmentsSection
          departments={departments}
          doctors={doctors}
          onSelectDepartment={(deptId) => {
            const el = document.getElementById('doctors');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <ServicesSection
          services={services}
          onBookService={() => handleBookDoctorDirectly('')}
        />

        <DoctorsSection
          doctors={doctors}
          departments={departments}
          onSelectDoctor={handleSelectDoctorForModal}
          onBookDoctor={handleBookDoctorDirectly}
        />

        <AvailabilitySection
          doctors={doctors}
          departments={departments}
          onBookDoctorSlot={handleBookDoctorDirectly}
        />

        <FacilitiesSection facilities={facilities} />

        <AppointmentSection
          departments={departments}
          doctors={doctors}
          preselectedDoctorId={preselectedDoctorId}
        />

        <ContactSection hospitalInfo={hospitalInfo} />

        <FaqSection />
      </main>

      <Footer
        hospitalInfo={hospitalInfo}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Doctor Profile Detail Modal */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        availability={doctorAvail}
        onClose={() => setSelectedDoctor(null)}
        onBookAppointment={handleBookDoctorDirectly}
      />

      {/* Role Selection Modal */}
      <AuthRoleModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSelectRole={handleSelectRoleFromModal}
      />

      {/* Voice Assistant Modal */}
      <VoiceAgentWidget
        isOpen={voiceWidgetOpen}
        onClose={() => setVoiceWidgetOpen(false)}
      />

      {/* Floating Voice Agent Trigger Button */}
      {!voiceWidgetOpen && (
        <button
          onClick={() => setVoiceWidgetOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/30 flex items-center gap-2.5 font-bold text-sm transition-all transform hover:scale-105 active:scale-95 group"
          title="Open Voice Assistant"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span>ಕನ್ನಡ / Voice Assistant</span>
        </button>
      )}
    </div>
  );
};
