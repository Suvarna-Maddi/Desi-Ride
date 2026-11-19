import React, { useState } from 'react';
import { MapPin, Search, Calendar, ChevronDown, ArrowLeftRight, X, Check, Clock, CalendarDays, CarFront } from 'lucide-react';
import { BookingTabs, BookingTabType } from './BookingTabs';

interface BookingSearchProps {
  currentLocation: string;
  selectedVehicleType: string;
  onSelectVehicleType: (vehicle: string) => void;
  onSearchSubmitted: (searchData: {
    tab: BookingTabType;
    pickup: string;
    destination: string;
    vehicleType: string;
    dateTime: string;
  }) => void;
}

export const BookingSearch: React.FC<BookingSearchProps> = ({
  currentLocation,
  selectedVehicleType,
  onSelectVehicleType,
  onSearchSubmitted
}) => {
  const [activeTab, setActiveTab] = useState<BookingTabType>('vehicles');
  const [pickupLocation, setPickupLocation] = useState<string>(currentLocation);
  const [destinationLocation, setDestinationLocation] = useState<string>('');
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');

  // Modals
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);

  // Sync currentLocation if changed from header
  React.useEffect(() => {
    if (currentLocation) {
      setPickupLocation(currentLocation);
    }
  }, [currentLocation]);

  const vehicleOptions = [
    { id: 'Car', name: 'Car / SUV', desc: 'Hatchbacks, Sedans, 7-Seater SUVs' },
    { id: 'Bike', name: 'Bike & Scooter', desc: '2-Wheelers, Scooters, City delivery' },
    { id: 'Auto', name: 'Auto Rickshaw', desc: '3-Wheelers, local passenger & cargo' },
    { id: 'Van', name: 'Van & Tempo', desc: 'Force Traveller, Omni, delivery vans' },
    { id: 'Bus', name: 'Bus', desc: 'Minibus, 32-seater & 50-seater luxury buses' },
    { id: 'Truck', name: 'Truck & Lorry', desc: 'Mini truck, 10-wheeler, cargo containers' },
    { id: 'JCB', name: 'JCB & Excavator', desc: 'Earthmovers, backhoe loaders for sites' },
    { id: 'Tractor', name: 'Tractor', desc: 'Farming, rotavator, trolley transport' }
  ];

  const serviceOptions = [
    { id: 'Agricultural Tilling', name: 'Tractor Tilling & Plowing', desc: 'Per acre agricultural plowing' },
    { id: 'Crop Harvesting', name: 'Harvester Machine Hire', desc: 'Paddy & corn harvesting machinery' },
    { id: 'Site Excavation', name: 'JCB Digging & Ground Levelling', desc: 'Per hour excavation with operator' },
    { id: 'Goods Transport', name: 'Intercity Goods Logistics', desc: 'Packers & cargo truck transport' },
    { id: 'Event Transport', name: 'Wedding & Tour Bus Booking', desc: 'AC/Non-AC buses with driver' }
  ];

  const popularLocations = [
    'Gadwal, Telangana',
    'Hyderabad, Telangana',
    'Mahabubnagar, Telangana',
    'Kurnool, Andhra Pradesh',
    'Raichur, Karnataka',
    'Wanaparthy, Telangana',
    'Alampur, Telangana',
    'Pebbair, Telangana'
  ];

  // Swap pickup and destination
  const handleSwap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const temp = pickupLocation;
    setPickupLocation(destinationLocation || 'Gadwal, Telangana');
    setDestinationLocation(temp);
  };

  const handleSearchClick = () => {
    if (!pickupLocation) {
      alert('Please select a pickup location');
      return;
    }
    onSearchSubmitted({
      tab: activeTab,
      pickup: pickupLocation,
      destination: destinationLocation || 'Open Destination',
      vehicleType: selectedVehicleType || 'All Vehicles',
      dateTime: selectedDateTime || 'Ride Now'
    });
  };

  return (
    <div className="booking-search-section">
      <div className="booking-search-card">
        {/* TABS */}
        <div className="booking-tabs-wrapper">
          <BookingTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>

        {/* INPUTS CONTAINER */}
        <div className="booking-inputs-container">
          {/* Pickup Location */}
          <div
            className="input-card input-card-pickup"
            onClick={() => setIsPickupModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Pickup Location"
          >
            <div className="input-icon-wrapper">
              <MapPin size={18} fill="#08783F" strokeWidth={1.5} />
            </div>
            <div className="input-content">
              <span className="input-label">Pickup Location</span>
              <span className="input-value">
                {pickupLocation || 'Select your location'}
              </span>
            </div>
            <ChevronDown size={15} className="input-chevron" />
          </div>

          {/* Swap Button */}
          <button
            type="button"
            className="swap-locations-btn"
            onClick={handleSwap}
            aria-label="Swap pickup and destination"
            title="Swap Locations"
          >
            <ArrowLeftRight size={15} strokeWidth={2.4} />
          </button>

          {/* Destination */}
          <div
            className="input-card input-card-destination"
            onClick={() => setIsDestModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Destination Location (Optional)"
          >
            <div className="input-icon-wrapper">
              <MapPin size={18} strokeWidth={2} />
            </div>
            <div className="input-content">
              <span className="input-label">Destination</span>
              <span className={`input-value ${!destinationLocation ? 'placeholder' : ''}`}>
                {destinationLocation || 'Optional'}
              </span>
            </div>
            <ChevronDown size={15} className="input-chevron" />
          </div>

          {/* Select Vehicle Type */}
          <div
            className="input-card input-card-vehicle"
            onClick={() => setIsVehicleModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Select Vehicle Type"
          >
            <div className="input-icon-wrapper">
              <CarFront size={19} strokeWidth={2.2} />
            </div>
            <div className="input-content">
              <span className="input-label">
                {activeTab === 'vehicles' ? 'Select Vehicle Type' : 'Select Service Type'}
              </span>
              <span className={`input-value ${!selectedVehicleType ? 'placeholder' : ''}`}>
                {selectedVehicleType || (activeTab === 'vehicles' ? 'e.g. Car, Truck, JCB, Tractor...' : 'Choose a service...')}
              </span>
            </div>
            <ChevronDown size={15} className="input-chevron" />
          </div>

          {/* Date & Time */}
          <div
            className="input-card input-card-datetime"
            onClick={() => setIsDateTimeModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Select Date and Time"
          >
            <div className="input-icon-wrapper">
              <Calendar size={18} strokeWidth={2.2} />
            </div>
            <div className="input-content">
              <span className="input-label">Date & Time</span>
              <span className={`input-value ${!selectedDateTime ? 'placeholder' : ''}`}>
                {selectedDateTime || 'Select date & time'}
              </span>
            </div>
            <ChevronDown size={15} className="input-chevron" />
          </div>

          {/* Desktop Search Button (or Mobile Search Button) */}
          <button
            type="button"
            className="search-vehicles-cta-btn"
            onClick={handleSearchClick}
            aria-label={activeTab === 'vehicles' ? 'Search Vehicles' : 'Search Services'}
          >
            <Search size={18} strokeWidth={2.6} />
            <span>{activeTab === 'vehicles' ? 'Search Vehicles' : 'Search Services'}</span>
          </button>
        </div>
      </div>

      {/* Pickup Location Modal */}
      {isPickupModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPickupModalOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">Select Pickup Location</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsPickupModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setPickupLocation(loc);
                    setIsPickupModalOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: pickupLocation === loc ? '#F0F9F3' : '#F9FAFB',
                    border: pickupLocation === loc ? '1px solid #08783F' : '1px solid #E5E7EB',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{loc}</span>
                  {pickupLocation === loc && <Check size={18} color="#08783F" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Destination Location Modal */}
      {isDestModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDestModalOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">Select Destination (Optional)</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsDestModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setDestinationLocation('');
                  setIsDestModalOpen(false);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: !destinationLocation ? '#F0F9F3' : '#F9FAFB',
                  border: !destinationLocation ? '1px solid #08783F' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#08783F'
                }}
              >
                Leave Optional (Local Hire / Hourly)
              </button>
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setDestinationLocation(loc);
                    setIsDestModalOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: destinationLocation === loc ? '#F0F9F3' : '#F9FAFB',
                    border: destinationLocation === loc ? '1px solid #08783F' : '1px solid #E5E7EB',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{loc}</span>
                  {destinationLocation === loc && <Check size={18} color="#08783F" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle / Service Type Modal */}
      {isVehicleModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsVehicleModalOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">
                {activeTab === 'vehicles' ? 'Select Vehicle Type' : 'Select Service Type'}
              </h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsVehicleModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(activeTab === 'vehicles' ? vehicleOptions : serviceOptions).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectVehicleType(item.name);
                    setIsVehicleModalOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: selectedVehicleType === item.name ? '#F0F9F3' : '#F9FAFB',
                    border: selectedVehicleType === item.name ? '1px solid #08783F' : '1px solid #E5E7EB',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{item.name}</p>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{item.desc}</p>
                  </div>
                  {selectedVehicleType === item.name && <Check size={18} color="#08783F" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Date & Time Modal */}
      {isDateTimeModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDateTimeModalOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">Select Date & Time</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsDateTimeModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedDateTime('Ride Now (Immediate)');
                  setIsDateTimeModalOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: selectedDateTime === 'Ride Now (Immediate)' ? '#F0F9F3' : '#FFFFFF',
                  border: selectedDateTime === 'Ride Now (Immediate)' ? '2px solid #08783F' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Clock size={20} color="#08783F" />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Book Immediately (Now)</p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>Nearest vehicle will be assigned</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDateTime('Today, 05:00 PM');
                  setIsDateTimeModalOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: selectedDateTime === 'Today, 05:00 PM' ? '#F0F9F3' : '#FFFFFF',
                  border: selectedDateTime === 'Today, 05:00 PM' ? '2px solid #08783F' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <CalendarDays size={20} color="#08783F" />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Schedule for Later Today</p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>Evening slot (05:00 PM)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDateTime('Tomorrow, 08:00 AM');
                  setIsDateTimeModalOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: selectedDateTime === 'Tomorrow, 08:00 AM' ? '#F0F9F3' : '#FFFFFF',
                  border: selectedDateTime === 'Tomorrow, 08:00 AM' ? '2px solid #08783F' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Calendar size={20} color="#08783F" />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Tomorrow Morning</p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>08:00 AM - Ideal for farm & site work</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
