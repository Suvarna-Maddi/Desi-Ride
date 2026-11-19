import React from 'react';
import { CalendarCheck, Truck, Users } from 'lucide-react';
import logoImg from '../../assets/images/desi_ride_logo.png';
import { AUTH_ASSETS } from '../../utils/assetLibrary';
import { useAuth } from '../../context/AuthContext';

interface RegistrationLayoutProps {
  children: React.ReactNode;
}

export const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({ children }) => {
  const { navigate } = useAuth();

  return (
    <div className="reg-split-screen-root">
      {/* Decorative Corner Ribbons matching uploaded reference */}
      <div className="reg-corner-ribbon-top-right" aria-hidden="true">
        <svg viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 0 L220 0 L220 120 Q135 55 40 0 Z" fill="#0B6E36" />
          <path d="M115 0 L220 0 L220 135 Q175 72 115 0 Z" fill="#F5A623" />
        </svg>
      </div>

      <div className="reg-corner-ribbon-bottom-left" aria-hidden="true">
        <svg viewBox="0 0 260 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 15 Q95 60 220 110 L0 110 Z" fill="#F5A623" />
          <path d="M0 40 Q95 75 195 110 L0 110 Z" fill="#0B6E36" />
        </svg>
      </div>

      {/* Main Split-Screen Container */}
      <div className="reg-split-inner-container">
        {/* LEFT SECTION – BRANDING AND PROMOTIONAL AREA */}
        <aside className="reg-left-promo-section" aria-label="Desi Ride Branding and Features">
          <div className="reg-left-top-content">
            {/* 1. Desi Ride Logo & Tagline */}
            <a
              href="/"
              className="reg-brand-link"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              aria-label="Desi Ride Home"
            >
              <img
                src={logoImg}
                alt="Desi Ride – Any Vehicle. Any Purpose."
                className="reg-brand-logo"
              />
            </a>

            {/* 3. Main Heading */}
            <h1 className="reg-promo-main-heading">
              Create Your
              <br />
              <span className="reg-text-orange">Desi Ride</span> Account
            </h1>

            <div className="reg-heading-orange-underline" />

            {/* 4. Three Feature Highlights with Icons */}
            <ul className="reg-feature-highlights-list">
              <li className="reg-feature-item">
                <div className="reg-feature-icon-circle">
                  <CalendarCheck size={22} strokeWidth={2.2} />
                </div>
                <span className="reg-feature-text">Book Vehicles Easily</span>
              </li>

              <li className="reg-feature-item">
                <div className="reg-feature-icon-circle">
                  <Truck size={22} strokeWidth={2.2} />
                </div>
                <span className="reg-feature-text">List Your Vehicles &amp; Earn</span>
              </li>

              <li className="reg-feature-item">
                <div className="reg-feature-icon-circle">
                  <Users size={22} strokeWidth={2.2} />
                </div>
                <span className="reg-feature-text">Manage Trips Seamlessly</span>
              </li>
            </ul>
          </div>

          {/* 5. Rural Indian Countryside & Vehicles Illustration at Bottom Left */}
          <div className="reg-left-scenic-illustration">
            <img
              src={AUTH_ASSETS.registrationIllustration}
              alt="Rural Indian road with SUV, commercial truck, agricultural tractor and JCB excavator"
              className="reg-scenic-vehicles-img"
            />
          </div>
        </aside>

        {/* RIGHT SECTION – WHITE REGISTRATION CARD */}
        <section className="reg-right-card-section" aria-label="Registration Form">
          <div className="reg-white-card">{children}</div>
        </section>
      </div>
    </div>
  );
};
