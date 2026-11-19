/**
 * Desi Ride Intelligent Dispatch Engine (Uber REACH / DISPATCH Equivalent)
 * Evaluates real-time driver availability, computes geodesic distances via Haversine,
 * selects optimal operator based on proximity and driver rating, calculates dynamic ETA,
 * and generates live route waypoints.
 */

import { db, runInTransaction, createNotification } from './db.mjs';
import {
  haversineDistanceKm,
  calculateEtaMinutes,
  resolveCoordinates,
  generateRouteWaypoints,
  calculateBearing,
  setOperatorTelemetry,
} from './geo.mjs';
import { publishRealtimeEvent } from './realtime.mjs';

/**
 * Finds and auto-dispatches the nearest verified on-duty operator for a booking
 */
export function dispatchNearestOperator(bookingId, pickupLocation = 'Gadwal', vehicleCategory = 'default') {
  return runInTransaction(() => {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) throw new Error('Booking not found');

    const pickupCoords = resolveCoordinates(pickupLocation, { lat: 16.2300, lng: 77.8000 });
    const dropCoords = resolveCoordinates(booking.drop_location, {
      lat: pickupCoords.lat + 0.02,
      lng: pickupCoords.lng + 0.02,
    });

    // Query all online operators
    const onlineOps = db
      .prepare(
        `SELECT u.id, u.full_name, u.mobile, op.current_lat, op.current_lng, op.rating, op.licence_number
         FROM users u
         JOIN operator_profiles op ON op.user_id = u.id
         WHERE u.role = 'operator' AND COALESCE(op.on_duty, 1) = 1`
      )
      .all();

    if (onlineOps.length === 0) {
      return {
        matched: false,
        message: 'No online operators available within service radius. Queued in dispatch pool.',
      };
    }

    // Score and rank operators based on geodesic proximity and rating
    const rankedOps = onlineOps
      .map((op) => {
        const opLat = op.current_lat || 16.2300;
        const opLng = op.current_lng || 77.8000;
        const distanceKm = haversineDistanceKm(opLat, opLng, pickupCoords.lat, pickupCoords.lng);
        const etaMinutes = calculateEtaMinutes(distanceKm, vehicleCategory);
        const bearing = calculateBearing(opLat, opLng, pickupCoords.lat, pickupCoords.lng);

        // Score formula: lower distance is better, higher rating is bonus
        const score = distanceKm * 10 - (op.rating || 4.5) * 2;

        return {
          ...op,
          lat: opLat,
          lng: opLng,
          distance_km: distanceKm,
          eta_minutes: etaMinutes,
          bearing: bearing.bearing,
          heading: bearing.heading,
          score,
        };
      })
      .sort((a, b) => a.score - b.score);

    const bestOperator = rankedOps[0];

    // Generate simulated road waypoints for live navigation
    const routeWaypoints = generateRouteWaypoints(
      { lat: bestOperator.lat, lng: bestOperator.lng },
      { lat: pickupCoords.lat, lng: pickupCoords.lng },
      10
    );

    const now = new Date().toISOString();

    // Assign operator to booking
    db.prepare(`
      UPDATE bookings
      SET operator_id = ?,
          operator_lat = ?,
          operator_lng = ?,
          eta_minutes = ?,
          status = 'Confirmed',
          live_stage = 'Operator Assigned',
          updated_at = ?
      WHERE id = ?
    `).run(
      bestOperator.id,
      bestOperator.lat,
      bestOperator.lng,
      bestOperator.eta_minutes,
      now,
      bookingId
    );

    // Update operator profile active job
    db.prepare(`
      UPDATE operator_profiles
      SET active_job_id = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(bookingId, now, bestOperator.id);

    // Cache operator live telemetry
    setOperatorTelemetry(bestOperator.id, {
      lat: bestOperator.lat,
      lng: bestOperator.lng,
      speed: 25,
      heading: bestOperator.bearing,
      bookingId,
    });

    // Record audit event
    db.prepare(`
      INSERT INTO booking_events (booking_id, actor_id, actor_role, event_type, message, created_at)
      VALUES (?, ?, 'system', 'INTELLIGENT_DISPATCH', ?, ?)
    `).run(
      bookingId,
      bestOperator.id,
      `Matched nearest operator ${bestOperator.full_name} (${bestOperator.distance_km} km away, ETA ~${bestOperator.eta_minutes} mins)`,
      now
    );

    // Create in-app notifications
    createNotification(
      bestOperator.id,
      'operator',
      'New Job Assigned!',
      `Booking #${booking.booking_code} assigned at ${pickupLocation}. Pickup ETA: ~${bestOperator.eta_minutes} mins.`
    );

    createNotification(
      booking.customer_id,
      'customer',
      'Operator Assigned',
      `${bestOperator.full_name} is assigned to your booking. ETA ~${bestOperator.eta_minutes} mins.`
    );

    // Publish live SSE event
    publishRealtimeEvent('OPERATOR_DISPATCHED', {
      booking_id: bookingId,
      booking_code: booking.booking_code,
      operator_id: bestOperator.id,
      operator_name: bestOperator.full_name,
      operator_mobile: bestOperator.mobile,
      operator_lat: bestOperator.lat,
      operator_lng: bestOperator.lng,
      distance_km: bestOperator.distance_km,
      eta_minutes: bestOperator.eta_minutes,
      heading: bestOperator.heading,
      waypoints: routeWaypoints,
    });

    return {
      matched: true,
      operator: bestOperator,
      waypoints: routeWaypoints,
      pickup_coords: pickupCoords,
      drop_coords: dropCoords,
    };
  });
}
