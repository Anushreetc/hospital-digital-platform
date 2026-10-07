import React, { useState, useEffect } from 'react';
import { HospitalInfo, Department, Doctor, ServiceItem, FacilityItem, DoctorAvailability, AuthUser } from './types';
import { apiClient } from './services/apiClient';
import { Navbar } from './components/Navbar';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { DepartmentsSection } from './sections/DepartmentsSection';
import { DoctorsSection } from './sections/DoctorsSection';
import { ServicesSection } from './sections/ServicesSection';
import { FacilitiesSection } from './sections/FacilitiesSection';
import { TariffsSection } from './sections/TariffsSection';
import { PatientGuideSection } from './sections/PatientGuideSection';
import { AvailabilitySection } from './sections/AvailabilitySection';
import { AppointmentSection } from './sections/AppointmentSection';
import { FaqSection } from './sections/FaqSection';
import { ContactSection } from './sections/ContactSection';
import { Footer } from './sections/Footer';
import { DoctorDetailModal } from './components/DoctorDetailModal';
import { VoiceAgentWidget } from './components/VoiceAgentWidget';
import { AuthRoleModal } from './components/AuthRoleModal';
import { AuthPages } from './pages/AuthPages';
import { ManagementDashboard } from './pages/ManagementDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { Mic, Loader2 } from 'lucide-react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export const App: React.FC = () => {
  // Main Data States
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI Interactive States
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorAvail, setDoctorAvail] = useState<DoctorAvailability | null>(null);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | undefined>(undefined);
  const [voiceWidgetOpen, setVoiceWidgetOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Portal & Auth State
  const [activePortalRole, setActivePortalRole] = useState<'PATIENT' | 'DOCTOR' | 'MANAGEMENT' | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('hospital_auth_token'));

  useEffect(() => {
    loadPublicData();
    
    // Initialize n8n chat widget
    createChat({
      webhookUrl: 'https://anushreetc.app.n8n.cloud/webhook/2c353b81-4725-4372-b5b7-d5165e67f9e4/chat',
      mode: 'window',
      showWelcomeScreen: false,
      initialMessages: [
        'Hello! Welcome to We Care Multispeciality Hospital.',
        'I can help you book, reschedule or cancel an appointment. How can I help?'
      ],
      i18n: {
        en: {
          title: 'Clinic Receptionist',
          subtitle: 'Available 24/7. For emergencies call +91 93530 61993',
          inputPlaceholder: 'Type your message...',
          getStarted: 'Start chat',
          footer: '',
          closeButtonTooltip: 'Close chat'
        }
      }
    });
  }, []);

  const loadPublicData = async () => {
    setLoading(true);
    try {
      const [info, depts, docs, srvs, facs] = await Promise.all([
        apiClient.getHospitalInfo(),
        apiClient.getDepartments(),
        apiClient.getDoctors(),
        apiClient.getServices(),
        apiClient.getFacilities(),
      ]);
      setHospitalInfo(info);
      setDepartments(depts);
      setDoctors(docs);
      setServices(srvs);
      setFacilities(facs);
    } catch (err) {
      console.warn('Backend loading in background:', err);
    } finally {
      setLoading(false);
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

  const handleNavigateToAppointment = () => {
    const element = document.getElementById('appointment');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectRoleFromModal = (role: 'PATIENT' | 'DOCTOR' | 'MANAGEMENT') => {
    setAuthModalOpen(false);
    setActivePortalRole(role);
  };

  const handleVoiceCallClick = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobile) {
      window.location.href = 'tel:+13074149229';
    } else {
      setVoiceWidgetOpen(true);
    }
  };

  const handleSuccessLogin = (token: string, user: any, role: string) => {
    setAuthToken(token);
    setAuthenticatedUser({
      id: user.id || user.userId,
      userId: user.id || user.userId,
      name: user.name || 'User',
      email: user.email,
      role: role as any,
      doctorId: user.doctorId
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital_auth_token');
    setAuthToken(null);
    setAuthenticatedUser(null);
    setActivePortalRole(null);
  };

  // If user is authenticated in a dashboard
  if (authenticatedUser) {
    if (authenticatedUser.role === 'SUPER_ADMIN' || authenticatedUser.role === 'HOSPITAL_ADMIN' || authenticatedUser.role === 'RECEPTIONIST') {
      return <ManagementDashboard user={authenticatedUser} onLogout={handleLogout} onNavigateHome={handleLogout} />;
    }
    if (authenticatedUser.role === 'DOCTOR') {
      return <DoctorDashboard user={authenticatedUser} onLogout={handleLogout} onNavigateHome={handleLogout} />;
    }
    if (authenticatedUser.role === 'PATIENT') {
      return <PatientDashboard user={authenticatedUser} onLogout={handleLogout} onNavigateHome={handleLogout} />;
    }
  }

  // If user is on an Auth Login / Registration Page
  if (activePortalRole) {
    return (
      <AuthPages
        role={activePortalRole}
        onSuccessLogin={handleSuccessLogin}
        onBackToWebsite={() => setActivePortalRole(null)}
      />
    );
  }

  if (loading || !hospitalInfo) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <div className="text-center">
          <div className="text-lg font-bold">Loading We Care Digital Platform...</div>
          <div className="text-xs text-slate-400 mt-1">Connecting to Doddaballapura Hospital Services &amp; Voice Engines</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Main Public Navigation Bar */}
      <Navbar
        hospitalInfo={hospitalInfo}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenVoiceWidget={() => setVoiceWidgetOpen(true)}
        onNavigateToAppointment={handleNavigateToAppointment}
      />



      {/* Main Content Sections */}
      <main className="flex-1">
        <HeroSection
          hospitalInfo={hospitalInfo}
          onBookClick={handleNavigateToAppointment}
          onVoiceClick={handleVoiceCallClick}
          onFindDoctorClick={() => {
            const el = document.getElementById('doctors');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <AboutSection hospitalInfo={hospitalInfo} />

        <DepartmentsSection
          departments={departments}
          doctors={doctors}
          onSelectDepartment={() => {
            const el = document.getElementById('doctors');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <DoctorsSection
          doctors={doctors}
          departments={departments}
          onSelectDoctor={handleSelectDoctorForModal}
          onBookDoctor={handleBookDoctorDirectly}
        />

        <ServicesSection
          services={services}
          onBookService={handleNavigateToAppointment}
        />

        <FacilitiesSection facilities={facilities} />

        <TariffsSection
          hospitalInfo={hospitalInfo}
          onBookClick={handleNavigateToAppointment}
        />

        <PatientGuideSection
          hospitalInfo={hospitalInfo}
          onBookClick={handleNavigateToAppointment}
        />

        <AvailabilitySection
          doctors={doctors}
          departments={departments}
          onBookDoctorSlot={(doctorId) => handleBookDoctorDirectly(doctorId)}
        />

        <AppointmentSection
          departments={departments}
          doctors={doctors}
          preselectedDoctorId={preselectedDoctorId}
        />

        <FaqSection />

        <ContactSection hospitalInfo={hospitalInfo} />
      </main>

      {/* Global Footer */}
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
    </div>
  );
};
