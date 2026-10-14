import React, { useState, useEffect, useRef } from 'react';
import { HospitalInfo } from '../types';
import { PhoneCall, Menu, X, UserCheck, CalendarCheck, ChevronDown, Ambulance } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
  onOpenAuthModal: () => void;
  onNavigateToAppointment: () => void;
}

export const Navbar: React.FC<Props> = ({
  hospitalInfo,
  onOpenAuthModal,
  onNavigateToAppointment
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryNavLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Departments', href: '#departments' },
    { name: 'Doctors', href: '#doctors' },
    { name: 'Services', href: '#services' },
    { name: 'Facilities', href: '#facilities' },
  ];

  const secondaryNavLinks = [
    { name: 'Tariffs & Rooms', href: '#tariffs' },
    { name: 'Patient Guide', href: '#patient-guide' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Slim, Elegant Dark Navy Top Contact Bar */}
      <div className="bg-[#101B33] text-slate-200 text-xs py-2 px-3 sm:px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          {/* Left contact items */}
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-hidden text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Doctors &amp; ICU
            </span>
            <span className="text-slate-600 hidden xs:inline">•</span>
            <a
              href={`tel:${hospitalInfo.emergencyPhone || '+918867755541'}`}
              className="text-rose-300 hover:text-white font-medium flex items-center gap-1 truncate transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-red-400 shrink-0" />
              <span className="hidden sm:inline text-slate-400">Emergency:</span>
              <span className="font-semibold">{hospitalInfo.emergencyPhone || '+91 88677 55541'}</span>
            </a>
            <span className="text-slate-600 hidden md:inline">•</span>
            <a
              href={`tel:${hospitalInfo.ambulancePhone || '+919353061993'}`}
              className="text-amber-300 hover:text-white font-medium hidden md:flex items-center gap-1 truncate transition-colors"
            >
              <Ambulance className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400">Ambulance:</span>
              <span className="font-semibold">{hospitalInfo.ambulancePhone || '+91 93530 61993'}</span>
            </a>
          </div>

          {/* Right location */}
          <div className="text-[11px] sm:text-xs text-slate-300 font-medium shrink-0 flex items-center gap-1.5">
            <span>Doddaballapura, Karnataka</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div
        className={`bg-white transition-all duration-300 border-b ${
          scrolled ? 'shadow-md border-slate-200/90 py-2.5' : 'border-slate-100 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Hospital Logo & Refined Name */}
            <a href="#home" className="flex items-center space-x-3 shrink-0 group">
              <img
                src="/images/hospital_logo.png"
                alt="We Care Multispeciality Hospital Logo"
                className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight truncate">
                  We Care Multispeciality Hospital
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  &amp; ICU Doddaballapura
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-700">
              {primaryNavLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="hover:text-blue-600 transition-colors py-1 relative whitespace-nowrap"
                >
                  {link.name}
                </a>
              ))}

              {/* Clean 'More' Dropdown for compact fit without overcrowding */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors py-1 cursor-pointer whitespace-nowrap"
                >
                  <span>More</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {secondaryNavLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={() => setMoreDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Action CTAs */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Portals Login */}
              <button
                onClick={onOpenAuthModal}
                className="px-2.5 sm:px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap border border-transparent hover:border-slate-200"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Portals Login</span>
                <span className="sm:hidden">Login</span>
              </button>

              {/* Book Appointment Primary Button */}
              <button
                onClick={onNavigateToAppointment}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-1 pb-2">
            {allNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-slate-800 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <a
              href={`tel:${hospitalInfo.emergencyPhone || '+1 307 414 9229'}`}
              className="w-full text-center py-3 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Emergency Hotline: {hospitalInfo.emergencyPhone || '+1 307 414 9229'}</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToAppointment();
              }}
              className="w-full text-center py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Appointment Now</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full text-center py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hospital Portal Sign In / Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
