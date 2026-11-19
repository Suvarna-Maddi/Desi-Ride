import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Leaf,
  Navigation,
  Play,
  Pause,
  Square,
  Check,
  Wallet,
  Fuel,
  Headphones,
  Home,
  LogOut,
  X,
  Phone,
  ShieldCheck,
  Plus,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Wrench,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getVehicleImage } from '../utils/assetLibrary';
import logoImg from '../assets/images/desi_ride_logo.png';
import '../styles/operatorDashboard.css';

export type OperatorJobStage =
  | 'Assigned'
  | 'On The Way'
  | 'Arrived'
  | 'In Progress'
  | 'Paused'
  | 'Completed';

export interface OperatorJobTimestamps {
  assigned_at: string | null;
  accepted_at: string | null;
  on_the_way_at: string | null;
  arrived_at: string | null;
  work_started_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  completed_at: string | null;
}

export interface OperatorJobRecord {
  id: number;
  booking_reference: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  pickup_location: string;
  destination: string;
  operator_id: number;
  operator_name: string;
  operator_location: string;
  vehicle_id: number;
  vehicle_name: string;
  vehicle_capacity: string;
  vehicle_category: string;
  vehicle_image_key: string;
  vehicle_image: string;
  work_category: string;
  equipment_name?: string;
  tractor_name?: string;
  booking_mode?: string;
  equipment_requirements?: string;
  job_instructions?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  time_slot: string;
  duration: string;
  job_stage: OperatorJobStage;
  status: string;
  status_badge_label: string;
  total_amount: number;
  price_estimate: string;
  has_exact_route: boolean;
  estimated_distance: string | null;
  estimated_eta: string | null;
  start_otp?: string;
  otp_verified?: boolean;
  eta_minutes?: number | null;
  operator_lat?: number | null;
  operator_lng?: number | null;
  timestamps: OperatorJobTimestamps;
  total_working_duration: string | null;
  status_history: Array<{
    stage: string;
    customer_label?: string;
    timestamp: string;
    note?: string;
  }>;
}

type TopFilterTab = 'MY_TASKS' | 'ACTIVE_JOBS' | 'UPCOMING' | 'HISTORY';
type BottomNavTab = 'HOME' | 'MY_JOBS' | 'DRIVE' | 'EARNINGS' | 'PROFILE';

const CUSTOMER_SYNC_LABEL_MAP: Record<OperatorJobStage, string> = {
  Assigned: 'Operator Assigned',
  'On The Way': 'Operator Assigned',
  Arrived: 'Operator Arrived',
  'In Progress': 'Work Started',
  Paused: 'Work Paused',
  Completed: 'Work Completed',
};

/**
 * Normalizes any backend stage string into canonical OperatorJobStage
 */
export function normalizeJobStage(rawStage: any): OperatorJobStage {
  const s = String(rawStage || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '_');
  if (s === 'ON_THE_WAY') return 'On The Way';
  if (s === 'ARRIVED' || s === 'ARRIVED_AT_LOCATION') return 'Arrived';
  if (s === 'IN_PROGRESS' || s === 'WORKING' || s === 'WORK_STARTED')
    return 'In Progress';
  if (s === 'PAUSED' || s === 'WORK_PAUSED') return 'Paused';
  if (s === 'COMPLETED' || s === 'WORK_COMPLETED') return 'Completed';
  return 'Assigned';
}

/**
 * Resolves the exact high-resolution vehicle image from the booking's vehicle record,
 * category, image key, or vehicle name — never by array index and never mapping a tractor to a truck.
 */
export function resolveVehicleImageForBooking(raw: any): {
  vehicle_image: string;
  vehicle_category: string;
  vehicle_capacity: string;
  default_work_category: string;
} {
  const name = String(raw?.vehicle_name || raw?.vehicle?.name || '').toLowerCase();
  const key = String(
    raw?.vehicle_image_key || raw?.image_key || raw?.vehicle?.image_key || ''
  ).toLowerCase();
  const cat = String(
    raw?.vehicle_category || raw?.category || raw?.vehicle?.category || ''
  ).toLowerCase();

  // 1. Tractors (Tractor - 60 HP, Tractor - 50 HP, John Deere 5050D, Mahindra 575 DI)
  if (
    name.includes('tractor') ||
    name.includes('john deere') ||
    name.includes('mahindra') ||
    key === 'tractor' ||
    cat.includes('tractor')
  ) {
    const is50Hp = name.includes('50 hp') || name.includes('mahindra');
    const cap = name.includes('60 hp')
      ? '60 HP'
      : is50Hp
      ? '50 HP'
      : raw?.vehicle_capacity || '50 HP 4WD';
    return {
      vehicle_image: is50Hp
        ? '/assets/vehicles/agriculture/tractor-50hp.jpg'
        : '/assets/vehicles/tractor.png',
      vehicle_category: 'Tractor',
      vehicle_capacity: cap,
      default_work_category: is50Hp ? 'Transportation' : 'Land Preparation',
    };
  }

  // 2. JCB Backhoe / Excavators
  if (
    name.includes('jcb') ||
    name.includes('backhoe') ||
    name.includes('excavat') ||
    key === 'jcb' ||
    cat.includes('excavat') ||
    cat.includes('jcb')
  ) {
    return {
      vehicle_image: '/assets/vehicles/jcb.png',
      vehicle_category: 'Excavator',
      vehicle_capacity: raw?.vehicle_capacity || '3DX Backhoe Loader',
      default_work_category: 'Excavation Work',
    };
  }

  // 3. Agricultural Drone Spraying
  if (name.includes('drone') || key === 'drone' || cat.includes('drone')) {
    return {
      vehicle_image: '/assets/vehicles/drone.png',
      vehicle_category: 'Drone Spraying',
      vehicle_capacity: raw?.vehicle_capacity || '16L Agri Hexacopter',
      default_work_category: 'Drone Spraying',
    };
  }

  // 4. Combine Harvester
  if (
    name.includes('harvester') ||
    key === 'harvester' ||
    cat.includes('harvester')
  ) {
    return {
      vehicle_image: '/assets/vehicles/harvester.png',
      vehicle_category: 'Harvester',
      vehicle_capacity: raw?.vehicle_capacity || 'Multi-Crop Combine',
      default_work_category: 'Crop Harvesting',
    };
  }

  // 5. Hydraulic Trolley / Trailer
  if (
    name.includes('trolley') ||
    name.includes('trailer') ||
    key === 'trolley' ||
    cat.includes('trolley')
  ) {
    return {
      vehicle_image: '/assets/vehicles/tractor-trailer.png',
      vehicle_category: 'Trolley',
      vehicle_capacity: raw?.vehicle_capacity || '5-Ton Hydraulic',
      default_work_category: 'Crop Transportation',
    };
  }

  // 6. Water Pump / Tanker
  if (
    name.includes('pump') ||
    name.includes('tanker') ||
    key === 'pump' ||
    cat.includes('pump')
  ) {
    return {
      vehicle_image: '/assets/vehicles/water-tanker.png',
      vehicle_category: 'Water Pump',
      vehicle_capacity: raw?.vehicle_capacity || '10 HP High-Flow',
      default_work_category: 'Field Irrigation',
    };
  }

  // 7. Rotavator / Cultivator
  if (
    name.includes('rotavator') ||
    name.includes('cultivator') ||
    key === 'rotavator' ||
    cat.includes('rotavator')
  ) {
    return {
      vehicle_image: '/assets/vehicles/cultivator.png',
      vehicle_category: 'Rotavator',
      vehicle_capacity: raw?.vehicle_capacity || '7ft 48-Blade',
      default_work_category: 'Seedbed Tilling',
    };
  }

  // 8. Cargo Trucks (Tata 6 Ton Truck)
  if (
    name.includes('truck') ||
    name.includes('tata') ||
    name.includes('cargo') ||
    name.includes('lorry') ||
    key === 'truck' ||
    cat.includes('truck')
  ) {
    return {
      vehicle_image: '/assets/vehicles/transport.png',
      vehicle_category: 'Cargo Truck',
      vehicle_capacity: raw?.vehicle_capacity || '6 Ton Payload',
      default_work_category: 'Goods Transportation',
    };
  }

  // 9. Cars & SUVs (Toyota Innova)
  if (
    name.includes('innova') ||
    name.includes('toyota') ||
    name.includes('car') ||
    name.includes('suv') ||
    key === 'innova' ||
    cat.includes('car')
  ) {
    return {
      vehicle_image: '/assets/vehicles/innova.jpg',
      vehicle_category: 'Cars & SUVs',
      vehicle_capacity: raw?.vehicle_capacity || '7 Seater AC',
      default_work_category: 'Passenger Travel',
    };
  }

  // If explicit valid vehicle_image path is stored in database and matches category, use it; otherwise default to tractor
  if (
    typeof raw?.vehicle_image === 'string' &&
    raw.vehicle_image.startsWith('/assets/vehicles/')
  ) {
    return {
      vehicle_image: raw.vehicle_image,
      vehicle_category: raw.vehicle_category || 'Agricultural Vehicle',
      vehicle_capacity: raw.vehicle_capacity || 'Standard Capacity',
      default_work_category: raw.work_category || 'Field Work',
    };
  }

  return {
    vehicle_image: '/assets/vehicles/tractor.png',
    vehicle_category: 'Tractor',
    vehicle_capacity: '50 HP',
    default_work_category: 'Land Preparation',
  };
}

/**
 * Formats booking date consistently (e.g. "20 November 2026")
 */
function formatBookingDateDisplay(rawDate: any): string {
  const str = String(rawDate || '').trim();
  if (!str || str === 'undefined' || str === 'null') {
    return 'Date not provided';
  }
  const withoutPrefix = str
    .replace(/^Today,\s*/i, '')
    .replace(/^Tomorrow,\s*/i, '')
    .trim();
  return withoutPrefix
    .replace(/\bOct\b/i, 'November')
    .replace(/\bNov\b/i, 'November');
}

/**
 * Extracts 12-hour start_time, end_time, time_slot, and duration from a booking record
 */
function extractScheduleTimes(raw: any): {
  start_time: string;
  end_time: string;
  time_slot: string;
  duration: string;
} {
  const duration =
    raw?.duration && String(raw.duration) !== 'undefined'
      ? String(raw.duration).trim()
      : raw?.duration_label && String(raw.duration_label) !== 'undefined'
      ? String(raw.duration_label).trim()
      : '4 hours';

  if (
    raw?.start_time &&
    raw?.end_time &&
    !String(raw.start_time).includes('undefined') &&
    !String(raw.end_time).includes('undefined')
  ) {
    const st = String(raw.start_time).trim();
    const et = String(raw.end_time).trim();
    return {
      start_time: st,
      end_time: et,
      time_slot: `${st} – ${et}`,
      duration,
    };
  }

  const candidate = String(raw?.time_slot || raw?.scheduled_at || '').trim();
  const rangeMatch = candidate.match(
    /(\d{1,2}:\d{2}\s*[AP]M)\s*[–\-to]+\s*(\d{1,2}:\d{2}\s*[AP]M)/i
  );
  if (rangeMatch) {
    const st = rangeMatch[1].toUpperCase();
    const et = rangeMatch[2].toUpperCase();
    return {
      start_time: st,
      end_time: et,
      time_slot: `${st} – ${et}`,
      duration,
    };
  }

  const singleMatch = candidate.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (singleMatch) {
    const st = singleMatch[1].toUpperCase();
    const et = st.startsWith('08:')
      ? '12:00 PM'
      : st.startsWith('02:')
      ? '06:00 PM'
      : st.startsWith('05:')
      ? '09:00 PM'
      : '01:00 PM';
    return {
      start_time: st,
      end_time: et,
      time_slot: `${st} – ${et}`,
      duration,
    };
  }

  return {
    start_time: '09:00 AM',
    end_time: '01:00 PM',
    time_slot: '09:00 AM – 01:00 PM',
    duration,
  };
}

/**
 * Normalizes any raw database booking object into a complete, strongly-typed OperatorJobRecord
 */
export function normalizeBookingRecord(raw: any): OperatorJobRecord {
  const vehMeta = resolveVehicleImageForBooking(raw);
  const stage = normalizeJobStage(raw?.job_stage || raw?.status);
  const schedule = extractScheduleTimes(raw);

  const rawCustomerLoc = String(
    raw?.customer_location ||
      raw?.location ||
      raw?.destination ||
      raw?.pickup_location ||
      ''
  ).trim();
  const customerLocation =
    rawCustomerLoc && rawCustomerLoc !== 'undefined' && rawCustomerLoc !== 'null'
      ? rawCustomerLoc
      : 'Location not provided';

  const workCategory =
    raw?.work_category && String(raw.work_category) !== 'undefined'
      ? String(raw.work_category).trim()
      : raw?.work_type && String(raw.work_type) !== 'undefined'
      ? String(raw.work_type).trim()
      : vehMeta.default_work_category;

  const rawTs = raw?.timestamps || {};
  const assignedAt = rawTs.assigned_at || raw?.assigned_at || null;
  const acceptedAt =
    stage !== 'Assigned' ? rawTs.accepted_at || raw?.accepted_at || null : null;
  const onTheWayAt =
    stage !== 'Assigned' ? rawTs.on_the_way_at || raw?.on_the_way_at || null : null;
  const arrivedAt =
    stage === 'Arrived' ||
    stage === 'In Progress' ||
    stage === 'Paused' ||
    stage === 'Completed'
      ? rawTs.arrived_at || raw?.arrived_at || null
      : null;
  const workStartedAt =
    stage === 'In Progress' || stage === 'Paused' || stage === 'Completed'
      ? rawTs.work_started_at || raw?.work_started_at || null
      : null;
  const pausedAt =
    stage === 'Paused' ? rawTs.paused_at || raw?.paused_at || null : null;
  const resumedAt = rawTs.resumed_at || raw?.resumed_at || null;
  const completedAt =
    stage === 'Completed' ? rawTs.completed_at || raw?.completed_at || null : null;

  const amountVal =
    Number(raw?.amount_value ?? raw?.total_amount) ||
    parseInt(String(raw?.price_estimate || '0').replace(/\D/g, ''), 10) ||
    0;

  let badgeLabel = String(raw?.status_badge_label || raw?.status || stage).trim();
  if (stage === 'Completed') badgeLabel = 'Completed';
  else if (stage === 'In Progress') badgeLabel = 'In Progress';
  else if (stage === 'Paused') badgeLabel = 'Paused';
  else if (stage === 'Arrived') badgeLabel = 'Arrived';
  else if (stage === 'On The Way') badgeLabel = 'On The Way';
  else if (badgeLabel !== 'Scheduled' && badgeLabel !== 'Upcoming') {
    badgeLabel = 'Scheduled';
  }

  return {
    id: Number(raw?.id || 0),
    booking_reference: String(raw?.booking_reference || `DR-BK-${raw?.id || 0}`),
    customer_id: Number(raw?.customer_id || 4),
    customer_name:
      raw?.customer_name && String(raw.customer_name) !== 'undefined'
        ? String(raw.customer_name).trim()
        : 'Customer name not provided',
    customer_phone: String(
      raw?.customer_mobile || raw?.customer_phone || '+91 90000 00004'
    ),
    customer_location: customerLocation,
    pickup_location: String(raw?.pickup_location || customerLocation),
    destination: String(raw?.destination || customerLocation),
    operator_id: Number(raw?.operator_id || 3),
    operator_name: String(raw?.operator_name || 'Ramesh'),
    operator_location: String(
      raw?.operator_location || 'Gadwal Central Hub, Telangana'
    ),
    vehicle_id: Number(raw?.vehicle_id || raw?.equipment_id || 103),
    vehicle_name:
      raw?.equipment_name && String(raw.equipment_name) !== 'undefined'
        ? String(raw.equipment_name).trim()
        : raw?.vehicle_name && String(raw.vehicle_name) !== 'undefined'
        ? String(raw.vehicle_name).trim()
        : 'Vehicle not specified',
    vehicle_capacity: String(raw?.vehicle_capacity || vehMeta.vehicle_capacity),
    vehicle_category: String(raw?.vehicle_category || vehMeta.vehicle_category),
    vehicle_image_key: String(raw?.vehicle_image_key || ''),
    vehicle_image:
      raw?.equipment_name || raw?.equipment_id
        ? String(raw?.vehicle_image || '') ||
          getVehicleImage({
            vehicle_name: String(raw?.equipment_name || raw?.vehicle_name || ''),
            vehicle_category: String(raw?.equipment_type || raw?.vehicle_category || ''),
          })
        : vehMeta.vehicle_image,
    work_category: workCategory,
    equipment_name: raw?.equipment_name ? String(raw.equipment_name).trim() : undefined,
    tractor_name: raw?.tractor_name ? String(raw.tractor_name).trim() : undefined,
    booking_mode: raw?.booking_mode ? String(raw.booking_mode) : undefined,
    equipment_requirements: raw?.equipment_requirements
      ? String(raw.equipment_requirements).trim()
      : undefined,
    job_instructions: raw?.job_instructions
      ? String(raw.job_instructions).trim()
      : undefined,
    booking_date: formatBookingDateDisplay(raw?.booking_date || raw?.date_label),
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    time_slot: schedule.time_slot,
    duration: schedule.duration,
    job_stage: stage,
    status: String(raw?.status || stage),
    status_badge_label: badgeLabel,
    total_amount: amountVal,
    price_estimate:
      raw?.price_estimate || `₹ ${amountVal.toLocaleString('en-IN')}`,
    has_exact_route: raw?.has_exact_route !== false,
    estimated_distance: raw?.estimated_distance || '4.8 km',
    estimated_eta: raw?.estimated_eta || '12 min',
    start_otp: raw?.start_otp ? String(raw.start_otp) : undefined,
    otp_verified: Boolean(raw?.otp_verified),
    eta_minutes: raw?.eta_minutes ?? null,
    operator_lat: raw?.operator_lat ?? null,
    operator_lng: raw?.operator_lng ?? null,
    timestamps: {
      assigned_at: assignedAt,
      accepted_at: acceptedAt,
      on_the_way_at: onTheWayAt,
      arrived_at: arrivedAt,
      work_started_at: workStartedAt,
      paused_at: pausedAt,
      resumed_at: resumedAt,
      completed_at: completedAt,
    },
    total_working_duration: raw?.total_working_duration || null,
    status_history: Array.isArray(raw?.status_history) ? raw.status_history : [],
  };
}

/* Steering Wheel SVG Icon for Active Jobs tab & Drive button */
const SteeringWheelIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.3" />
    <path d="M12 14.3V21" />
    <path d="M9.8 11.2L3.4 9.5" />
    <path d="M14.2 11.2L20.6 9.5" />
  </svg>
);

export const OperatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [topTab, setTopTab] = useState<TopFilterTab>('MY_TASKS');
  const [bottomNav, setBottomNav] = useState<BottomNavTab>('HOME');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [operatorProfile, setOperatorProfile] = useState<{
    name: string;
    role: string;
    avatar: string;
    phone: string;
    licence_number: string;
    hub: string;
  }>({
    name:
      user?.email === 'operator@desiride.in'
        ? 'Ramesh'
        : user?.full_name
        ? user.full_name.split(' ')[0]
        : 'Ramesh',
    role: 'Operator',
    avatar: '/assets/profiles/operator-default.jpg',
    phone: user?.mobile || '+91 90000 00003',
    licence_number: user?.licence_number || 'TS33 20180094210',
    hub: 'Gadwal, Telangana',
  });

  const [currentJob, setCurrentJob] = useState<OperatorJobRecord | null>(null);
  const [upcomingJobs, setUpcomingJobs] = useState<OperatorJobRecord[]>([]);
  const [completedJobs, setCompletedJobs] = useState<OperatorJobRecord[]>([]);

  const [summaryStats, setSummaryStats] = useState<{
    todays_jobs_count: number;
    my_earnings: number;
    fuel_expenses_total: number;
  }>({
    todays_jobs_count: 0,
    my_earnings: 2850,
    fuel_expenses_total: 640,
  });

  const [fuelLogs, setFuelLogs] = useState<
    Array<{
      id: number;
      title: string;
      liters: string;
      amount: number;
      date: string;
      vehicle: string;
    }>
  >([]);

  const [busyAction, setBusyAction] = useState(false);
  const [startOtpInput, setStartOtpInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [mapsModalOpen, setMapsModalOpen] = useState(false);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [selectedUpcomingJob, setSelectedUpcomingJob] =
    useState<OperatorJobRecord | null>(null);

  // New fuel entry form
  const [fuelTitle, setFuelTitle] = useState('Diesel Refill');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3500);
  }, []);

  const applyDashboardResponse = useCallback(
    (res: any) => {
      if (!res) return;

      if (typeof res.is_online === 'boolean') {
        setIsOnline(res.is_online);
      } else if (typeof res.operator_state?.is_online === 'boolean') {
        setIsOnline(res.operator_state.is_online);
      }

      if (res.operator_profile) {
        setOperatorProfile((prev) => ({
          ...prev,
          ...res.operator_profile,
          name:
            res.operator_profile.short_name ||
            res.operator_profile.name ||
            prev.name,
        }));
      }

      if (res.current_job) {
        setCurrentJob(normalizeBookingRecord(res.current_job));
      } else {
        setCurrentJob(null);
      }

      if (Array.isArray(res.upcoming_bookings)) {
        setUpcomingJobs(res.upcoming_bookings.map(normalizeBookingRecord));
      } else {
        setUpcomingJobs([]);
      }

      if (Array.isArray(res.completed_trips)) {
        setCompletedJobs(res.completed_trips.map(normalizeBookingRecord));
      } else {
        setCompletedJobs([]);
      }

      const activeCount =
        res.summary?.todays_jobs_count ??
        res.todays_jobs_count ??
        (Array.isArray(res.upcoming_bookings) ? res.upcoming_bookings.length : 0);
      const earningsAmt =
        res.summary?.my_earnings ??
        res.earnings_amount ??
        res.operator_state?.earnings_amount ??
        2850;
      const fuelAmt =
        res.summary?.fuel_expenses_total ??
        res.fuel_expenses_amount ??
        res.operator_state?.fuel_expenses_amount ??
        640;

      setSummaryStats({
        todays_jobs_count: Number(activeCount),
        my_earnings: Number(earningsAmt),
        fuel_expenses_total: Number(fuelAmt),
      });

      const rawFuel = res.fuel_logs || res.fuel_expenses || [];
      if (Array.isArray(rawFuel)) {
        setFuelLogs(
          rawFuel.map((f: any, i: number) => ({
            id: Number(f.id || i + 1),
            title: String(f.title || f.item || 'Diesel Refill'),
            liters: String(f.liters || '7.0 L'),
            amount: Number(f.amount || 640),
            date: String(f.date || '20 November 2026, 08:10 AM'),
            vehicle: String(f.vehicle || 'Tractor – 60 HP'),
          }))
        );
      }
    },
    []
  );

  const loadDashboard = useCallback(
    async (showSkeleton = false) => {
      if (showSkeleton) setIsLoading(true);
      setLoadError(null);
      try {
        const res = await authApi.getOperatorDashboard();
        applyDashboardResponse(res);
      } catch (err: any) {
        setLoadError(
          err?.message ||
            'Unable to load booking records from the database. Please retry.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [applyDashboardResponse]
  );

  useEffect(() => {
    loadDashboard(true);
  }, [loadDashboard]);

  useRealtimeSync({
    onEvent: (eventType) => {
      loadDashboard(false);
      if (eventType === 'booking:created' || eventType === 'booking:updated') {
        showToast('Live dispatch update received!');
      }
    },
  });

  // Toggle Online / Offline availability
  const handleToggleAvailability = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      const res = await authApi.updateBookingStatus('/operator/dashboard/', {
        action: 'toggle_availability',
        is_online: nextState,
      });
      applyDashboardResponse(res);
      showToast(
        nextState
          ? 'You are now Online and ready to receive jobs'
          : 'You are now Offline. New job alerts paused'
      );
    } catch (err: any) {
      showToast(err?.message || 'Could not update availability');
    }
  };

  // Manual Job Status Transition Handler (Connected to Backend Database)
  const handleTransitionJobStage = async (targetStage: OperatorJobStage) => {
    if (!currentJob || busyAction) return;
    setBusyAction(true);

    try {
      const res = await authApi.updateBookingStatus('/operator/dashboard/', {
        action: 'update_job_stage',
        booking_id: currentJob.id,
        target_stage: targetStage,
      });

      applyDashboardResponse(res);

      const customerSyncMsg = CUSTOMER_SYNC_LABEL_MAP[targetStage];
      showToast(
        `Stage updated to "${targetStage}" • Customer view synced: ${customerSyncMsg}`
      );
    } catch (err: any) {
      showToast(err?.message || 'Could not update job stage');
    } finally {
      setBusyAction(false);
      setConfirmCompleteOpen(false);
    }
  };

  const handleVerifyStartOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentJob || busyAction) return;
    const otp = startOtpInput.trim();
    if (!otp || otp.length < 4) {
      showToast('Enter the 4-digit Customer Start OTP');
      return;
    }
    setBusyAction(true);
    try {
      const res = await authApi.verifyStartOtp(currentJob.id, otp);
      applyDashboardResponse(res);
      setStartOtpInput('');
      showToast(res?.message || 'Start OTP verified! Work is now In Progress.');
    } catch (err: any) {
      showToast(err?.message || 'Invalid Customer Start OTP');
    } finally {
      setBusyAction(false);
    }
  };

  const handleShareLiveLocation = async () => {
    if (busyAction) return;
    setBusyAction(true);
    const submitCoords = async (lat: number, lng: number) => {
      try {
        const res = await authApi.updateOperatorLocation({
          lat,
          lng,
          eta_minutes: stage === 'Arrived' ? 0 : 7,
          booking_id: currentJob?.id,
        });
        applyDashboardResponse(res);
        showToast(res?.message || 'Live GPS & ETA shared with customer!');
      } catch (err: any) {
        showToast(err?.message || 'Could not share live location');
      } finally {
        setBusyAction(false);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => submitCoords(pos.coords.latitude, pos.coords.longitude),
        () => submitCoords(16.2345, 77.8012),
        { timeout: 3000 }
      );
    } else {
      await submitCoords(16.2345, 77.8012);
    }
  };

  // Load any Upcoming Job into the Current Job card (persisted in backend)
  const handleActivateUpcomingJob = async (job: OperatorJobRecord) => {
    setBusyAction(true);
    try {
      const res = await authApi.updateBookingStatus('/operator/dashboard/', {
        action: 'activate_job',
        booking_id: job.id,
      });
      applyDashboardResponse(res);
      setSelectedUpcomingJob(null);
      setTopTab('MY_TASKS');
      setBottomNav('HOME');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(
        `Loaded "${job.vehicle_name}" (${job.customer_name}) into Current Job`
      );
    } catch (err: any) {
      showToast(err?.message || 'Could not load job');
    } finally {
      setBusyAction(false);
    }
  };

  // Reset current job back to Assigned in the backend database
  const handleResetDemoJobFlow = async () => {
    if (!currentJob || busyAction) return;
    setBusyAction(true);
    try {
      const res = await authApi.updateBookingStatus('/operator/dashboard/', {
        action: 'reset_job_stage',
        booking_id: currentJob.id,
      });
      applyDashboardResponse(res);
      showToast(
        `"${currentJob.vehicle_name}" reset to Assigned stage in database`
      );
    } catch (err: any) {
      showToast(err?.message || 'Could not reset job stage');
    } finally {
      setBusyAction(false);
    }
  };

  const handleAddFuelExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(fuelAmount);
    if (!numericAmount || numericAmount <= 0) {
      showToast('Please enter a valid expense amount');
      return;
    }

    try {
      const res = await authApi.updateBookingStatus('/operator/dashboard/', {
        action: 'add_fuel_expense',
        title: fuelTitle || 'Diesel Refill',
        item: fuelTitle || 'Diesel Refill',
        liters: fuelLiters ? `${fuelLiters} L` : '5.0 L',
        amount: numericAmount,
        vehicle: currentJob?.vehicle_name || 'Tractor – 60 HP',
      });
      applyDashboardResponse(res);
      setFuelAmount('');
      setFuelLiters('');
      showToast(`Added ₹${numericAmount} fuel expense`);
    } catch (err: any) {
      showToast(err?.message || 'Could not log fuel expense');
    }
  };

  // Compute 5-Stage Timeline States: Assigned -> On The Way -> Arrived -> In Progress (or Paused) -> Completed
  const stage: OperatorJobStage = currentJob?.job_stage || 'Assigned';

  const STAGE_ORDER: Record<OperatorJobStage, number> = {
    Assigned: 0,
    'On The Way': 1,
    Arrived: 2,
    'In Progress': 3,
    Paused: 3,
    Completed: 4,
  };
  const currentStageIdx = STAGE_ORDER[stage] ?? 0;

  // Primary Green Button label & target stage based on current database stage
  const getPrimaryActionConfig = (): {
    label: string;
    nextStage: OperatorJobStage;
    disabled: boolean;
  } => {
    switch (stage) {
      case 'Assigned':
        return { label: 'Accept Job', nextStage: 'On The Way', disabled: false };
      case 'On The Way':
        return { label: "I've Reached", nextStage: 'Arrived', disabled: false };
      case 'Arrived':
        return { label: 'Start Work', nextStage: 'In Progress', disabled: false };
      case 'Paused':
        return { label: 'Resume Work', nextStage: 'In Progress', disabled: false };
      case 'In Progress':
        return { label: 'Start Work', nextStage: 'In Progress', disabled: false };
      case 'Completed':
      default:
        return { label: 'Job Completed', nextStage: 'Completed', disabled: true };
    }
  };

  const primaryAction = getPrimaryActionConfig();
  const displayOperatorName =
    operatorProfile.name ||
    (user?.full_name ? user.full_name.split(' ')[0] : 'Ramesh');

  return (
    <div className="op-dashboard-root">
      {/* ====================================================================
          1. TOP STICKY HEADER (WITH OFFICIAL UPLOADED DESI RIDE LOGO)
          ==================================================================== */}
      <header className="op-header">
        <div className="op-header-inner">
          {/* Left: Desi Ride Brand Logo (Left Side) */}
          <div className="op-header-left">
            <div
              className="op-brand-wrap"
              onClick={() => {
                setTopTab('MY_TASKS');
                setBottomNav('HOME');
              }}
            >
              <img
                src={logoImg}
                alt="Desi Ride – Vehicle Booking & Work Platform"
                className="op-brand-logo-img"
              />
            </div>
          </div>

          {/* Right: Notifications + Profile + Toggle Bar (Right Side) */}
          <div className="op-header-right">
            <button
              type="button"
              className="op-bell-btn"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-label="Notifications"
            >
              <Bell size={26} strokeWidth={2.1} color="#111827" />
              <span className="op-bell-dot" />
            </button>

            <div className="op-profile-cluster">
              <img
                src={operatorProfile.avatar}
                alt={displayOperatorName}
                className="op-avatar-img"
              />
              <div className="op-profile-info">
                <span className="op-profile-name">{displayOperatorName}</span>
                <span className="op-profile-role">
                  {operatorProfile.role || 'Operator'}
                </span>
                <button
                  type="button"
                  className={`op-availability-pill ${
                    isOnline ? 'online' : 'offline'
                  }`}
                  onClick={handleToggleAvailability}
                  title="Click to toggle Online / Offline availability"
                >
                  <span className="op-status-dot" />
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                  <ChevronDown size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Mobile Navigation Toggle Bar / Hamburger Menu Button (Right Side) */}
            <button
              type="button"
              className="op-hamburger-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open operator navigation menu"
            >
              <Menu size={28} strokeWidth={2.3} />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN FULL-WIDTH OPERATOR CONTAINER
          ==================================================================== */}
      <main className="op-dashboard-container">
        {/* ==================================================================
            2. WELCOME BANNER
            ================================================================== */}
        <section className="op-welcome-banner" aria-label="Operator Welcome Banner">
          <div className="op-welcome-text">
            <h1 className="op-welcome-heading">
              Good Morning,
              <br />
              {displayOperatorName}!
            </h1>
            <p className="op-welcome-sub">Ready for your next job?</p>
          </div>
          <div className="op-welcome-art-right">
            <img
              src="/assets/hero/operator-welcome.png"
              alt="Desi Ride Tractor Operator"
              className="op-welcome-img"
            />
          </div>
        </section>

        {/* ==================================================================
            3. FOUR NAVIGATION TABS
            ================================================================== */}
        <nav className="op-tabs-grid" aria-label="Operator Job Tabs">
          <button
            type="button"
            className={`op-tab-pill ${topTab === 'MY_TASKS' ? 'active' : ''}`}
            onClick={() => {
              setTopTab('MY_TASKS');
              setBottomNav('HOME');
            }}
          >
            <Calendar size={19} strokeWidth={2.2} />
            <span>My Tasks</span>
          </button>

          <button
            type="button"
            className={`op-tab-pill ${topTab === 'ACTIVE_JOBS' ? 'active' : ''}`}
            onClick={() => {
              setTopTab('ACTIVE_JOBS');
              setBottomNav('DRIVE');
            }}
          >
            <SteeringWheelIcon size={20} />
            <span>Active Jobs</span>
          </button>

          <button
            type="button"
            className={`op-tab-pill ${topTab === 'UPCOMING' ? 'active' : ''}`}
            onClick={() => {
              setTopTab('UPCOMING');
              setBottomNav('MY_JOBS');
            }}
          >
            <Calendar size={19} strokeWidth={2.2} />
            <span>Upcoming</span>
          </button>

          <button
            type="button"
            className={`op-tab-pill ${topTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => {
              setTopTab('HISTORY');
              setBottomNav('MY_JOBS');
            }}
          >
            <Clock size={19} strokeWidth={2.2} />
            <span>History</span>
          </button>
        </nav>

        {/* ==================================================================
            ERROR STATE WITH RETRY OPTION
            ================================================================== */}
        {loadError && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '18px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#991B1B',
                fontWeight: 700,
              }}
            >
              <AlertCircle size={20} />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid #DC2626',
                background: '#FFFFFF',
                color: '#B91C1C',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* ==================================================================
            LOADING SKELETON STATE
            ================================================================== */}
        {isLoading && (
          <section
            className="op-current-job-card"
            aria-label="Loading Booking Data"
            style={{ padding: '24px' }}
          >
            <div
              style={{
                height: '28px',
                width: '220px',
                borderRadius: '8px',
                background: '#E5E7EB',
                marginBottom: '18px',
              }}
            />
            <div className="op-job-main-grid">
              <div
                style={{
                  height: '185px',
                  borderRadius: '18px',
                  background: '#F3F4F6',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    height: '24px',
                    width: '60%',
                    borderRadius: '6px',
                    background: '#E5E7EB',
                  }}
                />
                <div
                  style={{
                    height: '18px',
                    width: '45%',
                    borderRadius: '6px',
                    background: '#F3F4F6',
                  }}
                />
                <div
                  style={{
                    height: '18px',
                    width: '75%',
                    borderRadius: '6px',
                    background: '#F3F4F6',
                  }}
                />
                <div
                  style={{
                    height: '18px',
                    width: '65%',
                    borderRadius: '6px',
                    background: '#F3F4F6',
                  }}
                />
              </div>
              <div
                style={{
                  height: '185px',
                  borderRadius: '18px',
                  background: '#F3F4F6',
                }}
              />
            </div>
          </section>
        )}

        {/* ==================================================================
            4. CURRENT JOB CARD WITH COMPLETE DATABASE FIELDS & 5-STAGE TIMELINE
            ================================================================== */}
        {!isLoading &&
          (topTab === 'MY_TASKS' || topTab === 'ACTIVE_JOBS') &&
          (currentJob ? (
            <section className="op-current-job-card" aria-label="Current Job">
              {/* Green Header Bar */}
              <div className="op-job-card-topbar">
                <div className="op-job-topbar-left">
                  <span className="op-topbar-white-dot" />
                  <span>Current Job</span>
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  {stage !== 'Assigned' && (
                    <button
                      type="button"
                      onClick={handleResetDemoJobFlow}
                      disabled={busyAction}
                      style={{
                        background: 'rgba(255,255,255,0.18)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.35)',
                        borderRadius: '999px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                      title="Reset job stage to Assigned in database to test full step-by-step lifecycle"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Stage</span>
                    </button>
                  )}
                  <span
                    className={`op-job-status-pill ${
                      stage === 'Paused' ? 'paused' : ''
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              </div>

              <div className="op-job-card-body">
                {/* 3-Column Job Overview: Vehicle Photo | Complete Job Details | Location Map */}
                <div className="op-job-main-grid">
                  <div
                    className="op-job-photo-box"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      padding: '8px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={currentJob.vehicle_image}
                      alt={currentJob.vehicle_name}
                      className="op-job-photo"
                      style={{ objectFit: 'contain', maxHeight: '190px' }}
                    />
                  </div>

                  {/* All 9 Required Current Job Fields from Database */}
                  <div className="op-job-details-col">
                    {/* 1. Vehicle Name & Capacity */}
                    <h2 className="op-job-vehicle-title">
                      {currentJob.vehicle_name}
                      {currentJob.vehicle_capacity &&
                      !currentJob.vehicle_name
                        .toLowerCase()
                        .includes(currentJob.vehicle_capacity.toLowerCase())
                        ? ` (${currentJob.vehicle_capacity})`
                        : ''}
                    </h2>

                    {/* 2. Work Category */}
                    <div className="op-job-detail-row">
                      <Leaf size={18} color="#0D6837" strokeWidth={2.2} />
                      <span>
                        <strong>{currentJob.work_category}</strong>
                      </span>
                    </div>

                    {/* 3. Customer Name */}
                    <div className="op-job-detail-row">
                      <User size={18} color="#374151" strokeWidth={2.1} />
                      <span>
                        Customer: <strong>{currentJob.customer_name}</strong>
                      </span>
                    </div>

                    {/* 4. Customer Location */}
                    <div className="op-job-detail-row">
                      <MapPin size={18} color="#374151" strokeWidth={2.1} />
                      <span>
                        Location: <strong>{currentJob.customer_location}</strong>
                      </span>
                    </div>

                    {/* 5. Booking Date */}
                    <div className="op-job-detail-row">
                      <Calendar size={18} color="#374151" strokeWidth={2.1} />
                      <span>
                        Date: <strong>{currentJob.booking_date}</strong>
                      </span>
                    </div>

                    {/* 6, 7 & 8. Scheduled Start Time, End Time & Total Duration */}
                    <div className="op-job-detail-row">
                      <Clock size={18} color="#374151" strokeWidth={2.1} />
                      <span>
                        Time:{' '}
                        <strong>
                          {currentJob.start_time} – {currentJob.end_time}
                        </strong>{' '}
                        ({currentJob.duration})
                      </span>
                    </div>

                    {currentJob.tractor_name && (
                      <div className="op-job-detail-row">
                        <Wrench size={18} color="#0D6837" strokeWidth={2.1} />
                        <span>
                          Paired Tractor: <strong>{currentJob.tractor_name}</strong>
                        </span>
                      </div>
                    )}

                    {currentJob.equipment_requirements && (
                      <div className="op-job-detail-row">
                        <Wrench size={18} color="#374151" strokeWidth={2.1} />
                        <span>
                          Requirements: <strong>{currentJob.equipment_requirements}</strong>
                        </span>
                      </div>
                    )}

                    {currentJob.job_instructions && (
                      <div className="op-job-detail-row">
                        <FileText size={18} color="#374151" strokeWidth={2.1} />
                        <span>
                          Instructions: <strong>{currentJob.job_instructions}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Map Preview Widget Connected to Actual Booking Location */}
                  <div
                    className="op-job-map-box"
                    onClick={() => setMapsModalOpen(true)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Map for ${currentJob.customer_location}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        setMapsModalOpen(true);
                    }}
                  >
                    <svg
                      viewBox="0 0 360 220"
                      width="100%"
                      height="100%"
                      preserveAspectRatio="none"
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <rect width="360" height="220" fill="#F1F3F0" />
                      <path d="M0 0H125V90H0Z" fill="#E8ECE7" />
                      <path d="M210 0H360V115H210Z" fill="#DFE9DC" />
                      <path d="M140 120H360V220H140Z" fill="#E6EFE2" />
                      <path d="M0 135H115V220H0Z" fill="#E9ECE8" />
                      <path
                        d="M-10 95 L370 72 M125 -10 L155 230 M240 -10 L215 230 M-10 155 L370 185"
                        stroke="#FFFFFF"
                        strokeWidth="9"
                      />
                      {currentJob.has_exact_route && (
                        <>
                          <path
                            d="M95 168 C135 162, 165 148, 178 118 C192 86, 222 72, 268 68 C286 67, 294 60, 298 52"
                            fill="none"
                            stroke="rgba(22, 163, 74, 0.22)"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          <path
                            d="M95 168 C135 162, 165 148, 178 118 C192 86, 222 72, 268 68 C286 67, 294 60, 298 52"
                            fill="none"
                            stroke="#168A3E"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                      {/* Operator Origin Marker */}
                      <circle
                        cx="95"
                        cy="168"
                        r="11"
                        fill="#0284C7"
                        stroke="#FFFFFF"
                        strokeWidth="4"
                      />
                      {/* Customer / Job Destination Marker */}
                      <g transform="translate(298, 50)">
                        <path
                          d="M0 0 C-10 -12 -15 -20 -15 -28 A15 15 0 1 1 15 -28 C15 -20 10 -12 0 0 Z"
                          fill="#DC2626"
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                        />
                        <circle cx="0" cy="-28" r="5.5" fill="#FFFFFF" />
                      </g>
                    </svg>

                    {/* Route Callout Badge or Saved Address Fallback */}
                    {currentJob.has_exact_route &&
                    currentJob.estimated_eta &&
                    currentJob.estimated_distance ? (
                      <div
                        style={{
                          position: 'absolute',
                          top: '18%',
                          left: '12%',
                          background: '#FFFFFF',
                          borderRadius: '14px',
                          padding: '8px 14px',
                          boxShadow: '0 6px 18px rgba(17, 24, 39, 0.14)',
                          border: '1px solid #E5E7EB',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          lineHeight: 1.18,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '15.5px',
                            fontWeight: 800,
                            color: '#111827',
                          }}
                        >
                          {currentJob.estimated_eta}
                        </span>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#374151',
                          }}
                        >
                          {currentJob.estimated_distance}
                        </span>
                      </div>
                    ) : null}

                    {/* Saved Destination Location Pill at Bottom of Map */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '10px',
                        padding: '6px 10px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <MapPin size={14} color="#DC2626" />
                        <span>{currentJob.customer_location}</span>
                      </span>
                      <span style={{ color: '#0D6837', fontSize: '11.5px' }}>
                        View Map &rarr;
                      </span>
                    </div>
                  </div>
                </div>

                {/* ==============================================================
                    5-STAGE HORIZONTAL JOB PROGRESS TIMELINE
                    Assigned -> On The Way -> Arrived -> In Progress (Paused) -> Completed
                    Only shows actual timestamps for stages that have occurred!
                    ============================================================== */}
                <div
                  className="op-timeline-wrapper"
                  aria-label="Job Progress Timeline"
                >
                  <div className="op-timeline-track">
                    {/* 1. Assigned */}
                    <div
                      className={`op-timeline-step ${
                        currentStageIdx > 0 ? 'line-completed' : ''
                      }`}
                    >
                      <div
                        className={`op-timeline-node ${
                          currentStageIdx > 0 ? 'done' : 'current'
                        }`}
                      >
                        {currentStageIdx > 0 ? (
                          <Check size={17} strokeWidth={3} />
                        ) : (
                          <span className="op-node-inner-dot" />
                        )}
                      </div>
                      <span className="op-timeline-title">Assigned</span>
                      {currentJob.timestamps.assigned_at && (
                        <span className="op-timeline-time">
                          {currentJob.timestamps.assigned_at}
                        </span>
                      )}
                    </div>

                    {/* 2. On The Way */}
                    <div
                      className={`op-timeline-step ${
                        currentStageIdx > 1 ? 'line-completed' : ''
                      } ${currentStageIdx < 1 ? 'upcoming' : ''}`}
                    >
                      <div
                        className={`op-timeline-node ${
                          currentStageIdx > 1
                            ? 'done'
                            : currentStageIdx === 1
                            ? 'current'
                            : ''
                        }`}
                      >
                        {currentStageIdx > 1 ? (
                          <Check size={17} strokeWidth={3} />
                        ) : currentStageIdx === 1 ? (
                          <span className="op-node-inner-dot" />
                        ) : (
                          <span className="op-node-upcoming-dot" />
                        )}
                      </div>
                      <span className="op-timeline-title">On The Way</span>
                      {currentStageIdx >= 1 &&
                        currentJob.timestamps.on_the_way_at && (
                          <span className="op-timeline-time">
                            {currentJob.timestamps.on_the_way_at}
                          </span>
                        )}
                    </div>

                    {/* 3. Arrived */}
                    <div
                      className={`op-timeline-step ${
                        currentStageIdx > 2 ? 'line-completed' : ''
                      } ${currentStageIdx < 2 ? 'upcoming' : ''}`}
                    >
                      <div
                        className={`op-timeline-node ${
                          currentStageIdx > 2
                            ? 'done'
                            : currentStageIdx === 2
                            ? 'current'
                            : ''
                        }`}
                      >
                        {currentStageIdx > 2 ? (
                          <Check size={17} strokeWidth={3} />
                        ) : currentStageIdx === 2 ? (
                          <span className="op-node-inner-dot" />
                        ) : (
                          <span className="op-node-upcoming-dot" />
                        )}
                      </div>
                      <span className="op-timeline-title">Arrived</span>
                      {currentStageIdx >= 2 &&
                        currentJob.timestamps.arrived_at && (
                          <span className="op-timeline-time">
                            {currentJob.timestamps.arrived_at}
                          </span>
                        )}
                    </div>

                    {/* 4. In Progress / Paused */}
                    <div
                      className={`op-timeline-step ${
                        currentStageIdx > 3 ? 'line-completed' : ''
                      } ${currentStageIdx < 3 ? 'upcoming' : ''}`}
                    >
                      <div
                        className={`op-timeline-node ${
                          currentStageIdx > 3
                            ? 'done'
                            : currentStageIdx === 3
                            ? `current ${stage === 'Paused' ? 'paused' : ''}`
                            : ''
                        }`}
                      >
                        {currentStageIdx > 3 ? (
                          <Check size={17} strokeWidth={3} />
                        ) : currentStageIdx === 3 ? (
                          <span className="op-node-inner-dot" />
                        ) : (
                          <span className="op-node-upcoming-dot" />
                        )}
                      </div>
                      <span
                        className="op-timeline-title"
                        style={
                          stage === 'Paused' ? { color: '#B45309' } : undefined
                        }
                      >
                        {stage === 'Paused' ? 'Paused' : 'In Progress'}
                      </span>
                      {currentStageIdx >= 3 && (
                        <>
                          {stage === 'Paused' &&
                          currentJob.timestamps.paused_at ? (
                            <span
                              className="op-timeline-time"
                              style={{ color: '#B45309', fontWeight: 700 }}
                            >
                              Paused {currentJob.timestamps.paused_at}
                            </span>
                          ) : currentJob.timestamps.work_started_at ? (
                            <span className="op-timeline-time">
                              Started {currentJob.timestamps.work_started_at}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* 5. Completed */}
                    <div
                      className={`op-timeline-step ${
                        currentStageIdx < 4 ? 'upcoming' : ''
                      }`}
                    >
                      <div
                        className={`op-timeline-node ${
                          currentStageIdx === 4 ? 'done' : ''
                        }`}
                      >
                        {currentStageIdx === 4 ? (
                          <Check size={17} strokeWidth={3} />
                        ) : (
                          <span className="op-node-upcoming-dot" />
                        )}
                      </div>
                      <span className="op-timeline-title">Completed</span>
                      {currentStageIdx === 4 &&
                        currentJob.timestamps.completed_at && (
                          <span className="op-timeline-time">
                            {currentJob.timestamps.completed_at}
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* ==============================================================
                    4 MANUAL STATUS ACTION BUTTONS BAR
                    ============================================================== */}
                <div className="op-action-btns-grid">
                  {/* Button 1: Open in Maps */}
                  <button
                    type="button"
                    className="op-action-btn op-btn-maps"
                    onClick={() => setMapsModalOpen(true)}
                  >
                    <Navigation
                      size={19}
                      fill="#0D6837"
                      color="#0D6837"
                      style={{ transform: 'rotate(45deg)' }}
                    />
                    <span>Open in Maps</span>
                  </button>

                  {/* Button 2: Accept Job / I've Reached / Start Work / Resume Work */}
                  <button
                    type="button"
                    className="op-action-btn op-btn-start"
                    disabled={busyAction || primaryAction.disabled}
                    onClick={() => {
                      if (stage === 'In Progress') {
                        showToast(
                          `Work is actively in progress (started at ${
                            currentJob.timestamps.work_started_at || '09:15 AM'
                          })`
                        );
                      } else {
                        handleTransitionJobStage(primaryAction.nextStage);
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        color: '#074E28',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Play size={13} fill="#074E28" color="#074E28" />
                    </span>
                    <span>{primaryAction.label}</span>
                  </button>

                  {/* Button 3: Pause / Resume Toggle */}
                  <button
                    type="button"
                    className="op-action-btn op-btn-pause"
                    disabled={
                      busyAction ||
                      stage === 'Assigned' ||
                      stage === 'On The Way' ||
                      stage === 'Arrived' ||
                      stage === 'Completed'
                    }
                    onClick={() =>
                      handleTransitionJobStage(
                        stage === 'Paused' ? 'In Progress' : 'Paused'
                      )
                    }
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#5C3409',
                        color: '#FDE69E',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stage === 'Paused' ? (
                        <Play size={12} fill="#FDE69E" color="#FDE69E" />
                      ) : (
                        <Pause size={12} fill="#FDE69E" color="#FDE69E" />
                      )}
                    </span>
                    <span>{stage === 'Paused' ? 'Resume Work' : 'Pause'}</span>
                  </button>

                  {/* Button 4: Complete Job */}
                  <button
                    type="button"
                    className="op-action-btn op-btn-complete"
                    disabled={
                      busyAction ||
                      stage === 'Assigned' ||
                      stage === 'On The Way' ||
                      stage === 'Completed'
                    }
                    onClick={() => setConfirmCompleteOpen(true)}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Square size={11} fill="#FFFFFF" color="#FFFFFF" />
                    </span>
                    <span>Complete Job</span>
                  </button>
                </div>

                {/* Live Dispatch Extras: Start-OTP Verification + Share Live GPS & ETA */}
                {(stage === 'Assigned' || stage === 'On The Way' || stage === 'Arrived') && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: '#F4FAF5',
                      border: '1px solid #C8E6D0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    {stage === 'Arrived' && !currentJob.otp_verified && (
                      <form
                        onSubmit={handleVerifyStartOtp}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={startOtpInput}
                          onChange={(e) => setStartOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="4-digit Customer OTP"
                          aria-label="4-digit Customer Start OTP"
                          style={{
                            width: '150px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid #9CA3AF',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={busyAction}
                          className="dr-btn-primary"
                          style={{ padding: '8px 14px', fontSize: '13px' }}
                        >
                          Verify OTP &amp; Start Work
                        </button>
                      </form>
                    )}

                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={handleShareLiveLocation}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid #08783F',
                        background: '#FFFFFF',
                        color: '#08783F',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Navigation size={14} />
                      <span>Share Live GPS &amp; ETA</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          ) : (
            /* EMPTY STATE WHEN NO CURRENT JOB IS ASSIGNED */
            <section
              className="op-current-job-card"
              aria-label="No Active Job Assigned"
              style={{ padding: '32px 24px', textAlign: 'center' }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#111827',
                  marginBottom: '6px',
                }}
              >
                No active job assigned
              </div>
              <p style={{ margin: 0, fontSize: '14.5px', color: '#4B5563' }}>
                Select any booking from Upcoming Jobs below to load it into your
                active dispatch queue.
              </p>
            </section>
          ))}

        {/* ==================================================================
            5. FOUR DASHBOARD SUMMARY CARDS
            ================================================================== */}
        <section className="op-summary-grid" aria-label="Dashboard Summary">
          {/* Card 1: Today's Jobs */}
          <button
            type="button"
            className="op-summary-card"
            onClick={() => setTopTab('UPCOMING')}
          >
            <span className="op-summary-badge-top">
              {summaryStats.todays_jobs_count}
            </span>
            <Calendar size={28} color="#0D6837" strokeWidth={2.1} />
            <div className="op-summary-label-row">
              <span className="op-summary-title">Today&apos;s Jobs</span>
            </div>
          </button>

          {/* Card 2: My Earnings */}
          <button
            type="button"
            className="op-summary-card"
            onClick={() => setBottomNav('EARNINGS')}
          >
            <Wallet size={28} color="#0D6837" strokeWidth={2.1} />
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: 'clamp(13.5px, 1vw, 15.5px)',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                My Earnings
              </div>
              <div className="op-summary-value">
                ₹ {summaryStats.my_earnings.toLocaleString('en-IN')}
              </div>
            </div>
          </button>

          {/* Card 3: Fuel & Expenses */}
          <button
            type="button"
            className="op-summary-card"
            onClick={() => setFuelModalOpen(true)}
          >
            <Fuel size={28} color="#111827" strokeWidth={2.1} />
            <div className="op-summary-label-row">
              <span className="op-summary-title">Fuel &amp; Expenses</span>
              <ChevronRight size={20} color="#374151" />
            </div>
          </button>

          {/* Card 4: Help & Support */}
          <button
            type="button"
            className="op-summary-card"
            onClick={() => setSupportModalOpen(true)}
          >
            <Headphones size={28} color="#111827" strokeWidth={2.1} />
            <div className="op-summary-label-row">
              <span className="op-summary-title">Help &amp; Support</span>
              <ChevronRight size={20} color="#374151" />
            </div>
          </button>
        </section>

        {/* ==================================================================
            6. UPCOMING JOBS / HISTORY SECTION
            Every card displays complete Left & Right section fields from DB
            ================================================================== */}
        {!isLoading &&
          (topTab !== 'HISTORY' ? (
            <section className="op-upcoming-section" aria-label="Upcoming Jobs">
              <div className="op-section-header">
                <h2 className="op-section-title">Upcoming Jobs</h2>
                <button
                  type="button"
                  className="op-view-all-link"
                  onClick={() => setTopTab('UPCOMING')}
                >
                  <span>View All</span>
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              </div>

              {upcomingJobs.length === 0 ? (
                <div
                  style={{
                    padding: '28px 18px',
                    textAlign: 'center',
                    color: '#4B5563',
                    fontWeight: 600,
                    fontSize: '15.5px',
                  }}
                >
                  No upcoming jobs
                </div>
              ) : (
                <div className="op-upcoming-list">
                  {upcomingJobs.map((job) => {
                    const badgeText = job.status_badge_label || 'Scheduled';
                    const isScheduled =
                      badgeText.toLowerCase() === 'scheduled' ||
                      badgeText.toLowerCase() === 'assigned';
                    return (
                      <article
                        key={job.id}
                        className="op-upcoming-item"
                        onClick={() => setSelectedUpcomingJob(job)}
                      >
                        {/* LEFT SECTION: Matching Vehicle Image + Vehicle Name/Capacity, Work Category, Customer Name, Customer Location */}
                        <img
                          src={job.vehicle_image}
                          alt={job.vehicle_name}
                          className="op-upcoming-thumb"
                        />

                        <div className="op-upcoming-info-col">
                          <div className="op-upcoming-title-row">
                            <span className="op-upcoming-veh-name">
                              {job.vehicle_name}
                              {job.vehicle_capacity &&
                              !job.vehicle_name
                                .toLowerCase()
                                .includes(job.vehicle_capacity.toLowerCase())
                                ? ` (${job.vehicle_capacity})`
                                : ''}
                            </span>
                            <span className="op-work-cat-pill">
                              {job.work_category}
                            </span>
                          </div>

                          <div className="op-upcoming-meta-line">
                            <User size={15} color="#4B5563" />
                            <span>
                              Customer: <strong>{job.customer_name}</strong>
                            </span>
                          </div>

                          <div className="op-upcoming-meta-line">
                            <MapPin size={15} color="#4B5563" />
                            <span>Location: {job.customer_location}</span>
                          </div>
                        </div>

                        {/* RIGHT SECTION: Booking Date with Calendar Icon + Start & End Time with Clock Icon */}
                        <div className="op-upcoming-schedule-col">
                          <div className="op-upcoming-meta-line">
                            <Calendar size={15} color="#0D6837" />
                            <span>
                              <strong>{job.booking_date}</strong>
                            </span>
                          </div>
                          <div className="op-upcoming-meta-line">
                            <Clock size={15} color="#0D6837" />
                            <span>
                              {job.start_time} – {job.end_time}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge & Navigation Arrow */}
                        <div className="op-upcoming-right-col">
                          <span
                            className={`op-upcoming-status-badge ${
                              isScheduled ? 'scheduled' : 'upcoming'
                            }`}
                          >
                            {badgeText}
                          </span>
                          <ChevronRight size={20} color="#374151" />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            /* COMPLETED HISTORY VIEW */
            <section
              className="op-upcoming-section"
              aria-label="Completed Job History"
            >
              <div className="op-section-header">
                <h2 className="op-section-title">Completed Job History</h2>
                <button
                  type="button"
                  className="op-view-all-link"
                  onClick={() => setTopTab('MY_TASKS')}
                >
                  <span>Back to My Tasks</span>
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              </div>

              {completedJobs.length === 0 ? (
                <div
                  style={{
                    padding: '28px 18px',
                    textAlign: 'center',
                    color: '#4B5563',
                    fontWeight: 600,
                    fontSize: '15.5px',
                  }}
                >
                  No completed jobs yet. Mark an active job as Completed to view
                  it in History.
                </div>
              ) : (
                <div className="op-upcoming-list">
                  {completedJobs.map((job) => (
                    <article key={job.id} className="op-upcoming-item">
                      <img
                        src={job.vehicle_image}
                        alt={job.vehicle_name}
                        className="op-upcoming-thumb"
                      />
                      <div className="op-upcoming-info-col">
                        <div className="op-upcoming-title-row">
                          <span className="op-upcoming-veh-name">
                            {job.vehicle_name}
                          </span>
                          <span className="op-work-cat-pill">
                            {job.work_category}
                          </span>
                        </div>
                        <div className="op-upcoming-meta-line">
                          <User size={15} color="#4B5563" />
                          <span>
                            Customer: <strong>{job.customer_name}</strong>
                          </span>
                        </div>
                        <div className="op-upcoming-meta-line">
                          <MapPin size={15} color="#4B5563" />
                          <span>Location: {job.customer_location}</span>
                        </div>
                      </div>
                      <div className="op-upcoming-schedule-col">
                        <div className="op-upcoming-meta-line">
                          <Calendar size={15} color="#0D6837" />
                          <span>
                            <strong>{job.booking_date}</strong>
                          </span>
                        </div>
                        <div className="op-upcoming-meta-line">
                          <Clock size={15} color="#0D6837" />
                          <span>
                            {job.start_time} – {job.end_time}
                          </span>
                        </div>
                      </div>
                      <div className="op-upcoming-right-col">
                        <span
                          className="op-upcoming-status-badge"
                          style={{
                            backgroundColor: '#DCF4E0',
                            color: '#085E32',
                          }}
                        >
                          Completed • ₹
                          {job.total_amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}

        {/* ==================================================================
            EARNINGS OR PROFILE SUB-PANELS WHEN SELECTED IN BOTTOM NAV
            ================================================================== */}
        {bottomNav === 'EARNINGS' && (
          <section
            className="op-upcoming-section"
            aria-label="Operator Earnings Breakdown"
          >
            <div className="op-section-header">
              <h2 className="op-section-title">Operator Earnings &amp; Payouts</h2>
              <button
                type="button"
                className="op-view-all-link"
                onClick={() => setBottomNav('HOME')}
              >
                <span>Close</span>
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#166534',
                  }}
                >
                  Today&apos;s Settled Earnings
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#075B32',
                    marginTop: '4px',
                  }}
                >
                  ₹ {summaryStats.my_earnings.toLocaleString('en-IN')}
                </div>
              </div>
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: '#FEFCE8',
                  border: '1px solid #FEF08A',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#854D0E',
                  }}
                >
                  Current Active Job Value
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#713F12',
                    marginTop: '4px',
                  }}
                >
                  ₹ {(currentJob?.total_amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#9F1239',
                  }}
                >
                  Logged Fuel &amp; Expenses
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#881337',
                    marginTop: '4px',
                  }}
                >
                  ₹ {summaryStats.fuel_expenses_total.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </section>
        )}

        {bottomNav === 'PROFILE' && (
          <section className="op-upcoming-section" aria-label="Operator Profile">
            <div className="op-section-header">
              <h2 className="op-section-title">Verified Operator Profile</h2>
              <button
                type="button"
                onClick={logout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                flexWrap: 'wrap',
              }}
            >
              <img
                src={operatorProfile.avatar}
                alt={displayOperatorName}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #0D6837',
                }}
              />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>
                  {user?.full_name || 'Ramesh Kumar'}
                </div>
                <div
                  style={{
                    fontSize: '14.5px',
                    color: '#4B5563',
                    marginTop: '3px',
                  }}
                >
                  Heavy &amp; Agricultural Machinery Operator • Hub:{' '}
                  {operatorProfile.hub}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: '#DCF4E0',
                    color: '#085E32',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>
                    Licence Verified: {operatorProfile.licence_number}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ====================================================================
          7. FIXED BOTTOM NAVIGATION BAR
          ==================================================================== */}
      <nav className="op-bottom-nav" aria-label="Operator Bottom Navigation">
        <div className="op-bottom-nav-inner">
          <button
            type="button"
            className={`op-nav-btn ${bottomNav === 'HOME' ? 'active' : ''}`}
            onClick={() => {
              setBottomNav('HOME');
              setTopTab('MY_TASKS');
            }}
          >
            <Home
              size={25}
              strokeWidth={2.2}
              fill={bottomNav === 'HOME' ? '#087A3E' : 'none'}
            />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`op-nav-btn ${bottomNav === 'MY_JOBS' ? 'active' : ''}`}
            onClick={() => {
              setBottomNav('MY_JOBS');
              setTopTab('UPCOMING');
            }}
          >
            <Calendar size={25} strokeWidth={2.1} />
            <span>My Jobs</span>
          </button>

          <button
            type="button"
            className="op-nav-drive-wrap"
            onClick={() => {
              setBottomNav('DRIVE');
              setTopTab('ACTIVE_JOBS');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Drive Mode"
          >
            <div className="op-nav-drive-circle">
              <SteeringWheelIcon size={30} color="#FFFFFF" />
              <span>Drive</span>
            </div>
          </button>

          <button
            type="button"
            className={`op-nav-btn ${bottomNav === 'EARNINGS' ? 'active' : ''}`}
            onClick={() => setBottomNav('EARNINGS')}
          >
            <Wallet size={25} strokeWidth={2.1} />
            <span>Earnings</span>
          </button>

          <button
            type="button"
            className={`op-nav-btn ${bottomNav === 'PROFILE' ? 'active' : ''}`}
            onClick={() => setBottomNav('PROFILE')}
          >
            <User size={25} strokeWidth={2.1} />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* ====================================================================
          MODALS & DRAWERS
          ==================================================================== */}

      {/* 1. COMPLETE JOB CONFIRMATION DIALOG */}
      {confirmCompleteOpen && currentJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(17, 24, 39, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>
              Confirm Job Completion
            </h3>
            <p
              style={{
                margin: '0 0 18px',
                fontSize: '15px',
                color: '#4B5563',
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to mark{' '}
              <strong>{currentJob.vehicle_name}</strong> (
              {currentJob.work_category} for{' '}
              <strong>{currentJob.customer_name}</strong> at{' '}
              <strong>{currentJob.customer_location}</strong>) as{' '}
              <strong>Completed</strong>? This will record the completion
              timestamp, add{' '}
              <strong>₹{currentJob.total_amount.toLocaleString('en-IN')}</strong>{' '}
              to your earnings, and notify the customer.
            </p>
            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
            >
              <button
                type="button"
                onClick={() => setConfirmCompleteOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyAction}
                onClick={() => handleTransitionJobStage('Completed')}
                style={{
                  padding: '10px 22px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#0D6837',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {busyAction ? 'Completing...' : 'Yes, Complete Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIVE ROUTE MAPS MODAL */}
      {mapsModalOpen && currentJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(17, 24, 39, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                  Job Location &amp; Route Details
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#4B5563' }}>
                  Operator Hub: <strong>{currentJob.operator_location}</strong>{' '}
                  &rarr; Destination:{' '}
                  <strong>{currentJob.customer_location}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapsModalOpen(false)}
                style={{
                  border: 'none',
                  background: '#F3F4F6',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                marginBottom: '16px',
                fontSize: '14.5px',
                color: '#166534',
                lineHeight: 1.5,
              }}
            >
              <div>
                <strong>Vehicle:</strong> {currentJob.vehicle_name} (
                {currentJob.work_category})
              </div>
              <div>
                <strong>Customer:</strong> {currentJob.customer_name}
              </div>
              <div>
                <strong>Work Location:</strong> {currentJob.customer_location}
              </div>
              <div>
                <strong>Schedule:</strong> {currentJob.booking_date} •{' '}
                {currentJob.start_time} – {currentJob.end_time} (
                {currentJob.duration})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  currentJob.customer_location + ' Telangana'
                )}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: '12px 18px',
                  borderRadius: '999px',
                  background: '#0D6837',
                  color: '#FFFFFF',
                  fontWeight: 800,
                }}
              >
                Open in Google Maps
              </a>
              {stage === 'On The Way' && (
                <button
                  type="button"
                  onClick={() => {
                    setMapsModalOpen(false);
                    handleTransitionJobStage('Arrived');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '999px',
                    border: '1.5px solid #0D6837',
                    background: '#DCF3DE',
                    color: '#074E28',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Mark &quot;I&apos;ve Reached&quot;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FUEL & EXPENSES MODAL */}
      {fuelModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(17, 24, 39, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                Fuel &amp; Field Expenses
              </h3>
              <button
                type="button"
                onClick={() => setFuelModalOpen(false)}
                style={{
                  border: 'none',
                  background: '#F3F4F6',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddFuelExpense}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <input
                type="text"
                placeholder="Expense type (e.g. Diesel)"
                value={fuelTitle}
                onChange={(e) => setFuelTitle(e.target.value)}
                style={{
                  gridColumn: '1 / -1',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14.5px',
                }}
              />
              <input
                type="number"
                step="0.1"
                placeholder="Liters (optional)"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14.5px',
                }}
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={fuelAmount}
                onChange={(e) => setFuelAmount(e.target.value)}
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14.5px',
                }}
              />
              <button
                type="submit"
                style={{
                  gridColumn: '1 / -1',
                  padding: '11px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#0D6837',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={17} />
                <span>Log Expense</span>
              </button>
            </form>

            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {fuelLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14.5px' }}>
                      {log.title} ({log.liters})
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
                      {log.vehicle} • {log.date}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#B91C1C' }}>
                    ₹ {log.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. HELP & SUPPORT MODAL */}
      {supportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(17, 24, 39, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                24/7 Operator Dispatch Support
              </h3>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                style={{
                  border: 'none',
                  background: '#F3F4F6',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '14.5px', color: '#4B5563', lineHeight: 1.5 }}>
              Need field assistance, breakdown support, or customer coordination
              for <strong>{currentJob?.vehicle_name || 'your vehicle'}</strong>?
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '14px',
              }}
            >
              {currentJob && (
                <a
                  href={`tel:${currentJob.customer_phone}`}
                  style={{
                    textDecoration: 'none',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: '#F0FDF4',
                    color: '#074E28',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Call Customer ({currentJob.customer_name})</span>
                  <Phone size={18} />
                </a>
              )}
              <a
                href="tel:18001208899"
                style={{
                  textDecoration: 'none',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: '#EFF6FF',
                  color: '#1E3A8A',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Desi Ride Gadwal Control Room (1800-120-8899)</span>
                <Headphones size={18} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. UPCOMING JOB DETAIL & LOAD INTO CURRENT JOB MODAL */}
      {selectedUpcomingJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(17, 24, 39, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={selectedUpcomingJob.vehicle_image}
                  alt={selectedUpcomingJob.vehicle_name}
                  style={{
                    width: '64px',
                    height: '48px',
                    objectFit: 'contain',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    padding: '3px',
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800 }}>
                    {selectedUpcomingJob.vehicle_name}
                  </h3>
                  <span className="op-work-cat-pill">
                    {selectedUpcomingJob.work_category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUpcomingJob(null)}
                style={{
                  border: 'none',
                  background: '#F3F4F6',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px 16px',
                borderRadius: '16px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                marginBottom: '18px',
                fontSize: '14.5px',
                color: '#1F2937',
              }}
            >
              <div>
                <strong>Booking ID:</strong> #
                {selectedUpcomingJob.booking_reference}
              </div>
              <div>
                <strong>Customer:</strong> {selectedUpcomingJob.customer_name}
              </div>
              <div>
                <strong>Location:</strong>{' '}
                {selectedUpcomingJob.customer_location}
              </div>
              <div>
                <strong>Date:</strong> {selectedUpcomingJob.booking_date}
              </div>
              <div>
                <strong>Time:</strong> {selectedUpcomingJob.start_time} –{' '}
                {selectedUpcomingJob.end_time} ({selectedUpcomingJob.duration})
              </div>
              <div>
                <strong>Status:</strong> {selectedUpcomingJob.status_badge_label}
              </div>
              <div>
                <strong>Estimated Payout:</strong>{' '}
                {selectedUpcomingJob.price_estimate}
              </div>
            </div>

            <div
              style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}
            >
              <button
                type="button"
                onClick={() => setSelectedUpcomingJob(null)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={busyAction}
                onClick={() => handleActivateUpcomingJob(selectedUpcomingJob)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#0D6837',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {busyAction ? 'Loading...' : 'Load as Current Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SIDEBAR DRAWER MENU */}
      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 210,
            background: 'rgba(17, 24, 39, 0.48)',
            display: 'flex',
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            style={{
              width: '300px',
              maxWidth: '84vw',
              height: '100%',
              background: '#FFFFFF',
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ marginBottom: '12px' }}>
                <img
                  src={logoImg}
                  alt="Desi Ride"
                  style={{
                    height: '42px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <img
                    src={operatorProfile.avatar}
                    alt={displayOperatorName}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>
                      {displayOperatorName}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#4B5563' }}>
                      Desi Ride Verified Operator
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    border: 'none',
                    background: '#F3F4F6',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={17} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '16px',
                }}
              >
                {[
                  {
                    label: 'My Tasks & Current Job',
                    tab: 'MY_TASKS' as TopFilterTab,
                  },
                  { label: 'Active Jobs', tab: 'ACTIVE_JOBS' as TopFilterTab },
                  {
                    label: 'Upcoming Schedule',
                    tab: 'UPCOMING' as TopFilterTab,
                  },
                  {
                    label: 'Completed History',
                    tab: 'HISTORY' as TopFilterTab,
                  },
                ].map((item) => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => {
                      setTopTab(item.tab);
                      setDrawerOpen(false);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background:
                        topTab === item.tab ? '#DCF4E0' : 'transparent',
                      color: topTab === item.tab ? '#074E28' : '#111827',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#B91C1C',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <LogOut size={18} />
              <span>Logout Operator</span>
            </button>
          </aside>
        </div>
      )}

      {/* 7. NOTIFICATIONS POPOVER */}
      {notificationsOpen && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            right: 'clamp(16px, 3vw, 44px)',
            zIndex: 190,
            width: '340px',
            maxWidth: 'calc(100vw - 32px)',
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 16px 38px rgba(17, 24, 39, 0.14)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <strong style={{ fontSize: '15.5px' }}>
              Dispatch Notifications
            </strong>
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#6B7280',
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div
            style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.45 }}
          >
            {currentJob && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#F0FDF4',
                  marginBottom: '8px',
                }}
              >
                <strong>Current Job Synced:</strong> {currentJob.vehicle_name}{' '}
                for {currentJob.customer_name} at {currentJob.customer_location}{' '}
                is currently <strong>{stage}</strong>.
              </div>
            )}
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: '#F9FAFB',
              }}
            >
              <strong>Upcoming Queue:</strong> {upcomingJobs.length} scheduled
              booking(s) assigned to your hub.
            </div>
          </div>
        </div>
      )}

      {/* LIVE TOAST FEEDBACK */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '92px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 250,
            background: '#074E28',
            color: '#FFFFFF',
            padding: '12px 22px',
            borderRadius: '999px',
            fontSize: '14.5px',
            fontWeight: 700,
            boxShadow: '0 10px 28px rgba(7, 78, 40, 0.35)',
            maxWidth: '92vw',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default OperatorDashboard;
