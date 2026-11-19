import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  MapPin,
  ChevronDown,
  Bell,
  X,
  CheckCircle2,
  Navigation,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  ShieldCheck,
  Car,
  Sparkles,
  Tractor,
  Wrench,
} from 'lucide-react';
import logoImg from '../assets/images/desi_ride_logo.png';
import { useAuth, getDashboardPathForRole } from '../context/AuthContext';

export interface HomeHeaderProps {
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  onNavigateTab?: (tab: string) => void;
  onBookNowClick?: () => void;
  activeSection?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  currentLocation,
  onSelectLocation,
  onNavigateTab,
  onBookNowClick,
  activeSection,
}) => {
  const { user, isAuthenticated, currentPath, navigate, logout } = useAuth();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const popularLocations = [
    { city: 'Gadwal, Telangana', area: 'Main Town, Raichur Road' },
    { city: 'Hyderabad, Telangana', area: 'Shamshabad, Gachibowli, Kukatpally' },
    { city: 'Mahabubnagar, Telangana', area: 'Clock Tower, Station Road' },
    { city: 'Kurnool, Andhra Pradesh', area: 'RTC Bus Stand, C-Camp' },
    { city: 'Raichur, Karnataka', area: 'Station Area, Agricultural Market' },
    { city: 'Wanaparthy, Telangana', area: 'Gandhi Chowk, Market Yard' },
  ];

  const filteredLocations = popularLocations.filter(
    (loc) =>
      loc.city.toLowerCase().includes(locationSearch.toLowerCase()) ||
      loc.area.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Role-based navigation links per Section 7 of requirements
  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: 'Home', id: 'Home', action: () => navigate('/') },
        {
          label: 'Vehicles',
          id: 'Vehicles',
          action: () => {
            if (currentPath !== '/') navigate('/');
            setTimeout(() => onBookNowClick?.(), 80);
          },
        },
        {
          label: 'Services',
          id: 'Services',
          action: () => {
            if (currentPath !== '/') navigate('/');
            setTimeout(() => onBookNowClick?.(), 80);
          },
        },
        { label: 'How It Works', id: 'HowItWorks', action: () => setIsHowItWorksOpen(true) },
        {
          label: 'Become an Owner',
          id: 'BecomeOwner',
          action: () => navigate('/register?role=owner'),
        },
      ];
    }

    switch (user.role) {
      case 'customer':
        return [
          { label: 'Home', id: 'Home', action: () => navigate('/') },
          {
            label: 'Vehicles',
            id: 'Vehicles',
            action: () => {
              if (currentPath !== '/') navigate('/');
              setTimeout(() => onBookNowClick?.(), 80);
            },
          },
          {
            label: 'My Bookings',
            id: 'Bookings',
            action: () => {
              navigate('/customer/dashboard');
              onNavigateTab?.('Bookings');
            },
          },
          {
            label: 'My Orders',
            id: 'MyOrders',
            action: () => {
              navigate('/customer/dashboard');
              onNavigateTab?.('MyOrders');
            },
          },
        ];

      case 'owner':
        return [
          {
            label: 'Dashboard',
            id: 'Dashboard',
            action: () => {
              navigate('/owner/dashboard');
              onNavigateTab?.('Dashboard');
            },
          },
          {
            label: 'My Vehicles',
            id: 'MyVehicles',
            action: () => {
              navigate('/owner/dashboard');
              onNavigateTab?.('MyVehicles');
            },
          },
          {
            label: 'Bookings',
            id: 'Bookings',
            action: () => {
              navigate('/owner/dashboard');
              onNavigateTab?.('Bookings');
            },
          },
          {
            label: 'Earnings',
            id: 'Earnings',
            action: () => {
              navigate('/owner/dashboard');
              onNavigateTab?.('Earnings');
            },
          },
        ];

      case 'operator':
        return [
          {
            label: 'Dashboard',
            id: 'Dashboard',
            action: () => {
              navigate('/operator/dashboard');
              onNavigateTab?.('Dashboard');
            },
          },
          {
            label: 'Assigned Bookings',
            id: 'AssignedBookings',
            action: () => {
              navigate('/operator/dashboard');
              onNavigateTab?.('AssignedBookings');
            },
          },
          {
            label: 'Trips',
            id: 'Trips',
            action: () => {
              navigate('/operator/dashboard');
              onNavigateTab?.('Trips');
            },
          },
        ];

      case 'admin':
        return [
          {
            label: 'Admin Dashboard',
            id: 'Dashboard',
            action: () => {
              navigate('/control-desk-x7k9p2m8');
              onNavigateTab?.('Dashboard');
            },
          },
          {
            label: 'Users',
            id: 'Users',
            action: () => {
              navigate('/control-desk-x7k9p2m8');
              onNavigateTab?.('Users');
            },
          },
          {
            label: 'Vehicles',
            id: 'Vehicles',
            action: () => {
              navigate('/control-desk-x7k9p2m8');
              onNavigateTab?.('Vehicles');
            },
          },
          {
            label: 'Bookings',
            id: 'Bookings',
            action: () => {
              navigate('/control-desk-x7k9p2m8');
              onNavigateTab?.('Bookings');
            },
          },
          {
            label: 'Reports',
            id: 'Reports',
            action: () => {
              navigate('/control-desk-x7k9p2m8');
              onNavigateTab?.('Reports');
            },
          },
        ];
    }
  };

  const navItems = getNavLinks();

  const getRoleBadgeLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'customer':
        return 'Customer Profile';
      case 'owner':
        return 'Owner Profile';
      case 'operator':
        return 'Operator Profile';
      case 'admin':
        return 'Admin Profile';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner-container">
          {/* Left: Desi Ride Brand Logo */}
          <div className="header-left">
            <a
              href="/"
              className="brand-wrapper"
              aria-label="Desi Ride Home"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              <img src={logoImg} alt="Desi Ride – Any Vehicle. Any Purpose." className="brand-logo-img" />
            </a>

            <div className="header-nav-divider" />

            {/* Center/Left Navigation based on Role or Guest state */}
            <nav className="desktop-nav-links" aria-label="Primary Navigation">
              {navItems.map((item) => {
                const isActive =
                  activeSection === item.id ||
                  (item.id === 'Home' && currentPath === '/' && !activeSection) ||
                  (item.id === 'Dashboard' && currentPath.includes('/dashboard') && !activeSection);

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`desktop-nav-link ${isActive ? 'active' : ''}`}
                    onClick={item.action}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Location Selector + Conditional Guest or Authenticated Actions + Toggle Bar */}
          <div className="header-right">
            <button
              type="button"
              className="location-selector-pill"
              onClick={() => setIsLocationModalOpen(true)}
              aria-label="Change Location"
            >
              <MapPin size={15} className="location-pin-icon" fill="#08783F" strokeWidth={1.5} />
              <span className="location-text">{currentLocation}</span>
              <ChevronDown size={14} className="location-chevron" />
            </button>

            {!isAuthenticated || !user ? (
              /* GUEST STATE: Login & Register Buttons (No hardcoded profile!) */
              <div className="header-auth-buttons">
                <button
                  type="button"
                  className="header-login-btn"
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="header-register-btn"
                  onClick={() => navigate('/register')}
                >
                  Register
                </button>
              </div>
            ) : (
              /* AUTHENTICATED STATE: Notifications + Actual User Profile Dropdown */
              <>
                <button
                  type="button"
                  className="notification-btn"
                  onClick={() => setIsNotificationsOpen(true)}
                  aria-label="Notifications"
                >
                  <Bell size={21} strokeWidth={2.2} />
                  <span className="notification-badge" />
                </button>

                <div className="profile-dropdown-wrapper" ref={dropdownRef}>
                  <button
                    type="button"
                    className="authenticated-user-pill"
                    onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                    aria-label="User Profile Menu"
                  >
                    <div className="user-initials-avatar">
                      {getInitials(user.full_name)}
                    </div>
                    <div className="user-pill-info">
                      <span className="user-greeting-text">{user.full_name}</span>
                      <span className="user-role-subtext">{getRoleBadgeLabel()}</span>
                    </div>
                    <ChevronDown size={15} className="user-greeting-chevron" />
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="profile-dropdown-menu">
                      <div className="profile-dropdown-header">
                        <p className="dropdown-user-name">{user.full_name}</p>
                        <p className="dropdown-user-email">{user.email}</p>
                        <span className="dropdown-role-badge">{user.role.toUpperCase()}</span>
                      </div>

                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate(getDashboardPathForRole(user.role));
                        }}
                      >
                        <LayoutDashboard size={16} />
                        <span>Go to My Dashboard</span>
                      </button>

                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate(getDashboardPathForRole(user.role));
                          onNavigateTab?.('Profile');
                        }}
                      >
                        <UserIcon size={16} />
                        <span>{getRoleBadgeLabel()}</span>
                      </button>

                      <div className="profile-dropdown-divider" />

                      <button
                        type="button"
                        className="profile-dropdown-item logout-item"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile Navigation Toggle Bar / Hamburger Menu Button (Right Side) */}
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={24} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isDrawerOpen && (
        <div className="modal-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="brand-wrapper">
                <img src={logoImg} alt="Desi Ride" className="brand-logo-img" style={{ height: '34px' }} />
              </div>
              <button type="button" className="sheet-close-btn" onClick={() => setIsDrawerOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            {isAuthenticated && user && (
              <div style={{ padding: '14px 16px', backgroundColor: '#F0F9F3', borderBottom: '1px solid #D1FAE5' }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#064E2E' }}>{user.full_name}</div>
                <div style={{ fontSize: '12px', color: '#08783F', fontWeight: 600 }}>{getRoleBadgeLabel()}</div>
              </div>
            )}

            <div className="drawer-items-list">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="drawer-item"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    item.action();
                  }}
                >
                  {item.label}
                </button>
              ))}

              {!isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 10px', marginTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                  <button
                    type="button"
                    className="header-login-btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate('/login');
                    }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="header-register-btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate('/register');
                    }}
                  >
                    Register
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="drawer-item"
                  style={{ color: '#DC2626', marginTop: '8px', borderTop: '1px solid #F3F4F6' }}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              )}
            </div>

            <div className="drawer-footer">
              Desi Ride • Any Vehicle. Any Purpose.
            </div>
          </div>
        </div>
      )}

      {/* How It Works Modal */}
      {isHowItWorksOpen && (
        <div className="modal-backdrop" onClick={() => setIsHowItWorksOpen(false)}>
          <div
            className="bottom-sheet"
            style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-header" style={{ flexShrink: 0 }}>
              <div>
                <h3 className="sheet-title">How Desi Ride Works</h3>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  One connected platform for Customers, Vehicle Owners, and Operators
                </p>
              </div>
              <button type="button" className="sheet-close-btn" onClick={() => setIsHowItWorksOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflowY: 'auto',
                paddingRight: '4px',
                paddingBottom: '6px',
              }}
            >
              {/* 1. Customer Side */}
              <div
                style={{
                  border: '1px solid #D1FAE5',
                  background: '#F7FCF9',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ background: '#E8F6E8', padding: '8px', borderRadius: '10px', color: '#08783F', flexShrink: 0 }}>
                    <Car size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#08783F' }}>
                      For Customers & Farmers
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>
                      1. How Customer Side Works
                    </h4>
                  </div>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#374151', lineHeight: 1.45 }}>
                  <li>
                    <strong>Search Vehicles &amp; Implements:</strong> Book agricultural vehicles, farming implements (rotavators, seed drills, sprayers, harvesters), JCBs, water tankers, or transport vehicles.
                  </li>
                  <li>
                    <strong>Flexible Booking &amp; Transparent Rates:</strong> Compare hourly, per-km, or per-acre pricing and choose booking with a verified operator or equipment-only rental.
                  </li>
                  <li>
                    <strong>Track Live &amp; Pay Securely:</strong> Follow operator arrival and work progress from your Customer Dashboard and pay upon completion.
                  </li>
                </ul>
              </div>

              {/* 2. Vehicle Owner Side */}
              <div
                style={{
                  border: '1px solid #FDE68A',
                  background: '#FFFDF7',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ background: '#FFF6ED', padding: '8px', borderRadius: '10px', color: '#E56B1F', flexShrink: 0 }}>
                    <Tractor size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#C25614' }}>
                      For Fleet &amp; Equipment Owners
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>
                      2. How Vehicle Owner Side Works
                    </h4>
                  </div>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#374151', lineHeight: 1.45 }}>
                  <li>
                    <strong>List Vehicles &amp; Equipment:</strong> Add your tractors, farm implements, JCBs, tankers, or transport vehicles with custom rates and service locations.
                  </li>
                  <li>
                    <strong>Review &amp; Approve Bookings:</strong> Receive instant booking requests, check dates/work details, and accept jobs from your Owner Dashboard.
                  </li>
                  <li>
                    <strong>Assign Operators &amp; Grow Earnings:</strong> Assign verified operators to active jobs and track fleet utilization, payouts, and ratings.
                  </li>
                </ul>
              </div>

              {/* 3. Operator Side */}
              <div
                style={{
                  border: '1px solid #BFDBFE',
                  background: '#F8FBFF',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ background: '#EFF6FF', padding: '8px', borderRadius: '10px', color: '#2563EB', flexShrink: 0 }}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1D4ED8' }}>
                      For Verified Drivers &amp; Operators
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>
                      3. How Operator Side Works
                    </h4>
                  </div>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#374151', lineHeight: 1.45 }}>
                  <li>
                    <strong>Receive Assigned Jobs:</strong> View assigned bookings with exact customer site/pickup location, equipment type, and schedule in your Operator Dashboard.
                  </li>
                  <li>
                    <strong>Update Live Job Status:</strong> Update progress step-by-step (Arrived at Site, Work In Progress, Completed) so customers and owners stay informed.
                  </li>
                  <li>
                    <strong>Complete Work &amp; Track Payouts:</strong> Finish the job cleanly, log work hours or distance, and build your verified operator rating and earnings.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Sheet */}
      {isLocationModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLocationModalOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">Select Location</h3>
              <button type="button" className="sheet-close-btn" onClick={() => setIsLocationModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Search city, town, or district..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectLocation('Gadwal, Telangana');
                setIsLocationModalOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: '#E8F6E8',
                borderRadius: '10px',
                border: 'none',
                color: '#08783F',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              <Navigation size={16} />
              <span>Use Current Location (GPS: Gadwal)</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                Popular Cities & Districts
              </span>
              {filteredLocations.map((item) => (
                <button
                  key={item.city}
                  type="button"
                  onClick={() => {
                    onSelectLocation(item.city);
                    setIsLocationModalOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: currentLocation === item.city ? '#F0F9F3' : '#F9FAFB',
                    border: currentLocation === item.city ? '1px solid #08783F' : '1px solid #E5E7EB',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{item.city}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{item.area}</div>
                  </div>
                  {currentLocation === item.city && <CheckCircle2 size={18} color="#08783F" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Sheet */}
      {isNotificationsOpen && (
        <div className="modal-backdrop" onClick={() => setIsNotificationsOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">Notifications</h3>
              <button type="button" className="sheet-close-btn" onClick={() => setIsNotificationsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F0F9F3', border: '1px solid #C3E3D1' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#064E2E' }}>Welcome to Desi Ride!</div>
                <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>
                  Your account ({user?.email}) is active and verified.
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>24x7 Verified Regional Fleet</div>
                <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px' }}>
                  SUVs, commercial trucks, JCBs, and farm tractors are available for immediate dispatch in {currentLocation}.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
