import React from 'react';
import { Home, Calendar, Plus, BarChart2, User } from 'lucide-react';

export type OwnerBottomNavTab =
  | 'home'
  | 'bookings'
  | 'add-vehicle'
  | 'earnings'
  | 'profile';

export interface OwnerBottomNavigationProps {
  activeTab: OwnerBottomNavTab;
  onSelectTab: (tab: OwnerBottomNavTab) => void;
}

export const OwnerBottomNavigation: React.FC<OwnerBottomNavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav className="owner-bottom-nav" aria-label="Owner Bottom Navigation">
      <div className="owner-bottom-nav-inner">
        {/* 1. Home */}
        <button
          type="button"
          className={`owner-bottom-nav-item ${
            activeTab === 'home' ? 'active' : ''
          }`}
          onClick={() => onSelectTab('home')}
        >
          <Home
            size={22}
            color={activeTab === 'home' ? '#087A43' : '#667085'}
            fill={activeTab === 'home' ? '#087A43' : 'none'}
            strokeWidth={2.2}
          />
          <span>Home</span>
        </button>

        {/* 2. Bookings */}
        <button
          type="button"
          className={`owner-bottom-nav-item ${
            activeTab === 'bookings' ? 'active' : ''
          }`}
          onClick={() => onSelectTab('bookings')}
        >
          <Calendar
            size={22}
            color={activeTab === 'bookings' ? '#087A43' : '#667085'}
            strokeWidth={2.1}
          />
          <span>Bookings</span>
        </button>

        {/* 3. Add Vehicle (Center Elevated Green Circle Button) */}
        <button
          type="button"
          className="owner-bottom-nav-center-item"
          onClick={() => onSelectTab('add-vehicle')}
          aria-label="Add Vehicle"
        >
          <span className="owner-center-plus-circle">
            <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
          </span>
          <span
            className={`owner-center-label ${
              activeTab === 'add-vehicle' ? 'active' : ''
            }`}
          >
            Add Vehicle
          </span>
        </button>

        {/* 4. Earnings */}
        <button
          type="button"
          className={`owner-bottom-nav-item ${
            activeTab === 'earnings' ? 'active' : ''
          }`}
          onClick={() => onSelectTab('earnings')}
        >
          <BarChart2
            size={22}
            color={activeTab === 'earnings' ? '#087A43' : '#667085'}
            strokeWidth={2.2}
          />
          <span>Earnings</span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          className={`owner-bottom-nav-item ${
            activeTab === 'profile' ? 'active' : ''
          }`}
          onClick={() => onSelectTab('profile')}
        >
          <User
            size={22}
            color={activeTab === 'profile' ? '#087A43' : '#667085'}
            strokeWidth={2.1}
          />
          <span>Profile</span>
        </button>
      </div>
    </nav>
  );
};

