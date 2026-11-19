import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
export const DB_PATH = process.env.DESIRIDE_DB_PATH
  ? path.resolve(process.env.DESIRIDE_DB_PATH)
  : path.join(DATA_DIR, 'desiride.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const LEGACY_JSON_DB = path.resolve(
  'C:/Users/suvar/.gemini/antigravity/brain/baae82eb-cfda-47f1-9c67-c84bb7adf999/desiride_mysql_store.json'
);

export const JWT_SECRET =
  process.env.JWT_SECRET || 'desiride-hmac-sha256-jwt-secret-key-2026';

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for high-concurrency multi-user performance
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

// Create normalized relational schema + indexes
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer','owner','operator','admin')),
    business_name TEXT DEFAULT '',
    licence_number TEXT DEFAULT '',
    licence_expiry TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT 'Gadwal',
    state TEXT DEFAULT 'Telangana',
    pincode TEXT DEFAULT '',
    is_mobile_verified INTEGER DEFAULT 1,
    is_email_verified INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

  CREATE TABLE IF NOT EXISTS operator_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    licence_number TEXT DEFAULT '',
    licence_expiry TEXT DEFAULT '',
    verified_operator INTEGER DEFAULT 1,
    on_duty INTEGER DEFAULT 1,
    active_job_id INTEGER,
    current_lat REAL DEFAULT 16.2300,
    current_lng REAL DEFAULT 77.8000,
    rating REAL DEFAULT 4.8,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    liters TEXT DEFAULT '5.0 L',
    amount REAL NOT NULL,
    vehicle TEXT DEFAULT '',
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_fuel_logs_operator ON fuel_logs(operator_id);

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    registration_number TEXT DEFAULT '',
    rate_label TEXT DEFAULT '',
    hourly_rate REAL DEFAULT 0,
    per_km_rate REAL DEFAULT 0,
    status TEXT DEFAULT 'Available',
    location TEXT DEFAULT 'Gadwal, Telangana',
    image_url TEXT DEFAULT '',
    specs_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
  CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
  CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

  CREATE TABLE IF NOT EXISTS equipment_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS equipment_listings (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT DEFAULT '',
    hourly_rate REAL DEFAULT 0,
    daily_rate REAL DEFAULT 0,
    per_acre_rate REAL DEFAULT 0,
    with_operator INTEGER DEFAULT 1,
    equipment_only INTEGER DEFAULT 1,
    approval_status TEXT DEFAULT 'Approved',
    availability TEXT DEFAULT 'Available',
    location TEXT DEFAULT 'Gadwal, Telangana',
    image_url TEXT DEFAULT '',
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment_listings(owner_id);
  CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_listings(category);
  CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment_listings(approval_status);

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY,
    booking_code TEXT NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    operator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    vehicle_id INTEGER,
    equipment_id INTEGER,
    service_name TEXT NOT NULL,
    category TEXT DEFAULT '',
    pickup_location TEXT NOT NULL,
    drop_location TEXT DEFAULT '',
    booking_date TEXT NOT NULL,
    duration_label TEXT DEFAULT '',
    need_operator INTEGER DEFAULT 1,
    total_amount REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending',
    live_stage TEXT DEFAULT 'Requested',
    start_otp TEXT NOT NULL,
    otp_verified INTEGER DEFAULT 0,
    operator_lat REAL,
    operator_lng REAL,
    eta_minutes INTEGER,
    payment_status TEXT DEFAULT 'Pending',
    notes TEXT DEFAULT '',
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_operator ON bookings(operator_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

  CREATE TABLE IF NOT EXISTS booking_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    actor_id INTEGER,
    actor_role TEXT DEFAULT '',
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_booking_events_bid ON booking_events(booking_id);

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    target_role TEXT DEFAULT '',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role, is_read);

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    role TEXT DEFAULT 'unknown',
    details TEXT DEFAULT '',
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    attempt_key TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    locked_until INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS otp_verifications (
    identifier TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    purpose TEXT DEFAULT 'verify',
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  );
`);

try {
  db.exec('ALTER TABLE operator_profiles ADD COLUMN active_job_id INTEGER;');
} catch {
  // column already exists
}

export function getKv(key, fallback = null) {
  const row = db.prepare('SELECT value_json FROM kv_store WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value_json);
  } catch {
    return fallback;
  }
}

export function setKv(key, value) {
  db.prepare('INSERT OR REPLACE INTO kv_store (key, value_json) VALUES (?, ?)').run(
    key,
    JSON.stringify(value)
  );
}

export function hashPassword(password, salt) {
  const actualSalt = salt || crypto.randomBytes(12).toString('hex');
  const derived = crypto
    .pbkdf2Sync(String(password), actualSalt, 100000, 32, 'sha256')
    .toString('hex');
  return `pbkdf2_sha256$100000$${actualSalt}$${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;
  const salt = parts[2];
  return hashPassword(password, salt) === storedHash;
}

export function signJwt(payload, expiresInSec) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url'
  );
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (signature !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() / 1000 > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function runInTransaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    business_name: u.business_name || '',
    licence_number: u.licence_number || '',
    licence_expiry: u.licence_expiry || '',
    address: u.address || '',
    city: u.city || 'Gadwal',
    state: u.state || 'Telangana',
    pincode: u.pincode || '',
    is_mobile_verified: Boolean(u.is_mobile_verified),
    is_email_verified: Boolean(u.is_email_verified),
    created_at: u.created_at,
  };
}

export function addAuditLog(action, actor, role, details) {
  db.prepare(
    'INSERT INTO audit_logs (action, actor, role, details, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).run(action, actor || 'system', role || 'system', details || '', new Date().toISOString());
}

export function createNotification(optsOrUserId, targetRoleArg, titleArg, messageArg, metadataArg) {
  let userId = null;
  let targetRole = '';
  let title = '';
  let message = '';
  let metadata = {};

  if (typeof optsOrUserId === 'object' && optsOrUserId !== null) {
    userId = optsOrUserId.userId ?? optsOrUserId.user_id ?? null;
    targetRole = optsOrUserId.targetRole ?? optsOrUserId.target_role ?? '';
    title = optsOrUserId.title || '';
    message = optsOrUserId.message || '';
    metadata = optsOrUserId.metadata || {};
  } else {
    userId = optsOrUserId ?? null;
    targetRole = targetRoleArg || '';
    title = titleArg || '';
    message = messageArg || '';
    metadata = metadataArg || {};
  }

  const createdAt = new Date().toISOString();
  const info = db
    .prepare(
      'INSERT INTO notifications (user_id, target_role, title, message, is_read, metadata_json, created_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
    )
    .run(userId, targetRole, title, message, JSON.stringify(metadata), createdAt);
  return {
    id: Number(info.lastInsertRowid),
    user_id: userId,
    target_role: targetRole,
    title,
    message,
    unread: true,
    metadata,
    time: 'Just now',
    created_at: createdAt,
  };
}

export function generateOtp4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function migrateFromLegacyJsonIfNeeded() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return;

  let legacy = null;
  if (fs.existsSync(LEGACY_JSON_DB)) {
    try {
      legacy = JSON.parse(fs.readFileSync(LEGACY_JSON_DB, 'utf8'));
    } catch {
      legacy = null;
    }
  }

  runInTransaction(() => {
    const now = new Date().toISOString();
    const usersToInsert =
      legacy?.users?.length > 0
        ? legacy.users
        : [
            {
              id: 1,
              full_name: 'Desi Ride System Admin',
              email: 'admin@desiride.in',
              mobile: '9000000001',
              password_hash: hashPassword('Admin@123'),
              role: 'admin',
              address: 'Desi Ride HQ, Station Road',
              city: 'Gadwal',
              state: 'Telangana',
              pincode: '509125',
              is_mobile_verified: true,
              is_email_verified: true,
              created_at: now,
            },
            {
              id: 2,
              full_name: 'Ramesh Reddy',
              email: 'owner@desiride.in',
              mobile: '9000000002',
              password_hash: hashPassword('Owner@123'),
              role: 'owner',
              business_name: 'Reddy Agro & Fleet Services',
              address: 'Raichur Road, Near Market Yard',
              city: 'Gadwal',
              state: 'Telangana',
              pincode: '509125',
              is_mobile_verified: true,
              is_email_verified: true,
              created_at: now,
            },
            {
              id: 3,
              full_name: 'Srinivasulu Goud',
              email: 'operator@desiride.in',
              mobile: '9000000003',
              password_hash: hashPassword('Operator@123'),
              role: 'operator',
              licence_number: 'TS33 20180094210',
              licence_expiry: '2031-06-30',
              address: 'Gandhi Nagar',
              city: 'Gadwal',
              state: 'Telangana',
              pincode: '509125',
              is_mobile_verified: true,
              is_email_verified: true,
              created_at: now,
            },
            {
              id: 4,
              full_name: 'Kiran Kumar',
              email: 'customer@desiride.in',
              mobile: '9000000004',
              password_hash: hashPassword('Customer@123'),
              role: 'customer',
              address: 'Main Bazaar, Clock Tower',
              city: 'Gadwal',
              state: 'Telangana',
              pincode: '509125',
              is_mobile_verified: true,
              is_email_verified: true,
              created_at: now,
            },
          ];

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users
      (id, full_name, email, mobile, password_hash, role, business_name, licence_number, licence_expiry, address, city, state, pincode, is_mobile_verified, is_email_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOpProfile = db.prepare(`
      INSERT OR IGNORE INTO operator_profiles
      (user_id, licence_number, licence_expiry, verified_operator, on_duty, current_lat, current_lng, rating, updated_at)
      VALUES (?, ?, ?, 1, 1, 16.23, 77.80, 4.9, ?)
    `);

    for (const u of usersToInsert) {
      insertUser.run(
        u.id,
        u.full_name || 'Desi Ride User',
        String(u.email || '').toLowerCase(),
        String(u.mobile || ''),
        u.password_hash || hashPassword('DesiRide@123'),
        u.role || 'customer',
        u.business_name || '',
        u.licence_number || '',
        u.licence_expiry || '',
        u.address || '',
        u.city || 'Gadwal',
        u.state || 'Telangana',
        u.pincode || '',
        u.is_mobile_verified === false ? 0 : 1,
        u.is_email_verified === false ? 0 : 1,
        u.created_at || now
      );
      if (u.role === 'operator') {
        insertOpProfile.run(u.id, u.licence_number || '', u.licence_expiry || '', now);
      }
    }

    // Migrate owner vehicles
    if (Array.isArray(legacy?.owner_vehicles)) {
      const insertVeh = db.prepare(`
        INSERT OR IGNORE INTO vehicles
        (id, owner_id, name, category, registration_number, rate_label, hourly_rate, per_km_rate, status, location, image_url, specs_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const v of legacy.owner_vehicles) {
        insertVeh.run(
          Number(v.id) || Date.now(),
          v.owner_id || 2,
          v.name || v.title || 'Vehicle',
          v.category || 'Agricultural Vehicles',
          v.registration_number || v.reg_no || '',
          v.rate_label || v.price || '',
          Number(v.hourly_rate || 0),
          Number(v.per_km_rate || 0),
          v.status || 'Available',
          v.location || 'Gadwal, Telangana',
          v.image || v.image_url || '',
          JSON.stringify(v),
          now
        );
      }
    }

    // Migrate equipment categories
    if (Array.isArray(legacy?.equipment_categories)) {
      const insertCat = db.prepare(`
        INSERT OR IGNORE INTO equipment_categories (id, name, group_name, description, image_url, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `);
      for (const c of legacy.equipment_categories) {
        insertCat.run(
          String(c.id || c.name),
          c.name || 'Equipment',
          c.group || c.group_name || 'Agricultural Equipment & Implements',
          c.description || '',
          c.image || ''
        );
      }
    }

    // Migrate equipment listings
    if (Array.isArray(legacy?.equipment_listings)) {
      const insertEq = db.prepare(`
        INSERT OR IGNORE INTO equipment_listings
        (id, owner_id, name, category, sub_category, hourly_rate, daily_rate, per_acre_rate, with_operator, equipment_only, approval_status, availability, location, image_url, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const eq of legacy.equipment_listings) {
        insertEq.run(
          Number(eq.id) || Date.now(),
          eq.owner_id || 2,
          eq.name || 'Equipment',
          eq.category || 'Agricultural Equipment & Implements',
          eq.sub_category || eq.group || '',
          Number(eq.hourly_rate || 0),
          Number(eq.daily_rate || 0),
          Number(eq.per_acre_rate || 0),
          eq.with_operator === false ? 0 : 1,
          eq.equipment_only === false ? 0 : 1,
          eq.approval_status || 'Approved',
          eq.availability || 'Available',
          eq.location || 'Gadwal, Telangana',
          eq.image || '',
          JSON.stringify(eq),
          now
        );
      }
    }

    // Migrate bookings
    const allLegacyBookings = [
      ...(Array.isArray(legacy?.bookings) ? legacy.bookings : []),
      ...(Array.isArray(legacy?.owner_booking_requests) ? legacy.owner_booking_requests : []),
    ];
    const insertBk = db.prepare(`
      INSERT OR IGNORE INTO bookings
      (id, booking_code, customer_id, owner_id, operator_id, vehicle_id, equipment_id, service_name, category, pickup_location, drop_location, booking_date, duration_label, need_operator, total_amount, status, live_stage, start_otp, otp_verified, operator_lat, operator_lng, eta_minutes, payment_status, notes, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < allLegacyBookings.length; i++) {
      const b = allLegacyBookings[i];
      const bid = Number(b.id) || 1000 + i;
      const status = b.status || 'Confirmed';
      const stage = status.toLowerCase().includes('complet')
        ? 'Completed'
        : status.toLowerCase().includes('progress') || status.toLowerCase().includes('start')
        ? 'Work In Progress'
        : status.toLowerCase().includes('confirm') || status.toLowerCase().includes('accept')
        ? 'Operator Assigned'
        : 'Requested';
      insertBk.run(
        bid,
        b.booking_code || `DR-${bid}`,
        b.customer_id || 4,
        b.owner_id || 2,
        b.operator_id || 3,
        b.vehicle_id || null,
        b.equipment_id || null,
        b.vehicle_name || b.service_name || b.equipment_name || 'Tractor & Implement Booking',
        b.category || 'Agricultural Vehicles',
        b.pickup_location || b.location || 'Gadwal, Telangana',
        b.drop_location || '',
        b.booking_date || b.date || now.slice(0, 10),
        b.duration_label || b.duration || '4 Hours',
        b.need_operator === false ? 0 : 1,
        Number(b.total_amount || b.amount || b.estimated_price || 2400),
        status,
        stage,
        b.start_otp || generateOtp4(),
        stage === 'Completed' || stage === 'Work In Progress' ? 1 : 0,
        16.23,
        77.80,
        12,
        stage === 'Completed' ? 'Paid' : 'Pending',
        b.notes || '',
        JSON.stringify(b),
        b.created_at || now,
        now
      );
    }

    // Store auxiliary collections in kv_store
    const kvKeys = [
      'owner_stats',
      'compatible_tractors',
      'commission_config',
      'customer_profiles',
      'owner_profiles',
    ];
    const insertKv = db.prepare(
      'INSERT OR IGNORE INTO kv_store (key, value_json) VALUES (?, ?)'
    );
    for (const k of kvKeys) {
      if (legacy && legacy[k] !== undefined) {
        insertKv.run(k, JSON.stringify(legacy[k]));
      }
    }

    if (Array.isArray(legacy?.audit_logs)) {
      const insertLog = db.prepare(
        'INSERT INTO audit_logs (action, actor, role, details, timestamp) VALUES (?, ?, ?, ?, ?)'
      );
      for (const log of legacy.audit_logs.slice(0, 100)) {
        insertLog.run(
          log.action || 'EVENT',
          log.actor || 'system',
          log.role || 'system',
          log.details || '',
          log.timestamp || now
        );
      }
    }

    db.prepare(
      'INSERT OR IGNORE INTO platform_settings (key, value_json) VALUES (?, ?)'
    ).run(
      'commission_config',
      JSON.stringify(
        legacy?.commission_config || {
          platform_commission_pct: 10,
          operator_share_pct: 20,
          gst_pct: 5,
          cancellation_fee_pct: 10,
        }
      )
    );
  });
}

function ensureBaselineDefaults() {
  const now = new Date().toISOString();
  const fuelCount = db.prepare('SELECT COUNT(*) AS c FROM fuel_logs').get().c;
  if (fuelCount === 0) {
    const op = db.prepare("SELECT id FROM users WHERE role = 'operator' ORDER BY id ASC LIMIT 1").get();
    if (op) {
      db.prepare(
        'INSERT INTO fuel_logs (operator_id, title, liters, amount, vehicle, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(op.id, 'Diesel Refill', '7.0 L', 640, 'Tractor – 60 HP', 'Today, 08:10 AM', now);
    }
  }

  const tractors = getKv('compatible_tractors', null);
  if (!Array.isArray(tractors) || tractors.length === 0) {
    setKv('compatible_tractors', [
      { id: 'tr-60hp', name: 'John Deere 5310 (55-60 HP)', hp: 60, hourly_rate: 850 },
      { id: 'tr-50hp', name: 'Mahindra 575 DI (45-50 HP)', hp: 50, hourly_rate: 720 },
      { id: 'tr-75hp', name: 'Swaraj 963 FE (60-65 HP)', hp: 65, hourly_rate: 950 },
    ]);
  }

  const eqCount = db.prepare('SELECT COUNT(*) AS c FROM equipment_listings').get().c;
  if (eqCount === 0) {
    const owner = db.prepare("SELECT id FROM users WHERE role = 'owner' ORDER BY id ASC LIMIT 1").get();
    const ownerId = owner?.id || 2;
    db.prepare(
      'INSERT OR IGNORE INTO equipment_categories (id, name, group_name, description, image_url, is_active) VALUES (?, ?, ?, ?, ?, 1)'
    ).run('rotavator', 'Rotavator', 'Soil Preparation', 'Heavy-duty rotary tiller for seedbed preparation', '/assets/vehicles/agriculture/cultivator.png');
    db.prepare(`
      INSERT OR IGNORE INTO equipment_listings
      (id, owner_id, name, category, sub_category, hourly_rate, daily_rate, per_acre_rate, with_operator, equipment_only, approval_status, availability, location, image_url, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'Approved', 'Available', 'Gadwal, Telangana', ?, ?, ?)
    `).run(
      9001,
      ownerId,
      'Heavy-Duty 7ft Rotavator',
      'Agricultural Equipment & Implements',
      'Soil Preparation',
      650,
      4200,
      900,
      '/assets/vehicles/agriculture/cultivator.png',
      JSON.stringify({ main_category: 'agri-equipment', sub_category_group: 'Soil Preparation', equipment_type: 'Rotavator', condition: 'Excellent' }),
      now
    );
  }
}

migrateFromLegacyJsonIfNeeded();
ensureBaselineDefaults();

