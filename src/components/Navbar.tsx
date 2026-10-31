import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, MapPin, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { HospitalInfo } from '../types';

interface NavbarProps {
  hospitalInfo: HospitalInfo;
  signedIn: boolean;
  onNavigateToAppointment?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ hospitalInfo, signedIn, onNavigateToAppointment }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleBookClick = (e: React.MouseEvent) => {
    if (onNavigateToAppointment) {
      e.preventDefault();
      setOpen(false);
      onNavigateToAppointment();
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/specialities', label: 'Specialities' },
    { to: '/doctors', label: 'Find a Doctor' },
    { to: '/patient-guide', label: 'Patient Guide & Tariffs' },
    { to: '/contact', label: 'Location & Contact' },
  ];

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="hospital-utility">
        <div>
          <span><MapPin size={14} /> Doddaballapura, Karnataka</span>
          <a href={`tel:${hospitalInfo.emergencyPhone}`}>
            <Phone size={14} /> 24/7 emergency: {hospitalInfo.emergencyPhone}
          </a>
        </div>
      </div>

      <header className="hospital-header reference-header">
        <div className="header-brand-row">
          <Link to="/" aria-label="We Care Hospital home">
            <img src="/images/wecare-official-logo.png" alt="We Care Multispeciality Hospital and ICU" />
          </Link>
          <div className="header-top-links">
            <Link to="/#about">Our hospital</Link>
            <Link to="/patient-guide">Patient guide</Link>
            <Link to="/contact">Location & contact</Link>
          </div>
          <Link to="/appointment" className="hospital-button" onClick={handleBookClick}>
            Book appointment <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="hospital-nav">
          <Link to="/" aria-label="We Care Hospital home">
            <img src="/images/wecare-official-logo.png" alt="We Care Multispeciality Hospital and ICU" />
          </Link>
          <nav aria-label="Main navigation" className={open ? 'is-open' : ''}>
            {navLinks.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={isActive ? 'font-bold text-blue-700' : ''}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
            <details>
              <summary>More</summary>
              <div>
                <Link to="/specialities" onClick={() => setOpen(false)}>All Specialities</Link>
                <Link to="/doctors" onClick={() => setOpen(false)}>Doctors & OPD Schedule</Link>
                <Link to="/patient-guide" onClick={() => setOpen(false)}>Inpatient Rooms & Tariffs</Link>
                <Link to="/patient-guide#packages" onClick={() => setOpen(false)}>Health Check Packages</Link>
                <Link to="/contact" onClick={() => setOpen(false)}>24/7 Emergency & Route</Link>
                <Link to={signedIn ? '/my' : '/login'}>
                  {signedIn ? 'My appointments' : 'Patient login'}
                </Link>
              </div>
            </details>
          </nav>
          <Link to="/appointment" className="hospital-button nav-appointment" onClick={handleBookClick}>
            Book appointment <ArrowUpRight size={17} />
          </Link>
          <button
            className="hospital-menu"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
};
