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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Hospital Portal Sign In</h3>
          <p className="text-sm text-slate-500 mt-1">Select your account type to continue to your dashboard</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectRole('PATIENT')}
            className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Patient Portal</div>
              <div className="text-xs text-slate-500">Book appointments, view medical history & manage profile</div>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('DOCTOR')}
            className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Doctor Portal</div>
              <div className="text-xs text-slate-500">View daily consultations, manage schedule & patient requests</div>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('MANAGEMENT')}
            className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Hospital Management</div>
              <div className="text-xs text-slate-500">Approve doctors, manage operations, CMS content & analytics</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
