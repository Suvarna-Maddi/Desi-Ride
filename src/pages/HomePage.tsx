import React, { useState, useRef, useEffect } from 'react';
import { HomeHeader } from '../components/HomeHeader';
import { FeaturedVehicles } from '../components/FeaturedVehicles';
import { HeroBanner } from '../components/HeroBanner';
import { BookingSearch } from '../components/BookingSearch';
import { VehicleCategoryGrid } from '../components/VehicleCategoryGrid';
import { CategoryItem } from '../components/VehicleCategoryCard';
import { TrustedVehiclesBanner } from '../components/TrustedVehiclesBanner';
import { BottomNavigation, NavTab } from '../components/BottomNavigation';
import { CheckCircle, Info, X, Shield, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { useAuth, getDashboardPathForRole } from '../context/AuthContext';
import { savePendingBooking, consumePendingBooking, authApi } from '../services/api';
import logoImg from '../assets/images/desi_ride_logo.png';
import '../styles/home.css';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, navigate } = useAuth();
  const [currentLocation, setCurrentLocation] = useState('Gadwal, Telangana');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('Home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bookingModalData, setBookingModalData] = useState<any | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const searchSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Restore any pending booking intent after guest logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      const pending = consumePendingBooking();
      if (pending) {
        if (pending.vehicleType) setSelectedVehicleType(pending.vehicleType);
        setBookingModalData(pending);
        showToast('Welcome back! Resuming your selected booking.');
      }
    }
  }, [isAuthenticated, user]);

  const handleScrollToBooking = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Choose your vehicle and location to proceed');
  };

  const handleNavChange = (tab: NavTab) => {
    if (tab === 'Home') {
      setActiveNavTab('Home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'BookNow') {
      handleScrollToBooking();
      return;
    }

    if (!isAuthenticated || !user) {
      savePendingBooking({
        pickup: currentLocation,
        vehicleType: selectedVehicleType || 'Toyota Innova',
        dateTime: 'Ride Now',
      });
      navigate('/login?redirect=/');
      return;
    }

    navigate(getDashboardPathForRole(user.role));
  };

  const handleSelectCategory = (category: CategoryItem) => {
    setSelectedCategoryId(category.id);
    setSelectedVehicleType(category.name.replace('\n', ' '));
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Selected category: ${category.name.replace('\n', ' ')}`);
  };

  // Guest can search vehicles freely; booking confirmation requires authentication
  const handleSearchSubmitted = (data: any) => {
    setBookingModalData({
      ...data,
      price: data.price || '₹ 18 / km',
    });
  };

  // Guest attempting to book a featured vehicle: preserve intent and redirect to /login
  const handleBookFeaturedVehicle = (v: any) => {
    const bookingIntent = {
      tab: 'vehicles',
      pickup: currentLocation,
      destination: 'Local / Outstation',
      vehicleType: v.name,
      vehicleId: v.id,
      dateTime: 'Immediate Dispatch',
      price: `${v.price} ${v.unit}`,
    };

    if (!isAuthenticated) {
      savePendingBooking(bookingIntent);
      navigate('/login?redirect=/');
      return;
    }

    setBookingModalData(bookingIntent);
  };

  const handleConfirmBooking = async () => {
    if (!bookingModalData) return;

    if (!isAuthenticated) {
      savePendingBooking(bookingModalData);
      setBookingModalData(null);
      navigate('/login?redirect=/');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      await authApi.createBooking({
        vehicle_name: bookingModalData.vehicleType,
        pickup_location: bookingModalData.pickup,
        destination: bookingModalData.destination,
        scheduled_at: bookingModalData.dateTime,
        price_estimate: bookingModalData.price || '₹ 1,250',
      });
      setBookingModalData(null);
      showToast('Booking confirmed! Redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 900);
    } catch (err: any) {
      showToast(err.message || 'Could not create booking');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="app-layout-root">
      {/* SECTION 1: RESPONSIVE HEADER */}
      <HomeHeader
        currentLocation={currentLocation}
        onSelectLocation={(loc) => {
          setCurrentLocation(loc);
          showToast(`Location set to ${loc}`);
        }}
        onNavigateTab={(tab) => handleNavChange(tab as NavTab)}
        onBookNowClick={handleScrollToBooking}
      />

      {/* MAIN CONTENT WRAPPER */}
      <main className="app-main-content">
        {/* SECTION 2: HERO PROMOTIONAL BANNER */}
        <section className="home-section hero-section" aria-label="Hero Promotion">
          <HeroBanner onBookNow={handleScrollToBooking} />
        </section>

        {/* SECTION 3: BOOKING SEARCH PANEL */}
        <section ref={searchSectionRef} className="home-section search-section" aria-label="Vehicle Booking Search">
          <BookingSearch
            currentLocation={currentLocation}
            selectedVehicleType={selectedVehicleType}
            onSelectVehicleType={(vt) => setSelectedVehicleType(vt)}
            onSearchSubmitted={handleSearchSubmitted}
          />
        </section>

        {/* SECTION 4: TWO-COLUMN BROWSE BY CATEGORY + FEATURED VEHICLES */}
        <section className="home-section main-two-column-section" aria-label="Categories and Featured Vehicles">
          <div className="two-col-left-panel">
            <VehicleCategoryGrid
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />
          </div>

          <div className="two-col-divider" aria-hidden="true" />

          <div className="two-col-right-panel">
            <FeaturedVehicles
              onBookVehicle={handleBookFeaturedVehicle}
              onViewAll={() => showToast('Showing all featured vehicles near ' + currentLocation)}
            />
          </div>
        </section>

        {/* SECTION 5: PROMOTIONAL BANNERS */}
        <section className="home-section trusted-section" aria-label="Promotional Guarantees and Partner Program">
          <TrustedVehiclesBanner />
        </section>
      </main>

      {/* DESKTOP FOOTER (Official Desi Ride Branding) */}
      <footer className="app-desktop-footer">
        <div className="footer-inner-container">
          <div className="footer-brand-col">
            <img
              src={logoImg}
              alt="Desi Ride – Vehicle Booking & Work Platform"
              style={{
                height: '56px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                marginBottom: '10px',
                backgroundColor: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '12px',
              }}
            />
            <h3 className="footer-brand-name">Desi Ride</h3>
            <p className="footer-tagline">Vehicle Booking &amp; Work Platform</p>
            <p className="footer-desc">
              India’s multi-category vehicle & agricultural equipment mobility network. Connecting farmers, commuters, and businesses with verified drivers and heavy equipment operators.
            </p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading">Vehicle Categories</h4>
            <ul className="footer-links-list">
              <li><span>Cars & SUVs</span></li>
              <li><span>Bikes & Scooters</span></li>
              <li><span>Auto Rickshaws</span></li>
              <li><span>Vans & Tempo</span></li>
              <li><span>Buses</span></li>
              <li><span>Trucks & Lorries</span></li>
              <li><span>JCB & Excavators</span></li>
              <li><span>Tractors & Harvesters</span></li>
            </ul>
          </div>

          <div className="footer-contact-col">
            <h4 className="footer-heading">Support & Regional Hubs</h4>
            <p className="footer-contact-item"><Phone size={16} /> 1800-DESI-RIDE (24x7 Toll-Free)</p>
            <p className="footer-contact-item"><Mail size={16} /> support@desiride.in</p>
            <p className="footer-contact-item"><MapPin size={16} /> Gadwal • Mahabubnagar • Hyderabad • Kurnool</p>
            <div className="footer-badge">
              <Shield size={16} color="#4ADE80" />
              <span>100% Verified Fleet & Operators</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© 2026 Desi Ride Mobility Technologies India Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>

      {/* SECTION 6: BOTTOM NAVIGATION (Mobile & Tablet) */}
      <BottomNavigation
        activeTab={activeNavTab}
        onTabChange={handleNavChange}
      />

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="toast-notice" role="alert">
          <Info size={16} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BOOKING & SEARCH MODAL */}
      {bookingModalData && (
        <div className="modal-backdrop" onClick={() => setBookingModalData(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={22} color="#08783F" />
                <h3 className="sheet-title">
                  {isAuthenticated ? 'Confirm Your Booking' : 'Vehicle Available – Login to Book'}
                </h3>
              </div>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setBookingModalData(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#F0F9F3', borderRadius: '12px', border: '1px solid #C3E3D1', marginBottom: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#064E2E', marginBottom: '6px' }}>
                Selected Vehicle & Trip Summary:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#374151' }}>
                <div><strong>Vehicle / Service:</strong> {bookingModalData.vehicleType}</div>
                <div><strong>Pickup Location:</strong> {bookingModalData.pickup}</div>
                <div><strong>Destination:</strong> {bookingModalData.destination}</div>
                <div><strong>Schedule:</strong> {bookingModalData.dateTime}</div>
                {bookingModalData.price && <div><strong>Standard Rate:</strong> {bookingModalData.price}</div>}
              </div>
            </div>

            {!isAuthenticated ? (
              <p style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: 1.45, marginBottom: '16px' }}>
                Please log in or create a Desi Ride account to confirm this booking. Your selected vehicle and trip details will be preserved automatically.
              </p>
            ) : (
              <p style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: 1.45, marginBottom: '16px' }}>
                Booking as <strong>{user?.full_name}</strong> ({user?.mobile}). A verified operator will be assigned immediately.
              </p>
            )}

            <button
              type="button"
              className="search-vehicles-cta-btn"
              style={{ width: '100%' }}
              disabled={isSubmittingBooking}
              onClick={handleConfirmBooking}
            >
              <span>
                {isSubmittingBooking
                  ? 'Confirming Booking...'
                  : isAuthenticated
                  ? 'Confirm & Book Now'
                  : 'Proceed to Login & Book'}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
