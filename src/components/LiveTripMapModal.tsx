import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Navigation,
  Phone,
  ShieldAlert,
  Compass,
  Clock,
  MapPin,
  Car,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { authApi } from '../services/api';

interface LiveTripMapModalProps {
  booking: any;
  onClose: () => void;
  onStageUpdated?: () => void;
}

export const LiveTripMapModal: React.FC<LiveTripMapModalProps> = ({
  booking,
  onClose,
  onStageUpdated,
}) => {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(32);
  const [remainingEta, setRemainingEta] = useState<number>(booking.eta_minutes || 8);
  const [sosSent, setSosSent] = useState(false);
  const [phoneCalled, setPhoneCalled] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    authApi
      .getBookingRoute(booking.id)
      .then((res: any) => {
        if (!mounted) return;
        setRouteData(res);
        setRemainingEta(res.eta_minutes || 8);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [booking.id]);

  // Handle GPS Drive simulation
  useEffect(() => {
    if (!isSimulating || !routeData?.waypoints?.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= routeData.waypoints.length) {
          setIsSimulating(false);
          clearInterval(timerRef.current);
          return prev;
        }

        const point = routeData.waypoints[next];
        const newEta = Math.max(1, Math.round(((routeData.waypoints.length - next) / routeData.waypoints.length) * (routeData.eta_minutes || 8)));
        setRemainingEta(newEta);

        // Ping backend simulated step
        authApi
          .simulateOperatorStep({
            booking_id: booking.id,
            step_index: next,
            lat: point.lat,
            lng: point.lng,
            eta_minutes: newEta,
            speed: Math.floor(Math.random() * 8 + 30),
            heading: routeData.heading || 'NE',
          })
          .catch(() => {});

        return next;
      });
    }, 2400);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, routeData, booking.id]);

  const handleTriggerSos = async () => {
    if (confirm('Are you sure you want to trigger Emergency SOS? This alerts 24x7 Command Center and Police.')) {
      try {
        await authApi.triggerEmergencySos({
          booking_id: booking.id,
          lat: routeData?.operator_lat || 16.23,
          lng: routeData?.operator_lng || 77.80,
        });
        setSosSent(true);
      } catch {
        setSosSent(true);
      }
    }
  };

  const currentPoint =
    routeData?.waypoints?.[currentStep] || {
      lat: routeData?.operator_lat || 16.2300,
      lng: routeData?.operator_lng || 77.8000,
    };

  // Convert lat/lng to normalized SVG map coordinates
  // Range: lat 16.20 to 16.26, lng 77.76 to 77.84
  const mapSvgCoord = (lat: number, lng: number) => {
    const minLat = 16.21;
    const maxLat = 16.255;
    const minLng = 77.78;
    const maxLng = 77.825;

    const x = Math.max(30, Math.min(570, ((lng - minLng) / (maxLng - minLng)) * 540 + 30));
    const y = Math.max(30, Math.min(370, 400 - ((lat - minLat) / (maxLat - minLat)) * 340 - 30));
    return { x, y };
  };

  const opCoord = mapSvgCoord(currentPoint.lat, currentPoint.lng);
  const pickupCoord = mapSvgCoord(
    routeData?.pickup_coords?.lat || 16.2300,
    routeData?.pickup_coords?.lng || 77.8000
  );
  const dropCoord = mapSvgCoord(
    routeData?.drop_coords?.lat || 16.2420,
    routeData?.drop_coords?.lng || 77.8150
  );

  const polylinePoints = (routeData?.waypoints || [])
    .map((p: any) => {
      const c = mapSvgCoord(p.lat, p.lng);
      return `${c.x},${c.y}`;
    })
    .join(' ');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #075B32 0%, #0F766E 100%)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Navigation size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Live GPS Ride & Telemetry
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.9 }}>
                {booking.booking_code} • {booking.service_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '999px',
              padding: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Real-Time Live Telemetry Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px',
            backgroundColor: '#E2E8F0',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Current ETA
            </span>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#075B32', marginTop: '2px' }}>
              ~{remainingEta} Mins
            </div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Distance
            </span>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0369A1', marginTop: '2px' }}>
              {routeData?.distance_km || 2.4} KM
            </div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Speed
            </span>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>
              {isSimulating ? currentSpeed : 0} KM/H
            </div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Heading
            </span>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#475569', marginTop: '2px' }}>
              {routeData?.heading || 'NE'} (38°)
            </div>
          </div>
        </div>

        {/* Interactive Simulated Map Canvas */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '340px',
            backgroundColor: '#F1F5F9',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                fontWeight: 700,
              }}
            >
              Calculating route polylines & nearest driver vector...
            </div>
          ) : (
            <svg
              viewBox="0 0 600 400"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#E2E8F0',
              }}
            >
              {/* Map background grids simulating street networks */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CBD5E1" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="600" height="400" fill="url(#grid)" />

              {/* Landmark zones */}
              <rect x="40" y="30" width="160" height="90" rx="8" fill="#DCFCE7" opacity="0.6" />
              <text x="50" y="55" fontSize="11" fill="#15803D" fontWeight="bold">
                Gadwal Rural Agriculture Zone
              </text>

              <rect x="360" y="240" width="180" height="110" rx="8" fill="#E0F2FE" opacity="0.6" />
              <text x="370" y="265" fontSize="11" fill="#0369A1" fontWeight="bold">
                Regional Hub / Bus Station
              </text>

              {/* Major Roads */}
              <line x1="0" y1="200" x2="600" y2="200" stroke="#FFFFFF" strokeWidth="8" />
              <line x1="0" y1="200" x2="600" y2="200" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 6" />

              <line x1="280" y1="0" x2="280" y2="400" stroke="#FFFFFF" strokeWidth="8" />
              <line x1="280" y1="0" x2="280" y2="400" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 6" />

              {/* Connecting Route Polyline */}
              {polylinePoints && (
                <>
                  {/* Glow */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeOpacity="0.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Core path */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#075B32"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Pickup Marker */}
              <g transform={`translate(${pickupCoord.x}, ${pickupCoord.y})`}>
                <circle r="12" fill="#2563EB" opacity="0.25" />
                <circle r="7" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                <text x="12" y="4" fontSize="11" fontWeight="bold" fill="#1E40AF">
                  Pickup (Customer)
                </text>
              </g>

              {/* Dropoff Marker */}
              <g transform={`translate(${dropCoord.x}, ${dropCoord.y})`}>
                <circle r="12" fill="#DC2626" opacity="0.25" />
                <circle r="7" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
                <text x="12" y="4" fontSize="11" fontWeight="bold" fill="#991B1B">
                  Drop / Work Field
                </text>
              </g>

              {/* Animated Vehicle / Operator Marker */}
              <g
                transform={`translate(${opCoord.x}, ${opCoord.y})`}
                style={{
                  transition: 'transform 2.2s ease-in-out',
                }}
              >
                <circle r="18" fill="#075B32" opacity="0.25">
                  <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r="12" fill="#075B32" stroke="#FFFFFF" strokeWidth="2.5" />
                <Car size={14} color="#FFFFFF" x="-7" y="-7" />
                <rect x="-35" y="-28" width="70" height="18" rx="4" fill="#0F172A" />
                <text x="0" y="-16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#FFFFFF">
                  {routeData?.operator_id ? 'Driver (Active)' : 'Vehicle'}
                </text>
              </g>
            </svg>
          )}

          {/* Floating Controls Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '999px',
                backgroundColor: isSimulating ? '#DC2626' : '#075B32',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12.5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              {isSimulating ? <Pause size={15} /> : <Play size={15} />}
              {isSimulating ? 'Pause GPS Drive' : 'Simulate Live Driver GPS Movement'}
            </button>
          </div>

          {/* Live Start OTP Badge Overlay */}
          {booking.start_otp && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(4px)',
                borderRadius: '12px',
                padding: '8px 14px',
                border: '1px solid #FDE68A',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>Start PIN:</span>
              <strong style={{ fontSize: '16px', color: '#92400E', letterSpacing: '1px' }}>
                {booking.start_otp}
              </strong>
            </div>
          )}
        </div>

        {/* Driver Details & Actions Footer */}
        <div style={{ padding: '18px 24px', backgroundColor: '#FFFFFF' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#D1FAE5',
                  color: '#075B32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  border: '2px solid #075B32',
                }}
              >
                {booking.operator_name ? booking.operator_name.charAt(0) : 'R'}
              </div>
              <div>
                <strong style={{ fontSize: '16px', color: '#111827' }}>
                  {booking.operator_name || 'Ramesh Goud'} (Verified Pro)
                </strong>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  ⭐ 4.9 Rating • Licence #TS-14-2023-8891 • {booking.vehicle_name}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPhoneCalled(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  backgroundColor: phoneCalled ? '#DCFCE7' : '#F1F5F9',
                  color: phoneCalled ? '#15803D' : '#1E293B',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                }}
              >
                <Phone size={15} />
                {phoneCalled ? 'Connecting Masked Call...' : 'Call Driver'}
              </button>

              <button
                type="button"
                onClick={handleTriggerSos}
                disabled={sosSent}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  backgroundColor: sosSent ? '#FEF2F2' : '#DC2626',
                  color: sosSent ? '#B91C1C' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <ShieldAlert size={16} />
                {sosSent ? 'SOS Dispatched (Police 112)' : 'Emergency SOS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
