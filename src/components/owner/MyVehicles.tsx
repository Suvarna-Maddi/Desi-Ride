import React, { useState } from 'react';
import {
  ArrowRight,
  MoreVertical,
  Car,
  Truck,
  Eye,
  Edit3,
  Clock,
  Power,
  Trash2,
} from 'lucide-react';
import { getVehicleImage, ILLUSTRATION_ASSETS } from '../../utils/assetLibrary';

export interface OwnerVehicleItem {
  id: number;
  name: string;
  category: string;
  purpose: string;
  price_amount: string;
  price_unit: string;
  status: 'Active' | 'Inactive';
  image_key?: string;
  custom_image?: string;
  registration_number?: string;
  working_hours?: string;
}

export interface MyVehiclesProps {
  vehicles: OwnerVehicleItem[];
  onViewDetails: (vehicle: OwnerVehicleItem) => void;
  onEditVehicle: (vehicle: OwnerVehicleItem) => void;
  onChangeAvailability: (vehicle: OwnerVehicleItem) => void;
  onToggleStatus: (vehicle: OwnerVehicleItem) => void;
  onDeleteVehicle: (vehicle: OwnerVehicleItem) => void;
  onViewAll?: () => void;
}

export const getVehicleImageByKey = (
  key?: string,
  category?: string,
  name?: string,
  customImage?: string
): string => {
  return getVehicleImage({
    name,
    category,
    image_key: key,
    custom_image: customImage,
  });
};

export const MyVehicles: React.FC<MyVehiclesProps> = ({
  vehicles,
  onViewDetails,
  onEditVehicle,
  onChangeAvailability,
  onToggleStatus,
  onDeleteVehicle,
  onViewAll,
}) => {
  const [filterTab, setFilterTab] = useState<'Active' | 'Inactive'>('Active');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const activeVehicles = vehicles.filter((v) => v.status === 'Active');
  const inactiveVehicles = vehicles.filter((v) => v.status === 'Inactive');
  const displayedVehicles =
    filterTab === 'Active' ? activeVehicles : inactiveVehicles;

  return (
    <section className="owner-my-vehicles-section" aria-label="My Vehicles">
      <div className="owner-section-header vehicles-header-wrap">
        <h2 className="owner-section-title">My Vehicles</h2>

        <div className="owner-vehicles-header-right">
          <div className="owner-status-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filterTab === 'Active'}
              className={`owner-status-tab-pill ${
                filterTab === 'Active' ? 'active-pill' : ''
              }`}
              onClick={() => {
                setFilterTab('Active');
                setOpenMenuId(null);
              }}
            >
              Active ({activeVehicles.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterTab === 'Inactive'}
              className={`owner-status-tab-pill ${
                filterTab === 'Inactive' ? 'active-pill' : ''
              }`}
              onClick={() => {
                setFilterTab('Inactive');
                setOpenMenuId(null);
              }}
            >
              Inactive ({inactiveVehicles.length})
            </button>
          </div>

          <button
            type="button"
            className="owner-view-all-link"
            onClick={onViewAll}
          >
            <span>View All</span>
            <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Horizontal 4-Card Row / Scroll Container */}
      <div className="owner-vehicles-row">
        {displayedVehicles.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '18px',
              padding: '28px 20px',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <img
              src={ILLUSTRATION_ASSETS.noVehicles}
              alt="No vehicles in this tab"
              style={{ width: '140px', height: '105px', objectFit: 'contain' }}
            />
            <strong style={{ fontSize: '16px', color: '#111827' }}>
              No {filterTab} Vehicles Found
            </strong>
          </div>
        ) : null}
        {displayedVehicles.map((vehicle) => {
          const imgSrc = getVehicleImageByKey(
            vehicle.image_key,
            vehicle.category,
            vehicle.name,
            vehicle.custom_image
          );
          const isMenuOpen = openMenuId === vehicle.id;

          return (
            <div key={vehicle.id} className="owner-vehicle-card">
              {/* Top Vehicle Image + Status Pill */}
              <div
                className="owner-vehicle-img-wrap"
                onClick={() => onViewDetails(vehicle)}
              >
                <img
                  src={imgSrc}
                  alt={vehicle.name}
                  className="owner-vehicle-photo"
                />
                <span
                  className={`owner-vehicle-status-badge ${
                    vehicle.status === 'Active' ? 'badge-active' : 'badge-inactive'
                  }`}
                >
                  {vehicle.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="owner-vehicle-card-body">
                <h3 className="owner-vehicle-title">{vehicle.name}</h3>

                <div className="owner-vehicle-meta-row">
                  {vehicle.category === 'Truck' ? (
                    <Truck size={13} color="#667085" />
                  ) : (
                    <Car size={13} color="#667085" />
                  )}
                  <span>
                    {vehicle.category} • {vehicle.purpose}
                  </span>
                </div>

                {/* Price & Three-Dot Options Menu */}
                <div className="owner-vehicle-bottom-row">
                  <div className="owner-vehicle-price-line">
                    <strong className="owner-price-bold">
                      {vehicle.price_amount}
                    </strong>
                    <span className="owner-price-unit"> {vehicle.price_unit}</span>
                  </div>

                  <div className="owner-vehicle-menu-wrapper">
                    <button
                      type="button"
                      className="owner-three-dot-btn"
                      aria-label={`Options for ${vehicle.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : vehicle.id);
                      }}
                    >
                      <MoreVertical size={17} color="#4B5563" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="owner-vehicle-dropdown-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="owner-dropdown-action"
                          onClick={() => {
                            setOpenMenuId(null);
                            onViewDetails(vehicle);
                          }}
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>

                        <button
                          type="button"
                          className="owner-dropdown-action"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditVehicle(vehicle);
                          }}
                        >
                          <Edit3 size={14} />
                          <span>Edit Vehicle</span>
                        </button>

                        <button
                          type="button"
                          className="owner-dropdown-action"
                          onClick={() => {
                            setOpenMenuId(null);
                            onChangeAvailability(vehicle);
                          }}
                        >
                          <Clock size={14} />
                          <span>Change Availability</span>
                        </button>

                        <button
                          type="button"
                          className="owner-dropdown-action"
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleStatus(vehicle);
                          }}
                        >
                          <Power size={14} />
                          <span>
                            {vehicle.status === 'Active'
                              ? 'Deactivate'
                              : 'Activate'}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="owner-dropdown-action delete-item"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDeleteVehicle(vehicle);
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Delete Vehicle</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

