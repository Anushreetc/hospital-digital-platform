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
import { AvailabilitySection } from './sections/AvailabilitySection';
import { AppointmentSection } from './sections/AppointmentSection';
import { FaqSection } from './sections/FaqSection';
import { ContactSection } from './sections/ContactSection';
import { Footer } from './sections/Footer';
import { DoctorDetailModal } from './components/DoctorDetailModal';
import { VoiceAgentWidget } from './components/VoiceAgentWidget';
import { VapiVoiceModal } from './components/VapiVoiceModal';
import { AuthRoleModal } from './components/AuthRoleModal';
import { AuthPages } from './pages/AuthPages';
import { ManagementDashboard } from './pages/ManagementDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { Mic, Loader2 } from 'lucide-react';

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
  const [vapiModalOpen, setVapiModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Portal & Auth State
  const [activePortalRole, setActivePortalRole] = useState<'PATIENT' | 'DOCTOR' | 'MANAGEMENT' | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('hospital_auth_token'));

  useEffect(() => {
    loadPublicData();
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
          <div className="text-lg font-bold">Loading City Care Digital Platform...</div>
          <div className="text-xs text-slate-400 mt-1">Connecting to NABH Hospital Services & Voice Engines</div>
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

      {/* Voice Assistant Modal */}
      <VoiceAgentWidget
        isOpen={voiceWidgetOpen}
        onClose={() => setVoiceWidgetOpen(false)}
      />

      <VapiVoiceModal
        isOpen={vapiModalOpen}
        onClose={() => setVapiModalOpen(false)}
        hospitalInfo={hospitalInfo}
      />

      {/* Floating Voice Agent Trigger Button - Mobile & Laptop Optimized */}
      {!voiceWidgetOpen && (
        <button
          onClick={() => setVoiceWidgetOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/30 flex items-center gap-2 sm:gap-2.5 font-bold text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
          title="Open Voice Assistant"
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
          </div>
          <span>ಕನ್ನಡ / Voice Assistant</span>
        </button>
      )}
    </div>
  );
};
