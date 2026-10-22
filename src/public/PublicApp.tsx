import React, { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { FullPageError, FullPageLoader } from '../components/StatusScreens';
import { isSupabaseConfigured } from '../lib/supabase';
import { HospitalProvider } from './HospitalContext';
import { PublicLayout } from './PublicLayout';
import { HomePage } from './HomePage';
import { DoctorsPage } from './DoctorsPage';
import { SpecialitiesPage } from './SpecialitiesPage';
import { PatientGuidePage } from './PatientGuidePage';
import { ContactPage } from './ContactPage';
import { AppointmentPage } from './AppointmentPage';
import { PatientLoginPage } from './PatientLoginPage';
import { PatientPortalPage } from './PatientPortalPage';

// Staff UI is lazy-loaded only for staff routes; database authorization is always required.
const PortalPage = lazy(() => import('../staff/PortalPage'));

export const PublicApp: React.FC = () => (
  <HospitalProvider>
    <Routes>
      {/* Public multi-page website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/specialities" element={<SpecialitiesPage />} />
        <Route path="/patient-guide" element={<PatientGuidePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentPage />} />
      </Route>

      {/* Staff and patient portal routes */}
      <Route path="/staff" element={<Suspense fallback={<FullPageLoader />}><PortalPage /></Suspense>} />
      <Route path="/staff/:portal" element={<Suspense fallback={<FullPageLoader />}><PortalPage /></Suspense>} />
      <Route path="/login" element={<Configured><PatientLoginPage /></Configured>} />
      <Route path="/my" element={<RequirePatient><PatientPortalPage /></RequirePatient>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </HospitalProvider>
);

// UI guard only; the database enforces access regardless of what the browser shows.
const RequirePatient: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { session, profile, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile || !profile.active || profile.role !== 'PATIENT') {
    return (
      <FullPageError
        title="This is the patient portal"
        message="Hospital staff accounts sign in through the staff app, not the public website."
        action={<Link to="/" className="inline-block text-sm font-bold text-blue-600 hover:underline">Back to website</Link>}
      />
    );
  }
  return children;
};

const NotFound: React.FC = () => (
  <FullPageError
    title="Page not found"
    message="The page you were looking for does not exist."
    action={<Link to="/" className="inline-block text-sm font-bold text-blue-600 hover:underline">Go to the home page</Link>}
  />
);

const Configured: React.FC<{ children: React.ReactElement }> = ({ children }) =>
  isSupabaseConfigured ? children : (
    <FullPageError
      title="Patient sign-in is not available yet"
      message="Please contact reception to arrange your visit."
      action={<Link to="/">Back to hospital website</Link>}
    />
  );
