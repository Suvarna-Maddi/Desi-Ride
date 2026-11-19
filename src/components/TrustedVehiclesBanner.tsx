import React, { useState } from 'react';
import { ArrowRight, X, ShieldCheck, Clock, Award, PhoneCall } from 'lucide-react';
import {
  TRANSPORTATION_VEHICLE_ASSETS,
  AGRICULTURE_VEHICLE_ASSETS,
} from '../utils/assetLibrary';
import { useAuth } from '../context/AuthContext';

export const TrustedVehiclesBanner: React.FC = () => {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const { isAuthenticated, user, navigate } = useAuth();

  const handleRegisterOwnerClick = () => {
    if (isAuthenticated && user?.role === 'owner') {
      navigate('/owner/dashboard');
    } else {
      navigate('/register?role=owner');
    }
  };

  return (
    <>
      <div className="promo-banners-grid">
        {/* LEFT PROMO BANNER: Trusted Vehicles for Every Need */}
        <div className="promo-banner-card promo-banner-trusted">
          <div className="promo-banner-text-col">
            <h2 className="promo-banner-title">
              Trusted Vehicles
              <br />
              for Every Need
            </h2>

            <div className="promo-trusted-bottom-row">
              <p className="promo-banner-subtitle">
                Safe. Reliable. Affordable.
              </p>

              <button
                type="button"
                className="promo-cta-btn"
                onClick={() => setIsLearnMoreOpen(true)}
                aria-label="Learn More about Trusted Vehicles"
              >
                <span>Learn More</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="promo-banner-media-col">
            <img
              src={TRANSPORTATION_VEHICLE_ASSETS.innova}
              alt="Toyota Innova SUV on scenic Indian highway"
              className="promo-art-img"
              loading="lazy"
            />
          </div>
        </div>

        {/* RIGHT PROMO BANNER: Earn with Your Vehicles */}
        <div className="promo-banner-card promo-banner-owner">
          <div className="promo-banner-text-col">
            <h2 className="promo-banner-title">
              Earn with Your Vehicles
            </h2>

            <p className="promo-banner-subtitle owner-subtitle">
              List your vehicle and start getting bookings.
            </p>

            <button
              type="button"
              className="promo-cta-btn owner-cta-btn"
              onClick={handleRegisterOwnerClick}
              aria-label="Register as Owner"
            >
              <span>Register as Owner</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="promo-banner-media-col owner-media-col">
            <img
              src={AGRICULTURE_VEHICLE_ASSETS.tractorField}
              alt="Partner tractor and agricultural equipment in field"
              className="promo-owner-img"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Learn More Informational Sheet */}
      {isLearnMoreOpen && (
        <div className="modal-backdrop" onClick={() => setIsLearnMoreOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">Why Desi Ride?</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsLearnMoreOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#E8F6E8', padding: '8px', borderRadius: '10px', color: '#08783F', flexShrink: 0 }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>100% Verified Drivers & Operators</h4>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    All drivers, tractor operators, and equipment owners undergo strict background checks, vehicle RC verification, and fitness inspection.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#FFF6ED', padding: '8px', borderRadius: '10px', color: '#F47716', flexShrink: 0 }}>
                  <Clock size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Guaranteed On-Time Arrival</h4>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    From early morning farm plowing to urgent city transfers, our local fleet ensures prompt service across towns and villages.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#EFF6FF', padding: '8px', borderRadius: '10px', color: '#2563EB', flexShrink: 0 }}>
                  <Award size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Fixed & Transparent Pricing</h4>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    No hidden charges, no sudden surge pricing. Standard hourly and per-km rates with digital invoice and UPI support.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#FDF2F8', padding: '8px', borderRadius: '10px', color: '#DB2777', flexShrink: 0 }}>
                  <PhoneCall size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>24x7 Regional Support</h4>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Friendly customer assistance in Telugu, Hindi & English whenever you need help before or during a trip.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
