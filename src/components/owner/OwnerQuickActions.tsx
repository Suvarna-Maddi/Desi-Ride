import React from 'react';
import {
  ArrowRight,
  Plus,
  CalendarCheck,
  IndianRupee,
  FileText,
} from 'lucide-react';
import { TRANSPORTATION_VEHICLE_ASSETS } from '../../utils/assetLibrary';

export interface OwnerQuickActionsProps {
  onAddVehicle: () => void;
  onManageAvailability: () => void;
  onViewEarnings: () => void;
  onMyVehicles: () => void;
  onViewAll?: () => void;
}

export const OwnerQuickActions: React.FC<OwnerQuickActionsProps> = ({
  onAddVehicle,
  onManageAvailability,
  onViewEarnings,
  onMyVehicles,
  onViewAll,
}) => {
  return (
    <section className="owner-quick-actions-section" aria-label="Quick Actions">
      <div className="owner-section-header">
        <h2 className="owner-section-title">Quick Actions</h2>
        <button
          type="button"
          className="owner-view-all-link"
          onClick={onViewAll || onMyVehicles}
        >
          <span>View All</span>
          <ArrowRight size={15} strokeWidth={2.4} />
        </button>
      </div>

      <div className="owner-quick-actions-grid">
        {/* Card 1: Add Vehicle */}
        <button
          type="button"
          className="owner-qa-card qa-card-green"
          onClick={onAddVehicle}
        >
          <div className="owner-qa-top-visual">
            <span className="owner-qa-circle-badge badge-green">
              <Plus size={22} color="#FFFFFF" strokeWidth={2.6} />
            </span>
            <img
              src={TRANSPORTATION_VEHICLE_ASSETS.suvStudio}
              alt="Add Vehicle"
              className="owner-qa-vehicle-thumb"
            />
          </div>
          <div className="owner-qa-text-block">
            <h3 className="owner-qa-heading">Add Vehicle</h3>
            <p className="owner-qa-desc">List a new vehicle</p>
          </div>
        </button>

        {/* Card 2: Manage Availability */}
        <button
          type="button"
          className="owner-qa-card qa-card-orange"
          onClick={onManageAvailability}
        >
          <div className="owner-qa-top-visual">
            <span className="owner-qa-circle-badge badge-orange">
              <CalendarCheck size={20} color="#FFFFFF" strokeWidth={2.3} />
            </span>

            {/* Calendar Illustration matching reference */}
            <svg
              className="owner-qa-svg-art"
              viewBox="0 0 64 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="6"
                y="8"
                width="52"
                height="40"
                rx="7"
                fill="#FFFFFF"
                stroke="#F3D5B5"
                strokeWidth="1.5"
              />
              <path
                d="M6 15C6 11.134 9.13401 8 13 8H51C54.866 8 58 11.134 58 15V19H6V15Z"
                fill="#EF4444"
              />
              <rect x="17" y="4" width="4" height="8" rx="2" fill="#9CA3AF" />
              <rect x="43" y="4" width="4" height="8" rx="2" fill="#9CA3AF" />
              {/* Calendar Grid Dots */}
              <circle cx="17" cy="27" r="2.8" fill="#16A34A" />
              <circle cx="27" cy="27" r="2.8" fill="#16A34A" />
              <circle cx="37" cy="27" r="2.8" fill="#E87519" />
              <circle cx="47" cy="27" r="2.8" fill="#D1D5DB" />
              <circle cx="17" cy="37" r="2.8" fill="#D1D5DB" />
              <circle cx="27" cy="37" r="2.8" fill="#E87519" />
              <circle cx="37" cy="37" r="2.8" fill="#16A34A" />
              <circle cx="47" cy="37" r="2.8" fill="#EF4444" />
            </svg>
          </div>
          <div className="owner-qa-text-block">
            <h3 className="owner-qa-heading">
              Manage
              <br />
              Availability
            </h3>
            <p className="owner-qa-desc">Set your working hours</p>
          </div>
        </button>

        {/* Card 3: View Earnings */}
        <button
          type="button"
          className="owner-qa-card qa-card-blue"
          onClick={onViewEarnings}
        >
          <div className="owner-qa-top-visual">
            <span className="owner-qa-circle-badge badge-blue">
              <IndianRupee size={20} color="#FFFFFF" strokeWidth={2.5} />
            </span>

            {/* Bar Chart Illustration matching reference */}
            <svg
              className="owner-qa-svg-art"
              viewBox="0 0 64 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="10" y="34" width="8" height="12" rx="2" fill="#60A5FA" />
              <rect x="23" y="25" width="8" height="21" rx="2" fill="#3B82F6" />
              <rect x="36" y="16" width="8" height="30" rx="2" fill="#2563EB" />
              <rect x="49" y="8" width="8" height="38" rx="2" fill="#93C5FD" />
            </svg>
          </div>
          <div className="owner-qa-text-block">
            <h3 className="owner-qa-heading">View Earnings</h3>
            <p className="owner-qa-desc">Track your income</p>
          </div>
        </button>

        {/* Card 4: My Vehicles */}
        <button
          type="button"
          className="owner-qa-card qa-card-purple"
          onClick={onMyVehicles}
        >
          <div className="owner-qa-top-visual">
            <span className="owner-qa-circle-badge badge-purple">
              <FileText size={20} color="#FFFFFF" strokeWidth={2.3} />
            </span>
            <img
              src={TRANSPORTATION_VEHICLE_ASSETS.suvStudio}
              alt="My Vehicles"
              className="owner-qa-vehicle-thumb"
            />
          </div>
          <div className="owner-qa-text-block">
            <h3 className="owner-qa-heading">My Vehicles</h3>
            <p className="owner-qa-desc">Manage your fleet</p>
          </div>
        </button>
      </div>
    </section>
  );
};

