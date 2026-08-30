import React, { useState } from 'react';
import { HospitalInfo } from '../types';
import { HeartPulse, PhoneCall, Mic, Menu, X, UserCheck, CalendarCheck } from 'lucide-react';

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

  const primaryNavLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Departments', href: '#departments' },
    { name: 'Doctors', href: '#doctors' },
    { name: 'Services', href: '#services' },
    { name: 'Contact', href: '#contact' },
  ];

  const secondaryNavLinks = [
    { name: 'Availability', href: '#availability' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'FAQ', href: '#faq' },
  ];

  const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel shadow-sm border-b border-slate-200/80 overflow-hidden">
      {/* Top Banner for Emergency */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Emergency & OPD Open
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <a href={`tel:${hospitalInfo.emergencyPhone}`} className="hover:text-white transition-colors font-semibold text-rose-400 shrink-0">
              🚨 Emergency: {hospitalInfo.emergencyPhone}
            </a>
          </div>
          <div className="flex items-center space-x-3 text-slate-300">
            <span className="hidden sm:inline">NABH Accredited Super Specialty</span>
            <button
              onClick={onOpenVoiceWidget}
              className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white px-2.5 py-0.5 rounded-full border border-blue-400/30 transition-all text-[11px] flex items-center gap-1 shrink-0"
            >
              <Mic className="w-3 h-3 text-blue-400 animate-pulse" />
              ಕನ್ನಡ ಅಸಿಸ್ಟೆಂಟ್
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2.5 min-h-[4rem] gap-2">
          {/* Logo & Name */}
          <a href="#home" className="flex items-center space-x-2 group shrink-0 max-w-[200px] sm:max-w-xs md:max-w-sm">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-blue-700 to-blue-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-xs sm:text-sm lg:text-base font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                {hospitalInfo.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide truncate hidden md:block">
                {hospitalInfo.tagline}
              </span>
            </div>
          </a>

          {/* Desktop Nav Links (Compact Primary Links on XL, All on 2XL) */}
          <nav className="hidden xl:flex items-center space-x-2 2xl:space-x-4 text-xs font-semibold text-slate-700 shrink">
            {primaryNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-blue-600 transition-colors py-1 relative whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
            {secondaryNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hidden 2xl:inline-block hover:text-blue-600 transition-colors py-1 relative whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs (Always 100% visible on screen) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <a
              href={`tel:${hospitalInfo.phone || '+918023456789'}`}
              onClick={(e) => {
                if (!window.navigator.userAgent.match(/Mobi|Android|iPhone/i)) {
                  e.preventDefault();
                  onOpenVoiceWidget();
                }
              }}
              aria-label="Call AI Assistant"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="hidden sm:inline">📞 Call AI Assistant</span>
              <span className="sm:hidden">AI Call</span>
            </a>

            <button
              onClick={onOpenAuthModal}
              className="px-2 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">Portals Login</span>
              <span className="lg:hidden">Login</span>
            </button>

            <button
              onClick={onNavigateToAppointment}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98] shrink-0 flex items-center gap-1"
            >
              <CalendarCheck className="w-3.5 h-3.5 sm:hidden" />
              <span className="whitespace-nowrap">Book Appointment</span>
            </button>

            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="2xl:hidden p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ml-0.5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="2xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200 shadow-lg">
          <div className="grid grid-cols-2 gap-1 pb-2">
            {allNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-slate-800 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full text-center py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-xl"
            >
              Portal Login / Register
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToAppointment();
              }}
              className="w-full text-center py-2 text-xs font-bold text-white bg-blue-600 rounded-xl shadow"
            >
              Book Appointment Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
