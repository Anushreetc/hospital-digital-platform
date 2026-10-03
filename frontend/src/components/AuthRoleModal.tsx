import React from 'react';
import { User, Stethoscope, Building2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'PATIENT' | 'DOCTOR' | 'MANAGEMENT') => void;
}

export const AuthRoleModal: React.FC<Props> = ({ isOpen, onClose, onSelectRole }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-[95vw] sm:w-full max-h-[92vh] overflow-y-auto p-4 xs:p-5 sm:p-6 shadow-2xl relative border border-slate-100 my-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5 sm:mb-6 pt-1 sm:pt-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2.5 sm:mb-3">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Hospital Portal Sign In</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Select your account type to continue to your dashboard</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => onSelectRole('PATIENT')}
            className="w-full min-h-[56px] flex items-center p-3.5 sm:p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group touch-manipulation cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">Patient Portal</div>
              <div className="text-[11px] sm:text-xs text-slate-500">Book appointments, view medical history & manage profile</div>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('DOCTOR')}
            className="w-full min-h-[56px] flex items-center p-3.5 sm:p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group touch-manipulation cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 shrink-0 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">Doctor Portal</div>
              <div className="text-[11px] sm:text-xs text-slate-500">View daily consultations, manage schedule & patient requests</div>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('MANAGEMENT')}
            className="w-full min-h-[56px] flex items-center p-3.5 sm:p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group touch-manipulation cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">Hospital Management</div>
              <div className="text-[11px] sm:text-xs text-slate-500">Approve doctors, manage operations, CMS content & analytics</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
