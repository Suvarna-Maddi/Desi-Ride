import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { VehicleCategoryCard, CategoryItem } from './VehicleCategoryCard';
import {
  TRANSPORTATION_VEHICLE_ASSETS,
  CONSTRUCTION_VEHICLE_ASSETS,
  AGRICULTURE_VEHICLE_ASSETS,
} from '../utils/assetLibrary';

interface VehicleCategoryGridProps {
  selectedCategoryId?: string;
  onSelectCategory: (category: CategoryItem) => void;
}

export const VehicleCategoryGrid: React.FC<VehicleCategoryGridProps> = ({
  selectedCategoryId,
  onSelectCategory
}) => {
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const categories: CategoryItem[] = [
    {
      id: 'cars',
      name: 'Cars & SUVs',
      image: TRANSPORTATION_VEHICLE_ASSETS.suvStudio,
      bgClass: 'bg-cars'
    },
    {
      id: 'bikes',
      name: 'Bikes & Scooters',
      image: TRANSPORTATION_VEHICLE_ASSETS.bike,
      bgClass: 'bg-bikes'
    },
    {
      id: 'autos',
      name: 'Auto\nRickshaws',
      image: TRANSPORTATION_VEHICLE_ASSETS.auto,
      bgClass: 'bg-autos'
    },
    {
      id: 'vans',
      name: 'Vans & Tempo',
      image: TRANSPORTATION_VEHICLE_ASSETS.van,
      bgClass: 'bg-vans'
    },
    {
      id: 'buses',
      name: 'Buses',
      image: TRANSPORTATION_VEHICLE_ASSETS.bus,
      bgClass: 'bg-buses'
    },
    {
      id: 'trucks',
      name: 'Trucks & Lorries',
      image: TRANSPORTATION_VEHICLE_ASSETS.cargoTruck,
      bgClass: 'bg-trucks'
    },
    {
      id: 'jcb',
      name: 'JCB &\nExcavators',
      image: CONSTRUCTION_VEHICLE_ASSETS.jcbBackhoe,
      bgClass: 'bg-jcb'
    },
    {
      id: 'tractors',
      name: 'Tractors',
      image: AGRICULTURE_VEHICLE_ASSETS.tractor60hp,
      bgClass: 'bg-tractors'
    }
  ];

  const categoryDetails = [
    {
      name: 'Cars & SUVs',
      types: 'Sedan, SUV, Hatchback (Innova, Ertiga, Swift, Creta)',
      usage: 'Personal travel, airport transfers, outstation family trips, weddings.',
      icon: '🚗'
    },
    {
      name: 'Bikes & Scooters',
      types: 'Honda Activa, Splendor, Pulsar, Electric Scooters',
      usage: 'Quick city transit, single commuter trips, swift package delivery.',
      icon: '🛵'
    },
    {
      name: 'Auto Rickshaws',
      types: 'Bajaj RE 3-Wheelers, Electric Auto Rickshaws, Cargo Piaggio',
      usage: 'Economical city rides, local market trips, intra-town errands.',
      icon: '🛺'
    },
    {
      name: 'Vans & Tempo',
      types: 'Force Traveller (12/17/26 Seater), Tata Winger, Maruti Eeco',
      usage: 'Family gatherings, pilgrim tours, team travel, parcel logistics.',
      icon: '🚐'
    },
    {
      name: 'Buses',
      types: '32-Seater AC Minibus, 50-Seater Luxury Sleeper, Tourist Coach',
      usage: 'Interstate group travel, wedding parties, corporate events, school tours.',
      icon: '🚌'
    },
    {
      name: 'Trucks & Lorries',
      types: 'Tata Ace (Chota Hathi), 14ft Open Truck, 10-Wheeler Container',
      usage: 'Agricultural produce hauling, house moving, industrial transport.',
      icon: '🚛'
    },
    {
      name: 'JCB & Excavators',
      types: 'JCB 3DX Backhoe, Heavy Hydraulic Excavator, Track Loader',
      usage: 'Plot levelling, road construction, foundation digging, pond digging.',
      icon: '🚜'
    },
    {
      name: 'Tractors',
      types: 'John Deere, Mahindra, Swaraj (35 HP to 60 HP) with Rotavator & Trolley',
      usage: 'Field plowing, seeding, harvest haulage, rural sand & gravel transport.',
      icon: '🚜'
    }
  ];

  return (
    <div className="category-section">
      <div className="category-header-row">
        <h3 className="category-title">Browse by Category</h3>
        <button
          type="button"
          className="category-view-all-link"
          onClick={() => setIsViewAllOpen(true)}
          aria-label="View all categories"
        >
          <span>View All</span>
          <ArrowRight size={14} strokeWidth={2.4} />
        </button>
      </div>

      <div className="category-cards-grid">
        {categories.map((category) => (
          <VehicleCategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategoryId === category.id}
            onSelect={onSelectCategory}
          />
        ))}
      </div>

      {/* View All Categories Sheet */}
      {isViewAllOpen && (
        <div className="modal-backdrop" onClick={() => setIsViewAllOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">All Vehicle Categories</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsViewAllOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categoryDetails.map((item) => (
                <div
                  key={item.name}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{item.name}</h4>
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#08783F', marginBottom: '3px' }}>
                    Models: {item.types}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>
                    Best for: {item.usage}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

