import React from 'react';
import { Link } from 'react-router-dom';
import { HospitalInfo } from '../types';
import { ShieldCheck, PhoneCall, Mail, MapPin, Ambulance } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
}

export const Footer: React.FC<Props> = ({ hospitalInfo }) => {
  return (
    <footer className="bg-[#0A1020] text-slate-300 text-xs border-t border-slate-800">
      <div className="staff-footer-links"><span>Authorised staff access</span><Link to="/staff/doctor">Doctor portal</Link><Link to="/staff/reception">Reception portal</Link><Link to="/staff/admin">Admin portal</Link></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Col 1: Brand & Contact */}
          <div className="sm:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/images/wecare-official-logo.png"
                alt="We Care Multispeciality Hospital Logo"
                className="h-11 w-auto object-contain shrink-0"
              />
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {hospitalInfo.name}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              24/7 Multi-Specialty Hospital and ICU committed to clinical excellence, attentive patient care, and round-the-clock emergency response in Doddaballapura, Karnataka.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{hospitalInfo.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Helpline: <strong className="text-white">{hospitalInfo.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24/7 Ambulance: <strong className="text-white">{hospitalInfo.ambulancePhone || '+91 93530 61993'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{hospitalInfo.email}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/" className="hover:text-blue-400 transition-colors py-1 inline-block">Home</Link></li>
              <li><Link to="/#about" className="hover:text-blue-400 transition-colors py-1 inline-block">About Us</Link></li>
              <li><Link to="/specialities" className="hover:text-blue-400 transition-colors py-1 inline-block">Specialities &amp; Departments</Link></li>
              <li><Link to="/doctors" className="hover:text-blue-400 transition-colors py-1 inline-block">Find a Doctor</Link></li>
              <li><Link to="/patient-guide" className="hover:text-blue-400 transition-colors py-1 inline-block">Patient Guide &amp; Tariffs</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors py-1 inline-block">Location &amp; Emergency</Link></li>
            </ul>
          </div>

          {/* Col 3: Patients */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Patients</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/appointment" className="hover:text-blue-400 transition-colors py-1 inline-block">Book an Appointment</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-400 transition-colors py-1 inline-block">Patient Login</Link>
              </li>
              <li>
                <Link to="/my" className="hover:text-blue-400 transition-colors py-1 inline-block">My Appointments</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Disclaimer */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Legal &amp; Clinical Notice</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Medical Disclaimer: Information on this site is provided for appointment booking and clinical service guidance. In critical emergencies, please call our 24/7 hotline or visit our emergency room immediately.
            </p>
            <div className="pt-2 flex flex-col space-y-1 text-[11px] text-slate-400">
              <span className="hover:text-white cursor-pointer py-0.5">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer py-0.5">Terms of Service</span>
            </div>
          </div>
        </div>

        <div className="pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-3 sm:gap-4 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} We Care Multispeciality Hospital and ICU Doddaballapura. All rights reserved.
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure Patient Care Digital Platform • Doddaballapura</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
