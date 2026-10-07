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
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Col 1: Brand */}
          <div className="sm:col-span-2 space-y-3.5 sm:space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/hospital_logo.png" 
                alt="We Care Multispeciality Hospital Logo" 
                className="h-11 w-auto object-contain shrink-0" 
              />
              <span className="text-xl font-bold text-white tracking-tight">{hospitalInfo.name}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              24/7 Multi-Specialty Hospital and ICU committed to clinical excellence, attentive patient care, and round-the-clock emergency response in Doddaballapura, Karnataka.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 space-y-1">
              <div>📍 {hospitalInfo.address}</div>
              <div>📞 Helpline: {hospitalInfo.phone}</div>
              <div>🚑 Ambulance: {hospitalInfo.ambulancePhone || '+91 93530 61993'}</div>
              <div>✉️ {hospitalInfo.email}</div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#home" className="hover:text-white transition-colors py-1 inline-block">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors py-1 inline-block">About Us</a></li>
              <li><a href="#departments" className="hover:text-white transition-colors py-1 inline-block">Departments</a></li>
              <li><a href="#doctors" className="hover:text-white transition-colors py-1 inline-block">Find Doctor</a></li>
              <li><a href="#services" className="hover:text-white transition-colors py-1 inline-block">Services</a></li>
              <li><a href="#facilities" className="hover:text-white transition-colors py-1 inline-block">Facilities</a></li>
              <li><a href="#tariffs" className="hover:text-white transition-colors py-1 inline-block">Tariffs &amp; Rooms</a></li>
              <li><a href="#patient-guide" className="hover:text-white transition-colors py-1 inline-block">Patient Guide</a></li>
            </ul>
          </div>

          {/* Col 3: Patient Portals */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Authenticated Portals</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={onOpenAuthModal} className="hover:text-white text-left transition-colors py-1 block cursor-pointer">Patient Sign In / Signup</button></li>
              <li><button onClick={onOpenAuthModal} className="hover:text-white text-left transition-colors py-1 block cursor-pointer">Doctor Registration & Login</button></li>
              <li><button onClick={onOpenAuthModal} className="hover:text-white text-left transition-colors py-1 block cursor-pointer">Hospital Management Login</button></li>
            </ul>
          </div>

          {/* Col 4: Legal & Disclaimer */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Legal & Compliance</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Medical Disclaimer: Information on this site is for clinical and appointment scheduling purposes. In critical emergencies, call our 24/7 hotline or visit our emergency room immediately.
            </p>
            <div className="pt-2 flex flex-col space-y-1 text-[11px] text-slate-400">
              <span className="hover:text-white cursor-pointer py-0.5">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer py-0.5">Terms of Service</span>
            </div>
          </div>
        </div>

        <div className="pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-3 sm:gap-4 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} {hospitalInfo.name}. All rights reserved.
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Secure Patient Care Digital Platform • Doddaballapura</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
