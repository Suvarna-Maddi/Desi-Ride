import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  ChevronDown,
  Bell,
  X,
  CheckCircle2,
  Navigation,
  Home,
  PlusCircle,
  Car,
  Calendar,
  BarChart2,
  User as UserIcon,
  LogOut,
  Clock,
} from 'lucide-react';
import logoImg from '../../assets/images/desi_ride_logo.png';

export interface OwnerNotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

export interface OwnerHeaderProps {
  ownerName: string;
  ownerBusiness?: string;
  ownerEmail?: string;
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  notifications: OwnerNotificationItem[];
  onNavigateAction: (
    section:
      | 'home'
      | 'add-vehicle'
      | 'my-vehicles'
      | 'availability'
      | 'bookings'
      | 'earnings'
      | 'profile'
  ) => void;
  onLogout: () => void;
}

export const OwnerHeader: React.FC<OwnerHeaderProps> = ({
  ownerName,
  ownerBusiness,
  ownerEmail,
  currentLocation,
  onSelectLocation,
  notifications,
  onNavigateAction,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');

  const operatingLocations = [
    { city: 'Gadwal, Telangana', hub: 'Main Market Yard & Raichur Road' },
    { city: 'Wanaparthy, Telangana', hub: 'Gandhi Chowk & Pebbair Road' },
    { city: 'Jadcherla, Telangana', hub: 'NH-44 Highway & Industrial Hub' },
    { city: 'Kurnool, Andhra Pradesh', hub: 'Bellary Chowrasta & C-Camp' },
    { city: 'Hyderabad, Telangana', hub: 'Shamshabad, LB Nagar & Kukatpally' },
    { city: 'Mahabubnagar, Telangana', hub: 'Clock Tower & Raichur Cross Road' },
  ];

  const filteredLocations = operatingLocations.filter(
    (l) =>
      l.city.toLowerCase().includes(locationQuery.toLowerCase()) ||
      l.hub.toLowerCase().includes(locationQuery.toLowerCase())
  );

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <header className="owner-top-header">
        <div className="owner-header-inner">
          {/* Left: Desi Ride Emblem & Brand Logo (Left Side) */}
          <div className="owner-header-left">
            <div
              className="owner-brand-block"
              onClick={() => onNavigateAction('home')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateAction('home')}
            >
              <img
                src={logoImg}
                alt="Desi Ride – Vehicle Booking & Work Platform"
                className="owner-brand-logo-img"
              />
            </div>
          </div>

          {/* Right: Location Selector Pill + Notification Bell + Toggle Bar (Right Side) */}
          <div className="owner-header-right">
            <button
              type="button"
              className="owner-location-pill"
              onClick={() => setIsLocationOpen(true)}
              aria-label="Change operating location"
            >
              <span className="owner-loc-pin-circle">
                <MapPin size={12} color="#FFFFFF" fill="#087A43" />
              </span>
              <span className="owner-loc-label">{currentLocation}</span>
              <ChevronDown size={15} color="#4B5563" strokeWidth={2.2} />
            </button>

            <button
              type="button"
              className="owner-bell-btn"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Notifications"
            >
              <Bell size={23} color="#111827" strokeWidth={2.1} />
              <span className="owner-bell-red-dot">
                {unreadCount > 9 ? '9+' : ''}
              </span>
            </button>

            {/* Mobile Navigation Toggle Bar / Hamburger Menu Button */}
            <button
              type="button"
              className="owner-hamburger-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Owner Menu"
            >
              <Menu size={24} strokeWidth={2.3} color="#111827" />
            </button>
          </div>
        </div>
      </header>

      {/* Owner Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="owner-modal-backdrop" onClick={() => setIsSidebarOpen(false)}>
          <aside className="owner-sidebar-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="owner-sidebar-top">
              <div>
                <img
                  src={logoImg}
                  alt="Desi Ride"
                  style={{ height: '42px', width: 'auto', objectFit: 'contain', display: 'block', marginBottom: '10px' }}
                />
                <span className="owner-sidebar-badge">VEHICLE OWNER</span>
                <h3 className="owner-sidebar-name">{ownerName}</h3>
                <p className="owner-sidebar-sub">
                  {ownerBusiness || ownerEmail || currentLocation}
                </p>
              </div>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close Sidebar"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="owner-sidebar-nav">
              <button
                type="button"
                className="owner-sidebar-link"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onNavigateAction('home');
                }}
              >
                <Home size={18} />
                <span>Owner Dashboard</span>
              </button>

              <button
                type="button"
                className="owner-sidebar-link"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onNavigateAction('add-vehicle');
                }}
              >
                <PlusCircle size={18} />
                <span>Add Vehicle</span>
              </button>

              <button
                type="button"
                className="owner-sidebar-link"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onNavigateAction('my-vehicles');
                }}
              >
                <Car size={18} />
                <span>My Vehicles</span>
              </button>

              <button
                type="button"
                className="owner-sidebar-link"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onNavigateAction('availability');
                }}
              >
                <Clock size={18} />
                <span>Manage Availability</span>
              </button>

              <button
                type="button"
                className="owner-sidebar-link"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onNavigateAction('bookings');
                }}
              >
                <Calendar size={18} />
                <span>Booking Requests</span>
              </button>

              <button
                type="button"
                className="owner-sidebar-link"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onNavigateAction('earnings');
                }}
              >
                <BarChart2 size={18} />
                <span>View Earnings</span>
              </button>

              <button
                type="button"
                className="owner-sidebar-link"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onNavigateAction('profile');
                }}
              >
                <UserIcon size={18} />
                <span>Owner Profile</span>
              </button>

              <div className="owner-sidebar-divider" />

              <button
                type="button"
                className="owner-sidebar-link logout"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Operating Location Selector Modal */}
      {isLocationOpen && (
        <div className="owner-modal-backdrop" onClick={() => setIsLocationOpen(false)}>
          <div className="owner-dialog-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="owner-dialog-header">
              <h3>Select Operating Location</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsLocationOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              className="owner-modal-input"
              placeholder="Search town, district, or state..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />

            <button
              type="button"
              className="owner-gps-btn"
              onClick={() => {
                onSelectLocation('Gadwal, Telangana');
                setIsLocationOpen(false);
              }}
            >
              <Navigation size={15} />
              <span>Use Current Fleet Base (Gadwal, Telangana)</span>
            </button>

            <div className="owner-location-list">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.city}
                  type="button"
                  className={`owner-location-option ${
                    currentLocation === loc.city ? 'selected' : ''
                  }`}
                  onClick={() => {
                    onSelectLocation(loc.city);
                    setIsLocationOpen(false);
                  }}
                >
                  <div>
                    <strong>{loc.city}</strong>
                    <span>{loc.hub}</span>
                  </div>
                  {currentLocation === loc.city && (
                    <CheckCircle2 size={18} color="#087A43" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Owner Notifications Modal */}
      {isNotificationsOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div className="owner-dialog-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="owner-dialog-header">
              <h3>Owner Notifications ({notifications.length})</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsNotificationsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="owner-notifications-list">
              {notifications.map((n) => (
                <div key={n.id} className="owner-notification-item">
                  <div className="owner-notification-top">
                    <strong>{n.title}</strong>
                    <span>{n.time}</span>
                  </div>
                  <p>{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

