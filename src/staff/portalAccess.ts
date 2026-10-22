import { UserRole } from '../types';
export type StaffPortal = 'doctor' | 'reception' | 'admin';
export const portalInfo = {
 doctor: { title: 'Doctor portal', description: 'Your schedule. Your patients. Your clinical workspace.', features: ['View your assigned appointments', 'Manage your consultation schedule', 'Update visit status and care notes'] },
 reception: { title: 'Reception portal', description: 'Keep every patient visit organised, from enquiry to arrival.', features: ['Coordinate appointment bookings', 'Manage patient enquiries', 'Follow up voice receptionist cases'] },
 admin: { title: 'Admin portal', description: 'A dedicated workspace for hospital administration.', features: ['Manage hospital content and doctors', 'Invite and manage staff access', 'Review hospital activity'] }
};
export const canAccessPortal = (portal: StaffPortal, role?: UserRole, active = false) => active && (portal === 'doctor' ? role === 'DOCTOR' : portal === 'reception' ? role === 'RECEPTIONIST' : role === 'HOSPITAL_ADMIN' || role === 'SUPER_ADMIN');
