import React, { useState } from 'react';
import { Star, MapPin, Heart, ArrowRight } from 'lucide-react';
import { getVehicleImage } from '../utils/assetLibrary';

interface VehicleCardItem {
  id: string;
  name: string;
  rating: number;
  bookings: number;
  location: string;
  distance: string;
  price: string;
  unit: string;
  image: string;
}

interface FeaturedVehiclesProps {
  onBookVehicle: (vehicle: VehicleCardItem) => void;
  onViewAll?: () => void;
}

export const FeaturedVehicles: React.FC<FeaturedVehiclesProps> = ({
  onBookVehicle,
  onViewAll
}) => {
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const vehicles: VehicleCardItem[] = [
    {
      id: 'innova',
      name: 'Toyota Innova',
      rating: 4.8,
      bookings: 120,
      location: 'Gadwal',
      distance: '2 km',
      price: '₹ 18',
      unit: '/ km',
      image: getVehicleImage({ name: 'Toyota Innova', category: 'Car', image_key: 'innova' })
    },
    {
      id: 'truck',
      name: 'Tata 6 Ton Truck',
      rating: 4.7,
      bookings: 96,
      location: 'Gadwal',
      distance: '3 km',
      price: '₹ 35',
      unit: '/ km',
      image: getVehicleImage({ name: 'Tata 6 Ton Truck', category: 'Truck', image_key: 'truck' })
    },
    {
      id: 'tractor',
      name: 'John Deere 5050D',
      rating: 4.6,
      bookings: 78,
      location: 'Gadwal',
      distance: '5 km',
      price: '₹ 900',
      unit: '/ hour',
      image: getVehicleImage({ name: 'John Deere 5050D', category: 'Tractor', image_key: 'tractor' })
    }
  ];

  return (
    <div className="featured-vehicles-section">
      <div className="featured-header-row">
        <h3 className="section-title">Featured Vehicles Near You</h3>
        <button
          type="button"
          className="section-view-all-link"
          onClick={onViewAll}
          aria-label="View all featured vehicles"
        >
          <span>View All</span>
          <ArrowRight size={14} strokeWidth={2.4} />
        </button>
      </div>

      <div className="featured-cards-grid">
        {vehicles.map((v) => (
          <div key={v.id} className="featured-vehicle-card">
            {/* Image Box + Wishlist Heart */}
            <div className="featured-image-box">
              <img
                src={v.image}
                alt={v.name}
                className="featured-vehicle-img"
              />
              <button
                type="button"
                className={`wishlist-heart-btn ${favorites[v.id] ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(v.id, e)}
                aria-label="Save to wishlist"
              >
                <Heart
                  size={15}
                  strokeWidth={2}
                  fill={favorites[v.id] ? '#EF4444' : 'none'}
                  color={favorites[v.id] ? '#EF4444' : '#6B7280'}
                />
              </button>
            </div>

            {/* Vehicle Details */}
            <div className="featured-card-body">
              <h4 className="featured-vehicle-name">{v.name}</h4>

              <div className="featured-rating-row">
                <Star size={13} fill="#EAB308" color="#EAB308" />
                <span className="featured-rating-score">{v.rating}</span>
                <span className="featured-bookings-count">({v.bookings} bookings)</span>
              </div>

              <div className="featured-location-row">
                <MapPin size={12} fill="#08783F" strokeWidth={1} color="#08783F" />
                <span className="featured-location-text">{v.location} • {v.distance}</span>
              </div>

              {/* Price & Book Button */}
              <div className="featured-price-action-row">
                <div className="featured-price-wrapper">
                  <span className="featured-price-amount">{v.price}</span>
                  <span className="featured-price-unit"> {v.unit}</span>
                </div>

                <button
                  type="button"
                  className="featured-book-now-btn"
                  onClick={() => onBookVehicle(v)}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

