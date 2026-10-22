import React, { useEffect, useState } from 'react';
import { Loader2, Send, UserCheck, UserX } from 'lucide-react';
import { AuthUser, Doctor, StaffMember, StaffRole, UserRole } from '../types';
import { staffApi } from '../services/db';
import { errorMessage } from '../lib/supabase';

interface Props {
  currentUser: AuthUser;
  doctors: Doctor[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  PATIENT: 'Patient (no staff access)',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist / Front desk',
  HOSPITAL_ADMIN: 'Hospital admin',
  SUPER_ADMIN: 'Super admin',
};

const field = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

// Staff are added by invitation only. The database and the invite-staff
// function enforce who may grant which role; this screen only offers the
// choices the current admin is allowed to make.
export const StaffManagement: React.FC<Props> = ({ currentUser, doctors }) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const invitableRoles: StaffRole[] = isSuperAdmin
    ? ['RECEPTIONIST', 'DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN']
    : ['RECEPTIONIST', 'DOCTOR'];
  const assignableRoles: UserRole[] = isSuperAdmin
    ? ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN']
    : ['PATIENT', 'DOCTOR', 'RECEPTIONIST'];

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<StaffRole>('RECEPTIONIST');
  const [doctorId, setDoctorId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setStaff(await staffApi.listStaff());
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unlinkedDoctors = doctors.filter(d => !d.userId);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMessage(null);
    setInviting(true);
    try {
      await staffApi.inviteStaff({ email, fullName, role, doctorId: role === 'DOCTOR' ? doctorId : undefined });
      setInviteMessage({ ok: true, text: `Invitation sent to ${email}. They will set a password and an authenticator app on first sign-in.` });
      setEmail('');
      setFullName('');
      setDoctorId('');
      load();
    } catch (err) {
      setInviteMessage({ ok: false, text: errorMessage(err, 'Could not send the invitation.') });
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (member: StaffMember, newRole: UserRole, active: boolean) => {
    const verb = !active ? 'deactivate' : newRole === 'PATIENT' ? 'remove staff access for' : `make ${ROLE_LABELS[newRole]}`;
    if (!confirm(`Are you sure you want to ${verb} ${member.fullName || member.email}?`)) return;
    try {
      await staffApi.setUserRole(member.id, newRole, active);
      load();
    } catch (err) {
      alert(errorMessage(err, 'Could not update access.'));
    }
  };

  const canManage = (member: StaffMember) =>
    member.id !== currentUser.id && (isSuperAdmin || (member.role !== 'HOSPITAL_ADMIN' && member.role !== 'SUPER_ADMIN'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      <form onSubmit={invite} className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-3 h-fit">
        <h3 className="font-bold text-lg text-white">Invite a staff member</h3>
        <p className="text-[11px] text-slate-400">
          They receive an email link to set a password. Every staff account must also set up an authenticator app (MFA) before it can see any data.
        </p>
        <label className="block space-y-1 text-[11px] font-semibold text-slate-300">
          <span>Full name</span>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className={field} required maxLength={120} />
        </label>
        <label className="block space-y-1 text-[11px] font-semibold text-slate-300">
          <span>Work email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} required />
        </label>
        <label className="block space-y-1 text-[11px] font-semibold text-slate-300">
          <span>Role</span>
          <select value={role} onChange={e => setRole(e.target.value as StaffRole)} className={field}>
            {invitableRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </label>
        {role === 'DOCTOR' && (
          <label className="block space-y-1 text-[11px] font-semibold text-slate-300">
            <span>Doctor profile</span>
            <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className={field} required>
              <option value="">— Choose doctor —</option>
              {unlinkedDoctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.departmentName})</option>
              ))}
            </select>
            {unlinkedDoctors.length === 0 && <span className="text-amber-400">Every doctor profile already has a login.</span>}
          </label>
        )}
        {inviteMessage && (
          <div className={`text-[11px] font-semibold p-2.5 rounded-xl border ${inviteMessage.ok ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border-rose-500/30 text-rose-300'}`}>
            {inviteMessage.text}
          </div>
        )}
        <button type="submit" disabled={inviting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send invitation
        </button>
      </form>

      <div className="lg:col-span-2 bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4">
        <h3 className="font-bold text-lg text-white">Staff accounts</h3>
        {error && <div className="text-xs text-rose-300">{error}</div>}
        {loading ? (
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        ) : staff.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No staff accounts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-300">
                {staff.map(member => (
                  <tr key={member.id}>
                    <td className="p-3 font-bold text-white">{member.fullName || '—'}{member.id === currentUser.id && <span className="ml-1 text-[10px] text-indigo-300">(you)</span>}</td>
                    <td className="p-3">{member.email ?? '—'}</td>
                    <td className="p-3">
                      {canManage(member) ? (
                        <select
                          value={member.role}
                          onChange={e => changeRole(member, e.target.value as UserRole, member.active)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                        >
                          {assignableRoles.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        ROLE_LABELS[member.role]
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${member.active ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                        {member.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {canManage(member) && (
                        <button
                          onClick={() => changeRole(member, member.role, !member.active)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 ${member.active ? 'bg-rose-600/30 hover:bg-rose-600 text-rose-200' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                          {member.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          {member.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
