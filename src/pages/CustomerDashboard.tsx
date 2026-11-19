import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  ChevronDown,
  Bell,
  Check,
  Search,
  Settings,
  Tractor,
  ArrowRight,
  Heart,
  Star,
  ShieldCheck,
  IndianRupee,
  Clock,
  User as UserIcon,
  Home,
  Calendar,
  Plus,
  FileText,
  X,
  CheckCircle2,
  LogOut,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import logoImg from '../assets/images/desi_ride_logo.png';
import {
  HERO_ASSETS,
  AGRICULTURE_VEHICLE_ASSETS,
  CONSTRUCTION_VEHICLE_ASSETS,
  TRANSPORTATION_VEHICLE_ASSETS,
  ILLUSTRATION_ASSETS,
  getVehicleImage,
} from '../utils/assetLibrary';
import {
  MAIN_SERVICE_CATEGORIES,
  AGRICULTURAL_IMPLEMENT_TAXONOMY,
  EquipmentListing,
  TractorOption,
  MainServiceCategoryId,
} from '../types/equipment';
import { EquipmentDetailAndBookingModal } from '../components/equipment/EquipmentDetailAndBookingModal';
import { LiveTripMapModal } from '../components/LiveTripMapModal';
import { PaymentCheckoutModal } from '../components/PaymentCheckoutModal';
import { TaxInvoiceModal } from '../components/TaxInvoiceModal';

// Original high-resolution (1024x1024+) studio & commercial assets (zero screenshot crops)
const HERO_RIGHT_SCENE_URL = HERO_ASSETS.customerHero;
const CAT_TRACTOR_URL = AGRICULTURE_VEHICLE_ASSETS.tractor60hp;
const CAT_TROLLEY_URL = AGRICULTURE_VEHICLE_ASSETS.tractorTrailer;
const CAT_HARVESTER_URL = AGRICULTURE_VEHICLE_ASSETS.harvester;
const CAT_DRONE_URL = AGRICULTURE_VEHICLE_ASSETS.drone;
const CAT_PUMP_URL = AGRICULTURE_VEHICLE_ASSETS.waterPump;
const CAT_ROTAVATOR_URL = AGRICULTURE_VEHICLE_ASSETS.cultivator;
const PROMO_NEAR_YOU_URL = ILLUSTRATION_ASSETS.promoNearYou;
const PROMO_SAVE_TIME_URL = ILLUSTRATION_ASSETS.promoSaveTime;

import '../styles/customerHome.css';

export interface CustomerListingItem {
  id: string;
  name: string;
  category: string;
  type: 'vehicles' | 'services';
  rating: number;
  bookings: number;
  location: string;
  distance: string;
  priceAmount: string;
  priceUnit: string;
  image: string;
  description: string;
  providerName: string;
}

const ALL_CUSTOMER_LISTINGS: CustomerListingItem[] = [
  {
    id: 'jd-5050d',
    name: 'John Deere 5050D',
    category: 'Tractor',
    type: 'vehicles',
    rating: 4.8,
    bookings: 120,
    location: 'Gadwal',
    distance: '2 km',
    priceAmount: '₹ 900',
    priceUnit: '/ hour',
    image: AGRICULTURE_VEHICLE_ASSETS.tractorField,
    description:
      '50 HP Heavy-duty 4WD farm tractor for plowing, tilling, and trolley haulage with verified operator.',
    providerName: 'Ramesh Reddy Agro Fleet',
  },
  {
    id: 'mahindra-575',
    name: 'Mahindra 575 DI',
    category: 'Tractor',
    type: 'vehicles',
    rating: 4.7,
    bookings: 98,
    location: 'Gadwal',
    distance: '3 km',
    priceAmount: '₹ 800',
    priceUnit: '/ hour',
    image: AGRICULTURE_VEHICLE_ASSETS.tractor50hp,
    description:
      '47 HP fuel-efficient tractor ideal for cultivation, rotavator work, and crop transport.',
    providerName: 'Srinivasulu Farm Services',
  },
  {
    id: 'combine-harvester',
    name: 'Combine Harvester',
    category: 'Harvester',
    type: 'vehicles',
    rating: 4.6,
    bookings: 76,
    location: 'Gadwal',
    distance: '5 km',
    priceAmount: '₹ 2,500',
    priceUnit: '/ hour',
    image: AGRICULTURE_VEHICLE_ASSETS.harvesterField,
    description:
      'Multi-crop self-propelled combine harvester for rapid paddy, wheat, and maize harvesting.',
    providerName: 'Krishna River Agro Harvesters',
  },
  {
    id: 'grain-trolley',
    name: 'Hydraulic 5-Ton Trolley',
    category: 'Trolley',
    type: 'vehicles',
    rating: 4.8,
    bookings: 84,
    location: 'Gadwal',
    distance: '2.5 km',
    priceAmount: '₹ 600',
    priceUnit: '/ hour',
    image: AGRICULTURE_VEHICLE_ASSETS.tractorTrailer,
    description:
      'Heavy-duty hydraulic tipping agricultural trailer for grain, cotton, and produce transport.',
    providerName: 'Gadwal Kisan Transport',
  },
  {
    id: 'agri-drone',
    name: 'Agri Spraying Drone 16L',
    category: 'Drone Spraying',
    type: 'services',
    rating: 4.9,
    bookings: 64,
    location: 'Gadwal',
    distance: '4 km',
    priceAmount: '₹ 550',
    priceUnit: '/ hour',
    image: AGRICULTURE_VEHICLE_ASSETS.drone,
    description:
      'Precision autonomous crop spraying drone — covers 1 acre in 7 minutes with certified pilot.',
    providerName: 'Telangana SkyAgri Tech',
  },
  {
    id: 'water-pump',
    name: 'Kirloskar 10HP Water Pump',
    category: 'Water Pump',
    type: 'services',
    rating: 4.7,
    bookings: 52,
    location: 'Gadwal',
    distance: '3 km',
    priceAmount: '₹ 350',
    priceUnit: '/ hour',
    image: AGRICULTURE_VEHICLE_ASSETS.waterPump,
    description:
      'High-discharge portable diesel & electric irrigation pump set with 200ft delivery pipe.',
    providerName: 'Narasimha Irrigation Rentals',
  },
  {
    id: 'rotavator-7ft',
    name: 'Shaktiman 7ft Rotavator',
    category: 'Rotavator',
    type: 'services',
    rating: 4.8,
    bookings: 91,
    location: 'Gadwal',
    distance: '2 km',
    priceAmount: '₹ 950',
    priceUnit: '/ hour',
    image: AGRICULTURE_VEHICLE_ASSETS.cultivator,
    description:
      '48-blade heavy-duty rotary tiller with tractor for fine seedbed preparation and stubble mixing.',
    providerName: 'Ramesh Reddy Agro Fleet',
  },
  {
    id: 'jcb-3dx',
    name: 'JCB 3DX Backhoe Loader',
    category: 'JCB & Earthmovers',
    type: 'vehicles',
    rating: 4.8,
    bookings: 110,
    location: 'Gadwal',
    distance: '3.5 km',
    priceAmount: '₹ 1,500',
    priceUnit: '/ hour',
    image: CONSTRUCTION_VEHICLE_ASSETS.jcbBackhoe,
    description:
      'Land levelling, farm pond digging, trenching, and construction earthmoving.',
    providerName: 'Reddy Earthmovers',
  },
  {
    id: 'toyota-innova',
    name: 'Toyota Innova Crysta',
    category: 'Cars & SUVs',
    type: 'vehicles',
    rating: 4.9,
    bookings: 145,
    location: 'Gadwal',
    distance: '1.5 km',
    priceAmount: '₹ 650',
    priceUnit: '/ hour',
    image: TRANSPORTATION_VEHICLE_ASSETS.innova,
    description: '7-seater AC SUV for family travel, market visits, and outstation trips.',
    providerName: 'DesiRide Verified Fleet',
  },
];

type CustomerBottomTab = 'Home' | 'Bookings' | 'BookNow' | 'MyOrders' | 'Profile';

export const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Header & Location State
  const [selectedCity, setSelectedCity] = useState('Gadwal, Telangana');
  const [searchCityShort, setSearchCityShort] = useState('Gadwal');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Search & Filter State
  const [searchTab, setSearchTab] = useState<'vehicles' | 'services'>('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tractor');
  const [isCategoryFiltered, setIsCategoryFiltered] = useState<boolean>(false);
  const [showAllVehicles, setShowAllVehicles] = useState<boolean>(false);
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState<boolean>(false);

  // Favourites, Bookings & Backend Data
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 1,
      title: `Welcome, ${user?.full_name || 'Customer'}!`,
      message:
        'Verified tractors, harvesters, trolleys, and farm services are available near Gadwal.',
      time: 'Just now',
    },
  ]);

  // Active Bottom Navigation & Booking Modal
  const [bottomTab, setBottomTab] = useState<CustomerBottomTab>('Home');
  const [bookingModalVehicle, setBookingModalVehicle] =
    useState<CustomerListingItem | null>(null);
  const [bookingDurationHours, setBookingDurationHours] = useState('4');
  const [bookingScheduleDate, setBookingScheduleDate] = useState(
    'Today, Immediate Dispatch'
  );
  const [bookingDestination, setBookingDestination] = useState(
    'Local Farm / Gadwal Hub'
  );
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Hyper-Scale Real-Time Live Map, Online Escrow Payment & Tax Receipt Modals
  const [liveMapBooking, setLiveMapBooking] = useState<any | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<any | null>(null);
  const [invoiceBookingId, setInvoiceBookingId] = useState<number | null>(null);

  // Agricultural Equipment & Implements Catalog State
  const [equipmentListings, setEquipmentListings] = useState<EquipmentListing[]>([]);
  const [compatibleTractors, setCompatibleTractors] = useState<TractorOption[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [selectedMainCategory, setSelectedMainCategory] = useState<
    'all' | MainServiceCategoryId
  >('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('All');
  const [eqFilterType, setEqFilterType] = useState<string>('All');
  const [eqFilterMaxHp, setEqFilterMaxHp] = useState<string>('');
  const [eqFilterMaxPrice, setEqFilterMaxPrice] = useState<string>('');
  const [eqFilterLocation, setEqFilterLocation] = useState<string>('');
  const [eqFilterCondition, setEqFilterCondition] = useState<string>('All');
  const [eqFilterOperatorOnly, setEqFilterOperatorOnly] = useState<boolean>(false);
  const [eqFilterBookingMode, setEqFilterBookingMode] = useState<
    'all' | 'standalone' | 'combo'
  >('all');
  const [selectedEquipmentDetail, setSelectedEquipmentDetail] =
    useState<EquipmentListing | null>(null);
  const [bookingCart, setBookingCart] = useState<EquipmentListing[]>([]);

  const popularSectionRef = useRef<HTMLDivElement>(null);
  const equipmentSectionRef = useRef<HTMLDivElement>(null);
  const searchCardRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const loadCustomerData = useCallback(async () => {
    try {
      const [data, eqData]: any[] = await Promise.all([
        authApi.getCustomerDashboard(),
        authApi.getEquipmentCatalog().catch(() => null),
      ]);
      if (data?.active_bookings) setActiveBookings(data.active_bookings);
      if (data?.booking_history) setBookingHistory(data.booking_history);
      if (data?.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
      }
      if (Array.isArray(data?.favourites)) {
        const favMap: Record<string, boolean> = {};
        data.favourites.forEach((id: string) => {
          favMap[id] = true;
        });
        setFavourites(favMap);
      }
      if (eqData && Array.isArray(eqData.equipment)) {
        setEquipmentListings(eqData.equipment);
      }
      if (eqData && Array.isArray(eqData.compatible_tractors)) {
        setCompatibleTractors(eqData.compatible_tractors);
      }
    } catch {
      // keep default state
    } finally {
      setEquipmentLoading(false);
    }
  }, []);

  const getFilteredEquipment = (): EquipmentListing[] => {
    const q = searchQuery.trim().toLowerCase();
    return equipmentListings.filter((item) => {
      if (item.approval_status === 'Rejected') return false;
      if (selectedMainCategory !== 'all' && item.main_category !== selectedMainCategory) {
        return false;
      }
      if (selectedSubGroup !== 'All' && item.sub_category_group !== selectedSubGroup) {
        return false;
      }
      if (eqFilterType !== 'All' && item.equipment_type !== eqFilterType) {
        return false;
      }
      if (eqFilterMaxHp && Number(eqFilterMaxHp) > 0) {
        if ((item.required_hp_min || 0) > Number(eqFilterMaxHp)) return false;
      }
      if (eqFilterMaxPrice && Number(eqFilterMaxPrice) > 0) {
        const basePrice = item.pricing_options?.[0]?.price || item.default_price || 0;
        if (basePrice > Number(eqFilterMaxPrice)) return false;
      }
      if (eqFilterLocation.trim()) {
        const locQuery = eqFilterLocation.trim().toLowerCase();
        const matchesLoc =
          (item.city || '').toLowerCase().includes(locQuery) ||
          (item.service_locations || []).some((l) => l.toLowerCase().includes(locQuery));
        if (!matchesLoc) return false;
      }
      if (eqFilterCondition !== 'All' && item.condition !== eqFilterCondition) {
        return false;
      }
      if (eqFilterOperatorOnly && !item.operator_available) {
        return false;
      }
      if (eqFilterBookingMode === 'standalone' && !item.standalone_available) {
        return false;
      }
      if (eqFilterBookingMode === 'combo' && !item.combo_available) {
        return false;
      }
      if (q) {
        const haystack = `${item.name} ${item.equipment_type} ${item.sub_category_group} ${item.brand} ${item.city} ${(item.suitable_operations || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  };

  const handleConfirmEquipmentBooking = async (payload: any) => {
    try {
      await authApi.createBooking({
        ...payload,
        customer_name: user?.full_name || 'Customer',
      });
      setSelectedEquipmentDetail(null);
      await loadCustomerData();
      showToast(
        `${payload.equipment_name || 'Equipment'} booked successfully! Track live status in Bookings.`
      );
      setBottomTab('Bookings');
    } catch (err: any) {
      showToast(err?.message || 'Could not complete equipment booking. Please try again.');
      throw err;
    }
  };

  useEffect(() => {
    loadCustomerData();
    const timer = setInterval(() => {
      loadCustomerData();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadCustomerData]);

  useRealtimeSync({
    onEvent: (eventType) => {
      loadCustomerData();
      if (eventType === 'booking:updated' || eventType === 'operator:location') {
        showToast('Live booking update received!');
      }
    },
  });

  const handleToggleFavourite = async (
    vehicle: CustomerListingItem,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const nextVal = !favourites[vehicle.id];
    setFavourites((prev) => ({ ...prev, [vehicle.id]: nextVal }));
    showToast(
      nextVal
        ? `${vehicle.name} added to your favourites ♥`
        : `${vehicle.name} removed from favourites`
    );

    try {
      await authApi.updateBookingStatus('/customer/dashboard/', {
        action: 'toggle_favourite',
        vehicle_id: vehicle.id,
      });
    } catch {
      // local state already updated
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsCategoryFiltered(false);
      setShowAllVehicles(false);
    }
    popularSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(
      searchQuery.trim()
        ? `Showing results for "${searchQuery.trim()}" in ${searchCityShort}`
        : `Showing popular ${searchTab} in ${searchCityShort}`
    );
  };

  const handleSelectCategory = (catName: string) => {
    if (catName === 'More') {
      setIsMoreCategoriesOpen(true);
      return;
    }
    setSelectedCategory(catName);
    if (catName === 'Tractor') {
      // Tractor is the default active category showing the 3 Popular Vehicles
      setIsCategoryFiltered(false);
      setShowAllVehicles(false);
    } else {
      setIsCategoryFiltered(true);
      setShowAllVehicles(false);
    }
    showToast(`Category selected: ${catName}`);
  };

  const handleConfirmVehicleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalVehicle) return;

    setIsSubmittingBooking(true);
    try {
      const numericPrice =
        parseInt(bookingModalVehicle.priceAmount.replace(/\D/g, ''), 10) || 900;
      const hours = parseInt(bookingDurationHours, 10) || 4;
      const totalEstimate = `₹ ${(numericPrice * hours).toLocaleString(
        'en-IN'
      )} (${hours} hrs @ ${bookingModalVehicle.priceAmount}${
        bookingModalVehicle.priceUnit
      })`;

      await authApi.createBooking({
        vehicle_name: bookingModalVehicle.name,
        pickup_location: selectedCity,
        destination: bookingDestination,
        scheduled_at: bookingScheduleDate,
        price_estimate: totalEstimate,
      });

      const bookedName = bookingModalVehicle.name;
      setBookingModalVehicle(null);
      await loadCustomerData();
      showToast(`Booking confirmed for ${bookedName}! View in Bookings.`);
    } catch (err: any) {
      showToast(err.message || 'Could not complete booking');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Compute displayed vehicles: defaults to the exact 3 Popular Vehicles in Image 1
  const getDisplayedVehicles = (): CustomerListingItem[] => {
    const list = ALL_CUSTOMER_LISTINGS.map((item) => ({
      ...item,
      location: searchCityShort,
    }));

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
      );
    }

    if (showAllVehicles) {
      return list;
    }

    if (isCategoryFiltered && selectedCategory && selectedCategory !== 'All') {
      const byCat = list.filter(
        (v) => v.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (byCat.length > 0) return byCat;
    }

    if (searchTab === 'services') {
      return list.filter((v) => v.type === 'services');
    }

    // Default state: exact 3 Popular Vehicles from Image 1
    // 1. John Deere 5050D – ₹ 900 / hour
    // 2. Mahindra 575 DI – ₹ 800 / hour
    // 3. Combine Harvester – ₹ 2,500 / hour
    return list.slice(0, 3);
  };

  const displayedVehicles = getDisplayedVehicles();

  const availableLocations = [
    {
      full: 'Gadwal, Telangana',
      short: 'Gadwal',
      area: 'Main Town, Raichur Road & Market Yard',
    },
    {
      full: 'Wanaparthy, Telangana',
      short: 'Wanaparthy',
      area: 'Gandhi Chowk & Agricultural Hub',
    },
    {
      full: 'Kurnool, Andhra Pradesh',
      short: 'Kurnool',
      area: 'Bellary Chowrasta & Rural Belt',
    },
    {
      full: 'Mahabubnagar, Telangana',
      short: 'Mahabubnagar',
      area: 'Clock Tower & Jadcherla Corridor',
    },
    {
      full: 'Hyderabad, Telangana',
      short: 'Hyderabad',
      area: 'Shamshabad, Patancheru & Medchal',
    },
  ];

  const categoriesList = [
    { name: 'Tractor', label: 'Tractor', img: CAT_TRACTOR_URL },
    { name: 'Trolley', label: 'Trolley', img: CAT_TROLLEY_URL },
    { name: 'Harvester', label: 'Harvester', img: CAT_HARVESTER_URL },
    { name: 'Drone Spraying', label: 'Drone\nSpraying', img: CAT_DRONE_URL },
    { name: 'Water Pump', label: 'Water Pump', img: CAT_PUMP_URL },
    { name: 'Rotavator', label: 'Rotavator', img: CAT_ROTAVATOR_URL },
  ];

  return (
    <div className="cust-home-root">
      {/* ====================================================================
          1. HEADER SECTION
          ==================================================================== */}
      <header className="cust-header">
        <div className="cust-header-inner">
          {/* Left: DesiRide Logo, Brand Name & Tagline */}
          <div
            className="cust-brand-wrap"
            onClick={() => {
              setBottomTab('Home');
              setShowAllVehicles(false);
              setIsCategoryFiltered(false);
              setSelectedCategory('Tractor');
              setSearchTab('vehicles');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setBottomTab('Home')}
          >
            <img
              src={logoImg}
              alt="Desi Ride – Vehicle Booking & Work Platform"
              className="cust-brand-logo-img"
            />
          </div>

          {/* Right: Current Location Selector & Notification Bell */}
          <div className="cust-header-right">
            <button
              type="button"
              className="cust-location-selector"
              onClick={() => setIsLocationModalOpen(true)}
              aria-label="Select Location"
            >
              <span className="cust-loc-pin-badge">
                <MapPin size={14} color="#FFFFFF" fill="#075B32" />
              </span>
              <span className="cust-loc-text">{selectedCity}</span>
              <ChevronDown size={17} color="#374151" strokeWidth={2.4} />
            </button>

            <button
              type="button"
              className="cust-bell-btn"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Notifications"
            >
              <Bell size={26} color="#111827" strokeWidth={2.1} />
              <span className="cust-bell-unread-dot" />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT CONTAINER
          ==================================================================== */}
      <main className="cust-home-container">
        {bottomTab === 'Home' && (
          <>
            {/* ==============================================================
                2 & 3. HERO SECTION & OVERLAPPING SEARCH CONTAINER
                ============================================================== */}
            <section className="cust-hero-wrapper" aria-label="Hero and Search">
              <div className="cust-hero-banner">
                {/* Left Side: Headline, Description, 3 Benefit Indicators */}
                <div className="cust-hero-content">
                  <h1 className="cust-hero-heading">
                    <span className="cust-hero-line-one">Everything You Need,</span>
                    <span className="cust-hero-line-two">
                      Just a{' '}
                      <span className="cust-hero-highlight-orange">
                        Few Taps Away
                      </span>
                    </span>
                  </h1>

                  <p className="cust-hero-desc">
                    Book vehicles, equipment and services with trusted providers.
                    Everything you need, whenever you need it.
                  </p>

                  <div className="cust-hero-trust-list">
                    <div className="cust-trust-pill">
                      <span className="cust-trust-check-circle">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <span>Nearby Vehicles</span>
                    </div>

                    <div className="cust-trust-pill">
                      <span className="cust-trust-check-circle">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <span>Trusted Providers</span>
                    </div>

                    <div className="cust-trust-pill">
                      <span className="cust-trust-check-circle">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <span>Fair Prices</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Agricultural Landscape, Tractor & Trolley, Smartphone Map & Drone */}
                <div className="cust-hero-art-right">
                  <img
                    src={HERO_RIGHT_SCENE_URL}
                    alt="Tractor with Trolley, Smartphone Map, Drone and Combine Harvester"
                    className="cust-hero-scene-img"
                  />
                </div>
              </div>

              {/* 4. SEARCH AND BOOKING SECTION (OVERLAPPING WHITE ROUNDED CARD) */}
              <div ref={searchCardRef} className="cust-search-card">
                {/* First Row: Find Vehicles (Active Green) | Find Services (Inactive Light-Grey) */}
                <div className="cust-search-tabs-row" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={searchTab === 'vehicles'}
                    className={`cust-search-tab-btn ${
                      searchTab === 'vehicles' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSearchTab('vehicles');
                      setShowAllVehicles(false);
                      setIsCategoryFiltered(false);
                    }}
                  >
                    <Tractor size={20} strokeWidth={2.3} />
                    <span>Find Vehicles</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={searchTab === 'services'}
                    className={`cust-search-tab-btn ${
                      searchTab === 'services' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSearchTab('services');
                      setShowAllVehicles(false);
                      setIsCategoryFiltered(false);
                    }}
                  >
                    <Settings size={19} strokeWidth={2.3} />
                    <span>Find Services</span>
                  </button>
                </div>

                {/* Second Row: Wide Search Input + Location Dropdown + Green Search Button */}
                <form
                  className="cust-search-controls-row"
                  onSubmit={handleSearchSubmit}
                >
                  <div className="cust-search-input-box">
                    <Search size={21} color="#6B7280" strokeWidth={2.2} />
                    <input
                      type="text"
                      className="cust-search-input"
                      placeholder="Search tractors, trolleys, harvesters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6B7280',
                          display: 'flex',
                        }}
                        aria-label="Clear search"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="cust-search-loc-dropdown"
                    onClick={() => setIsLocationModalOpen(true)}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <MapPin size={19} color="#075B32" fill="#075B32" />
                      <span>{searchCityShort}</span>
                    </span>
                    <ChevronDown size={17} color="#374151" strokeWidth={2.3} />
                  </button>

                  <button type="submit" className="cust-search-submit-btn">
                    Search
                  </button>
                </form>
              </div>
            </section>

            {/* ==============================================================
                5. VEHICLE CATEGORIES (7 HORIZONTAL ITEMS WITH 3D VEHICLE IMAGES)
                ============================================================== */}
            <section
              className="cust-categories-section"
              aria-label="Vehicle Categories"
            >
              <div className="cust-categories-grid">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    className={`cust-category-item ${
                      selectedCategory === cat.name ? 'selected' : ''
                    }`}
                    onClick={() => handleSelectCategory(cat.name)}
                  >
                    <div className="cust-category-icon-box">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="cust-category-vehicle-img"
                      />
                    </div>
                    <span className="cust-category-label">
                      {cat.label.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <br />}
                          {line}
                        </React.Fragment>
                      ))}
                    </span>
                  </button>
                ))}

                {/* 7. More */}
                <button
                  type="button"
                  className="cust-category-item"
                  onClick={() => handleSelectCategory('More')}
                >
                  <div className="cust-category-icon-box">
                    <div className="cust-category-more-grid" aria-hidden="true">
                      <span className="cust-category-more-cell" />
                      <span className="cust-category-more-cell" />
                      <span className="cust-category-more-cell" />
                      <span className="cust-category-more-cell" />
                    </div>
                  </div>
                  <span className="cust-category-label">More</span>
                </button>
              </div>
            </section>

            {/* ==============================================================
                6. PROMOTIONAL BANNERS (TWO EQUAL-WIDTH BANNERS SIDE BY SIDE)
                ============================================================== */}
            <section
              className="cust-promo-banners-grid"
              aria-label="Promotional Banners"
            >
              {/* Banner 1 – Light Green Background: Vehicles Near You */}
              <div className="cust-promo-card cust-promo-green">
                <div className="cust-promo-text-col">
                  <h2 className="cust-promo-title">
                    Vehicles
                    <br />
                    Near You
                  </h2>
                  <p className="cust-promo-desc">
                    Find available
                    <br />
                    vehicles in your area
                  </p>
                  <button
                    type="button"
                    className="cust-promo-btn btn-green"
                    onClick={() => {
                      popularSectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                      showToast(
                        `Exploring available vehicles near ${selectedCity}`
                      );
                    }}
                  >
                    <span>Explore Now</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="cust-promo-art-bleed">
                  <img
                    src={PROMO_NEAR_YOU_URL}
                    alt="Smartphone map illustration and agricultural landscape"
                    className="cust-promo-art-img"
                  />
                </div>
              </div>

              {/* Banner 2 – Light Orange Background: Save Time Increase Yield */}
              <div className="cust-promo-card cust-promo-orange">
                <div className="cust-promo-text-col">
                  <h2 className="cust-promo-title">
                    Save Time
                    <br />
                    Increase Yield
                  </h2>
                  <p className="cust-promo-desc">
                    Get the right vehicle
                    <br />
                    at the right time
                  </p>
                  <button
                    type="button"
                    className="cust-promo-btn btn-orange"
                    onClick={() => {
                      setBookingModalVehicle(ALL_CUSTOMER_LISTINGS[0]);
                    }}
                  >
                    <span>Book Now</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="cust-promo-art-bleed">
                  <img
                    src={PROMO_SAVE_TIME_URL}
                    alt="Tractor and trolley in farmland"
                    className="cust-promo-art-img"
                  />
                </div>
              </div>
            </section>

            {/* ==============================================================
                7. POPULAR VEHICLES SECTION
                ============================================================== */}
            <section
              ref={popularSectionRef}
              className="cust-popular-section"
              aria-label="Popular Vehicles"
            >
              <div className="cust-section-header">
                <div className="cust-section-title-group">
                  <h2 className="cust-section-title">Popular Vehicles</h2>

                  {(isCategoryFiltered || searchQuery.trim() || showAllVehicles || searchTab === 'services') && (
                    <button
                      type="button"
                      className="cust-active-filter-badge"
                      onClick={() => {
                        setIsCategoryFiltered(false);
                        setSelectedCategory('Tractor');
                        setSearchQuery('');
                        setShowAllVehicles(false);
                        setSearchTab('vehicles');
                      }}
                    >
                      <span>
                        {searchQuery.trim()
                          ? `Search: "${searchQuery.trim()}"`
                          : showAllVehicles
                          ? 'Showing All (9)'
                          : searchTab === 'services'
                          ? 'Services'
                          : selectedCategory}
                      </span>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="cust-view-all-btn"
                  onClick={() => {
                    const next = !showAllVehicles;
                    setShowAllVehicles(next);
                    if (!next) {
                      setIsCategoryFiltered(false);
                      setSelectedCategory('Tractor');
                      setSearchQuery('');
                    }
                  }}
                >
                  <span>{showAllVehicles ? 'Show Popular' : 'View All'}</span>
                  <ArrowRight size={17} strokeWidth={2.5} />
                </button>
              </div>

              <div className="cust-vehicles-grid">
                {displayedVehicles.map((vehicle) => {
                  const isFav = Boolean(favourites[vehicle.id]);

                  return (
                    <div
                      key={vehicle.id}
                      className="cust-vehicle-card"
                      onClick={() => setBookingModalVehicle(vehicle)}
                    >
                      {/* Large Vehicle Photograph + Top-Right Favourite Heart Icon */}
                      <div className="cust-vehicle-img-box">
                        <img
                          src={vehicle.image}
                          alt={vehicle.name}
                          className="cust-vehicle-img"
                        />
                        <button
                          type="button"
                          className="cust-fav-heart-btn"
                          aria-label={`Save ${vehicle.name} to favourites`}
                          onClick={(e) => handleToggleFavourite(vehicle, e)}
                        >
                          <Heart
                            size={20}
                            color={isFav ? '#EF4444' : '#374151'}
                            fill={isFav ? '#EF4444' : 'none'}
                            strokeWidth={2.2}
                          />
                        </button>
                      </div>

                      {/* Vehicle Card Body */}
                      <div className="cust-vehicle-body">
                        <h3 className="cust-vehicle-name">{vehicle.name}</h3>

                        <div className="cust-vehicle-rating-row">
                          <Star size={16} color="#F59E0B" fill="#F59E0B" />
                          <strong>{vehicle.rating}</strong>
                          <span>({vehicle.bookings} bookings)</span>
                        </div>

                        <div className="cust-vehicle-loc-row">
                          <MapPin size={15} color="#4B5563" />
                          <span>
                            {vehicle.location} • {vehicle.distance}
                          </span>
                        </div>

                        <div className="cust-vehicle-footer">
                          <div className="cust-vehicle-price">
                            <span className="cust-price-val">
                              {vehicle.priceAmount}
                            </span>
                            <span className="cust-price-unit">
                              {vehicle.priceUnit}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="cust-book-now-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingModalVehicle(vehicle);
                            }}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ==============================================================
                7B. 6 MAIN SERVICE CATEGORIES
                ============================================================== */}
            <section
              className="cust-services-hub"
              aria-label="Main Service Categories"
            >
              <div className="cust-services-header-row">
                <div>
                  <h2 className="cust-section-title">
                    Explore All Services & Machinery
                  </h2>
                  <p className="cust-section-subtext">
                    Vehicles, farming implements, construction machinery, transport & water tankers
                  </p>
                </div>
                {selectedMainCategory !== 'all' && (
                  <button
                    type="button"
                    className="cust-reset-pill-btn"
                    onClick={() => setSelectedMainCategory('all')}
                  >
                    Show All Categories
                  </button>
                )}
              </div>

              <div className="cust-services-grid">
                {MAIN_SERVICE_CATEGORIES.map((cat) => {
                  const isActive = selectedMainCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cust-service-cat-card ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMainCategory(cat.id);
                        setSelectedSubGroup('All');
                        setEqFilterType('All');
                        equipmentSectionRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                    >
                      <div
                        className="cust-service-cat-thumb"
                        style={{ backgroundColor: cat.accentBg }}
                      >
                        <img
                          src={getVehicleImage({ vehicle_name: cat.title, vehicle_image_key: cat.imageKey })}
                          alt={cat.title}
                        />
                      </div>
                      <div className="cust-service-cat-body">
                        <div className="cust-service-cat-title">
                          {cat.title}
                        </div>
                        <div className="cust-service-cat-sub">
                          {cat.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ==============================================================
                7C. AGRICULTURAL EQUIPMENT & IMPLEMENTS CATALOG
                ============================================================== */}
            <section
              ref={equipmentSectionRef}
              aria-label="Agricultural Equipment and Implements"
              className="cust-equip-catalog-panel"
            >
              <div className="cust-equip-header-row">
                <div>
                  <h2 className="cust-section-title">
                    Agricultural Equipment & Farm Implements
                  </h2>
                  <p className="cust-section-subtext">
                    Book standalone implements or Tractor + Equipment combos with HP compatibility check
                  </p>
                </div>
                <div className="cust-equip-header-badges">
                  <span className="cust-equip-count-pill">
                    {getFilteredEquipment().length} Available
                  </span>
                  {bookingCart.length > 0 && (
                    <span className="cust-equip-cart-pill">
                      Booking Cart: {bookingCart.length} item{bookingCart.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {(selectedMainCategory !== 'all' ||
                    selectedSubGroup !== 'All' ||
                    eqFilterType !== 'All' ||
                    eqFilterMaxHp ||
                    eqFilterMaxPrice ||
                    eqFilterLocation ||
                    eqFilterCondition !== 'All' ||
                    eqFilterOperatorOnly ||
                    eqFilterBookingMode !== 'all') && (
                    <button
                      type="button"
                      className="cust-reset-pill-btn"
                      onClick={() => {
                        setSelectedMainCategory('all');
                        setSelectedSubGroup('All');
                        setEqFilterType('All');
                        setEqFilterMaxHp('');
                        setEqFilterMaxPrice('');
                        setEqFilterLocation('');
                        setEqFilterCondition('All');
                        setEqFilterOperatorOnly(false);
                        setEqFilterBookingMode('all');
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-category Group Tabs (A-F) */}
              <div className="cust-equip-tabs-row">
                <button
                  type="button"
                  className={`cust-equip-tab-pill ${selectedSubGroup === 'All' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSubGroup('All');
                    setEqFilterType('All');
                  }}
                >
                  All Implements
                </button>
                {(Object.keys(AGRICULTURAL_IMPLEMENT_TAXONOMY) as Array<keyof typeof AGRICULTURAL_IMPLEMENT_TAXONOMY>).map((grpName) => {
                  const active = selectedSubGroup === grpName;
                  return (
                    <button
                      key={grpName}
                      type="button"
                      className={`cust-equip-tab-pill ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSubGroup(grpName);
                        setEqFilterType('All');
                      }}
                    >
                      {grpName}
                    </button>
                  );
                })}
              </div>

              {/* Filter Bar */}
              <div className="cust-equip-filter-bar">
                <div className="cust-equip-filter-field">
                  <label htmlFor="eq-filter-type">Equipment Type</label>
                  <select
                    id="eq-filter-type"
                    className="cust-equip-filter-control"
                    value={eqFilterType}
                    onChange={(e) => setEqFilterType(e.target.value)}
                  >
                    <option value="All">All Equipment Types</option>
                    {(Object.keys(AGRICULTURAL_IMPLEMENT_TAXONOMY) as Array<keyof typeof AGRICULTURAL_IMPLEMENT_TAXONOMY>)
                      .filter((g) => selectedSubGroup === 'All' || g === selectedSubGroup)
                      .flatMap((g) =>
                        AGRICULTURAL_IMPLEMENT_TAXONOMY[g].map((it) => (
                          <option key={it} value={it}>
                            {it}
                          </option>
                        ))
                      )}
                  </select>
                </div>

                <div className="cust-equip-filter-field">
                  <label htmlFor="eq-filter-hp">Tractor HP (Max)</label>
                  <input
                    id="eq-filter-hp"
                    type="number"
                    min={15}
                    placeholder="e.g. 50 HP"
                    className="cust-equip-filter-control"
                    value={eqFilterMaxHp}
                    onChange={(e) => setEqFilterMaxHp(e.target.value)}
                  />
                </div>

                <div className="cust-equip-filter-field">
                  <label htmlFor="eq-filter-price">Max Price (₹)</label>
                  <input
                    id="eq-filter-price"
                    type="number"
                    min={100}
                    placeholder="e.g. ₹1,500"
                    className="cust-equip-filter-control"
                    value={eqFilterMaxPrice}
                    onChange={(e) => setEqFilterMaxPrice(e.target.value)}
                  />
                </div>

                <div className="cust-equip-filter-field">
                  <label htmlFor="eq-filter-loc">Location</label>
                  <input
                    id="eq-filter-loc"
                    type="text"
                    placeholder="City or village..."
                    className="cust-equip-filter-control"
                    value={eqFilterLocation}
                    onChange={(e) => setEqFilterLocation(e.target.value)}
                  />
                </div>

                <div className="cust-equip-filter-field">
                  <label htmlFor="eq-filter-cond">Condition</label>
                  <select
                    id="eq-filter-cond"
                    className="cust-equip-filter-control"
                    value={eqFilterCondition}
                    onChange={(e) => setEqFilterCondition(e.target.value)}
                  >
                    <option value="All">Any Condition</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                <div className="cust-equip-filter-field">
                  <label htmlFor="eq-filter-mode">Booking Mode</label>
                  <select
                    id="eq-filter-mode"
                    className="cust-equip-filter-control"
                    value={eqFilterBookingMode}
                    onChange={(e) =>
                      setEqFilterBookingMode(e.target.value as 'all' | 'standalone' | 'combo')
                    }
                  >
                    <option value="all">Standalone & Combo</option>
                    <option value="standalone">Equipment Only</option>
                    <option value="combo">Tractor + Equipment</option>
                  </select>
                </div>

                <div className="cust-equip-filter-field">
                  <label>Operator</label>
                  <label
                    className={`cust-equip-operator-chip ${eqFilterOperatorOnly ? 'active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={eqFilterOperatorOnly}
                      onChange={(e) => setEqFilterOperatorOnly(e.target.checked)}
                    />
                    With Operator
                  </label>
                </div>
              </div>

              {/* Equipment Cards Grid */}
              {equipmentLoading ? (
                <div className="cust-equip-empty">
                  Loading agricultural equipment & implements...
                </div>
              ) : getFilteredEquipment().length === 0 ? (
                <div className="cust-equip-empty">
                  No equipment matched your filters. Try clearing location, HP, or price filters.
                </div>
              ) : (
                <div className="cust-equip-grid">
                  {getFilteredEquipment().map((eq) => {
                    const primaryRate = eq.pricing_options?.[0];
                    return (
                      <div key={eq.id} className="cust-equip-card">
                        <div>
                          <div className="cust-equip-card-media">
                            <img
                              src={eq.image || getVehicleImage({ vehicle_name: eq.equipment_type || eq.name, vehicle_category: eq.equipment_type })}
                              alt={eq.name}
                            />
                            <span
                              className="cust-equip-status-badge"
                              style={{
                                background: eq.availability_status === 'Available' ? '#087A43' : '#DC2626',
                              }}
                            >
                              {eq.availability_status || 'Available'}
                            </span>
                            <span className="cust-equip-cond-badge">
                              {eq.condition}
                            </span>
                          </div>

                          <div className="cust-equip-card-body">
                            <div className="cust-equip-eyebrow">
                              {eq.sub_category_group} • {eq.equipment_type}
                            </div>
                            <h3 className="cust-equip-title">
                              {eq.name}
                            </h3>
                            <div className="cust-equip-specs">
                              {eq.required_hp_min > 0
                                ? `Requires ${eq.required_hp_min}–${eq.required_hp_max} HP • ${eq.attachment_type}`
                                : `Standalone Unit • ${eq.attachment_type}`}
                            </div>
                            <div className="cust-equip-meta">
                              <span>★ {eq.rating.toFixed(1)} ({eq.bookings_count})</span>
                              <span>•</span>
                              <span>{eq.city}</span>
                            </div>
                            <div className="cust-equip-chips">
                              {eq.standalone_available && (
                                <span className="cust-equip-chip-standalone">
                                  Equipment Only
                                </span>
                              )}
                              {eq.combo_available && (
                                <span className="cust-equip-chip-combo">
                                  Tractor + Implement
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="cust-equip-card-footer">
                          <div>
                            <span className="cust-equip-price-val">
                              ₹{primaryRate ? primaryRate.price : eq.default_price || 400}
                            </span>
                            <span className="cust-equip-price-unit">
                              {' '}
                              / {primaryRate ? primaryRate.unit : eq.default_price_unit || 'hour'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="cust-equip-book-btn"
                            onClick={() => setSelectedEquipmentDetail(eq)}
                          >
                            View & Book
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ==============================================================
                8. WHY CHOOSE DESIRIDE SECTION
                ============================================================== */}
            <section
              className="cust-why-choose-section"
              aria-label="Why Choose DesiRide"
            >
              <div className="cust-why-left">
                <h2 className="cust-why-title">Why Choose DesiRide?</h2>

                <div className="cust-why-grid">
                  {/* Benefit 1: Verified Vehicles */}
                  <div className="cust-why-item">
                    <span className="cust-why-icon-circle">
                      <ShieldCheck size={24} strokeWidth={2.1} />
                    </span>
                    <span className="cust-why-label">
                      Verified
                      <br />
                      Vehicles
                    </span>
                  </div>

                  {/* Benefit 2: Affordable Rates */}
                  <div className="cust-why-item">
                    <span className="cust-why-icon-circle">
                      <IndianRupee size={23} strokeWidth={2.3} />
                    </span>
                    <span className="cust-why-label">
                      Affordable
                      <br />
                      Rates
                    </span>
                  </div>

                  {/* Benefit 3: Quick Booking */}
                  <div className="cust-why-item">
                    <span className="cust-why-icon-circle">
                      <Clock size={24} strokeWidth={2.1} />
                    </span>
                    <span className="cust-why-label">
                      Quick
                      <br />
                      Booking
                    </span>
                  </div>

                  {/* Benefit 4: Trusted Providers */}
                  <div className="cust-why-item">
                    <span className="cust-why-icon-circle">
                      <UserIcon size={24} strokeWidth={2.1} />
                    </span>
                    <span className="cust-why-label">
                      Trusted
                      <br />
                      Providers
                    </span>
                  </div>
                </div>
              </div>

              {/* Right-Side Subtle Agricultural Field Illustration (Vector SVG) */}
              <div className="cust-why-right-art" aria-hidden="true">
                <svg
                  viewBox="0 0 420 170"
                  width="100%"
                  height="100%"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Rising Sun & Rays */}
                  <circle
                    cx="178"
                    cy="68"
                    r="20"
                    stroke="#69AE6C"
                    strokeWidth="2"
                  />
                  <line x1="178" y1="36" x2="178" y2="43" stroke="#69AE6C" strokeWidth="2" strokeLinecap="round" />
                  <line x1="154" y1="45" x2="159" y2="50" stroke="#69AE6C" strokeWidth="2" strokeLinecap="round" />
                  <line x1="202" y1="45" x2="197" y2="50" stroke="#69AE6C" strokeWidth="2" strokeLinecap="round" />
                  <line x1="145" y1="68" x2="152" y2="68" stroke="#69AE6C" strokeWidth="2" strokeLinecap="round" />
                  <line x1="204" y1="68" x2="211" y2="68" stroke="#69AE6C" strokeWidth="2" strokeLinecap="round" />
                  {/* Farmhouse & Trees */}
                  <path
                    d="M276 116V88L304 68L332 88V116H276Z"
                    fill="#95CB97"
                    fillOpacity="0.45"
                    stroke="#5B9E5E"
                    strokeWidth="2"
                  />
                  <rect x="297" y="96" width="12" height="20" fill="#5B9E5E" fillOpacity="0.45" />
                  <ellipse cx="354" cy="84" rx="12" ry="26" fill="#95CB97" fillOpacity="0.4" stroke="#5B9E5E" strokeWidth="2" />
                  <line x1="354" y1="84" x2="354" y2="118" stroke="#5B9E5E" strokeWidth="2" />
                  <ellipse cx="378" cy="88" rx="10" ry="22" fill="#95CB97" fillOpacity="0.4" stroke="#5B9E5E" strokeWidth="2" />
                  <line x1="378" y1="88" x2="378" y2="118" stroke="#5B9E5E" strokeWidth="2" />
                  {/* Tractor in Field */}
                  <rect x="210" y="84" width="26" height="18" rx="3" fill="#77B97A" stroke="#4D8E50" strokeWidth="2" />
                  <rect x="222" y="68" width="16" height="16" rx="2" stroke="#4D8E50" strokeWidth="2" />
                  <circle cx="234" cy="106" r="11" fill="#88C48B" stroke="#4D8E50" strokeWidth="2.4" />
                  <circle cx="210" cy="110" r="7.5" fill="#88C48B" stroke="#4D8E50" strokeWidth="2.2" />
                  {/* Rolling Agricultural Field Furrows */}
                  <path d="M10 165C95 118 220 112 415 124" stroke="#5E9F61" strokeWidth="2" />
                  <path d="M55 168C135 126 250 120 415 136" stroke="#5E9F61" strokeWidth="1.8" />
                  <path d="M105 168C180 134 280 128 415 148" stroke="#5E9F61" strokeWidth="1.8" />
                  <path d="M160 168C225 142 310 138 415 158" stroke="#5E9F61" strokeWidth="1.6" />
                </svg>
              </div>
            </section>
          </>
        )}

        {/* ================================================================
            CUSTOMER SUB-VIEWS: BOOKINGS, MY ORDERS, PROFILE
            (WITH OPERATOR-SYNCHRONIZED 5-STAGE JOB PROGRESS TIMELINE)
            ================================================================ */}
        {bottomTab === 'Bookings' && (
          <section className="cust-popular-section">
            <div className="cust-section-header">
              <div className="cust-section-title-group">
                <h2 className="cust-section-title">
                  My Active Bookings ({activeBookings.length})
                </h2>
                <button
                  type="button"
                  className="cust-active-filter-badge"
                  onClick={() => {
                    loadCustomerData();
                    showToast('Refreshed live operator job status');
                  }}
                >
                  <span>↻ Refresh Status</span>
                </button>
              </div>
              <button
                type="button"
                className="cust-book-now-btn"
                onClick={() => setBottomTab('Home')}
              >
                + Book Another Vehicle
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {activeBookings.length === 0 ? (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '22px',
                    padding: '36px 24px',
                    border: '1px solid #E5E7EB',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <img
                    src={ILLUSTRATION_ASSETS.noBookings}
                    alt="No Active Bookings"
                    style={{ width: '160px', height: '120px', objectFit: 'contain' }}
                  />
                  <strong style={{ fontSize: '18px', color: '#111827' }}>
                    No Active Bookings Right Now
                  </strong>
                  <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: 0 }}>
                    Book a verified tractor, harvester, JCB, or passenger vehicle near you to see live operator tracking here.
                  </p>
                </div>
              ) : null}
              {activeBookings.map((b: any) => {
                const bookingThumb = getVehicleImage({
                  vehicle_name: b.vehicle_name,
                  vehicle_category: b.vehicle_category,
                  vehicle_image_key: b.vehicle_image_key,
                });
                const stage = b.job_stage || 'Assigned';
                const ts = b.timestamps || {};
                const stageOrder = [
                  'Assigned',
                  'On The Way',
                  'Arrived',
                  'In Progress',
                  'Completed',
                ];
                const normalizedStage =
                  stage === 'Paused' ? 'In Progress' : stage;
                const currentIdx = Math.max(
                  0,
                  stageOrder.indexOf(normalizedStage)
                );

                const timelineSteps = [
                  {
                    key: 'Assigned',
                    label: 'Assigned',
                    time: ts.assigned_at || '08:30 AM',
                  },
                  {
                    key: 'On The Way',
                    label: 'On the way',
                    time: ts.on_the_way_at || '',
                  },
                  {
                    key: 'Arrived',
                    label: 'Arrived',
                    time: ts.arrived_at || '',
                  },
                  {
                    key: 'In Progress',
                    label: stage === 'Paused' ? 'Work Paused' : 'Working',
                    time:
                      stage === 'Paused'
                        ? `Paused ${ts.paused_at || ''}`
                        : ts.work_started_at
                        ? `Started ${ts.work_started_at}`
                        : '',
                  },
                  {
                    key: 'Completed',
                    label: 'Completed',
                    time: ts.completed_at || '',
                  },
                ];

                return (
                  <div
                    key={b.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '22px',
                      padding: '20px 24px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 6px 20px rgba(17, 24, 39, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                          src={bookingThumb}
                          alt={b.vehicle_name}
                          style={{
                            width: '78px',
                            height: '58px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            backgroundColor: '#F3F8F2',
                            border: '1px solid #E5E7EB',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <strong style={{ fontSize: '19px', color: '#111827' }}>
                            {b.vehicle_name}{' '}
                            {b.work_category ? `• ${b.work_category}` : ''}
                          </strong>
                          <div
                            style={{
                              fontSize: '14.5px',
                              color: '#4B5563',
                              marginTop: '4px',
                            }}
                          >
                            Location: {b.destination || b.pickup_location} •{' '}
                            {b.booking_date || 'Today'} ({b.scheduled_at})
                          </div>
                          <div
                            style={{
                              fontSize: '13.5px',
                              color: '#075B32',
                              fontWeight: 700,
                              marginTop: '4px',
                            }}
                          >
                            Operator: {b.operator_name || 'Ramesh'} •{' '}
                            {b.journey_update || 'Operator assigned'}
                          </div>
                          {((b.start_otp && !b.otp_verified && stage !== 'Completed') ||
                            (b.eta_minutes && (stage === 'Assigned' || stage === 'On The Way'))) && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginTop: '8px',
                              }}
                            >
                              {b.start_otp && !b.otp_verified && stage !== 'Completed' && (
                                <span
                                  title="Share this 4-digit PIN with your operator on arrival to start work"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    borderRadius: '999px',
                                    backgroundColor: '#FEF3C7',
                                    color: '#92400E',
                                    border: '1px solid #FDE68A',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                  }}
                                >
                                  Start OTP: {b.start_otp} (Share on arrival)
                                </span>
                              )}
                              {b.eta_minutes !== null &&
                                b.eta_minutes !== undefined &&
                                (stage === 'Assigned' || stage === 'On The Way') && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 10px',
                                      borderRadius: '999px',
                                      backgroundColor: '#E0F2FE',
                                      color: '#0369A1',
                                      border: '1px solid #BAE6FD',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Live ETA: ~{b.eta_minutes} mins
                                  </span>
                                )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '19px',
                            fontWeight: 800,
                            color: '#111827',
                          }}
                        >
                          {b.price_estimate}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '6px',
                            padding: '5px 15px',
                            borderRadius: '999px',
                            backgroundColor:
                              stage === 'Paused' ? '#FEF3C7' : '#D9F2DC',
                            color: stage === 'Paused' ? '#92400E' : '#075B32',
                            fontSize: '13px',
                            fontWeight: 800,
                          }}
                        >
                          {b.customer_status_label || b.status}
                        </span>
                      </div>
                    </div>

                    {/* Synchronized 5-Stage Job Progress Timeline */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        gap: '6px',
                        paddingTop: '12px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      {timelineSteps.map((step, idx) => {
                        const isDone = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        const isPausedCurrent =
                          isCurrent && stage === 'Paused';

                        return (
                          <div
                            key={step.key}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: isDone
                                  ? '#16803C'
                                  : isPausedCurrent
                                  ? '#FEF3C7'
                                  : isCurrent
                                  ? '#FFFFFF'
                                  : '#CBD5E1',
                                border: isPausedCurrent
                                  ? '3px solid #D97706'
                                  : isCurrent
                                  ? '3px solid #16803C'
                                  : 'none',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '13px',
                                marginBottom: '6px',
                              }}
                            >
                              {isDone ? (
                                <Check size={15} strokeWidth={3} />
                              ) : isCurrent ? (
                                <span
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: isPausedCurrent
                                      ? '#D97706'
                                      : '#16803C',
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#FFFFFF',
                                  }}
                                />
                              )}
                            </div>
                            <strong
                              style={{
                                fontSize: '13px',
                                color:
                                  isDone || isCurrent ? '#111827' : '#64748B',
                              }}
                            >
                              {step.label}
                            </strong>
                            {step.time && (
                              <span
                                style={{
                                  fontSize: '11.5px',
                                  color: '#4B5563',
                                  marginTop: '2px',
                                }}
                              >
                                {step.time}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Hyper-Scale Action Buttons: Live Map, Digital Payment, Tax Receipt */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                        gap: '10px',
                        paddingTop: '14px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setLiveMapBooking(b)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#E0F2FE',
                          color: '#0369A1',
                          fontWeight: 700,
                          fontSize: '13px',
                          border: '1px solid #BAE6FD',
                          cursor: 'pointer',
                        }}
                      >
                        <Navigation size={14} />
                        Track Live on Map & Driver Telemetry
                      </button>

                      {b.payment_status === 'Paid' ? (
                        <button
                          type="button"
                          onClick={() => setInvoiceBookingId(b.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            backgroundColor: '#F0FDF4',
                            color: '#15803D',
                            fontWeight: 700,
                            fontSize: '13px',
                            border: '1px solid #BBF7D0',
                            cursor: 'pointer',
                          }}
                        >
                          <FileText size={14} />
                          Tax Invoice & GST Receipt
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPaymentBooking(b)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            backgroundColor: '#075B32',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '13px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <IndianRupee size={14} />
                          Pay Online via UPI / Card
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {bottomTab === 'MyOrders' && (
          <section className="cust-popular-section">
            <div className="cust-section-header">
              <h2 className="cust-section-title">My Orders & Trip History</h2>
              <button
                type="button"
                className="cust-view-all-btn"
                onClick={() => setBottomTab('Home')}
              >
                <span>Back to Home</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[...activeBookings, ...bookingHistory].map((b: any) => {
                const orderThumb = getVehicleImage({
                  vehicle_name: b.vehicle_name,
                  vehicle_category: b.vehicle_category,
                  vehicle_image_key: b.vehicle_image_key,
                });
                return (
                <div
                  key={b.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '18px 22px',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={orderThumb}
                      alt={b.vehicle_name}
                      style={{
                        width: '72px',
                        height: '54px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        backgroundColor: '#F3F8F2',
                        border: '1px solid #E5E7EB',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <strong style={{ fontSize: '18px', color: '#111827' }}>
                        Order #{b.id} — {b.vehicle_name}
                      </strong>
                      <div
                        style={{
                          fontSize: '14.5px',
                          color: '#4B5563',
                          marginTop: '4px',
                        }}
                      >
                        {b.pickup_location} → {b.destination} ({b.scheduled_at})
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#075B32',
                          fontWeight: 700,
                          marginTop: '4px',
                        }}
                      >
                        Status: {b.customer_status_label || b.status} •{' '}
                        {b.journey_update}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        fontSize: '17px',
                        fontWeight: 800,
                        color: '#075B32',
                      }}
                    >
                      {b.price_estimate}
                    </div>
                    <button
                      type="button"
                      onClick={() => setInvoiceBookingId(b.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        color: '#334155',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                      }}
                    >
                      <FileText size={13} />
                      Receipt
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        )}

        {bottomTab === 'Profile' && (
          <section className="cust-popular-section">
            <div className="cust-section-header">
              <h2 className="cust-section-title">Customer Profile</h2>
              <button
                type="button"
                className="cust-book-now-btn"
                style={{
                  background: '#DC2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '22px',
                padding: '26px',
                border: '1px solid #E5E7EB',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '18px',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src="/assets/profiles/customer-default.jpg"
                  alt={user?.full_name || 'Customer Profile'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2.5px solid #075B32',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#62666D',
                      fontWeight: 600,
                    }}
                  >
                    Full Name
                  </div>
                  <strong style={{ fontSize: '17px', color: '#111827' }}>
                    {user?.full_name || 'Kiran Kumar'}
                  </strong>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#62666D',
                    fontWeight: 600,
                  }}
                >
                  Email Address
                </div>
                <strong style={{ fontSize: '17px', color: '#111827' }}>
                  {user?.email || 'customer@desiride.in'}
                </strong>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#62666D',
                    fontWeight: 600,
                  }}
                >
                  Mobile Number
                </div>
                <strong style={{ fontSize: '17px', color: '#111827' }}>
                  +91 {user?.mobile || '9000000004'}
                </strong>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#62666D',
                    fontWeight: 600,
                  }}
                >
                  Saved Location
                </div>
                <strong style={{ fontSize: '17px', color: '#111827' }}>
                  {selectedCity}
                </strong>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ====================================================================
          9. FLOATING WHITE BOTTOM NAVIGATION BAR
          ==================================================================== */}
      <nav className="cust-bottom-nav" aria-label="Customer Bottom Navigation">
        <div className="cust-bottom-nav-inner">
          {/* 1. Home */}
          <button
            type="button"
            className={`cust-nav-item ${bottomTab === 'Home' ? 'active' : ''}`}
            onClick={() => {
              setBottomTab('Home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Home
              size={25}
              color={bottomTab === 'Home' ? '#075B32' : '#62666D'}
              fill={bottomTab === 'Home' ? '#075B32' : 'none'}
              strokeWidth={2.2}
            />
            <span>Home</span>
          </button>

          {/* 2. Bookings */}
          <button
            type="button"
            className={`cust-nav-item ${bottomTab === 'Bookings' ? 'active' : ''}`}
            onClick={() => setBottomTab('Bookings')}
          >
            <Calendar
              size={25}
              color={bottomTab === 'Bookings' ? '#075B32' : '#62666D'}
              strokeWidth={2.1}
            />
            <span>Bookings</span>
          </button>

          {/* 3. Book Now (Prominent Circular Green Plus Button Above Navigation Bar) */}
          <button
            type="button"
            className="cust-nav-center-btn"
            onClick={() => {
              setBottomTab('Home');
              setBookingModalVehicle(ALL_CUSTOMER_LISTINGS[0]);
            }}
            aria-label="Book Now"
          >
            <span className="cust-nav-plus-circle">
              <Plus size={32} color="#FFFFFF" strokeWidth={2.8} />
            </span>
            <span
              className={`cust-nav-center-label ${
                bottomTab === 'BookNow' ? 'active' : ''
              }`}
            >
              Book Now
            </span>
          </button>

          {/* 4. My Orders */}
          <button
            type="button"
            className={`cust-nav-item ${bottomTab === 'MyOrders' ? 'active' : ''}`}
            onClick={() => setBottomTab('MyOrders')}
          >
            <FileText
              size={25}
              color={bottomTab === 'MyOrders' ? '#075B32' : '#62666D'}
              strokeWidth={2.1}
            />
            <span>My Orders</span>
          </button>

          {/* 5. Profile */}
          <button
            type="button"
            className={`cust-nav-item ${bottomTab === 'Profile' ? 'active' : ''}`}
            onClick={() => setBottomTab('Profile')}
          >
            <UserIcon
              size={25}
              color={bottomTab === 'Profile' ? '#075B32' : '#62666D'}
              strokeWidth={2.1}
            />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* ====================================================================
          MODALS: VEHICLE BOOKING, MORE CATEGORIES, LOCATION, NOTIFICATIONS
          ==================================================================== */}

      {/* Vehicle Details & Booking Modal */}
      {bookingModalVehicle && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setBookingModalVehicle(null)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Book {bookingModalVehicle.name}</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setBookingModalVehicle(null)}
              >
                <X size={20} color="#111827" />
              </button>
            </div>

            <img
              src={bookingModalVehicle.image}
              alt={bookingModalVehicle.name}
              style={{
                width: '100%',
                height: '185px',
                objectFit: 'cover',
                borderRadius: '14px',
                marginBottom: '12px',
              }}
            />

            <p className="owner-dialog-desc">{bookingModalVehicle.description}</p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#E7F5E5',
                borderRadius: '12px',
                marginBottom: '12px',
                fontSize: '14px',
              }}
            >
              <span>
                Provider: <strong>{bookingModalVehicle.providerName}</strong>
              </span>
              <strong style={{ color: '#075B32' }}>
                {bookingModalVehicle.priceAmount}
                {bookingModalVehicle.priceUnit}
              </strong>
            </div>

            <form onSubmit={handleConfirmVehicleBooking}>
              <label className="owner-modal-label">Work / Drop Location</label>
              <input
                type="text"
                className="owner-modal-input"
                value={bookingDestination}
                onChange={(e) => setBookingDestination(e.target.value)}
                required
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="owner-modal-label">Duration (Hours)</label>
                  <select
                    className="owner-modal-input"
                    value={bookingDurationHours}
                    onChange={(e) => setBookingDurationHours(e.target.value)}
                  >
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="6">6 Hours</option>
                    <option value="8">8 Hours (Full Day)</option>
                  </select>
                </div>
                <div>
                  <label className="owner-modal-label">Schedule</label>
                  <input
                    type="text"
                    className="owner-modal-input"
                    value={bookingScheduleDate}
                    onChange={(e) => setBookingScheduleDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="owner-dialog-actions">
                <button
                  type="button"
                  className="owner-dialog-cancel-btn"
                  onClick={() => setBookingModalVehicle(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="owner-dialog-primary-btn"
                  disabled={isSubmittingBooking}
                >
                  {isSubmittingBooking ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* More Categories Modal */}
      {isMoreCategoriesOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setIsMoreCategoriesOpen(false)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>All Vehicle & Service Categories</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsMoreCategoriesOpen(false)}
              >
                <X size={20} color="#111827" />
              </button>
            </div>

            <div className="owner-location-list">
              {[
                {
                  name: 'Tractor',
                  desc: 'Popular Vehicles (John Deere 5050D, Mahindra 575 DI)',
                },
                {
                  name: 'Trolley',
                  desc: 'Hydraulic 5-Ton & 10-Ton Grain Trailers',
                },
                {
                  name: 'Harvester',
                  desc: 'Multi-Crop Self-Propelled Combine Harvesters',
                },
                {
                  name: 'Drone Spraying',
                  desc: 'Precision 16L Autonomous Crop Spraying Drones',
                },
                {
                  name: 'Water Pump',
                  desc: 'Portable Diesel & Submersible Irrigation Pumps',
                },
                {
                  name: 'Rotavator',
                  desc: 'Shaktiman Rotary Tillers & Seedbed Equipment',
                },
                {
                  name: 'JCB & Earthmovers',
                  desc: 'JCB 3DX Backhoe Loaders & Trenchers',
                },
                {
                  name: 'Cars & SUVs',
                  desc: 'Toyota Innova Crysta, Passenger SUVs & Vans',
                },
              ].map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  className={`owner-location-option ${
                    selectedCategory === cat.name ? 'selected' : ''
                  }`}
                  onClick={() => {
                    handleSelectCategory(cat.name);
                    setIsMoreCategoriesOpen(false);
                    popularSectionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                >
                  <div>
                    <strong>{cat.name}</strong>
                    <span>{cat.desc}</span>
                  </div>
                  {selectedCategory === cat.name && (
                    <CheckCircle2 size={18} color="#075B32" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      {isLocationModalOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setIsLocationModalOpen(false)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Select Your Location</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsLocationModalOpen(false)}
              >
                <X size={20} color="#111827" />
              </button>
            </div>

            <button
              type="button"
              className="owner-gps-btn"
              onClick={() => {
                setSelectedCity('Gadwal, Telangana');
                setSearchCityShort('Gadwal');
                setIsLocationModalOpen(false);
                showToast('Location set to Gadwal, Telangana');
              }}
            >
              <Navigation size={15} />
              <span>Use Current GPS Location (Gadwal, Telangana)</span>
            </button>

            <div className="owner-location-list">
              {availableLocations.map((loc) => (
                <button
                  key={loc.full}
                  type="button"
                  className={`owner-location-option ${
                    selectedCity === loc.full ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setSelectedCity(loc.full);
                    setSearchCityShort(loc.short);
                    setIsLocationModalOpen(false);
                    showToast(`Location updated to ${loc.full}`);
                  }}
                >
                  <div>
                    <strong>{loc.full}</strong>
                    <span>{loc.area}</span>
                  </div>
                  {selectedCity === loc.full && (
                    <CheckCircle2 size={18} color="#075B32" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Notifications ({notifications.length})</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsNotificationsOpen(false)}
              >
                <X size={20} color="#111827" />
              </button>
            </div>

            <div className="owner-notifications-list">
              {notifications.map((n: any, idx: number) => (
                <div key={n.id || idx} className="owner-notification-item">
                  <div className="owner-notification-top">
                    <strong>{n.title || 'DesiRide Update'}</strong>
                    <span>{n.time || 'Today'}</span>
                  </div>
                  <p>{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Equipment Detail & Dual-Mode Booking Modal */}
      {selectedEquipmentDetail && (
        <EquipmentDetailAndBookingModal
          equipment={selectedEquipmentDetail}
          compatibleTractors={compatibleTractors}
          defaultLocation={selectedCity}
          onClose={() => setSelectedEquipmentDetail(null)}
          onConfirmBooking={handleConfirmEquipmentBooking}
          onAddToBookingCart={(eq: EquipmentListing) => {
            setBookingCart((prev) =>
              prev.some((item) => item.id === eq.id) ? prev : [...prev, eq]
            );
            showToast(`${eq.name} added to your Booking Cart`);
          }}
          onContactOwner={(eq: EquipmentListing) => {
            showToast(`Contacting ${eq.owner_name} (${eq.owner_phone || 'Owner'})...`);
          }}
        />
      )}

      {/* Hyper-Scale Interactive Live Trip & Route Map Modal */}
      {liveMapBooking && (
        <LiveTripMapModal
          booking={liveMapBooking}
          onClose={() => setLiveMapBooking(null)}
          onStageUpdated={() => loadCustomerData()}
        />
      )}

      {/* Hyper-Scale Digital Payment & Escrow Modal */}
      {paymentBooking && (
        <PaymentCheckoutModal
          booking={paymentBooking}
          onClose={() => setPaymentBooking(null)}
          onSuccess={() => {
            loadCustomerData();
            showToast('Payment verified & tax receipt generated!');
          }}
        />
      )}

      {/* Official Tax Invoice & GST Receipt Modal */}
      {invoiceBookingId && (
        <TaxInvoiceModal
          bookingId={invoiceBookingId}
          onClose={() => setInvoiceBookingId(null)}
        />
      )}

      {/* Toast Message */}
      {toast && (
        <div className="toast-notice" role="status">
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
