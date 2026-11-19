import React from 'react';
import { Home, Calendar, Plus, FileText, User } from 'lucide-react';

export type NavTab = 'Home' | 'Bookings' | 'BookNow' | 'MyOrders' | 'Profile';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <nav className="bottom-nav-container" aria-label="Main Navigation">
      <div className="bottom-nav-bar">
        {/* 1. Home */}
        <button
          type="button"
          className={`nav-item-btn ${activeTab === 'Home' ? 'active' : ''}`}
          onClick={() => onTabChange('Home')}
          aria-label="Home"
        >
          <Home size={22} strokeWidth={activeTab === 'Home' ? 2.5 : 2} />
          <span className="nav-item-label">Home</span>
        </button>

        {/* 2. Bookings */}
        <button
          type="button"
          className={`nav-item-btn ${activeTab === 'Bookings' ? 'active' : ''}`}
          onClick={() => onTabChange('Bookings')}
          aria-label="Bookings"
        >
          <Calendar size={22} strokeWidth={2} />
          <span className="nav-item-label">Bookings</span>
        </button>

        {/* 3. Center Elevated "Book Now" Button */}
        <div className="center-book-now-wrapper">
          <button
            type="button"
            className="elevated-plus-btn"
            onClick={() => onTabChange('BookNow')}
            aria-label="Book Now Fast Action"
            title="Book Now"
          >
            <Plus size={26} strokeWidth={3} />
          </button>
          <span className="center-btn-label">Book Now</span>
        </div>

        {/* 4. My Orders */}
        <button
          type="button"
          className={`nav-item-btn ${activeTab === 'MyOrders' ? 'active' : ''}`}
          onClick={() => onTabChange('MyOrders')}
          aria-label="My Orders"
        >
          <FileText size={22} strokeWidth={2} />
          <span className="nav-item-label">My Orders</span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          className={`nav-item-btn ${activeTab === 'Profile' ? 'active' : ''}`}
          onClick={() => onTabChange('Profile')}
          aria-label="Profile"
        >
          <User size={22} strokeWidth={2} />
          <span className="nav-item-label">Profile</span>
        </button>
      </div>
    </nav>
  );
};

