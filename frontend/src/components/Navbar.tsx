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
    unlockBrowserAudio();
    onOpenVoiceWidget();
  };

  const primaryNavLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Departments', href: '#departments' },
    { name: 'Doctors', href: '#doctors' },
    { name: 'Services', href: '#services' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Availability', href: '#availability' },
    { name: 'Appointment', href: '#appointment' }
  ];

  const secondaryNavLinks = [
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' }
  ];

  const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Top Banner (NABH + Emergency + Voice Trigger) */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 OPD
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-semibold truncate">
              🚨 Emergency: {hospitalInfo.emergencyPhone || '+91 80 2345 9999'}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="hidden md:inline text-slate-400 text-[11px]">NABH Accredited</span>
            <button
              onClick={handleVoiceCallClick}
              className="bg-blue-600/40 hover:bg-blue-600/70 text-blue-300 hover:text-white px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-400/30 transition-all text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Mic className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>ಕನ್ನಡ Voice AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-2">
          {/* Logo & Brand */}
          <a href="#home" className="flex items-center space-x-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-lg text-slate-900 leading-tight tracking-tight">
                {hospitalInfo.name || "City Care Hospital"}
              </span>
              <span className="text-[10px] sm:text-xs text-blue-600 font-semibold tracking-wide uppercase">
                Super Specialty & Research
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-5 text-xs font-bold text-slate-700">
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
              onClick={handleVoiceCallClick}
              aria-label="Call AI Assistant"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="hidden sm:inline">Call AI Assistant</span>
              <span className="sm:hidden text-[11px]">AI Call</span>
            </button>

            <button
              onClick={onOpenAuthModal}
              className="px-2 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">Portals Login</span>
              <span className="lg:hidden text-[11px]">Login</span>
            </button>

            {/* Desktop Only Book Button */}
            <button
              onClick={onNavigateToAppointment}
              className="hidden sm:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98] shrink-0 items-center gap-1 cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Book Appointment</span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200 shadow-xl">
          <div className="grid grid-cols-2 gap-1.5 pb-2">
            {allNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-bold text-slate-800 hover:text-blue-600 hover:bg-slate-50 rounded-xl"
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
              className="w-full text-center py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-4 h-4 text-white animate-pulse" />
              <span>🎙️ Talk to AI Voice Assistant (ಕನ್ನಡ / EN)</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToAppointment();
              }}
              className="w-full text-center py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Appointment Now</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full text-center py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hospital Portal Sign In / Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
