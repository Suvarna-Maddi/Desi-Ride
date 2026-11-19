import React from 'react';
import { ArrowRight, ShieldCheck, IndianRupee, Users } from 'lucide-react';
import { HERO_ASSETS } from '../../utils/assetLibrary';

export interface OwnerHeroBannerProps {
  onAddVehicleClick: () => void;
}

export const OwnerHeroBanner: React.FC<OwnerHeroBannerProps> = ({
  onAddVehicleClick,
}) => {
  return (
    <section className="owner-hero-banner" aria-label="List Your Vehicles Promotion">
      {/* Right-Side High-Resolution Fleet & Owner Artwork */}
      <div className="owner-hero-art-layer">
        <img
          src={HERO_ASSETS.ownerHero}
          alt="Vehicle Owner with Cars, Trucks, JCBs, and Tractors"
          className="owner-hero-bg-img"
        />
        <div className="owner-hero-gradient-mask" />
      </div>

      {/* Right-Side Promotional Script Text */}
      <div className="owner-hero-script-callout" aria-hidden="true">
        <span>Your Vehicle</span>
        <span>Works for You</span>
        <svg
          className="owner-script-swoosh"
          viewBox="0 0 140 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12C42 4 95 2 136 8"
            stroke="#064D32"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Left-Side Content */}
      <div className="owner-hero-left-content">
        <span className="owner-hero-role-badge">Vehicle Owner</span>

        <h1 className="owner-hero-main-heading">List Your Vehicles</h1>

        <h2 className="owner-hero-subheading">
          <span className="sub-green">Get Bookings. </span>
          <span className="sub-orange">Earn More.</span>
        </h2>

        <p className="owner-hero-description">
          Rent your cars, trucks, JCBs, tractors, and other vehicles for any purpose.
        </p>

        <button
          type="button"
          className="owner-hero-cta-btn"
          onClick={onAddVehicleClick}
        >
          <span>Add Your Vehicle</span>
          <ArrowRight size={17} strokeWidth={2.5} />
        </button>

        {/* Three Trust Indicators */}
        <div className="owner-hero-trust-row">
          <div className="owner-trust-item">
            <span className="owner-trust-icon-circle">
              <ShieldCheck size={15} color="#FFFFFF" strokeWidth={2.3} />
            </span>
            <span className="owner-trust-text">
              Verified
              <br />
              Customers
            </span>
          </div>

          <div className="owner-trust-item">
            <span className="owner-trust-icon-circle">
              <IndianRupee size={14} color="#FFFFFF" strokeWidth={2.5} />
            </span>
            <span className="owner-trust-text">
              Secure
              <br />
              Payments
            </span>
          </div>

          <div className="owner-trust-item">
            <span className="owner-trust-icon-circle">
              <Users size={14} color="#FFFFFF" strokeWidth={2.3} />
            </span>
            <span className="owner-trust-text">
              Wide
              <br />
              Demand
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

