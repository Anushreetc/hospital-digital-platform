import React from 'react';
import { HospitalInfo } from '../types';
import { HeartPulse, ShieldCheck, PhoneCall, Mail } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
  onOpenAuthModal: () => void;
}

export const Footer: React.FC<Props> = ({ hospitalInfo, onOpenAuthModal }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{hospitalInfo.name}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              NABH & NABL Accredited Super Specialty Hospital committed to clinical excellence, patient safety, and 24/7 critical emergency response.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 space-y-1">
              <div>📍 {hospitalInfo.address}</div>
              <div>📞 {hospitalInfo.phone}</div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#departments" className="hover:text-white transition-colors">Departments</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#doctors" className="hover:text-white transition-colors">Find Doctor</a></li>
              <li><a href="#facilities" className="hover:text-white transition-colors">Facilities</a></li>
            </ul>
          </div>

          {/* Col 3: Patient Portals */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Authenticated Portals</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={onOpenAuthModal} className="hover:text-white text-left transition-colors">Patient Sign In / Signup</button></li>
              <li><button onClick={onOpenAuthModal} className="hover:text-white text-left transition-colors">Doctor Registration & Login</button></li>
              <li><button onClick={onOpenAuthModal} className="hover:text-white text-left transition-colors">Hospital Management Login</button></li>
            </ul>
          </div>

          {/* Col 4: Legal & Disclaimer */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Legal & Compliance</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Medical Disclaimer: Information on this site is for educational & booking purposes. In case of life-threatening emergency, visit the nearest emergency room immediately.
            </p>
            <div className="pt-2 flex flex-col space-y-1 text-[11px] text-slate-400">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>

        <div className="pt-12 mt-12 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} {hospitalInfo.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure HIPAA & NABH Standard Compliant Digital Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
