import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { canAccessPortal, StaffPortal } from './portalAccess';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { accountApi } from '../services/db';
import { AuthUser } from '../types';
import { FullPageLoader } from '../components/StatusScreens';
import { StaffLoginPage } from './StaffLoginPage';
import { MfaPage } from './MfaPage';
import { SetPasswordPage } from './SetPasswordPage';
import { StaffCard } from './StaffCard';
import { ManagementDashboard } from './ManagementDashboard';
import { DoctorDashboard } from './DoctorDashboard';

const MUST_SET_PASSWORD_KEY = 'staff_must_set_password';

const readMustSetPassword = () => {
  try {
    return sessionStorage.getItem(MUST_SET_PASSWORD_KEY) !== null;
  } catch {
    return false;
  }
};

type Aal = { current: string | null; next: string | null };

// Gate for the staff app. Order of checks:
//   signed in -> password chosen (after invite/reset) -> staff role -> MFA (aal2) -> dashboard
// These screens are for usability; the database refuses staff data to any
// session that is not an active staff account with MFA.
export const StaffApp: React.FC<{portal?: StaffPortal}> = ({portal}) => <StaffGate portal={portal}/>;

const StaffGate: React.FC<{portal?: StaffPortal}> = ({portal}) => {
  const { session, profile, loading, signOut, refreshProfile } = useAuth();
  const [mustSetPassword, setMustSetPassword] = useState(readMustSetPassword);
  const [aal, setAal] = useState<Aal | null>(null);
  const [doctorId, setDoctorId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setMustSetPassword(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setAal(null);
      return;
    }
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      setAal({ current: data?.currentLevel ?? null, next: data?.nextLevel ?? null });
    });
  }, [session]);

  const isStaffRole = Boolean(profile && profile.active && profile.role !== 'PATIENT');
  const hasMfa = aal?.current === 'aal2';

  useEffect(() => {
    if (hasMfa && profile?.role === 'DOCTOR') {
      accountApi.getMyDoctorId().then(setDoctorId).catch(() => setDoctorId(null));
    } else {
      setDoctorId(undefined);
    }
  }, [hasMfa, profile?.role]);

  if (loading || (session && !aal)) return <FullPageLoader label="Checking your session…" />;

  if (!session) return <StaffLoginPage portal={portal}/>;

  if (mustSetPassword) {
    return (
      <SetPasswordPage
        onDone={() => {
          try {
            sessionStorage.removeItem(MUST_SET_PASSWORD_KEY);
          } catch {
            // ignore
          }
          setMustSetPassword(false);
        }}
      />
    );
  }

  if (!profile) return <StaffCard title="Access unavailable" subtitle="Your staff profile could not be verified."><p>Contact your hospital administrator.</p><button onClick={signOut}>Sign out</button></StaffCard>;

  if (!isStaffRole) {
    return (
      <StaffCard title="No staff access" subtitle={session.user.email ?? ''}>
        <p className="text-sm text-slate-600">
          This account does not have staff access{profile.active ? '' : ' (it has been deactivated)'}. Ask a hospital administrator to invite you.
        </p>
        <button onClick={signOut} className="w-full py-3 bg-[#195fbd] hover:bg-[#124a96] text-white font-bold rounded-xl text-sm">
          Sign out
        </button>
      </StaffCard>
    );
  }

  if (portal && !canAccessPortal(portal, profile.role, profile.active)) {
    return <StaffCard title="This portal is restricted" subtitle="Your account does not have the required role."><p className="text-sm text-slate-600">Choose your assigned workspace or contact your administrator.</p><Link to="/staff" className="block text-blue-600">Back to staff portals</Link><button onClick={signOut} className="w-full rounded-lg bg-[#195fbd] hover:bg-[#124a96] text-white py-3">Sign out</button></StaffCard>;
  }

  if (!hasMfa) {
    return (
      <MfaPage
        mode={aal?.next === 'aal2' ? 'verify' : 'enroll'}
        onVerified={async () => {
          const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          setAal({ current: data?.currentLevel ?? null, next: data?.nextLevel ?? null });
          await refreshProfile();
        }}
        onSignOut={signOut}
      />
    );
  }

  const user: AuthUser = {
    id: profile.id,
    userId: profile.id,
    email: profile.email ?? session.user.email ?? '',
    name: profile.fullName || session.user.email || 'Staff',
    role: profile.role,
    doctorId: doctorId ?? undefined,
  };

  if (portal === 'doctor' || profile.role === 'DOCTOR') {
    if (doctorId === undefined && profile.role === 'DOCTOR') return <FullPageLoader label="Loading your schedule…" />;
    // No silent fallback to another doctor's profile: an unlinked login sees the "not linked" notice.
    return <DoctorDashboard user={user} onLogout={signOut} />;
  }
  return <ManagementDashboard user={user} onLogout={signOut} portal={portal} />;
};
