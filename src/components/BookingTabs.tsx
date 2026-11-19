import React from 'react';
import { Car, Settings } from 'lucide-react';

export type BookingTabType = 'vehicles' | 'services';

interface BookingTabsProps {
  activeTab: BookingTabType;
  onChangeTab: (tab: BookingTabType) => void;
}

export const BookingTabs: React.FC<BookingTabsProps> = ({ activeTab, onChangeTab }) => {
  return (
    <div className="booking-tabs-container">
      <button
        type="button"
        className={`booking-tab-btn ${activeTab === 'vehicles' ? 'active' : 'inactive'}`}
        onClick={() => onChangeTab('vehicles')}
      >
        <Car size={18} strokeWidth={2.4} />
        <span>Find Vehicles</span>
      </button>

      <button
        type="button"
        className={`booking-tab-btn ${activeTab === 'services' ? 'active' : 'inactive'}`}
        onClick={() => onChangeTab('services')}
      >
        <Settings size={18} strokeWidth={2.4} />
        <span>Find Services</span>
      </button>
    </div>
  );
};

