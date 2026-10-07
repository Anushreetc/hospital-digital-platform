import React, { useState } from 'react';
import { HospitalInfo } from '../types';
import { HeartPulse, PhoneCall, Mic, Menu, X, UserCheck, CalendarCheck } from 'lucide-react';
import { unlockBrowserAudio } from '../services/kannadaTts';

interface Props {
  hospitalInfo: HospitalInfo;
  onOpenAuthModal: () => void;
  onOpenVoiceWidget: () => void;
  onNavigateToAppointment: () => void;
}

export const Navbar: React.FC<Props> = ({
  hospitalInfo,
  onOpenAuthModal,
  onOpenVoiceWidget,
  onNavigateToAppointment
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleVoiceCallClick = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobile) {
      window.location.href = 'tel:+13074149229';
    } else {
      onOpenVoiceWidget();
    }
  };

  const primaryNavLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Departments', href: '#departments' },
    { name: 'Doctors', href: '#doctors' },
    { name: 'Services', href: '#services' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Tariffs & Rooms', href: '#tariffs' },
    { name: 'Patient Guide', href: '#patient-guide' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' }
  ];

  const allNavLinks = [...primaryNavLinks];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all w-full max-w-full">
      {/* Top Banner (Emergency + Ambulance + Voice Trigger) */}
      <div className="bg-slate-900 text-slate-200 text-[10px] xs:text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-4">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center gap-1.5 sm:gap-2">
          <div className="flex items-center space-x-1.5 sm:space-x-3 overflow-hidden">
            <span className="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Doctors &amp; ICU
            </span>
            <span className="text-slate-600 hidden xs:inline">|</span>
            <a href={`tel:${hospitalInfo.emergencyPhone || '+918867755541'}`} className="text-rose-400 font-semibold truncate hover:underline">
              🚨 <span className="hidden xs:inline">Emergency: </span>{hospitalInfo.emergencyPhone || '+91 88677 55541'}
            </a>
            <span className="text-slate-600 hidden md:inline">|</span>
            <a href={`tel:${hospitalInfo.ambulancePhone || '+919353061993'}`} className="text-amber-300 font-semibold truncate hidden md:inline hover:underline">
              🚑 Ambulance: {hospitalInfo.ambulancePhone || '+91 93530 61993'}
            </a>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <span className="hidden lg:inline text-slate-300 text-[11px] font-medium">Doddaballapura, Karnataka</span>

          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1440px] mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 gap-1.5 sm:gap-2">
          {/* Logo & Brand */}
          <a href="#home" className="flex items-center space-x-2.5 sm:space-x-3.5 shrink min-w-0 group">
            <img 
              src="/images/hospital_logo.png" 
              alt="We Care Multispeciality Hospital Logo" 
              className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform shrink-0" 
            />
            <div className="flex flex-col min-w-0">
              <span className="font-black text-xs xs:text-sm sm:text-base text-slate-900 leading-tight tracking-tight truncate max-w-[150px] 2xs:max-w-[180px] xs:max-w-[240px] sm:max-w-none">
                We Care Multispeciality Hospital
              </span>
              <span className="text-[9px] xs:text-[10px] text-blue-600 font-bold tracking-wide uppercase">
                &amp; ICU Doddaballapura
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-3.5 2xl:space-x-5 text-xs font-bold text-slate-700">
            {primaryNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-blue-600 transition-colors py-1 relative whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={onOpenAuthModal}
              className="px-1.5 xs:px-2 sm:px-2.5 py-1.5 sm:py-2 text-[10px] xs:text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap min-h-[34px] sm:min-h-[38px]"
            >
              <UserCheck className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Portals Login</span>
              <span className="sm:hidden">Login</span>
            </button>

            {/* Book Appointment CTA */}
            <button
              onClick={onNavigateToAppointment}
              className="hidden md:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98] shrink-0 items-center gap-1 cursor-pointer whitespace-nowrap min-h-[38px]"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 xs:p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-3 xs:px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pb-2">
            {allNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-xs font-bold text-slate-800 hover:text-blue-600 hover:bg-slate-50 rounded-xl"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleVoiceCallClick();
              }}
              className="w-full text-center py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4 text-white animate-pulse" />
              <span>🎙️ Talk to AI Voice Assistant (ಕನ್ನಡ / EN)</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToAppointment();
              }}
              className="w-full text-center py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Appointment Now</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full text-center py-2.5 px-4 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer min-h-[40px]"
            >
              Hospital Portal Sign In / Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
