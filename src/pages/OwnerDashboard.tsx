import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, X, LogOut, Wrench, Plus, Trash2, Power } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import {
  AGRICULTURAL_IMPLEMENT_TAXONOMY,
  EquipmentListing,
} from '../types/equipment';
import { getVehicleImage } from '../utils/assetLibrary';
import {
  OwnerHeader,
  OwnerNotificationItem,
} from '../components/owner/OwnerHeader';
import { OwnerHeroBanner } from '../components/owner/OwnerHeroBanner';
import {
  OwnerStatistics,
  OwnerStatsData,
} from '../components/owner/OwnerStatistics';
import { OwnerQuickActions } from '../components/owner/OwnerQuickActions';
import {
  MyVehicles,
  OwnerVehicleItem,
  getVehicleImageByKey,
} from '../components/owner/MyVehicles';
import {
  BookingRequests,
  OwnerBookingRequestItem,
} from '../components/owner/BookingRequests';
import {
  OwnerBottomNavigation,
  OwnerBottomNavTab,
} from '../components/owner/OwnerBottomNavigation';
import '../styles/ownerDashboard.css';

const DEFAULT_STATS: OwnerStatsData = {
  total_bookings: 24,
  bookings_growth: '↑ 12% this month',
  total_earnings: 48600,
  earnings_growth: '↑ 18% this month',
  upcoming_jobs: 6,
  upcoming_label: 'Next 7 Days',
  owner_rating: 4.8,
  reviews_count: 120,
};

const DEFAULT_VEHICLES: OwnerVehicleItem[] = [
  {
    id: 1001,
    name: 'Toyota Innova',
    category: 'Car',
    purpose: '7 Seater',
    price_amount: '₹ 18',
    price_unit: '/ km',
    status: 'Active',
    image_key: 'innova',
    registration_number: 'TS 33 AB 1234',
    working_hours: '6:00 AM - 10:00 PM',
  },
  {
    id: 1002,
    name: 'Tata 6 Ton Truck',
    category: 'Truck',
    purpose: 'Goods',
    price_amount: '₹ 35',
    price_unit: '/ km',
    status: 'Active',
    image_key: 'truck',
    registration_number: 'TS 33 TR 6090',
    working_hours: '24 Hours Available',
  },
  {
    id: 1003,
    name: 'JCB 3DX',
    category: 'Excavator',
    purpose: 'Construction',
    price_amount: '₹ 1,500',
    price_unit: '/ hour',
    status: 'Active',
    image_key: 'jcb',
    registration_number: 'TS 33 EX 3099',
    working_hours: '7:00 AM - 7:00 PM',
  },
  {
    id: 1004,
    name: 'John Deere 5050D',
    category: 'Tractor',
    purpose: 'Farm Work',
    price_amount: '₹ 900',
    price_unit: '/ hour',
    status: 'Active',
    image_key: 'tractor',
    registration_number: 'TS 33 AG 5050',
    working_hours: '6:00 AM - 8:00 PM',
  },
  {
    id: 1005,
    name: 'Force Traveller Van',
    category: 'Van',
    purpose: '17 Seater',
    price_amount: '₹ 26',
    price_unit: '/ km',
    status: 'Inactive',
    image_key: 'van',
    registration_number: 'TS 33 VN 4412',
    working_hours: 'Scheduled Maintenance',
  },
];

const DEFAULT_BOOKING_REQUESTS: OwnerBookingRequestItem[] = [
  {
    id: 2001,
    vehicle_name: 'Toyota Innova (Car)',
    image_key: 'innova',
    status: 'New',
    customer_name: 'Ramesh Kumar',
    booking_date: 'Oct 25, 2026',
    time_slot: '9:00 AM - 4:00 PM',
    route: 'Gadwal → Kurnool',
    amount_display: '₹ 2,400',
    amount_value: 2400,
    duration: '4 hours',
  },
  {
    id: 2002,
    vehicle_name: 'Tata Truck (6 Ton)',
    image_key: 'truck',
    status: 'New',
    customer_name: 'Sreenivas',
    booking_date: 'Oct 26, 2026',
    time_slot: '8:00 AM - 6:00 PM',
    route: 'Wanaparthy → Hyderabad',
    amount_display: '₹ 8,500',
    amount_value: 8500,
    duration: '1 day',
  },
  {
    id: 2003,
    vehicle_name: 'JCB 3DX',
    image_key: 'jcb',
    status: 'New',
    customer_name: 'Mahesh',
    booking_date: 'Oct 27, 2026',
    time_slot: '9:00 AM - 5:00 PM',
    route: 'Jadcherla → Gadwal',
    amount_display: '₹ 7,500',
    amount_value: 7500,
    duration: '8 hours',
  },
  {
    id: 2004,
    vehicle_name: 'John Deere 5050D',
    image_key: 'tractor',
    status: 'New',
    customer_name: 'Naveen',
    booking_date: 'Oct 28, 2026',
    time_slot: '10:00 AM - 3:00 PM',
    route: 'Gadwal → Local Farm',
    amount_display: '₹ 3,600',
    amount_value: 3600,
    duration: '5 hours',
  },
];

export const OwnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const [currentLocation, setCurrentLocation] = useState(
    user?.city ? `${user.city}, ${user.state || 'Telangana'}` : 'Gadwal, Telangana'
  );
  const [bottomNavTab, setBottomNavTab] = useState<OwnerBottomNavTab>('home');

  const [stats, setStats] = useState<OwnerStatsData>(DEFAULT_STATS);
  const [vehicles, setVehicles] = useState<OwnerVehicleItem[]>(DEFAULT_VEHICLES);
  const [bookingRequests, setBookingRequests] = useState<OwnerBookingRequestItem[]>(
    DEFAULT_BOOKING_REQUESTS
  );
  const [notifications, setNotifications] = useState<OwnerNotificationItem[]>([
    {
      id: 1,
      title: 'New Booking Request – Toyota Innova',
      message: 'Ramesh Kumar requested Toyota Innova (Gadwal → Kurnool) for Oct 25, 2026.',
      time: 'Just now',
      unread: true,
    },
    {
      id: 2,
      title: 'New Booking Request – Tata Truck (6 Ton)',
      message:
        'Sreenivas requested Tata 6 Ton Truck (Wanaparthy → Hyderabad) for Oct 26, 2026.',
      time: '15 mins ago',
      unread: true,
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);

  // Interactive Modal States
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isEarningsModalOpen, setIsEarningsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] =
    useState<OwnerVehicleItem | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<OwnerVehicleItem | null>(
    null
  );

  // Add Vehicle Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Car');
  const [newPurpose, setNewPurpose] = useState('7 Seater');
  const [newPriceAmount, setNewPriceAmount] = useState('₹ 18');
  const [newPriceUnit, setNewPriceUnit] = useState('/ km');
  const [newRegNumber, setNewRegNumber] = useState('');

  // Agricultural Equipment & Implements State
  const [ownerEquipment, setOwnerEquipment] = useState<EquipmentListing[]>([]);
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [eqName, setEqName] = useState('');
  const eqTaxonomyGroups = Object.keys(AGRICULTURAL_IMPLEMENT_TAXONOMY) as Array<
    keyof typeof AGRICULTURAL_IMPLEMENT_TAXONOMY
  >;
  const [eqSubGroup, setEqSubGroup] = useState<
    keyof typeof AGRICULTURAL_IMPLEMENT_TAXONOMY
  >(eqTaxonomyGroups[0]);
  const [eqType, setEqType] = useState(
    AGRICULTURAL_IMPLEMENT_TAXONOMY[eqTaxonomyGroups[0]][0]
  );
  const [eqBrand, setEqBrand] = useState('Shaktiman');
  const [eqModel, setEqModel] = useState('Regular Plus 7ft');
  const [eqSpecs, setEqSpecs] = useState('Heavy-duty 48 blades, 7ft working width');
  const [eqHpMin, setEqHpMin] = useState('35');
  const [eqHpMax, setEqHpMax] = useState('55');
  const [eqAttachmentType, setEqAttachmentType] = useState('3-Point Hitch PTO');
  const [eqPriceHour, setEqPriceHour] = useState('950');
  const [eqPriceAcre, setEqPriceAcre] = useState('1200');
  const [eqPriceDay, setEqPriceDay] = useState('4500');
  const [eqStandalone, setEqStandalone] = useState(true);
  const [eqCombo, setEqCombo] = useState(true);
  const [eqOperatorAvail, setEqOperatorAvail] = useState(true);
  const [eqOperatorRate, setEqOperatorRate] = useState('250');
  const [eqCondition, setEqCondition] = useState<'Excellent' | 'Good' | 'Standard'>('Excellent');
  const [eqLocations, setEqLocations] = useState('Gadwal, Alampur, Wanaparthy');

  // Section refs for smooth navigation
  const myVehiclesRef = useRef<HTMLDivElement>(null);
  const bookingRequestsRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  const fetchOwnerDashboard = useCallback(async () => {
    try {
      const [res, eqRes]: any[] = await Promise.all([
        authApi.getOwnerDashboard(),
        authApi.getEquipmentCatalog().catch(() => null),
      ]);
      if (res?.statistics) setStats(res.statistics);
      if (res?.owner_vehicles && res.owner_vehicles.length > 0) {
        setVehicles(res.owner_vehicles);
      }
      if (res?.owner_booking_requests && res.owner_booking_requests.length > 0) {
        setBookingRequests(res.owner_booking_requests);
      }
      if (res?.owner_notifications && res.owner_notifications.length > 0) {
        setNotifications(res.owner_notifications);
      }
      if (eqRes && Array.isArray(eqRes.equipment)) {
        setOwnerEquipment(eqRes.equipment);
      }
    } catch {
      // Fallback to seeded state if offline
    }
  }, []);

  const handleAddEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName.trim()) {
      showToast('Please enter equipment name.');
      return;
    }
    const pricing_options = [
      eqPriceHour ? { unit: 'hour', price: Number(eqPriceHour), label: '/ hour' } : null,
      eqPriceAcre ? { unit: 'acre', price: Number(eqPriceAcre), label: '/ acre' } : null,
      eqPriceDay ? { unit: 'day', price: Number(eqPriceDay), label: '/ day' } : null,
    ].filter(Boolean);

    try {
      await authApi.addOwnerEquipment({
        name: eqName.trim(),
        main_category: 'agri-equipment',
        sub_category_group: eqSubGroup,
        equipment_type: eqType,
        brand: eqBrand.trim(),
        model: eqModel.trim(),
        image: getVehicleImage({ vehicle_name: eqType, vehicle_category: eqType }),
        specifications: { summary: eqSpecs.trim() },
        required_hp_min: Number(eqHpMin) || 0,
        required_hp_max: Number(eqHpMax) || 0,
        attachment_type: eqAttachmentType.trim(),
        pricing_options,
        default_price: Number(eqPriceHour) || 950,
        default_price_unit: 'hour',
        standalone_available: eqStandalone,
        combo_available: eqCombo,
        operator_available: eqOperatorAvail,
        operator_rate_per_hour: eqOperatorAvail ? Number(eqOperatorRate) || 0 : 0,
        condition: eqCondition,
        city: currentLocation,
        service_locations: eqLocations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        owner_name: user?.full_name || 'Ramesh Reddy',
        owner_phone: user?.mobile || '+91 90000 00002',
      });
      setIsAddEquipmentModalOpen(false);
      setEqName('');
      await fetchOwnerDashboard();
      showToast('Agricultural equipment listed and submitted for verification!');
    } catch (err: any) {
      showToast(err?.message || 'Could not add equipment listing.');
    }
  };

  const handleToggleEquipmentStatus = async (eq: EquipmentListing) => {
    const nextStatus = eq.availability_status === 'Available' ? 'Inactive' : 'Available';
    try {
      await authApi.updateOwnerEquipment({
        action: 'toggle_availability',
        equipment_id: eq.id,
        availability_status: nextStatus,
      });
      await fetchOwnerDashboard();
      showToast(`${eq.name} marked as ${nextStatus}`);
    } catch {
      showToast('Could not update equipment availability.');
    }
  };

  const handleDeleteEquipment = async (eq: EquipmentListing) => {
    try {
      await authApi.updateOwnerEquipment({
        action: 'delete',
        equipment_id: eq.id,
      });
      await fetchOwnerDashboard();
      showToast(`${eq.name} removed from equipment listings`);
    } catch {
      showToast('Could not delete equipment listing.');
    }
  };

  useEffect(() => {
    fetchOwnerDashboard();
  }, [fetchOwnerDashboard]);

  useRealtimeSync({
    onEvent: (eventType) => {
      fetchOwnerDashboard();
      if (eventType === 'booking:created') {
        showToast('New live booking request received!');
      }
    },
  });

  // Accept Booking Handler
  const handleAcceptBooking = async (booking: OwnerBookingRequestItem) => {
    try {
      const res: any = await authApi.updateBookingStatus('/owner/dashboard/', {
        action: 'accept_booking',
        booking_id: booking.id,
      });

      setBookingRequests((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'Accepted' } : b))
      );

      if (res?.statistics) {
        setStats(res.statistics);
      } else {
        setStats((prev) => ({
          ...prev,
          total_bookings: prev.total_bookings + 1,
          upcoming_jobs: prev.upcoming_jobs + 1,
          total_earnings: prev.total_earnings + booking.amount_value,
        }));
      }

      setNotifications((prev) => [
        {
          id: Date.now(),
          title: `Booking Accepted – ${booking.vehicle_name}`,
          message: `Customer ${booking.customer_name} has been notified. Trip (${booking.route}) confirmed.`,
          time: 'Just now',
          unread: true,
        },
        ...prev,
      ]);

      showToast(
        res?.message ||
          `Accepted booking for ${booking.customer_name}! Customer notified & stats updated.`
      );
    } catch (err: any) {
      showToast(err.message || 'Could not accept booking');
    }
  };

  // Reject Booking Handler
  const handleRejectBooking = async (
    booking: OwnerBookingRequestItem,
    reason: string
  ) => {
    try {
      const res: any = await authApi.updateBookingStatus('/owner/dashboard/', {
        action: 'reject_booking',
        booking_id: booking.id,
        reason,
      });

      setBookingRequests((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, status: 'Rejected', rejection_reason: reason }
            : b
        )
      );

      setNotifications((prev) => [
        {
          id: Date.now(),
          title: `Booking Rejected – ${booking.vehicle_name}`,
          message: `Customer ${booking.customer_name} notified (${reason}).`,
          time: 'Just now',
          unread: true,
        },
        ...prev,
      ]);

      showToast(
        res?.message ||
          `Booking request from ${booking.customer_name} rejected. Customer notified.`
      );
    } catch (err: any) {
      showToast(err.message || 'Could not reject booking');
    }
  };

  // Add Vehicle Submit Handler
  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Please enter a vehicle name');
      return;
    }

    try {
      const res: any = await authApi.addOwnerVehicle({
        name: newName.trim(),
        category: newCategory,
        purpose: newPurpose.trim() || 'Multi-Purpose',
        price_amount: newPriceAmount.trim() || '₹ 20',
        price_unit: newPriceUnit,
        registration_number: newRegNumber.trim().toUpperCase() || 'TS 33 DR 9900',
        status: 'Active',
      });

      if (res?.vehicle) {
        setVehicles((prev) => [res.vehicle, ...prev]);
      } else {
        await fetchOwnerDashboard();
      }

      setNewName('');
      setNewRegNumber('');
      setIsAddVehicleModalOpen(false);
      showToast(`${newName.trim()} added to your active vehicles!`);
    } catch (err: any) {
      showToast(err.message || 'Could not add vehicle');
    }
  };

  // Toggle Active / Inactive
  const handleToggleVehicleStatus = async (vehicle: OwnerVehicleItem) => {
    try {
      const res: any = await authApi.updateBookingStatus('/owner/dashboard/', {
        action: 'toggle_vehicle_status',
        vehicle_id: vehicle.id,
      });
      const nextStatus = vehicle.status === 'Active' ? 'Inactive' : 'Active';
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicle.id ? { ...v, status: nextStatus } : v
        )
      );
      showToast(res?.message || `${vehicle.name} is now ${nextStatus}.`);
    } catch (err: any) {
      showToast(err.message || 'Could not update status');
    }
  };

  // Delete Vehicle
  const handleDeleteVehicle = async (vehicle: OwnerVehicleItem) => {
    try {
      const res: any = await authApi.updateBookingStatus('/owner/dashboard/', {
        action: 'delete_vehicle',
        vehicle_id: vehicle.id,
      });
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
      showToast(res?.message || `${vehicle.name} deleted from fleet.`);
    } catch (err: any) {
      showToast(err.message || 'Could not delete vehicle');
    }
  };

  // Edit Vehicle Save
  const handleSaveEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    try {
      await authApi.updateBookingStatus('/owner/dashboard/', {
        action: 'edit_vehicle',
        vehicle_id: editingVehicle.id,
        name: editingVehicle.name,
        category: editingVehicle.category,
        purpose: editingVehicle.purpose,
        price_amount: editingVehicle.price_amount,
        price_unit: editingVehicle.price_unit,
        working_hours: editingVehicle.working_hours,
      });
      setVehicles((prev) =>
        prev.map((v) => (v.id === editingVehicle.id ? editingVehicle : v))
      );
      setEditingVehicle(null);
      showToast(`${editingVehicle.name} updated successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Could not save changes');
    }
  };

  // Unified Navigation Handler for Header, Quick Actions & Bottom Bar
  const handleNavigateSection = (
    target:
      | 'home'
      | 'add-vehicle'
      | 'my-vehicles'
      | 'availability'
      | 'bookings'
      | 'earnings'
      | 'profile'
  ) => {
    if (target === 'home') {
      setBottomNavTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'add-vehicle') {
      setBottomNavTab('add-vehicle');
      setIsAddVehicleModalOpen(true);
    } else if (target === 'my-vehicles') {
      setBottomNavTab('home');
      myVehiclesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (target === 'availability') {
      setIsAvailabilityModalOpen(true);
    } else if (target === 'bookings') {
      setBottomNavTab('bookings');
      bookingRequestsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else if (target === 'earnings') {
      setBottomNavTab('earnings');
      setIsEarningsModalOpen(true);
    } else if (target === 'profile') {
      setBottomNavTab('profile');
      setIsProfileModalOpen(true);
    }
  };

  return (
    <div className="owner-dashboard-root">
      {/* SECTION 1: TOP HEADER */}
      <OwnerHeader
        ownerName={user?.full_name || 'Ramesh Reddy'}
        ownerBusiness={user?.business_name}
        ownerEmail={user?.email}
        currentLocation={currentLocation}
        onSelectLocation={(loc) => {
          setCurrentLocation(loc);
          showToast(`Operating location updated to ${loc}`);
        }}
        notifications={notifications}
        onNavigateAction={handleNavigateSection}
        onLogout={logout}
      />

      {/* MAIN DASHBOARD CONTAINER */}
      <main className="owner-dashboard-container">
        {/* SECTION 2: HERO BANNER – LIST YOUR VEHICLES */}
        <OwnerHeroBanner
          onAddVehicleClick={() => setIsAddVehicleModalOpen(true)}
        />

        {/* SECTION 3: OWNER STATISTICS (4 CARDS) */}
        <OwnerStatistics stats={stats} />

        {/* SECTION 4: QUICK ACTIONS (4 CARDS) */}
        <OwnerQuickActions
          onAddVehicle={() => setIsAddVehicleModalOpen(true)}
          onManageAvailability={() => setIsAvailabilityModalOpen(true)}
          onViewEarnings={() => setIsEarningsModalOpen(true)}
          onMyVehicles={() =>
            myVehiclesRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }
          onViewAll={() =>
            myVehiclesRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }
        />

        {/* SECTION 5: MY VEHICLES (ACTIVE / INACTIVE TABS + 4 HORIZONTAL CARDS) */}
        <div ref={myVehiclesRef}>
          <MyVehicles
            vehicles={vehicles}
            onViewDetails={(v) => setSelectedVehicleForDetail(v)}
            onEditVehicle={(v) => setEditingVehicle({ ...v })}
            onChangeAvailability={(v) => {
              setEditingVehicle({ ...v });
            }}
            onToggleStatus={handleToggleVehicleStatus}
            onDeleteVehicle={handleDeleteVehicle}
            onViewAll={() =>
              showToast(`Showing all ${vehicles.length} fleet vehicles`)
            }
          />
        </div>

        {/* SECTION 5B: AGRICULTURAL EQUIPMENT & IMPLEMENTS LISTINGS */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '20px',
            marginTop: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#075B32', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={18} />
                My Agricultural Equipment & Implements ({ownerEquipment.length})
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                Manage rotavators, ploughs, seed drills, sprayers, harvesters, pumps & trailers
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddEquipmentModalOpen(true)}
              style={{
                background: '#075B32',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              Add Agricultural Equipment
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px',
            }}
          >
            {ownerEquipment.slice(0, 8).map((eq) => {
              const primaryRate = eq.pricing_options?.[0];
              return (
                <div
                  key={eq.id}
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ position: 'relative', height: '140px', background: '#F3F4F6' }}>
                      <img
                        src={eq.image || getVehicleImage({ vehicle_name: eq.equipment_type || eq.name, vehicle_category: eq.equipment_type })}
                        alt={eq.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: eq.availability_status === 'Available' ? '#087A43' : '#E52525',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: '20px',
                        }}
                      >
                        {eq.availability_status === 'Available' ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background:
                            eq.approval_status === 'Approved'
                              ? '#065F46'
                              : eq.approval_status === 'Rejected'
                              ? '#991B1B'
                              : '#B45309',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '20px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {eq.approval_status}
                      </span>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706' }}>
                        {eq.sub_category_group} • {eq.equipment_type}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                        {eq.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>
                        HP: {eq.required_hp_min}–{eq.required_hp_max} • {eq.attachment_type}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#075B32', marginTop: '6px' }}>
                        ₹{primaryRate ? primaryRate.price : eq.default_price || 400} / {primaryRate ? primaryRate.unit : eq.default_price_unit || 'hour'}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderTop: '1px solid #F3F4F6',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleEquipmentStatus(eq)}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        background: '#F9FAFB',
                        color: '#111827',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Power size={13} />
                      {eq.availability_status === 'Available' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEquipment(eq)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete Equipment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 6: RECENT BOOKING REQUESTS */}
        <div ref={bookingRequestsRef}>
          <BookingRequests
            requests={bookingRequests}
            onAcceptBooking={handleAcceptBooking}
            onRejectBooking={handleRejectBooking}
            onViewAll={() =>
              showToast(`Showing all ${bookingRequests.length} booking requests`)
            }
          />
        </div>
      </main>

      {/* SECTION 7: FIXED BOTTOM NAVIGATION BAR */}
      <OwnerBottomNavigation
        activeTab={bottomNavTab}
        onSelectTab={(tab) => handleNavigateSection(tab)}
      />

      {/* ADD VEHICLE MODAL */}
      {isAddVehicleModalOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => {
            setIsAddVehicleModalOpen(false);
            setBottomNavTab('home');
          }}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Add New Vehicle to Fleet</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => {
                  setIsAddVehicleModalOpen(false);
                  setBottomNavTab('home');
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit}>
              <label className="owner-modal-label">Vehicle Name / Model *</label>
              <input
                type="text"
                className="owner-modal-input"
                placeholder="e.g. Toyota Innova, Mahindra Tractor, JCB 3DX"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />

              <label className="owner-modal-label">Vehicle Category *</label>
              <select
                className="owner-modal-input"
                value={newCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setNewCategory(cat);
                  if (cat === 'Car') {
                    setNewPurpose('7 Seater');
                    setNewPriceAmount('₹ 18');
                    setNewPriceUnit('/ km');
                  } else if (cat === 'Truck') {
                    setNewPurpose('Goods');
                    setNewPriceAmount('₹ 35');
                    setNewPriceUnit('/ km');
                  } else if (cat === 'Excavator') {
                    setNewPurpose('Construction');
                    setNewPriceAmount('₹ 1,500');
                    setNewPriceUnit('/ hour');
                  } else if (cat === 'Tractor') {
                    setNewPurpose('Farm Work');
                    setNewPriceAmount('₹ 900');
                    setNewPriceUnit('/ hour');
                  }
                }}
              >
                <option value="Car">Car</option>
                <option value="Truck">Truck</option>
                <option value="Excavator">Excavator</option>
                <option value="Tractor">Tractor</option>
                <option value="Van">Van</option>
              </select>

              <label className="owner-modal-label">Purpose / Capacity *</label>
              <input
                type="text"
                className="owner-modal-input"
                placeholder="e.g. 7 Seater, Goods, Construction, Farm Work"
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="owner-modal-label">Rental Rate *</label>
                  <input
                    type="text"
                    className="owner-modal-input"
                    placeholder="e.g. ₹ 18"
                    value={newPriceAmount}
                    onChange={(e) => setNewPriceAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="owner-modal-label">Rate Unit *</label>
                  <select
                    className="owner-modal-input"
                    value={newPriceUnit}
                    onChange={(e) => setNewPriceUnit(e.target.value)}
                  >
                    <option value="/ km">/ km</option>
                    <option value="/ hour">/ hour</option>
                    <option value="/ day">/ day</option>
                  </select>
                </div>
              </div>

              <label className="owner-modal-label">Registration Number</label>
              <input
                type="text"
                className="owner-modal-input"
                placeholder="e.g. TS 33 AB 4590"
                value={newRegNumber}
                onChange={(e) => setNewRegNumber(e.target.value)}
              />

              <div className="owner-dialog-actions">
                <button
                  type="button"
                  className="owner-dialog-cancel-btn"
                  onClick={() => {
                    setIsAddVehicleModalOpen(false);
                    setBottomNavTab('home');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="owner-dialog-primary-btn">
                  List Vehicle Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VEHICLE DETAILS MODAL */}
      {selectedVehicleForDetail && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setSelectedVehicleForDetail(null)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>{selectedVehicleForDetail.name}</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setSelectedVehicleForDetail(null)}
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={getVehicleImageByKey(
                selectedVehicleForDetail.image_key,
                selectedVehicleForDetail.category
              )}
              alt={selectedVehicleForDetail.name}
              style={{
                width: '100%',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '14px',
                marginBottom: '14px',
              }}
            />

            <div className="owner-notifications-list">
              <div className="owner-notification-item">
                <strong>Category & Purpose:</strong>{' '}
                <span>
                  {selectedVehicleForDetail.category} •{' '}
                  {selectedVehicleForDetail.purpose}
                </span>
              </div>
              <div className="owner-notification-item">
                <strong>Rental Rate:</strong>{' '}
                <span>
                  {selectedVehicleForDetail.price_amount}{' '}
                  {selectedVehicleForDetail.price_unit}
                </span>
              </div>
              <div className="owner-notification-item">
                <strong>Registration Number:</strong>{' '}
                <span>
                  {selectedVehicleForDetail.registration_number || 'TS 33 AB 1234'}
                </span>
              </div>
              <div className="owner-notification-item">
                <strong>Working Hours:</strong>{' '}
                <span>
                  {selectedVehicleForDetail.working_hours || '6:00 AM - 10:00 PM'}
                </span>
              </div>
              <div className="owner-notification-item">
                <strong>Current Status:</strong>{' '}
                <span style={{ color: '#087A43', fontWeight: 700 }}>
                  {selectedVehicleForDetail.status}
                </span>
              </div>
            </div>

            <div className="owner-dialog-actions" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="owner-dialog-cancel-btn"
                onClick={() => {
                  const target = selectedVehicleForDetail;
                  setSelectedVehicleForDetail(null);
                  setEditingVehicle({ ...target });
                }}
              >
                Edit Vehicle
              </button>
              <button
                type="button"
                className="owner-dialog-primary-btn"
                onClick={() => setSelectedVehicleForDetail(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE / AVAILABILITY MODAL */}
      {editingVehicle && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setEditingVehicle(null)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Edit {editingVehicle.name}</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setEditingVehicle(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditVehicle}>
              <label className="owner-modal-label">Vehicle Name</label>
              <input
                type="text"
                className="owner-modal-input"
                value={editingVehicle.name}
                onChange={(e) =>
                  setEditingVehicle({ ...editingVehicle, name: e.target.value })
                }
                required
              />

              <label className="owner-modal-label">Purpose</label>
              <input
                type="text"
                className="owner-modal-input"
                value={editingVehicle.purpose}
                onChange={(e) =>
                  setEditingVehicle({
                    ...editingVehicle,
                    purpose: e.target.value,
                  })
                }
                required
              />

              <label className="owner-modal-label">Rate Amount</label>
              <input
                type="text"
                className="owner-modal-input"
                value={editingVehicle.price_amount}
                onChange={(e) =>
                  setEditingVehicle({
                    ...editingVehicle,
                    price_amount: e.target.value,
                  })
                }
                required
              />

              <label className="owner-modal-label">
                Working Hours & Availability
              </label>
              <input
                type="text"
                className="owner-modal-input"
                value={editingVehicle.working_hours || '6:00 AM - 10:00 PM'}
                onChange={(e) =>
                  setEditingVehicle({
                    ...editingVehicle,
                    working_hours: e.target.value,
                  })
                }
              />

              <div className="owner-dialog-actions">
                <button
                  type="button"
                  className="owner-dialog-cancel-btn"
                  onClick={() => setEditingVehicle(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="owner-dialog-primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE AVAILABILITY QUICK ACTION MODAL */}
      {isAvailabilityModalOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setIsAvailabilityModalOpen(false)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Manage Fleet Availability</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsAvailabilityModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} color="#111827" />
              </button>
            </div>

            <p className="owner-dialog-desc">
              Toggle availability status or set operating hours for your vehicles in{' '}
              <strong>{currentLocation}</strong>.
            </p>

            <div className="owner-notifications-list">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="owner-location-option"
                  onClick={() => handleToggleVehicleStatus(v)}
                >
                  <div>
                    <strong>{v.name}</strong>
                    <span className="owner-avail-hours-text">
                      {v.category} • {v.working_hours || '6:00 AM - 10:00 PM'}
                    </span>
                  </div>
                  <span
                    className={`owner-availability-badge ${
                      v.status === 'Active'
                        ? 'badge-status-active'
                        : 'badge-status-inactive'
                    }`}
                    style={{
                      backgroundColor:
                        v.status === 'Active' ? '#087A43' : '#E52525',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '14px',
                      borderRadius: '20px',
                      padding: '5px 15px',
                      border: 'none',
                    }}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="owner-dialog-actions">
              <button
                type="button"
                className="owner-dialog-primary-btn"
                onClick={() => setIsAvailabilityModalOpen(false)}
                style={{
                  backgroundColor: '#087A43',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW EARNINGS MODAL */}
      {isEarningsModalOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => {
            setIsEarningsModalOpen(false);
            setBottomNavTab('home');
          }}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Owner Earnings Summary</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => {
                  setIsEarningsModalOpen(false);
                  setBottomNavTab('home');
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="owner-notifications-list">
              <div
                className="owner-notification-item"
                style={{ backgroundColor: '#EAF7EC', borderColor: '#B7E4C7' }}
              >
                <strong style={{ fontSize: '15px', color: '#064D32' }}>
                  Total Monthly Earnings: ₹{' '}
                  {Number(stats.total_earnings).toLocaleString('en-IN')}
                </strong>
                <p style={{ marginTop: '4px', color: '#087A43', fontWeight: 600 }}>
                  {stats.earnings_growth} • {stats.total_bookings} Completed &
                  Confirmed Bookings
                </p>
              </div>

              <div className="owner-notification-item">
                <strong>Upcoming Scheduled Payouts:</strong>
                <p>
                  {stats.upcoming_jobs} upcoming jobs scheduled in the next 7 days.
                </p>
              </div>
            </div>

            <div className="owner-dialog-actions" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="owner-dialog-primary-btn"
                onClick={() => {
                  setIsEarningsModalOpen(false);
                  setBottomNavTab('home');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER PROFILE MODAL */}
      {isProfileModalOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => {
            setIsProfileModalOpen(false);
            setBottomNavTab('home');
          }}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Vehicle Owner Profile</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setBottomNavTab('home');
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="owner-notifications-list">
              <div className="owner-notification-item">
                <strong>Owner Name:</strong>{' '}
                <span>{user?.full_name || 'Ramesh Reddy'}</span>
              </div>
              <div className="owner-notification-item">
                <strong>Business / Fleet Name:</strong>{' '}
                <span>
                  {user?.business_name || 'Reddy Agro & Fleet Services'}
                </span>
              </div>
              <div className="owner-notification-item">
                <strong>Email & Mobile:</strong>{' '}
                <span>
                  {user?.email || 'owner@desiride.in'} • +91{' '}
                  {user?.mobile || '9000000002'}
                </span>
              </div>
              <div className="owner-notification-item">
                <strong>Operating Location:</strong> <span>{currentLocation}</span>
              </div>
              <div className="owner-notification-item">
                <strong>Owner Rating:</strong>{' '}
                <span>
                  ★ {stats.owner_rating} ({stats.reviews_count} Verified Reviews)
                </span>
              </div>
            </div>

            <div className="owner-dialog-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="owner-dialog-confirm-reject-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={logout}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
              <button
                type="button"
                className="owner-dialog-primary-btn"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setBottomNavTab('home');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD AGRICULTURAL EQUIPMENT MODAL */}
      {isAddEquipmentModalOpen && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setIsAddEquipmentModalOpen(false)}
        >
          <div
            className="owner-dialog-sheet"
            style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <h3>Add Agricultural Equipment & Implement</h3>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setIsAddEquipmentModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEquipmentSubmit}>
              <label className="owner-modal-label">Equipment Name *</label>
              <input
                type="text"
                className="owner-modal-input"
                placeholder="e.g. Shaktiman 7ft Heavy Rotavator"
                value={eqName}
                onChange={(e) => setEqName(e.target.value)}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="owner-modal-label">Implement Group *</label>
                  <select
                    className="owner-modal-input"
                    value={eqSubGroup}
                    onChange={(e) => {
                      const grpName = e.target.value as keyof typeof AGRICULTURAL_IMPLEMENT_TAXONOMY;
                      setEqSubGroup(grpName);
                      const items = AGRICULTURAL_IMPLEMENT_TAXONOMY[grpName] || [];
                      if (items.length > 0) {
                        setEqType(items[0]);
                      }
                    }}
                  >
                    {eqTaxonomyGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="owner-modal-label">Equipment Type *</label>
                  <select
                    className="owner-modal-input"
                    value={eqType}
                    onChange={(e) => setEqType(e.target.value)}
                  >
                    {(AGRICULTURAL_IMPLEMENT_TAXONOMY[eqSubGroup] || []).map((it) => (
                      <option key={it} value={it}>
                        {it}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="owner-modal-label">Brand</label>
                  <input
                    type="text"
                    className="owner-modal-input"
                    value={eqBrand}
                    onChange={(e) => setEqBrand(e.target.value)}
                  />
                </div>
                <div>
                  <label className="owner-modal-label">Model</label>
                  <input
                    type="text"
                    className="owner-modal-input"
                    value={eqModel}
                    onChange={(e) => setEqModel(e.target.value)}
                  />
                </div>
              </div>

              <label className="owner-modal-label">Specifications</label>
              <input
                type="text"
                className="owner-modal-input"
                value={eqSpecs}
                onChange={(e) => setEqSpecs(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="owner-modal-label">Min Tractor HP</label>
                  <input
                    type="number"
                    className="owner-modal-input"
                    value={eqHpMin}
                    onChange={(e) => setEqHpMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="owner-modal-label">Max Tractor HP</label>
                  <input
                    type="number"
                    className="owner-modal-input"
                    value={eqHpMax}
                    onChange={(e) => setEqHpMax(e.target.value)}
                  />
                </div>
                <div>
                  <label className="owner-modal-label">Attachment Type</label>
                  <input
                    type="text"
                    className="owner-modal-input"
                    value={eqAttachmentType}
                    onChange={(e) => setEqAttachmentType(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="owner-modal-label">Rate / Hour (₹)</label>
                  <input
                    type="number"
                    className="owner-modal-input"
                    value={eqPriceHour}
                    onChange={(e) => setEqPriceHour(e.target.value)}
                  />
                </div>
                <div>
                  <label className="owner-modal-label">Rate / Acre (₹)</label>
                  <input
                    type="number"
                    className="owner-modal-input"
                    value={eqPriceAcre}
                    onChange={(e) => setEqPriceAcre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="owner-modal-label">Rate / Day (₹)</label>
                  <input
                    type="number"
                    className="owner-modal-input"
                    value={eqPriceDay}
                    onChange={(e) => setEqPriceDay(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="owner-modal-label">Condition</label>
                  <select
                    className="owner-modal-input"
                    value={eqCondition}
                    onChange={(e) =>
                      setEqCondition(
                        e.target.value as 'Excellent' | 'Good' | 'Standard'
                      )
                    }
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div>
                  <label className="owner-modal-label">Operator Rate / Hr (₹)</label>
                  <input
                    type="number"
                    className="owner-modal-input"
                    value={eqOperatorRate}
                    onChange={(e) => setEqOperatorRate(e.target.value)}
                    disabled={!eqOperatorAvail}
                  />
                </div>
              </div>

              <label className="owner-modal-label">Service Locations (comma-separated)</label>
              <input
                type="text"
                className="owner-modal-input"
                value={eqLocations}
                onChange={(e) => setEqLocations(e.target.value)}
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '10px 0 16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={eqStandalone}
                    onChange={(e) => setEqStandalone(e.target.checked)}
                  />
                  Available Standalone
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={eqCombo}
                    onChange={(e) => setEqCombo(e.target.checked)}
                  />
                  Available as Tractor + Equipment
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={eqOperatorAvail}
                    onChange={(e) => setEqOperatorAvail(e.target.checked)}
                  />
                  Operator Available
                </label>
              </div>

              <div className="owner-dialog-actions">
                <button
                  type="button"
                  className="owner-dialog-cancel-btn"
                  onClick={() => setIsAddEquipmentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="owner-dialog-primary-btn">
                  Publish Equipment Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast-notice" role="status">
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
