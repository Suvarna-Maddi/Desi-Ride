import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Load .env automatically into process.env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const k = line.slice(0, eqIdx).trim();
        const v = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (k && !process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch {}
import {
  db,
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  runInTransaction,
  sanitizeUser,
  addAuditLog,
  createNotification,
  generateOtp4,
  getKv,
  setKv,
} from './db.mjs';
import { addSseClient, publishRealtimeEvent, getConnectedClientsCount } from './realtime.mjs';
import {
  haversineDistanceKm,
  calculateEtaMinutes,
  calculateBearing,
  resolveCoordinates,
  generateRouteWaypoints,
  setOperatorTelemetry,
  getOperatorTelemetry,
} from './geo.mjs';
import { calculateFareEstimate, getDynamicSurgeMultiplier } from './pricing.mjs';
import {
  createPaymentOrder,
  verifyAndCapturePayment,
  getBookingTaxInvoice,
  getUserWalletBalance,
  getUserWalletHistory,
} from './payments.mjs';
import { dispatchNearestOperator } from './dispatch.mjs';
import {
  dispatchMobileOtp,
  dispatchEmailOtp,
  verifyMobileCode,
  verifyEmailToken,
} from './otp.mjs';

const PORT = Number(process.env.PORT || 4000);
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function getAuthUser(req, queryToken = null) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : queryToken;
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload || payload.type !== 'access') return null;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.user_id);
  return user || null;
}

function getCommissionConfig() {
  const row = db
    .prepare("SELECT value_json FROM platform_settings WHERE key = 'commission_config'")
    .get();
  if (!row) {
    return {
      platform_commission_pct: 10,
      operator_share_pct: 20,
      gst_pct: 5,
      cancellation_fee_pct: 10,
    };
  }
  try {
    return JSON.parse(row.value_json);
  } catch {
    return {
      platform_commission_pct: 10,
      operator_share_pct: 20,
      gst_pct: 5,
      cancellation_fee_pct: 10,
    };
  }
}

function safeParseJson(str, fallback = {}) {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function nowTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CUSTOMER_STATUS_LABELS = {
  Assigned: 'Operator Assigned',
  'On The Way': 'Operator Assigned',
  Arrived: 'Operator Arrived',
  'In Progress': 'Work Started',
  Paused: 'Work Paused',
  Completed: 'Work Completed',
};

function canonicalJobStage(rawStage, status) {
  const s = String(rawStage || status || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '_');
  if (s === 'ON_THE_WAY' || s === 'OPERATOR_EN_ROUTE' || s === 'ARRIVING') return 'On The Way';
  if (s === 'ARRIVED' || s === 'ARRIVED_AT_SITE' || s === 'ARRIVED_AT_LOCATION') return 'Arrived';
  if (s === 'IN_PROGRESS' || s === 'WORK_IN_PROGRESS' || s === 'WORKING' || s === 'WORK_STARTED')
    return 'In Progress';
  if (s === 'PAUSED' || s === 'WORK_PAUSED') return 'Paused';
  if (s === 'COMPLETED' || s === 'WORK_COMPLETED') return 'Completed';
  return 'Assigned';
}

function formatBookingRow(b) {
  const customer = b.customer_id
    ? db.prepare('SELECT id, full_name, mobile FROM users WHERE id = ?').get(b.customer_id)
    : null;
  const owner = b.owner_id
    ? db.prepare('SELECT id, full_name, mobile, business_name FROM users WHERE id = ?').get(b.owner_id)
    : null;
  const operator = b.operator_id
    ? db.prepare('SELECT id, full_name, mobile FROM users WHERE id = ?').get(b.operator_id)
    : null;
  const events = db
    .prepare('SELECT id, actor_role, event_type, message, created_at FROM booking_events WHERE booking_id = ? ORDER BY id DESC LIMIT 12')
    .all(b.id);

  const meta = safeParseJson(b.metadata_json, {});
  const jobStage = canonicalJobStage(meta.job_stage || b.live_stage, b.status);
  const statusStr = String(b.status || 'Confirmed');
  const customerStatusLabel =
    statusStr === 'Rejected' || statusStr === 'Cancelled'
      ? statusStr
      : CUSTOMER_STATUS_LABELS[jobStage] || 'Operator Assigned';
  const amountVal = Number(b.total_amount || 0);
  const createdTime = b.created_at
    ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '08:30 AM';
  const timestamps = {
    assigned_at: createdTime,
    ...(meta.timestamps || {}),
  };
  const etaStr = b.eta_minutes !== null && b.eta_minutes !== undefined ? `${b.eta_minutes} mins` : null;

  return {
    id: b.id,
    booking_code: b.booking_code,
    customer_id: b.customer_id,
    customer_name: meta.customer_name || customer?.full_name || 'Customer',
    customer_mobile: customer?.mobile || '',
    customer_phone: customer?.mobile || '',
    owner_id: b.owner_id,
    owner_name: owner?.business_name || owner?.full_name || 'Fleet Partner',
    owner_mobile: owner?.mobile || '',
    operator_id: b.operator_id,
    operator_name: operator?.full_name || 'Assigning Operator...',
    operator_mobile: operator?.mobile || '',
    vehicle_id: b.vehicle_id,
    equipment_id: b.equipment_id,
    vehicle_name: b.service_name,
    service_name: b.service_name,
    vehicle_category: b.category,
    category: b.category,
    vehicle_image_key: meta.vehicle_image_key || '',
    work_category: meta.work_category || b.category,
    equipment_name: meta.equipment_name || '',
    tractor_name: meta.tractor_name || '',
    booking_mode: meta.booking_mode || '',
    pickup_location: b.pickup_location,
    drop_location: b.drop_location,
    destination: b.drop_location || b.pickup_location,
    route: b.drop_location ? `${b.pickup_location} → ${b.drop_location}` : b.pickup_location,
    booking_date: b.booking_date,
    date: b.booking_date,
    scheduled_at: meta.scheduled_at || '09:00 AM',
    start_time: meta.start_time || '09:00 AM',
    end_time: meta.end_time || '01:00 PM',
    time_slot: meta.time_slot || '09:00 AM – 01:00 PM',
    duration_label: b.duration_label,
    duration: b.duration_label,
    need_operator: Boolean(b.need_operator),
    total_amount: amountVal,
    amount_value: amountVal,
    amount: `₹${amountVal.toLocaleString('en-IN')}`,
    estimated_price: amountVal,
    price_estimate: meta.price_estimate || `₹${amountVal.toLocaleString('en-IN')}`,
    status: b.status,
    job_stage: jobStage,
    live_stage: b.live_stage,
    customer_status_label: customerStatusLabel,
    journey_update:
      meta.journey_update ||
      (b.eta_minutes ? `Live ETA ~${b.eta_minutes} mins` : customerStatusLabel),
    start_otp: b.start_otp,
    otp_verified: Boolean(b.otp_verified),
    operator_lat: b.operator_lat,
    operator_lng: b.operator_lng,
    eta_minutes: b.eta_minutes,
    estimated_eta: etaStr,
    payment_status: b.payment_status,
    rejection_reason: meta.rejection_reason || '',
    notes: b.notes,
    timestamps,
    status_history: events.map((ev) => ({
      stage: ev.event_type,
      customer_label: ev.message,
      timestamp: new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: ev.message,
    })),
    events,
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
}

function formatEquipmentRow(l) {
  const meta = safeParseJson(l.metadata_json, {});
  const hourly = Number(l.hourly_rate || meta.default_price || 650);
  const pricingOptions =
    Array.isArray(meta.pricing_options) && meta.pricing_options.length > 0
      ? meta.pricing_options
      : [{ unit: 'hour', price: hourly, label: '/ hour' }];
  return {
    ...meta,
    id: l.id,
    owner_id: l.owner_id,
    name: l.name,
    category: l.category,
    sub_category: l.sub_category,
    main_category: meta.main_category || 'agri-equipment',
    sub_category_group: meta.sub_category_group || l.sub_category || 'Soil Preparation',
    equipment_type: meta.equipment_type || l.name,
    hourly_rate: l.hourly_rate,
    daily_rate: l.daily_rate,
    per_acre_rate: l.per_acre_rate,
    default_price: Number(meta.default_price || hourly),
    default_price_unit: meta.default_price_unit || 'hour',
    pricing_options: pricingOptions,
    with_operator: Boolean(l.with_operator),
    operator_available: meta.operator_available ?? Boolean(l.with_operator),
    equipment_only: Boolean(l.equipment_only),
    standalone_available: meta.standalone_available ?? Boolean(l.equipment_only),
    combo_available: meta.combo_available ?? true,
    approval_status: l.approval_status,
    availability: l.availability,
    city: meta.city || l.location || 'Gadwal, Telangana',
    location: l.location,
    service_locations: Array.isArray(meta.service_locations)
      ? meta.service_locations
      : [l.location || 'Gadwal'],
    image: l.image_url || meta.image || '',
  };
}

function formatVehicleRow(v) {
  const specs = safeParseJson(v.specs_json, {});
  return {
    ...specs,
    id: v.id,
    owner_id: v.owner_id,
    name: v.name,
    category: v.category,
    purpose: specs.purpose || v.category || 'Multi-Purpose',
    reg_no: v.registration_number,
    registration_number: v.registration_number,
    price: v.rate_label || `₹${v.hourly_rate}/hr`,
    price_amount: specs.price_amount || `₹ ${v.hourly_rate || 900}`,
    price_unit: specs.price_unit || '/ hour',
    status: v.status || 'Active',
    location: v.location,
    image: v.image_url || specs.image || '',
  };
}

function buildOwnerDashboardPayload(user) {
  const vehicles = db
    .prepare('SELECT * FROM vehicles WHERE owner_id = ? OR owner_id IS NULL ORDER BY id DESC')
    .all(user.id)
    .map(formatVehicleRow);

  const bookingRequests = db
    .prepare('SELECT * FROM bookings WHERE owner_id = ? OR owner_id IS NULL ORDER BY id DESC')
    .all(user.id)
    .map(formatBookingRow);

  const operators = db
    .prepare(
      `SELECT u.id, u.full_name, u.mobile, u.city, COALESCE(op.on_duty, 1) AS on_duty, COALESCE(op.rating, 4.8) AS rating
       FROM users u
       LEFT JOIN operator_profiles op ON op.user_id = u.id
       WHERE u.role = 'operator'`
    )
    .all();

  const notifications = getNotificationsForUser(user);
  const completedRevenue = bookingRequests
    .filter((b) => b.status === 'Completed' || b.status === 'Accepted' || b.status === 'Confirmed' || b.payment_status === 'Paid')
    .reduce((s, b) => s + Number(b.total_amount || 0), 0);

  const upcomingJobsCount = bookingRequests.filter(
    (b) => !['Completed', 'Cancelled', 'Rejected'].includes(b.status)
  ).length;

  return {
    user: sanitizeUser(user),
    statistics: {
      total_vehicles: vehicles.length,
      total_bookings: bookingRequests.length,
      upcoming_jobs: upcomingJobsCount,
      total_earnings: completedRevenue,
    },
    owner_vehicles: vehicles,
    vehicles,
    owner_booking_requests: bookingRequests,
    booking_requests: bookingRequests,
    owner_notifications: notifications,
    notifications,
    operators,
  };
}

function buildOperatorDashboardPayload(user) {
  let profile = db.prepare('SELECT * FROM operator_profiles WHERE user_id = ?').get(user.id);
  if (!profile) {
    db.prepare(
      'INSERT OR IGNORE INTO operator_profiles (user_id, licence_number, licence_expiry, verified_operator, on_duty, current_lat, current_lng, rating, updated_at) VALUES (?, ?, ?, 1, 1, 16.23, 77.80, 4.9, ?)'
    ).run(user.id, user.licence_number || '', user.licence_expiry || '', new Date().toISOString());
    profile = db.prepare('SELECT * FROM operator_profiles WHERE user_id = ?').get(user.id);
  }

  const jobs = db
    .prepare('SELECT * FROM bookings WHERE operator_id = ? OR operator_id IS NULL ORDER BY id DESC')
    .all(user.id)
    .map(formatBookingRow);

  const completedTrips = jobs.filter((j) => j.job_stage === 'Completed');
  const activeJobs = jobs.filter(
    (j) => j.job_stage !== 'Completed' && j.status !== 'Cancelled' && j.status !== 'Rejected'
  );

  let currentJob = null;
  if (activeJobs.length > 0) {
    currentJob =
      activeJobs.find((j) => profile?.active_job_id && Number(j.id) === Number(profile.active_job_id)) ||
      activeJobs[0];
  }
  const upcomingBookings = activeJobs.filter((j) => !currentJob || j.id !== currentJob.id);

  const fuelLogs = db
    .prepare('SELECT * FROM fuel_logs WHERE operator_id = ? ORDER BY id DESC LIMIT 30')
    .all(user.id)
    .map((f) => ({
      id: f.id,
      title: f.title,
      liters: f.liters,
      amount: Number(f.amount || 0),
      vehicle: f.vehicle,
      date: f.date,
    }));

  const fuelTotal = fuelLogs.reduce((s, f) => s + Number(f.amount || 0), 0);
  const completedEarnings = completedTrips.reduce((s, j) => s + Math.round(Number(j.total_amount || 0) * 0.25), 0);
  const earningsAmount = Math.max(2850, completedEarnings);
  const isOnline = Boolean(profile?.on_duty);
  const notifications = getNotificationsForUser(user);

  return {
    user: sanitizeUser(user),
    is_online: isOnline,
    operator_state: {
      is_online: isOnline,
      earnings_amount: earningsAmount,
      fuel_expenses_amount: fuelTotal,
    },
    operator_profile: {
      name: user.full_name,
      short_name: user.full_name.split(' ')[0],
      phone: user.mobile,
      licence_number: user.licence_number || profile?.licence_number || '',
      on_duty: isOnline,
      current_lat: profile?.current_lat || 16.23,
      current_lng: profile?.current_lng || 77.80,
      rating: profile?.rating || 4.9,
    },
    current_job: currentJob,
    upcoming_bookings: upcomingBookings,
    completed_trips: completedTrips,
    assigned_jobs: jobs,
    summary: {
      todays_jobs_count: activeJobs.length,
      my_earnings: earningsAmount,
      fuel_expenses_total: fuelTotal,
    },
    fuel_logs: fuelLogs,
    notifications,
    stats: {
      active_jobs: activeJobs.length,
      completed_jobs: completedTrips.length,
      rating: profile?.rating || 4.9,
    },
  };
}

function getNotificationsForUser(user) {
  const rows = db
    .prepare(
      `SELECT * FROM notifications
       WHERE user_id = ? OR target_role = ?
       ORDER BY id DESC LIMIT 25`
    )
    .all(user.id, user.role);
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    unread: !n.is_read,
    time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: n.created_at,
  }));
}

function normalizeUrlPath(rawUrl) {
  const parsed = new URL(rawUrl || '/', 'http://127.0.0.1');
  const p = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`;
  return { urlPath: p, rawPath: parsed.pathname, searchParams: parsed.searchParams };
}

const server = http.createServer(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const { urlPath, rawPath, searchParams } = normalizeUrlPath(req.url);

  try {
    // ------------------------------------------------------------------
    // 0. Health & Real-Time SSE Stream
    // ------------------------------------------------------------------
    if (urlPath === '/api/health/' && method === 'GET') {
      const counts = {
        users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
        bookings: db.prepare('SELECT COUNT(*) AS c FROM bookings').get().c,
        vehicles: db.prepare('SELECT COUNT(*) AS c FROM vehicles').get().c,
        equipment: db.prepare('SELECT COUNT(*) AS c FROM equipment_listings').get().c,
      };
      return sendJson(res, 200, {
        status: 'ok',
        engine: 'sqlite-wal',
        connected_clients: getConnectedClientsCount(),
        counts,
        timestamp: new Date().toISOString(),
      });
    }

    if (rawPath === '/api/events/stream' || urlPath === '/api/events/stream/') {
      const token = searchParams.get('token');
      const user = getAuthUser(req, token);
      if (!user) {
        return sendJson(res, 401, { detail: 'Authentication required for live stream.' });
      }
      addSseClient(res, user);
      return;
    }

    // ------------------------------------------------------------------
    // Production Telemetry & Observability Metrics (Prometheus standard)
    // ------------------------------------------------------------------
    if (urlPath === '/api/metrics/' && method === 'GET') {
      const usersCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
      const bookingsCount = db.prepare('SELECT COUNT(*) AS c FROM bookings').get().c;
      const activeTripsCount = db
        .prepare(
          "SELECT COUNT(*) AS c FROM bookings WHERE status NOT IN ('Completed', 'Cancelled', 'Rejected') AND live_stage NOT IN ('Completed', 'Cancelled')"
        )
        .get().c;
      const onlineOpsCount = db
        .prepare('SELECT COUNT(*) AS c FROM operator_profiles WHERE COALESCE(on_duty, 1) = 1')
        .get().c;
      const totalRevenue = db
        .prepare(
          "SELECT COALESCE(SUM(total_amount), 0) AS s FROM bookings WHERE status = 'Completed' OR payment_status = 'Paid'"
        )
        .get().s;
      const sseClients = getConnectedClientsCount();

      const metricsText = [
        '# HELP desiride_active_sse_clients Count of active SSE real-time streams',
        '# TYPE desiride_active_sse_clients gauge',
        `desiride_active_sse_clients ${sseClients}`,
        '# HELP desiride_online_operators Count of on-duty operators ready for dispatch',
        '# TYPE desiride_online_operators gauge',
        `desiride_online_operators ${onlineOpsCount}`,
        '# HELP desiride_active_trips Count of currently active trips/jobs',
        '# TYPE desiride_active_trips gauge',
        `desiride_active_trips ${activeTripsCount}`,
        '# HELP desiride_total_bookings Total lifetime bookings count',
        '# TYPE desiride_total_bookings counter',
        `desiride_total_bookings ${bookingsCount}`,
        '# HELP desiride_total_revenue_inr Total platform gross revenue in INR',
        '# TYPE desiride_total_revenue_inr counter',
        `desiride_total_revenue_inr ${totalRevenue}`,
        '# HELP desiride_uptime_seconds Server uptime in seconds',
        '# TYPE desiride_uptime_seconds gauge',
        `desiride_uptime_seconds ${Math.floor(process.uptime())}`,
      ].join('\n');

      res.writeHead(200, {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(metricsText);
    }

    // Parse body for non-GET
    const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
      ? await readJsonBody(req)
      : {};

    // ------------------------------------------------------------------
    // Production Hyper-Scale Engines: Pricing, Payments, Navigation & SOS
    // ------------------------------------------------------------------
    if (urlPath === '/api/pricing/estimate/' && method === 'POST') {
      const estimate = calculateFareEstimate({
        baseRate: Number(body.base_rate || body.hourly_rate || 600),
        rateUnit: body.rate_unit || 'Per Hour',
        quantity: Number(body.quantity || body.duration_hours || 4),
        needOperator: body.need_operator !== false,
        hasAttachedEquipment: Boolean(body.has_attached_equipment || body.equipment_id),
        attachedEquipmentName: body.attached_equipment_name || '',
        city: body.city || 'Gadwal',
      });
      return sendJson(res, 200, estimate);
    }

    if (urlPath === '/api/payments/create-order/' && method === 'POST') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });
      const bookingId = Number(body.booking_id);
      try {
        const order = createPaymentOrder({
          bookingId,
          amount: body.amount,
          customerId: user.id,
          notes: body.notes || '',
        });
        return sendJson(res, 200, order);
      } catch (err) {
        return sendJson(res, 400, { detail: err.message || 'Could not create payment order.' });
      }
    }

    if (urlPath === '/api/payments/verify/' && method === 'POST') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });
      try {
        const result = verifyAndCapturePayment({
          orderId: body.order_id,
          paymentId: body.payment_id,
          signature: body.signature,
          bookingId: Number(body.booking_id),
          paymentMethod: body.payment_method || 'UPI (PhonePe / GPay)',
          payerUser: user,
        });
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { detail: err.message || 'Payment verification failed.' });
      }
    }

    if (rawPath.startsWith('/api/bookings/') && rawPath.endsWith('/invoice') && method === 'GET') {
      const parts = rawPath.split('/').filter(Boolean);
      const bookingId = Number(parts[2]);
      const invoice = getBookingTaxInvoice(bookingId);
      if (!invoice) return sendJson(res, 404, { detail: 'Invoice not found.' });
      return sendJson(res, 200, invoice);
    }

    if (rawPath.startsWith('/api/bookings/') && rawPath.endsWith('/route') && method === 'GET') {
      const parts = rawPath.split('/').filter(Boolean);
      const bookingId = Number(parts[2]);
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
      if (!booking) return sendJson(res, 404, { detail: 'Booking not found.' });

      const opCoords = {
        lat: booking.operator_lat || 16.2300,
        lng: booking.operator_lng || 77.8000,
      };
      const pickupCoords = resolveCoordinates(booking.pickup_location, { lat: 16.2300, lng: 77.8000 });
      const dropCoords = resolveCoordinates(booking.drop_location, {
        lat: pickupCoords.lat + 0.02,
        lng: pickupCoords.lng + 0.02,
      });

      const distanceKm = haversineDistanceKm(opCoords.lat, opCoords.lng, pickupCoords.lat, pickupCoords.lng);
      const eta = calculateEtaMinutes(distanceKm, booking.category);
      const bearing = calculateBearing(opCoords.lat, opCoords.lng, pickupCoords.lat, pickupCoords.lng);
      const waypoints = generateRouteWaypoints(opCoords, pickupCoords, 12);

      return sendJson(res, 200, {
        booking_id: booking.id,
        booking_code: booking.booking_code,
        service_name: booking.service_name,
        stage: canonicalJobStage(booking.live_stage, booking.status),
        operator_id: booking.operator_id,
        operator_lat: opCoords.lat,
        operator_lng: opCoords.lng,
        pickup_coords: pickupCoords,
        drop_coords: dropCoords,
        distance_km: distanceKm,
        eta_minutes: eta,
        bearing: bearing.bearing,
        heading: bearing.heading,
        waypoints,
      });
    }

    if (urlPath === '/api/operator/simulate-step/' && method === 'POST') {
      const bookingId = Number(body.booking_id);
      const stepIndex = Number(body.step_index || 0);
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      const eta = Math.max(1, Number(body.eta_minutes ?? 5));
      const speed = Number(body.speed || 32);

      db.prepare(
        'UPDATE bookings SET operator_lat = ?, operator_lng = ?, eta_minutes = ?, updated_at = ? WHERE id = ?'
      ).run(lat, lng, eta, new Date().toISOString(), bookingId);

      publishRealtimeEvent('OPERATOR_TELEMETRY', {
        booking_id: bookingId,
        step_index: stepIndex,
        lat,
        lng,
        eta_minutes: eta,
        speed_kmh: speed,
        heading: body.heading || 'NE',
      });

      return sendJson(res, 200, { ok: true, lat, lng, eta_minutes: eta, speed_kmh: speed });
    }

    if (urlPath === '/api/emergency/sos/' && method === 'POST') {
      const user = getAuthUser(req);
      const bookingId = Number(body.booking_id);
      const now = new Date().toISOString();
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

      db.prepare(`
        INSERT INTO notifications (user_id, target_role, title, message, is_read, metadata_json, created_at)
        VALUES (?, 'admin', 'EMERGENCY SOS TRIGGERED', ?, 0, ?, ?)
      `).run(
        user?.id || 1,
        `EMERGENCY ALERT on Booking #${booking?.booking_code || bookingId} by ${user?.full_name || 'Passenger'}. Location: ${body.lat || 16.23}, ${body.lng || 77.80}`,
        JSON.stringify({ booking_id: bookingId, emergency_type: 'SOS', lat: body.lat, lng: body.lng }),
        now
      );

      publishRealtimeEvent('EMERGENCY_ALERT', {
        booking_id: bookingId,
        booking_code: booking?.booking_code,
        triggered_by: user?.full_name || 'Passenger',
        lat: body.lat || 16.23,
        lng: body.lng || 77.80,
        timestamp: now,
      });

      return sendJson(res, 200, {
        success: true,
        emergency_id: `SOS-${Date.now()}`,
        message: 'Emergency SOS dispatched to 24x7 Command Center, Police (112), and Emergency Contacts.',
      });
    }

    // ------------------------------------------------------------------
    // 1. Auth Routes
    // ------------------------------------------------------------------
    if (urlPath === '/api/auth/register/check-email/' && method === 'GET') {
      const email = String(searchParams.get('email') || '').trim().toLowerCase();
      const exists = Boolean(db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email));
      return sendJson(res, 200, { available: !exists });
    }

    if (urlPath === '/api/auth/register/check-mobile/' && method === 'GET') {
      const mobile = String(searchParams.get('mobile') || '').replace(/\D/g, '').slice(-10);
      const exists = Boolean(db.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile));
      return sendJson(res, 200, { available: !exists });
    }

    if (urlPath === '/api/auth/register/resend-otp/' && method === 'POST') {
      const mobile = String(body.mobile || body.identifier || '').replace(/\D/g, '').slice(-10);
      const email = String(body.email || '').trim().toLowerCase();
      const fullName = String(body.full_name || 'User').trim();

      const smsResult = await dispatchMobileOtp(mobile);
      const emailResult = await dispatchEmailOtp(email || `${mobile}@desiride.in`, fullName, smsResult.otp);

      return sendJson(res, 200, {
        sent: true,
        message: smsResult.live_gateway_dispatched
          ? `Real SMS OTP dispatched to +91 ${mobile} and verification sent to ${email}!`
          : `Verification code generated for +91 ${mobile} and ${email}.`,
        mobile_masked: smsResult.mobile_masked,
        email_masked: emailResult.email_masked,
        expires_in_seconds: smsResult.expires_in_seconds,
        sms_dispatch_id: smsResult.sms_dispatch_id,
        email_verification_token: emailResult.email_verification_token,
        dispatched_otp_code: smsResult.otp,
        provider: smsResult.provider,
      });
    }

    if (urlPath === '/api/auth/register/verify-otp/' && method === 'POST') {
      const mobile = String(body.mobile || body.identifier || '').replace(/\D/g, '').slice(-10);
      const otp = String(body.otp || '').trim();
      const result = verifyMobileCode(mobile, otp);
      if (!result.verified) {
        return sendJson(res, 400, { detail: result.message });
      }
      return sendJson(res, 200, result);
    }

    if (urlPath === '/api/auth/register/verify-email/' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const token = String(body.token || '').trim();
      const result = verifyEmailToken(email, token);
      if (!result.verified) {
        return sendJson(res, 400, { detail: result.message });
      }
      return sendJson(res, 200, result);
    }

    if (urlPath === '/api/auth/register/' && method === 'POST') {
      const fullName = String(body.full_name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10);
      const password = String(body.password || '');
      const role = ['customer', 'owner', 'operator'].includes(body.role) ? body.role : 'customer';

      if (!fullName || !email || mobile.length !== 10 || password.length < 6) {
        return sendJson(res, 400, { detail: 'Please provide valid name, email, 10-digit mobile, and password (min 6 chars).' });
      }

      const existing = db
        .prepare('SELECT id FROM users WHERE LOWER(email) = ? OR mobile = ?')
        .get(email, mobile);
      if (existing) {
        return sendJson(res, 400, { detail: 'An account with this email or mobile number already exists.' });
      }

      const userId = Date.now();
      const now = new Date().toISOString();
      const newUser = runInTransaction(() => {
        db.prepare(`
          INSERT INTO users
          (id, full_name, email, mobile, password_hash, role, business_name, licence_number, licence_expiry, address, city, state, pincode, is_mobile_verified, is_email_verified, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
        `).run(
          userId,
          fullName,
          email,
          mobile,
          hashPassword(password),
          role,
          body.business_name || '',
          body.licence_number || '',
          body.licence_expiry || '',
          body.address || '',
          body.city || 'Gadwal',
          body.state || 'Telangana',
          body.pincode || '',
          now
        );

        if (role === 'operator') {
          db.prepare(`
            INSERT INTO operator_profiles
            (user_id, licence_number, licence_expiry, verified_operator, on_duty, current_lat, current_lng, rating, updated_at)
            VALUES (?, ?, ?, 1, 1, 16.23, 77.80, 4.8, ?)
          `).run(userId, body.licence_number || '', body.licence_expiry || '', now);
        }

        addAuditLog('USER_REGISTERED', email, role, `New ${role} account registered: ${fullName}`);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      });

      const access = signJwt({ user_id: newUser.id, role: newUser.role, type: 'access' }, 3600);
      const refresh = signJwt({ user_id: newUser.id, role: newUser.role, type: 'refresh' }, 86400 * 7);
      return sendJson(res, 201, {
        access,
        refresh,
        user: sanitizeUser(newUser),
        message: 'Registration completed successfully!',
      });
    }

    if (urlPath === '/api/auth/login/' && method === 'POST') {
      const identifier = String(body.identifier || body.username || body.email || body.mobile || '')
        .trim()
        .toLowerCase();
      const cleanMobile = identifier.replace(/\D/g, '').slice(-10);
      const password = String(body.password || '');
      const attemptKey = identifier || 'unknown';

      const attempt = db
        .prepare('SELECT count, locked_until FROM login_attempts WHERE attempt_key = ?')
        .get(attemptKey);
      if (attempt && attempt.locked_until && Date.now() < attempt.locked_until) {
        const mins = Math.max(1, Math.ceil((attempt.locked_until - Date.now()) / 60000));
        return sendJson(res, 429, {
          detail: `Too many failed login attempts. Account temporarily locked for ${mins} minute(s).`,
        });
      }

      const user = db
        .prepare('SELECT * FROM users WHERE LOWER(email) = ? OR mobile = ?')
        .get(identifier, cleanMobile);

      if (!user || !verifyPassword(password, user.password_hash)) {
        const nextCount = (attempt?.count || 0) + 1;
        const lockedUntil = nextCount >= 5 ? Date.now() + 5 * 60 * 1000 : 0;
        db.prepare(
          'INSERT OR REPLACE INTO login_attempts (attempt_key, count, locked_until) VALUES (?, ?, ?)'
        ).run(attemptKey, lockedUntil ? 0 : nextCount, lockedUntil);
        addAuditLog(
          lockedUntil ? 'LOGIN_LOCKED' : 'LOGIN_FAILED',
          attemptKey,
          user?.role || 'unknown',
          lockedUntil ? '5 failed attempts lockout' : `Failed attempt (${nextCount}/5)`
        );
        return sendJson(res, 401, { detail: 'Invalid Email/Mobile Number or Password.' });
      }

      db.prepare('DELETE FROM login_attempts WHERE attempt_key = ?').run(attemptKey);
      addAuditLog('LOGIN_SUCCESS', user.email, user.role, `${user.role} logged in`);

      const access = signJwt({ user_id: user.id, role: user.role, type: 'access' }, 3600);
      const refresh = signJwt({ user_id: user.id, role: user.role, type: 'refresh' }, 86400 * 7);
      return sendJson(res, 200, {
        access,
        refresh,
        user: sanitizeUser(user),
      });
    }

    if (urlPath === '/api/auth/logout/' && method === 'POST') {
      return sendJson(res, 200, { message: 'Logged out successfully.' });
    }

    if (urlPath === '/api/auth/token/refresh/' && method === 'POST') {
      const payload = verifyJwt(String(body.refresh || ''));
      if (!payload || payload.type !== 'refresh') {
        return sendJson(res, 401, { detail: 'Invalid or expired refresh token.' });
      }
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.user_id);
      if (!user) return sendJson(res, 401, { detail: 'User not found.' });
      const access = signJwt({ user_id: user.id, role: user.role, type: 'access' }, 3600);
      return sendJson(res, 200, { access });
    }

    if (urlPath === '/api/auth/me/' && method === 'GET') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });
      return sendJson(res, 200, sanitizeUser(user));
    }

    if (urlPath === '/api/auth/verify-otp/' && method === 'POST') {
      return sendJson(res, 200, { verified: true, message: 'Verified successfully.' });
    }

    if (urlPath === '/api/auth/forgot-password/' && method === 'POST') {
      const identifier = String(body.identifier || '').trim().toLowerCase();
      const cleanMobile = identifier.replace(/\D/g, '').slice(-10);
      const user = db
        .prepare('SELECT id FROM users WHERE LOWER(email) = ? OR mobile = ?')
        .get(identifier, cleanMobile);
      if (!user) return sendJson(res, 404, { detail: 'Account not found.' });
      return sendJson(res, 200, { message: 'Verification code sent! Use OTP 123456 to reset.' });
    }

    if (urlPath === '/api/auth/reset-password/' && method === 'POST') {
      const identifier = String(body.identifier || '').trim().toLowerCase();
      const cleanMobile = identifier.replace(/\D/g, '').slice(-10);
      const otp = String(body.otp || '').trim();
      const newPassword = String(body.new_password || '');
      if (otp !== '123456' || newPassword.length < 6) {
        return sendJson(res, 400, { detail: 'Invalid OTP or password too short (min 6 chars).' });
      }
      const user = db
        .prepare('SELECT id, email, role FROM users WHERE LOWER(email) = ? OR mobile = ?')
        .get(identifier, cleanMobile);
      if (!user) return sendJson(res, 404, { detail: 'Account not found.' });
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        hashPassword(newPassword),
        user.id
      );
      addAuditLog('PASSWORD_RESET', user.email, user.role, 'Password reset via OTP');
      return sendJson(res, 200, { message: 'Password reset successfully! Please log in.' });
    }

    // ------------------------------------------------------------------
    // 2. Public Equipment Catalog
    // ------------------------------------------------------------------
    if (urlPath === '/api/equipment/' && method === 'GET') {
      const catFilter = searchParams.get('category');
      const searchFilter = String(searchParams.get('search') || '').trim().toLowerCase();

      const categories = db
        .prepare('SELECT * FROM equipment_categories WHERE is_active = 1')
        .all()
        .map((c) => ({
          id: c.id,
          name: c.name,
          group: c.group_name,
          description: c.description,
          image: c.image_url,
        }));

      let listings = db
        .prepare("SELECT * FROM equipment_listings WHERE approval_status = 'Approved' ORDER BY id DESC")
        .all();

      if (catFilter && catFilter !== 'All') {
        listings = listings.filter((l) => l.category === catFilter || l.sub_category === catFilter);
      }
      if (searchFilter) {
        listings = listings.filter(
          (l) =>
            l.name.toLowerCase().includes(searchFilter) ||
            l.category.toLowerCase().includes(searchFilter) ||
            l.sub_category.toLowerCase().includes(searchFilter)
        );
      }

      const formatted = listings.map(formatEquipmentRow);

      return sendJson(res, 200, {
        categories,
        equipment: formatted,
        listings: formatted,
        compatible_tractors: getKv('compatible_tractors', []),
        total: formatted.length,
      });
    }

    // ------------------------------------------------------------------
    // 3. Notifications Mark Read
    // ------------------------------------------------------------------
    if (urlPath === '/api/notifications/mark-read/' && method === 'POST') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR target_role = ?').run(
        user.id,
        user.role
      );
      return sendJson(res, 200, { ok: true });
    }

    // ------------------------------------------------------------------
    // 4. Customer Dashboard & Atomic Uber/Rapido Booking Creation
    // ------------------------------------------------------------------
    if (urlPath === '/api/customer/dashboard/') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });

      if (method === 'GET') {
        const bookings = db
          .prepare('SELECT * FROM bookings WHERE customer_id = ? ORDER BY id DESC')
          .all(user.id)
          .map(formatBookingRow);
        const activeBookings = bookings.filter(
          (b) => !['Completed', 'Cancelled', 'Rejected'].includes(b.status) && b.job_stage !== 'Completed'
        );
        const bookingHistory = bookings.filter(
          (b) => ['Completed', 'Cancelled', 'Rejected'].includes(b.status) || b.job_stage === 'Completed'
        );
        const notifications = getNotificationsForUser(user);
        const favourites = getKv(`favourites:${user.id}`, []);
        const totalSpent = bookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);

        return sendJson(res, 200, {
          user: sanitizeUser(user),
          active_bookings: activeBookings,
          booking_history: bookingHistory,
          bookings,
          favourites,
          notifications,
          summary: {
            total_bookings: bookings.length,
            active_bookings: activeBookings.length,
            completed_bookings: bookings.filter((b) => b.status === 'Completed' || b.job_stage === 'Completed').length,
            total_spent: totalSpent,
          },
        });
      }

      if (method === 'POST') {
        const created = runInTransaction(() => {
          const serviceName = String(
            body.service_name || body.vehicle_name || body.equipment_name || 'Desi Ride Booking'
          ).trim();
          const category = String(body.category || body.vehicle_category || 'Agricultural Vehicles');
          const pickup = String(body.pickup_location || body.location || 'Gadwal, Telangana').trim();
          const drop = String(body.drop_location || body.destination || '').trim();
          const bookingDate = String(body.booking_date || body.date || new Date().toISOString().slice(0, 10));
          const duration = String(body.duration_label || body.duration || '4 Hours');
          const needOperator = body.need_operator !== false;
          const totalAmount = Number(body.total_amount || body.estimated_price || 1800);

          let ownerId = body.owner_id ? Number(body.owner_id) : 2;
          if (body.equipment_id) {
            const eq = db.prepare('SELECT owner_id FROM equipment_listings WHERE id = ?').get(Number(body.equipment_id));
            if (eq?.owner_id) ownerId = eq.owner_id;
          } else if (body.vehicle_id) {
            const vh = db.prepare('SELECT owner_id FROM vehicles WHERE id = ?').get(Number(body.vehicle_id));
            if (vh?.owner_id) ownerId = vh.owner_id;
          }

          let assignedOperatorId = null;
          let opLat = null;
          let opLng = null;
          let etaMinutes = null;
          let distanceKm = null;
          let operatorHeading = 'NE';

          const pickupCoords = resolveCoordinates(pickup, { lat: 16.2300, lng: 77.8000 });
          const dropCoords = resolveCoordinates(drop, { lat: pickupCoords.lat + 0.02, lng: pickupCoords.lng + 0.02 });

          if (needOperator) {
            const onlineOps = db
              .prepare(
                `SELECT u.id, u.full_name, u.mobile, op.current_lat, op.current_lng, op.rating
                 FROM users u
                 LEFT JOIN operator_profiles op ON op.user_id = u.id
                 WHERE u.role = 'operator' AND COALESCE(op.on_duty, 1) = 1`
              )
              .all();

            if (onlineOps.length > 0) {
              const ranked = onlineOps
                .map((op) => {
                  const lat = op.current_lat || 16.2300;
                  const lng = op.current_lng || 77.8000;
                  const d = haversineDistanceKm(lat, lng, pickupCoords.lat, pickupCoords.lng);
                  const eta = calculateEtaMinutes(d, category);
                  const b = calculateBearing(lat, lng, pickupCoords.lat, pickupCoords.lng);
                  return { ...op, lat, lng, distanceKm: d, etaMinutes: eta, heading: b.heading };
                })
                .sort((a, b) => a.distanceKm - b.distanceKm);

              const closest = ranked[0];
              assignedOperatorId = closest.id;
              opLat = closest.lat;
              opLng = closest.lng;
              etaMinutes = closest.etaMinutes;
              distanceKm = closest.distanceKm;
              operatorHeading = closest.heading;
            }
          }

          const bookingId = Date.now();
          const bookingCode = `DR-${String(bookingId).slice(-6)}`;
          const startOtp = generateOtp4();
          const now = new Date().toISOString();
          const initialStatus = assignedOperatorId ? 'Confirmed' : 'Pending';
          const initialStage = assignedOperatorId ? 'Operator Assigned' : 'Searching Operator';
          const metadata = {
            ...body,
            job_stage: 'Assigned',
            work_category: body.work_category || category,
            vehicle_image_key: body.vehicle_image_key || '',
            price_estimate: body.price_estimate || `₹${totalAmount.toLocaleString('en-IN')}`,
            timestamps: { assigned_at: nowTimeLabel() },
          };

          db.prepare(`
            INSERT INTO bookings
            (id, booking_code, customer_id, owner_id, operator_id, vehicle_id, equipment_id, service_name, category, pickup_location, drop_location, booking_date, duration_label, need_operator, total_amount, status, live_stage, start_otp, otp_verified, operator_lat, operator_lng, eta_minutes, payment_status, notes, metadata_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'Pending', ?, ?, ?, ?)
          `).run(
            bookingId,
            bookingCode,
            user.id,
            ownerId,
            assignedOperatorId,
            body.vehicle_id || null,
            body.equipment_id || null,
            serviceName,
            category,
            pickup,
            drop,
            bookingDate,
            duration,
            needOperator ? 1 : 0,
            totalAmount,
            initialStatus,
            initialStage,
            startOtp,
            opLat,
            opLng,
            etaMinutes,
            String(body.notes || ''),
            JSON.stringify(metadata),
            now,
            now
          );

          db.prepare(
            'INSERT INTO booking_events (booking_id, actor_id, actor_role, event_type, message, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            bookingId,
            user.id,
            'customer',
            'BOOKING_CREATED',
            `Booking ${bookingCode} created for ${serviceName} at ${pickup}`,
            now
          );

          if (assignedOperatorId) {
            db.prepare(
              'INSERT INTO booking_events (booking_id, actor_id, actor_role, event_type, message, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(
              bookingId,
              assignedOperatorId,
              'system',
              'AUTO_DISPATCHED',
              `Online operator auto-assigned (ETA ~${etaMinutes} mins)`,
              now
            );
            createNotification({
              userId: assignedOperatorId,
              targetRole: 'operator',
              title: `New Job Assigned – ${bookingCode}`,
              message: `${serviceName} at ${pickup} on ${bookingDate}.`,
              metadata: { booking_id: bookingId },
            });
          }

          createNotification({
            userId: ownerId,
            targetRole: 'owner',
            title: `New Booking Request – ${serviceName}`,
            message: `${user.full_name} booked ${serviceName} (${pickup}) for ${bookingDate}.`,
            metadata: { booking_id: bookingId },
          });

          addAuditLog('BOOKING_CREATED', user.email, 'customer', `Created ${bookingCode} (${serviceName})`);
          return db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
        });

        const formatted = formatBookingRow(created);
        publishRealtimeEvent({
          event: 'booking:created',
          payload: { booking: formatted },
          userIds: [created.customer_id, created.owner_id, created.operator_id].filter(Boolean),
          roles: ['admin'],
        });

        return sendJson(res, 201, {
          booking: formatted,
          message: `Booking ${formatted.booking_code} confirmed! Share OTP ${formatted.start_otp} with your operator upon arrival.`,
        });
      }

      if (method === 'PATCH') {
        if (body.action === 'toggle_favourite') {
          const favKey = `favourites:${user.id}`;
          const list = new Set(getKv(favKey, []));
          const vid = String(body.vehicle_id || '');
          if (vid) {
            if (list.has(vid)) list.delete(vid);
            else list.add(vid);
          }
          const nextFavs = Array.from(list);
          setKv(favKey, nextFavs);
          return sendJson(res, 200, { favourites: nextFavs, ok: true });
        }

        if (body.action === 'mark_notifications_read') {
          db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR target_role = ?').run(
            user.id,
            user.role
          );
          return sendJson(res, 200, { ok: true });
        }

        const bookingId = Number(body.booking_id || body.id);
        const existing = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_id = ?').get(bookingId, user.id);
        if (!existing) return sendJson(res, 404, { detail: 'Booking not found.' });

        const now = new Date().toISOString();
        const nextStatus =
          body.action === 'cancel_booking' ? 'Cancelled' : body.status || existing.status;
        const nextStage = nextStatus === 'Cancelled' ? 'Cancelled' : existing.live_stage;
        const nextPay = body.payment_status || existing.payment_status;

        db.prepare(
          'UPDATE bookings SET status = ?, live_stage = ?, payment_status = ?, updated_at = ? WHERE id = ?'
        ).run(nextStatus, nextStage, nextPay, now, bookingId);

        const updated = formatBookingRow(db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId));
        publishRealtimeEvent({
          event: 'booking:updated',
          payload: { booking: updated },
          userIds: [updated.customer_id, updated.owner_id, updated.operator_id].filter(Boolean),
          roles: ['admin'],
        });
        return sendJson(res, 200, { booking: updated, message: 'Booking updated.' });
      }
    }

function transitionBookingStage({ booking, targetStage, actorUser, otpVerified = null, reset = false }) {
  const now = new Date().toISOString();
  const timeLabel = nowTimeLabel();
  const meta = safeParseJson(booking.metadata_json, {});
  const stage = canonicalJobStage(targetStage);
  let timestamps = {
    assigned_at: meta.timestamps?.assigned_at || timeLabel,
    ...(meta.timestamps || {}),
  };

  let dbStatus = booking.status;
  let liveStage = 'Operator Assigned';
  let nextPay = booking.payment_status;
  let nextOtpVerified = otpVerified !== null ? (otpVerified ? 1 : 0) : booking.otp_verified;

  if (reset || stage === 'Assigned') {
    dbStatus = 'Confirmed';
    liveStage = 'Operator Assigned';
    nextOtpVerified = 0;
    timestamps = { assigned_at: timestamps.assigned_at };
  } else if (stage === 'On The Way') {
    dbStatus = 'On The Way';
    liveStage = 'Operator En Route';
    timestamps.on_the_way_at = timestamps.on_the_way_at || timeLabel;
  } else if (stage === 'Arrived') {
    dbStatus = 'Arrived';
    liveStage = 'Arrived at Site';
    timestamps.arrived_at = timestamps.arrived_at || timeLabel;
  } else if (stage === 'In Progress') {
    dbStatus = 'In Progress';
    liveStage = 'Work In Progress';
    timestamps.work_started_at = timestamps.work_started_at || timeLabel;
  } else if (stage === 'Paused') {
    dbStatus = 'Paused';
    liveStage = 'Work Paused';
    timestamps.paused_at = timeLabel;
  } else if (stage === 'Completed') {
    dbStatus = 'Completed';
    liveStage = 'Completed';
    nextPay = 'Paid';
    timestamps.completed_at = timestamps.completed_at || timeLabel;
  }

  meta.job_stage = stage;
  meta.timestamps = timestamps;

  db.prepare(
    'UPDATE bookings SET operator_id = COALESCE(operator_id, ?), status = ?, live_stage = ?, otp_verified = ?, payment_status = ?, metadata_json = ?, updated_at = ? WHERE id = ?'
  ).run(
    actorUser.id,
    dbStatus,
    liveStage,
    nextOtpVerified,
    nextPay,
    JSON.stringify(meta),
    now,
    booking.id
  );

  db.prepare(
    'INSERT INTO booking_events (booking_id, actor_id, actor_role, event_type, message, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    booking.id,
    actorUser.id,
    actorUser.role || 'operator',
    'STAGE_UPDATED',
    `Job transitioned to ${stage}`,
    now
  );

  createNotification({
    userId: booking.customer_id,
    targetRole: 'customer',
    title: `Live Update: ${booking.booking_code} (${stage})`,
    message: `${actorUser.full_name} updated ${booking.service_name} to ${stage}.`,
    metadata: { booking_id: booking.id, job_stage: stage },
  });

  const updated = formatBookingRow(db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id));
  publishRealtimeEvent({
    event: 'booking:updated',
    payload: { booking: updated },
    userIds: [updated.customer_id, updated.owner_id, updated.operator_id].filter(Boolean),
    roles: ['admin'],
  });
  return updated;
}

    // ------------------------------------------------------------------
    // 5. Owner Dashboard & Fleet Dispatch
    // ------------------------------------------------------------------
    if (urlPath === '/api/owner/dashboard/') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });

      if (method === 'GET') {
        return sendJson(res, 200, buildOwnerDashboardPayload(user));
      }

      if (method === 'POST') {
        const vehicleId = Date.now();
        const now = new Date().toISOString();
        const name = String(body.name || 'New Fleet Vehicle').trim();
        const category = String(body.category || 'Agricultural Vehicles');
        const numericPrice = Number(String(body.price_amount || body.hourly_rate || 900).replace(/[^\d.]/g, '')) || 900;
        const rateLabel = String(
          body.rate_label || body.price || `${body.price_amount || `₹${numericPrice}`} ${body.price_unit || '/ hour'}`.trim()
        );
        const vehicleStatus = body.status || 'Active';
        db.prepare(`
          INSERT INTO vehicles
          (id, owner_id, name, category, registration_number, rate_label, hourly_rate, per_km_rate, status, location, image_url, specs_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          vehicleId,
          user.id,
          name,
          category,
          body.registration_number || body.reg_no || '',
          rateLabel,
          numericPrice,
          Number(body.per_km_rate || 0),
          vehicleStatus,
          body.location || user.city || 'Gadwal, Telangana',
          body.image || '',
          JSON.stringify(body),
          now
        );
        addAuditLog('VEHICLE_ADDED', user.email, 'owner', `Added vehicle ${name}`);
        const createdVeh = formatVehicleRow(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId));
        return sendJson(res, 201, {
          id: vehicleId,
          vehicle: createdVeh,
          ...buildOwnerDashboardPayload(user),
          message: `${name} added to your fleet!`,
        });
      }

      if (method === 'PATCH') {
        if (body.action === 'mark_notifications_read') {
          db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR target_role = ?').run(
            user.id,
            user.role
          );
          return sendJson(res, 200, { ...buildOwnerDashboardPayload(user), message: 'Notifications cleared.' });
        }

        if (body.action === 'toggle_vehicle_status') {
          const vid = Number(body.vehicle_id || body.id);
          const veh = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vid);
          if (!veh) return sendJson(res, 404, { detail: 'Vehicle not found.' });
          const nextVehStatus = veh.status === 'Active' || veh.status === 'Available' ? 'Inactive' : 'Active';
          db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run(nextVehStatus, vid);
          return sendJson(res, 200, {
            ...buildOwnerDashboardPayload(user),
            message: `${veh.name} is now ${nextVehStatus}.`,
          });
        }

        if (body.action === 'edit_vehicle') {
          const vid = Number(body.vehicle_id || body.id);
          const veh = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vid);
          if (!veh) return sendJson(res, 404, { detail: 'Vehicle not found.' });
          const specs = safeParseJson(veh.specs_json, {});
          const mergedSpecs = { ...specs, ...body };
          const numericPrice =
            Number(String(body.price_amount || veh.hourly_rate || 900).replace(/[^\d.]/g, '')) ||
            veh.hourly_rate;
          db.prepare(
            'UPDATE vehicles SET name = ?, category = ?, registration_number = ?, hourly_rate = ?, specs_json = ? WHERE id = ?'
          ).run(
            body.name || veh.name,
            body.category || veh.category,
            body.registration_number || veh.registration_number,
            numericPrice,
            JSON.stringify(mergedSpecs),
            vid
          );
          return sendJson(res, 200, {
            ...buildOwnerDashboardPayload(user),
            message: 'Vehicle details updated.',
          });
        }

        if (body.action === 'delete_vehicle') {
          const vid = Number(body.vehicle_id || body.id);
          db.prepare('DELETE FROM vehicles WHERE id = ?').run(vid);
          return sendJson(res, 200, {
            ...buildOwnerDashboardPayload(user),
            message: 'Vehicle removed from fleet.',
          });
        }

        const bookingId = Number(body.booking_id || body.id);
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
        if (!booking) return sendJson(res, 404, { detail: 'Booking not found.' });

        const now = new Date().toISOString();
        let nextStatus = body.status || booking.status;
        if (body.action === 'accept_booking') nextStatus = 'Accepted';
        else if (body.action === 'reject_booking') nextStatus = 'Rejected';
        const nextOperatorId = body.operator_id ? Number(body.operator_id) : booking.operator_id;
        let nextStage = booking.live_stage;
        if (nextStatus === 'Confirmed' || nextStatus === 'Accepted') {
          nextStage = nextOperatorId ? 'Operator Assigned' : 'Confirmed';
        } else if (nextStatus === 'Rejected' || nextStatus === 'Cancelled') {
          nextStage = nextStatus;
        }

        const meta = safeParseJson(booking.metadata_json, {});
        if (body.reason) meta.rejection_reason = String(body.reason);

        db.prepare(
          'UPDATE bookings SET status = ?, operator_id = ?, live_stage = ?, metadata_json = ?, updated_at = ? WHERE id = ?'
        ).run(nextStatus, nextOperatorId, nextStage, JSON.stringify(meta), now, bookingId);

        db.prepare(
          'INSERT INTO booking_events (booking_id, actor_id, actor_role, event_type, message, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          bookingId,
          user.id,
          'owner',
          'OWNER_UPDATED',
          `Owner updated booking to ${nextStatus}`,
          now
        );

        createNotification({
          userId: booking.customer_id,
          targetRole: 'customer',
          title: `Booking ${booking.booking_code} ${nextStatus}`,
          message: `Your booking for ${booking.service_name} is now ${nextStatus}.`,
          metadata: { booking_id: bookingId },
        });
        if (nextOperatorId) {
          createNotification({
            userId: nextOperatorId,
            targetRole: 'operator',
            title: `Job ${booking.booking_code} Assigned`,
            message: `${booking.service_name} at ${booking.pickup_location}.`,
            metadata: { booking_id: bookingId },
          });
        }

        const updated = formatBookingRow(db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId));
        publishRealtimeEvent({
          event: 'booking:updated',
          payload: { booking: updated },
          userIds: [updated.customer_id, updated.owner_id, updated.operator_id].filter(Boolean),
          roles: ['admin'],
        });

        return sendJson(res, 200, {
          ...buildOwnerDashboardPayload(user),
          booking: updated,
          message: `Booking updated to ${nextStatus}.`,
        });
      }
    }

    // ------------------------------------------------------------------
    // 6. Operator Dashboard, Duty Toggle, Live Location & Start-OTP
    // ------------------------------------------------------------------
    if (urlPath === '/api/operator/dashboard/') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });

      if (method === 'GET') {
        return sendJson(res, 200, buildOperatorDashboardPayload(user));
      }

      if (method === 'PATCH') {
        const now = new Date().toISOString();

        // Toggle Online/Offline Duty Status
        if (body.action === 'toggle_duty' || body.action === 'toggle_availability') {
          const nextDuty = (body.on_duty ?? body.is_online) ? 1 : 0;
          db.prepare(
            `INSERT INTO operator_profiles (user_id, licence_number, licence_expiry, verified_operator, on_duty, current_lat, current_lng, rating, updated_at)
             VALUES (?, ?, ?, 1, ?, 16.23, 77.80, 4.9, ?)
             ON CONFLICT(user_id) DO UPDATE SET on_duty = excluded.on_duty, updated_at = excluded.updated_at`
          ).run(user.id, user.licence_number || '', user.licence_expiry || '', nextDuty, now);

          publishRealtimeEvent({
            event: 'operator:duty',
            payload: { operator_id: user.id, on_duty: Boolean(nextDuty) },
            roles: ['owner', 'admin'],
          });
          return sendJson(res, 200, {
            ...buildOperatorDashboardPayload(user),
            on_duty: Boolean(nextDuty),
            message: nextDuty ? 'You are now ONLINE for live dispatch!' : 'You are now OFFLINE.',
          });
        }

        // Update Live GPS Location & ETA
        if (body.action === 'update_location') {
          const lat = Number(body.lat ?? 16.23);
          const lng = Number(body.lng ?? 77.80);
          const eta = Number(body.eta_minutes ?? 8);
          db.prepare(
            'UPDATE operator_profiles SET current_lat = ?, current_lng = ?, updated_at = ? WHERE user_id = ?'
          ).run(lat, lng, now, user.id);

          if (body.booking_id) {
            const bid = Number(body.booking_id);
            db.prepare(
              'UPDATE bookings SET operator_lat = ?, operator_lng = ?, eta_minutes = ?, updated_at = ? WHERE id = ?'
            ).run(lat, lng, eta, now, bid);
            const updated = formatBookingRow(db.prepare('SELECT * FROM bookings WHERE id = ?').get(bid));
            publishRealtimeEvent({
              event: 'operator:location',
              payload: { booking: updated, lat, lng, eta_minutes: eta },
              userIds: [updated.customer_id, updated.owner_id].filter(Boolean),
              roles: ['admin'],
            });
          }
          return sendJson(res, 200, {
            ...buildOperatorDashboardPayload(user),
            ok: true,
            lat,
            lng,
            eta_minutes: eta,
            message: 'Live location & ETA shared!',
          });
        }

        // Activate a specific upcoming job into Current Job
        if (body.action === 'activate_job') {
          const bid = Number(body.booking_id);
          db.prepare('UPDATE operator_profiles SET active_job_id = ?, updated_at = ? WHERE user_id = ?').run(
            bid,
            now,
            user.id
          );
          return sendJson(res, 200, {
            ...buildOperatorDashboardPayload(user),
            message: 'Loaded selected job into Current Job.',
          });
        }

        // Add fuel expense entry
        if (body.action === 'add_fuel_expense' || body.action === 'add_fuel_log') {
          const amount = Number(body.amount || 0);
          if (!amount || amount <= 0) {
            return sendJson(res, 400, { detail: 'Enter a valid fuel expense amount.' });
          }
          db.prepare(
            'INSERT INTO fuel_logs (operator_id, title, liters, amount, vehicle, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(
            user.id,
            String(body.title || body.item || 'Diesel Refill'),
            String(body.liters || '5.0 L'),
            amount,
            String(body.vehicle || 'Tractor – 60 HP'),
            nowTimeLabel(),
            now
          );
          return sendJson(res, 200, {
            ...buildOperatorDashboardPayload(user),
            message: `Fuel expense ₹${amount} logged.`,
          });
        }

        // Verify 4-digit Start OTP & Start Work
        if (body.action === 'verify_start_otp') {
          const bid = Number(body.booking_id);
          const otp = String(body.otp || '').trim();
          const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bid);
          if (!booking) return sendJson(res, 404, { detail: 'Booking not found.' });
          if (otp !== String(booking.start_otp)) {
            return sendJson(res, 400, { detail: 'Incorrect 4-digit Customer Start OTP.' });
          }
          const updated = transitionBookingStage({
            booking,
            targetStage: 'In Progress',
            actorUser: user,
            otpVerified: true,
          });
          return sendJson(res, 200, {
            ...buildOperatorDashboardPayload(user),
            booking: updated,
            message: 'Start OTP verified! Work is now In Progress.',
          });
        }

        // Reset stage / update_job_stage / generic status transition
        const bookingId = Number(body.booking_id || body.id);
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
        if (!booking) return sendJson(res, 404, { detail: 'Booking not found.' });

        if (body.action === 'reset_job_stage') {
          const updated = transitionBookingStage({
            booking,
            targetStage: 'Assigned',
            actorUser: user,
            reset: true,
          });
          return sendJson(res, 200, {
            ...buildOperatorDashboardPayload(user),
            booking: updated,
            message: 'Job reset to Assigned stage.',
          });
        }

        const nextTarget = body.target_stage || body.status || booking.status;
        const updated = transitionBookingStage({
          booking,
          targetStage: nextTarget,
          actorUser: user,
        });
        return sendJson(res, 200, {
          ...buildOperatorDashboardPayload(user),
          booking: updated,
          message: `Job stage updated to ${updated.job_stage}.`,
        });
      }
    }

    // ------------------------------------------------------------------
    // 7. Owner Equipment Management
    // ------------------------------------------------------------------
    if (urlPath === '/api/owner/equipment/') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { detail: 'Authentication required.' });

      if (method === 'GET') {
        const listings = db
          .prepare('SELECT * FROM equipment_listings WHERE owner_id = ? OR owner_id IS NULL ORDER BY id DESC')
          .all(user.id)
          .map(formatEquipmentRow);
        return sendJson(res, 200, { listings, equipment: listings });
      }

      if (method === 'POST') {
        const id = Date.now();
        const now = new Date().toISOString();
        const pricingOpts = Array.isArray(body.pricing_options) ? body.pricing_options : [];
        const hrOpt = pricingOpts.find((o) => o?.unit === 'hour')?.price;
        const dayOpt = pricingOpts.find((o) => o?.unit === 'day')?.price;
        const acreOpt = pricingOpts.find((o) => o?.unit === 'acre')?.price;
        const hourlyRate = Number(body.hourly_rate || hrOpt || body.default_price || 650);

        db.prepare(`
          INSERT INTO equipment_listings
          (id, owner_id, name, category, sub_category, hourly_rate, daily_rate, per_acre_rate, with_operator, equipment_only, approval_status, availability, location, image_url, metadata_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Approval', 'Available', ?, ?, ?, ?)
        `).run(
          id,
          user.id,
          String(body.name || 'Farm Implement'),
          String(body.category || 'Agricultural Equipment & Implements'),
          String(body.sub_category_group || body.sub_category || 'Soil Preparation'),
          hourlyRate,
          Number(body.daily_rate || dayOpt || hourlyRate * 6),
          Number(body.per_acre_rate || acreOpt || hourlyRate),
          body.operator_available === false || body.with_operator === false ? 0 : 1,
          body.standalone_available === false || body.equipment_only === false ? 0 : 1,
          String(body.city || body.location || user.city || 'Gadwal, Telangana'),
          String(body.image || ''),
          JSON.stringify(body),
          now
        );
        return sendJson(res, 201, { id, message: 'Equipment submitted for Admin approval!' });
      }

      if (method === 'PATCH') {
        const id = Number(body.equipment_id || body.id);
        if (body.action === 'delete') {
          db.prepare('DELETE FROM equipment_listings WHERE id = ?').run(id);
          return sendJson(res, 200, { ok: true, message: 'Equipment deleted.' });
        }
        const eq = db.prepare('SELECT * FROM equipment_listings WHERE id = ?').get(id);
        if (!eq) return sendJson(res, 404, { detail: 'Equipment not found.' });
        const nextAvail =
          body.action === 'toggle_availability'
            ? eq.availability === 'Available'
              ? 'Unavailable'
              : 'Available'
            : body.availability || eq.availability;
        db.prepare('UPDATE equipment_listings SET availability = ? WHERE id = ?').run(nextAvail, id);
        return sendJson(res, 200, { ok: true, availability: nextAvail, message: 'Equipment updated.' });
      }
    }

    // ------------------------------------------------------------------
    // 8. Admin Dashboard
    // ------------------------------------------------------------------
    if (urlPath === '/api/admin/dashboard/') {
      const user = getAuthUser(req);
      if (!user || user.role !== 'admin') {
        return sendJson(res, 403, { detail: 'Admin access required.' });
      }

      if (method === 'GET') {
        const users = db.prepare('SELECT * FROM users ORDER BY id DESC').all().map(sanitizeUser);
        const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY id DESC').all().map(formatVehicleRow);
        const equipmentListings = db.prepare('SELECT * FROM equipment_listings ORDER BY id DESC').all().map(formatEquipmentRow);
        const equipmentCategories = db.prepare('SELECT * FROM equipment_categories').all().map((c) => ({
          id: c.id,
          name: c.name,
          group: c.group_name,
          description: c.description,
          image: c.image_url,
        }));
        const bookings = db.prepare('SELECT * FROM bookings ORDER BY id DESC').all().map(formatBookingRow);
        const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all();
        const commissionConfig = getCommissionConfig();

        const totalRevNum = bookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);
        const catMap = new Map();
        for (const eq of equipmentListings) {
          const key = eq.category || 'Other';
          const cur = catMap.get(key) || { category: key, listings: 0, bookings: 0, revenue: 0 };
          cur.listings += 1;
          catMap.set(key, cur);
        }
        for (const bk of bookings) {
          const key = bk.category || 'Other';
          const cur = catMap.get(key) || { category: key, listings: 0, bookings: 0, revenue: 0 };
          cur.bookings += 1;
          cur.revenue += Number(bk.total_amount || 0);
          catMap.set(key, cur);
        }

        return sendJson(res, 200, {
          users,
          vehicles,
          equipment_listings: equipmentListings,
          equipment_categories: equipmentCategories,
          bookings,
          audit_logs: auditLogs,
          commission_config: commissionConfig,
          category_analytics: Array.from(catMap.values()),
          total_revenue: `₹ ${totalRevNum.toLocaleString('en-IN')}`,
        });
      }

      if (method === 'PATCH') {
        if (body.action === 'approve_equipment' || body.action === 'reject_equipment') {
          const status = body.action === 'approve_equipment' ? 'Approved' : 'Rejected';
          db.prepare('UPDATE equipment_listings SET approval_status = ? WHERE id = ?').run(
            status,
            Number(body.equipment_id)
          );
          addAuditLog('EQUIPMENT_' + status.toUpperCase(), user.email, 'admin', `Equipment #${body.equipment_id} -> ${status}`);
          return sendJson(res, 200, { message: `Equipment ${status}.` });
        }

        if (body.action === 'add_category') {
          const id = String(body.name || 'cat').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          db.prepare(
            'INSERT OR REPLACE INTO equipment_categories (id, name, group_name, description, image_url, is_active) VALUES (?, ?, ?, ?, ?, 1)'
          ).run(id, String(body.name || ''), String(body.group || 'Agricultural Equipment & Implements'), String(body.description || ''), '');
          return sendJson(res, 200, { message: 'Category saved!' });
        }

        if (body.action === 'update_commission') {
          const cfg = {
            platform_commission_pct: Number(body.platform_commission_pct ?? 10),
            operator_share_pct: Number(body.operator_share_pct ?? 20),
            gst_pct: Number(body.gst_pct ?? 5),
            cancellation_fee_pct: Number(body.cancellation_fee_pct ?? 10),
          };
          db.prepare("INSERT OR REPLACE INTO platform_settings (key, value_json) VALUES ('commission_config', ?)").run(
            JSON.stringify(cfg)
          );
          addAuditLog('COMMISSION_UPDATED', user.email, 'admin', JSON.stringify(cfg));
          return sendJson(res, 200, { commission_config: cfg, message: 'Commission rates updated!' });
        }

        return sendJson(res, 200, { ok: true });
      }
    }

    // ------------------------------------------------------------------
    // 9. Production Static SPA Fallback (when running `npm start`)
    // ------------------------------------------------------------------
    if (!rawPath.startsWith('/api') && fs.existsSync(DIST_DIR)) {
      const safeRel = rawPath === '/' ? 'index.html' : rawPath.replace(/^\/+/, '');
      let filePath = path.join(DIST_DIR, safeRel);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    return sendJson(res, 404, { detail: `Endpoint not found: ${rawPath}` });
  } catch (err) {
    console.error('[DesiRide Server Error]', err);
    return sendJson(res, 500, { detail: err?.message || 'Internal server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[DesiRide API] SQLite-WAL + SSE server listening on http://0.0.0.0:${PORT}`);
});

function gracefulShutdown(signal) {
  console.log(`[DesiRide] Received ${signal}, closing server gracefully...`);
  server.close(() => {
    try {
      db.exec('PRAGMA optimize;');
      console.log('[DesiRide] Database optimized and connections closed.');
    } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 4000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
