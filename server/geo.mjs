/**
 * Desi Ride Geospatial & High-Precision Telemetry Engine
 * Provides Haversine distance, bearing calculations, dynamic ETAs,
 * turn-by-turn route waypoint generation, and high-throughput in-memory GPS cache.
 */

// Radius of Earth in kilometers
const EARTH_RADIUS_KM = 6371.0;

// Category speed profile in km/h under Indian semi-urban and rural road conditions
export const SPEED_PROFILES = {
  'Rapido Bike': 36,
  'Bike Taxi': 36,
  'Auto Rickshaw': 28,
  'Passenger Cars': 42,
  'Car': 42,
  'Commercial Trucks': 26,
  'Truck': 26,
  'Agricultural Vehicles': 20,
  'Tractor': 20,
  'Earth Movers': 14,
  'JCB': 14,
  'Harvester': 12,
  'default': 25,
};

// Known coordinates for regional hubs (Telangana / AP region)
export const REGIONAL_COORDINATES = {
  'gadwal': { lat: 16.2300, lng: 77.8000, name: 'Gadwal' },
  'kurnool': { lat: 15.8281, lng: 78.0373, name: 'Kurnool' },
  'raichur': { lat: 16.2076, lng: 77.3463, name: 'Raichur' },
  'mahabubnagar': { lat: 16.7488, lng: 77.9864, name: 'Mahabubnagar' },
  'wanaparthy': { lat: 16.3624, lng: 78.0628, name: 'Wanaparthy' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
  'alampur': { lat: 15.8837, lng: 78.1333, name: 'Alampur' },
  'itikyala': { lat: 16.0500, lng: 77.8500, name: 'Itikyala' },
  'dharur': { lat: 16.2800, lng: 77.7200, name: 'Dharur' },
  'maldakal': { lat: 16.1400, lng: 77.7000, name: 'Maldakal' },
};

export function resolveCoordinates(locationName, fallback = { lat: 16.2300, lng: 77.8000 }) {
  if (!locationName || typeof locationName !== 'string') return fallback;
  const clean = locationName.toLowerCase();
  for (const [key, coords] of Object.entries(REGIONAL_COORDINATES)) {
    if (clean.includes(key)) {
      return { lat: coords.lat, lng: coords.lng, name: coords.name };
    }
  }
  // Perturb slightly around Gadwal base for realistic variance
  const hash = Array.from(clean).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((hash % 100) - 50) * 0.0006;
  const lngOffset = (((hash * 13) % 100) - 50) * 0.0006;
  return {
    lat: Number((fallback.lat + latOffset).toFixed(4)),
    lng: Number((fallback.lng + lngOffset).toFixed(4)),
    name: locationName,
  };
}

/**
 * Calculates spherical distance between two points in kilometers using Haversine formula
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Calculates initial bearing compass angle in degrees (0 - 360) and cardinal direction
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const toDeg = (angle) => (angle * 180) / Math.PI;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));

  let bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  bearing = Math.round(bearing);

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dirIdx = Math.round(bearing / 45) % 8;

  return { bearing, heading: directions[dirIdx] };
}

/**
 * Computes estimated time of arrival (ETA) in minutes based on distance and category speed
 */
export function calculateEtaMinutes(distanceKm, category = 'default') {
  const speed = SPEED_PROFILES[category] || SPEED_PROFILES['default'];
  const rawMinutes = (distanceKm / speed) * 60;
  // Minimum 3 minutes dispatch/buffer time, rounded
  return Math.max(3, Math.round(rawMinutes));
}

/**
 * Generates realistic animated route polyline waypoints connecting
 * Operator -> Pickup -> Destination with natural curves
 */
export function generateRouteWaypoints(origin, destination, stepsCount = 12) {
  const waypoints = [];
  const startLat = origin.lat;
  const startLng = origin.lng;
  const endLat = destination.lat;
  const endLng = destination.lng;

  for (let i = 0; i <= stepsCount; i++) {
    const t = i / stepsCount;
    // Linear base
    let lat = startLat + (endLat - startLat) * t;
    let lng = startLng + (endLng - startLng) * t;

    // Add gentle sinusoidal curve for road bend simulation
    if (i > 0 && i < stepsCount) {
      const bend = Math.sin(t * Math.PI) * 0.0035;
      lat += bend * 0.6;
      lng += bend * 0.8;
    }

    waypoints.push({
      step: i,
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      progress: Math.round(t * 100),
    });
  }

  return waypoints;
}

// =========================================================================
// High-Speed In-Memory Telemetry Cache (Redis-ready architecture)
// Stores live operator locations with sub-millisecond O(1) lookups
// =========================================================================
const operatorTelemetryCache = new Map();

export function setOperatorTelemetry(operatorId, { lat, lng, speed = 0, heading = 0, bookingId = null }) {
  operatorTelemetryCache.set(Number(operatorId), {
    lat: Number(lat),
    lng: Number(lng),
    speed: Number(speed),
    heading: Number(heading),
    bookingId: bookingId ? Number(bookingId) : null,
    timestamp: Date.now(),
  });
}

export function getOperatorTelemetry(operatorId) {
  return operatorTelemetryCache.get(Number(operatorId)) || null;
}

export function getAllActiveTelemetry() {
  const result = [];
  for (const [operatorId, data] of operatorTelemetryCache.entries()) {
    result.push({ operator_id: operatorId, ...data });
  }
  return result;
}
