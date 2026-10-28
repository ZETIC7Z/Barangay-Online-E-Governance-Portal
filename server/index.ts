import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { createInitialSeedData } from './seedData.js';
import {
  ensureResidentDriveFolder,
  loadDriveIndex,
  saveBase64ToResidentDrive,
} from './driveVault.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
  maxHttpBufferSize: 15 * 1024 * 1024,
});

// =========================================================
// DEFENSE-IN-DEPTH SECURITY LAYER (Headers, Rate Limit, Referrer/IP Lock, NoSQL/XSS Sanitizer)
// =========================================================
const rateLimitBucket = new Map<string, { count: number; resetAt: number }>();

function sanitizeInputPayload(val: any): any {
  if (typeof val === 'string') {
    return val
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on(error|load|mouseover|focus)\s*=/gi, '');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeInputPayload);
  }
  if (val && typeof val === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (k.startsWith('$') || k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue; // Block NoSQL injection ($where, $gt, $ne) & Prototype Pollution
      }
      cleaned[k] = sanitizeInputPayload(v);
    }
    return cleaned;
  }
  return val;
}

app.use((req, res, next) => {
  // 1. Strict HTTP Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // 2. IP Sliding-Window Rate Limiter (Anti-Penetration / Anti-DDoS)
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  const now = Date.now();
  const bucket = rateLimitBucket.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBucket.set(ip, { count: 1, resetAt: now + 60_000 });
  } else {
    bucket.count += 1;
    if (bucket.count > 360) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Automated penetration or flood requests are blocked by Barangay Matatag Security Shield.',
      });
    }
  }

  // 3. Defense-in-Depth HTTP Referrer / Origin Restriction for Mutating API Calls
  if (req.path.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = String(req.headers.origin || req.headers.referer || '');
    const customAllowed = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const isTrustedOrigin =
      !origin ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('192.168.') ||
      origin.includes('.trycloudflare.com') ||
      origin.includes('.loca.lt') ||
      origin.includes('.lhr.life') ||
      origin.includes('.localhost.run') ||
      origin.includes('.pinggy.link') ||
      origin.includes('.vercel.app') ||
      origin.includes('zeticuz.xyz') ||
      customAllowed.some((allowed) => origin.includes(allowed));

    if (!isTrustedOrigin) {
      return res.status(403).json({
        error: 'Forbidden: Request blocked by HTTP Referrer / Origin domain restriction policy.',
      });
    }
  }

  next();
});

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Apply recursive NoSQL & XSS sanitization to all incoming payloads
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInputPayload(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInputPayload(req.query);
  }
  next();
});

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'brgy_matatag_secret_2026';

// Static serving for Google Drive Vault and Public Downloads
const VAULT_ROOT = path.resolve(process.env.GOOGLE_DRIVE_VAULT_ROOT || './storage/google_drive_vault');
fs.mkdirSync(VAULT_ROOT, { recursive: true });
app.use('/drive-vault', express.static(VAULT_ROOT));
app.use('/downloads', express.static(path.resolve('./public/downloads')));

// Hybrid MongoDB Atlas + Local Resilient Store
const STORAGE_DIR = path.resolve('./storage');
fs.mkdirSync(STORAGE_DIR, { recursive: true });
const DB_FILE = path.join(STORAGE_DIR, 'brgy_matatag_db.json');

type DatabaseState = ReturnType<typeof createInitialSeedData>;
let db: DatabaseState;
let mongoConnected = false;
let mongoClient: MongoClient | null = null;

function loadOrInitDb(): DatabaseState {
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed && parsed.seedVersion === '2026-10-28-v5' && parsed.users && parsed.residents) {
        return parsed;
      }
    } catch (err) {
      console.warn('Re-initializing local DB state:', err);
    }
  }
  const initial = {
    seedVersion: '2026-10-28-v5',
    ...createInitialSeedData(),
  } as any;
  // Ensure Google Drive folders exist for all seeded residents
  for (const r of initial.residents) {
    ensureResidentDriveFolder(r.fullName, r.id);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

db = loadOrInitDb();

function persistDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  if (mongoConnected && mongoClient) {
    const mdb = mongoClient.db('brgy_matatag');
    mdb
      .collection('portal_state')
      .updateOne(
        { _id: 'master_state' as any },
        { $set: { updatedAt: new Date().toISOString(), state: db } },
        { upsert: true }
      )
      .catch(() => {});
  }
}

async function connectMongoAtlas() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_SRV_URI;
  if (!uri) return;
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
    });
    await client.connect();
    mongoClient = client;
    mongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas Cluster (sws-member.yxddg7o.mongodb.net / brgy_matatag)');
    const mdb = client.db('brgy_matatag');
    await mdb.collection('portal_state').updateOne(
      { _id: 'master_state' as any },
      {
        $set: {
          updatedAt: new Date().toISOString(),
          state: db,
        },
      },
      { upsert: true }
    );
    console.log('✅ Synced Barangay Matatag E-Governance dataset (Chairwoman Hon. Hulma G. Abdurahman & Council) into MongoDB Atlas');
  } catch (err: any) {
    console.log('ℹ️ MongoDB Atlas operating in Local-First Resilient Sync Mode:', err?.message || '');
  }
}
connectMongoAtlas();

function addActivityLog(user: string, role: string, action: string, module: string, description: string, ip = '127.0.0.1') {
  const entry = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    user,
    role,
    action,
    module,
    description,
    ipAddress: ip,
    timestamp: new Date().toISOString(),
  };
  db.activityLogs.unshift(entry);
  if (db.activityLogs.length > 250) db.activityLogs.length = 250;
  persistDb();
  io.emit('activity:new', entry);
}

// ==========================================
// PUBLIC & OVERVIEW ENDPOINTS
// ==========================================

app.get('/api/bootstrap', (_req, res) => {
  res.json({
    barangay: {
      name: 'Barangay Matatag',
      city: 'Lamitan City',
      province: 'Basilan Province',
      region: 'BARMM',
      zipCode: '7302',
      coordinates: { lat: 6.6625, lng: 122.1347, dms: `6°39'45"N, 122°8'5"E` },
      hallAddress: 'Aguinaldo Street, Poblacion, Barangay Matatag, Lamitan City, Basilan 7302',
      population: 2854,
      projectedPopulation2026: 3120,
      households: 486,
      puroks: [
        'Purok 1 - Aguinaldo Central',
        'Purok 2 - Quezon Blvd Commercial',
        'Purok 3 - P. Cuevas Academic Zone',
        'Purok 4 - Patikul Interior Compound',
        'Purok 5 - Kalun Triangle / Plaza Periphery',
        'Purok 6 - East Matatag (Malinis Boundary)',
        'Purok 7 - South Matatag (Limo-ok Approach)',
      ],
      founder: 'Datu Kalun (Pedro Javier Cuevas, 1845–1904) • Founded June 1886',
      festival: 'Lami-Lamihan Festival (Annual June Celebration)',
      heritage: 'Home of the Finest Yakan Tennun Weavers (Bunga Sama & Sinaluan)',
    },
    mongoStatus: {
      connected: mongoConnected,
      cluster: 'sws-member.yxddg7o.mongodb.net',
      projectId: process.env.MONGODB_ATLAS_PROJECT_ID || '6a1f6ccb3d1fe946af2b6b90',
      publicKey: process.env.MONGODB_ATLAS_PUBLIC_KEY || 'nqfzewxd',
      mode: mongoConnected ? 'MongoDB Atlas Cloud + Local Sync' : 'Local-First MongoDB Sync Engine',
    },
    certificates: db.certificates,
    bulletins: db.bulletins,
    officials: db.officials,
    stats: {
      totalResidents: db.residents.length,
      censusPopulation: 2854,
      totalRequests: db.requests.length,
      pendingRequests: db.requests.filter((r) => r.status === 'Pending').length,
      approvedRequests: db.requests.filter((r) => r.status === 'Approved').length,
      releasedRequests: db.requests.filter((r) => r.status === 'Released').length,
      totalRevenue: db.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0),
      activeSummons: db.summons.filter((s) => s.status !== 'Settled').length,
      activeEmergencies: db.emergencies.filter((e) => e.status !== 'Resolved').length,
    },
  });
});

// ==========================================
// AUTHENTICATION & 3D SATELLITE SIGNUP
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const identifier = (username || '').trim().toLowerCase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );

  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  const residentProfile =
    db.residents.find((r) => r.id === (user as any).residentId || r.email.toLowerCase() === user.email.toLowerCase()) ||
    null;

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  addActivityLog(user.email, user.role, 'LOGIN', 'Authentication', `User ${user.fullName} logged in`);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      position: user.position,
      contactNumber: user.contactNumber,
      purok: user.purok,
      residentId: residentProfile?.id || (user as any).residentId || null,
      driveFolderName: residentProfile?.driveFolderName || (user as any).driveFolderName || null,
      driveFolderId: residentProfile?.driveFolderId || (user as any).driveFolderId || null,
    },
    residentProfile,
  });
});

app.post('/api/auth/register', (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    gender,
    birthDate,
    civilStatus,
    contactNumber,
    email,
    username,
    password,
    purok,
    street,
    houseNo,
    yearsOfResidency,
    voterStatus,
    occupation,
    is4Ps,
    isPWD,
    isSenior,
    pinnedLocation,
    selfieBase64,
    validIdBase64,
  } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUser = (username || cleanEmail).trim();

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUser.toLowerCase())) {
    return res.status(409).json({ error: 'An account with this email or username already exists.' });
  }

  const residentId = `RES-MTG-${String(db.residents.length + 1).padStart(3, '0')}`;
  const userId = `USR-RES-${Date.now()}`;
  const fullName = `${firstName} ${middleName ? middleName[0] + '. ' : ''}${lastName}`.trim();

  // Create dedicated Google Drive Vault folder for this resident account
  const driveFolder = ensureResidentDriveFolder(fullName, residentId);

  if (selfieBase64) {
    saveBase64ToResidentDrive({
      residentId,
      residentName: fullName,
      base64Data: selfieBase64,
      originalName: 'kyc_live_selfie.png',
      category: 'kyc_selfie',
      uploadedBy: fullName,
    });
  }
  if (validIdBase64) {
    saveBase64ToResidentDrive({
      residentId,
      residentName: fullName,
      base64Data: validIdBase64,
      originalName: 'kyc_valid_id.png',
      category: 'kyc_id',
      uploadedBy: fullName,
    });
  }

  const birthYear = birthDate ? new Date(birthDate).getFullYear() : 1998;
  const age = Math.max(18, 2026 - birthYear);

  const newResident = {
    id: residentId,
    accountId: userId,
    nationalId: `7302-${birthYear}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName,
    middleName: middleName || '',
    lastName,
    fullName,
    alias: firstName,
    gender: gender || 'Male',
    birthDate: birthDate || '1998-01-01',
    age,
    birthPlace: 'Lamitan City, Basilan',
    civilStatus: civilStatus || 'Single',
    citizenship: 'Filipino',
    ethnicity: 'Yakan / Lamiteño',
    contactNumber: contactNumber || '0917-000-7302',
    email: cleanEmail,
    purok: purok || 'Purok 1 - Aguinaldo Central',
    street: street || 'Aguinaldo Street',
    houseNo: houseNo || 'Pinned House Lot',
    address: `${houseNo || 'Pinned House'}, ${street || 'Aguinaldo St.'}, ${purok || 'Purok 1'}, Barangay Matatag, Lamitan City, Basilan 7302`,
    yearsOfResidency: Number(yearsOfResidency || 10),
    voterStatus: voterStatus || 'Yes',
    precinctNo: '0042A',
    occupation: occupation || 'Resident',
    is4Ps: Boolean(is4Ps),
    isPWD: Boolean(isPWD),
    isSenior: Boolean(isSenior || age >= 60),
    residentType: 'Alive',
    verificationStatus: 'Verified',
    pinnedLocation: pinnedLocation || {
      lat: 6.6625,
      lng: 122.1347,
      lotLabel: `${houseNo || 'Pinned House'} • ${street || 'Aguinaldo St.'}`,
      street: street || 'Aguinaldo Street',
      purok: purok || 'Purok 1 - Aguinaldo Central',
      confirmedAt: new Date().toISOString(),
    },
    liveLocation: {
      lat: pinnedLocation?.lat || 6.6625,
      lng: pinnedLocation?.lng || 122.1347,
      accuracy: 4.0,
      status: `Online • Pinned at ${street || 'Aguinaldo St.'}`,
      updatedAt: new Date().toISOString(),
    },
    driveFolderName: driveFolder.folderName,
    driveFolderId: driveFolder.folderId,
    createdAt: new Date().toISOString(),
  };

  const newUser = {
    id: userId,
    username: cleanUser,
    email: cleanEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    fullName,
    role: 'Resident',
    position: 'Registered Resident',
    status: 'Active',
    contactNumber: newResident.contactNumber,
    purok: newResident.purok,
    residentId,
    driveFolderName: driveFolder.folderName,
    driveFolderId: driveFolder.folderId,
    createdAt: new Date().toISOString(),
  };

  db.residents.unshift(newResident as any);
  db.users.push(newUser as any);

  // Welcome chat message from Barangay Matatag
  db.chatMessages.push({
    id: `MSG-${Date.now()}`,
    residentId,
    residentName: fullName,
    senderRole: 'Admin',
    senderName: 'Barangay Matatag Smart Command Center',
    message: `Assalamu Alaikum & Welcome ${fullName}! Your 3D Satellite House Pinpoint (${newResident.pinnedLocation.lotLabel}) and personal Google Drive Vault folder (${driveFolder.folderName}) are now active.`,
    imageUrl: null,
    driveFileId: null,
    driveFolderName: driveFolder.folderName,
    createdAt: new Date().toISOString(),
  });

  persistDb();
  addActivityLog(cleanEmail, 'Resident', 'REGISTER_RESIDENT', '3D GIS Registration', `Registered ${fullName} with 3D house pin at ${newResident.pinnedLocation.lotLabel}`);
  io.emit('resident:registered', newResident);

  const token = jwt.sign({ id: newUser.id, role: newUser.role, email: newUser.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.status(201).json({
    token,
    user: newUser,
    residentProfile: newResident,
  });
});

// ==========================================
// ZERO-LOGIN TRACKER & DOCUMENT REQUESTS
// ==========================================

app.get('/api/track/:code', (req, res) => {
  const q = (req.params.code || '').trim().toUpperCase();
  const found = db.requests.find(
    (r) =>
      r.trackingNumber.toUpperCase() === q ||
      r.shortCode.toUpperCase() === q ||
      r.id.toUpperCase() === q ||
      r.trackingNumber.toUpperCase().endsWith(q)
  );
  if (!found) {
    return res.status(404).json({
      error: `No application found matching reference "${req.params.code}". Try MTG-2026-8842 or MTG-2026-1028.`,
    });
  }
  res.json({ request: found });
});

app.get('/api/requests', (_req, res) => {
  res.json({ requests: db.requests });
});

app.post('/api/requests', (req, res) => {
  const {
    residentId,
    residentName,
    contactNumber,
    purok,
    certificateId,
    documentType,
    purpose,
    paymentMethod,
    businessDetails,
  } = req.body;

  const cert = db.certificates.find((c) => c.id === certificateId || c.name === documentType) || db.certificates[0];
  const rand4 = Math.floor(1000 + Math.random() * 9000);
  const trackingNumber = `MTG-2026-${rand4}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = chars[Math.floor(Math.random() * chars.length)];
  const shortCode = `MTG26${rand4}${suffix}`; // 10-character zero-login code

  const fee = Number(cert.fee || 0);
  const orNumber = fee > 0 ? `OR-MTG-2026-${Math.floor(1000 + Math.random() * 8999)}` : `FREE-EODB-2026-${rand4}`;

  const newReq = {
    id: `REQ-2026-${Date.now().toString().slice(-4)}`,
    trackingNumber,
    shortCode,
    residentId: residentId || 'RES-MTG-001',
    residentName: residentName || 'Amir K. Kalun',
    contactNumber: contactNumber || '0917-542-1886',
    purok: purok || 'Purok 1 - Aguinaldo Central',
    certificateId: cert.id,
    documentType: cert.name,
    purpose: purpose || 'Official Legal & Administrative Requirement',
    fee,
    paymentStatus: fee === 0 ? 'Waived (Free)' : 'Paid',
    paymentMethod: fee === 0 ? 'Free Service' : paymentMethod || 'GCash',
    orNumber,
    stage: 1,
    status: 'Pending',
    remarks: 'Application submitted online. Queued for Barangay Secretary verification.',
    businessDetails: businessDetails || null,
    dateFiled: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.requests.unshift(newReq);

  if (fee > 0) {
    db.payments.unshift({
      id: `PAY-${Date.now()}`,
      orNumber,
      requestId: newReq.id,
      trackingNumber,
      residentId: newReq.residentId,
      residentName: newReq.residentName,
      details: `${newReq.documentType} Processing Fee`,
      amount: fee,
      mode: paymentMethod || 'GCash',
      cashier: 'Online Portal Auto-OR',
      status: 'Verified',
      createdAt: new Date().toISOString(),
    });
  }

  persistDb();
  addActivityLog(newReq.residentName, 'Resident', 'FILE_REQUEST', 'Document Services', `Filed ${newReq.documentType} (${trackingNumber})`);
  io.emit('request:created', newReq);

  res.status(201).json({ request: newReq });
});

app.patch('/api/requests/:id', (req, res) => {
  const { stage, status, remarks } = req.body;
  const item = db.requests.find((r) => r.id === req.params.id || r.trackingNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Request not found' });

  if (stage !== undefined) item.stage = Number(stage);
  if (status) item.status = status;
  if (remarks !== undefined) item.remarks = remarks;
  item.updatedAt = new Date().toISOString();

  const notif = {
    id: `NOTIF-${Date.now()}`,
    targetResidentId: item.residentId,
    type: 'REQUEST_UPDATE',
    title: `Application ${item.trackingNumber} Updated: ${item.status}`,
    message: item.remarks || `Your ${item.documentType} is now at Stage ${item.stage} (${item.status}).`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notif);
  persistDb();

  addActivityLog('admin@test.com', 'Admin', 'UPDATE_REQUEST', 'Document Requests', `Updated ${item.trackingNumber} to ${item.status} (Stage ${item.stage})`);
  io.emit('request:updated', item);
  io.emit('notification:new', notif);

  res.json({ request: item });
});

// ==========================================
// SUBPOENA / SUMMONS / BLOTTER (KATARUNGANG PAMBARANGAY)
// ==========================================

app.get('/api/summons', (_req, res) => {
  res.json({ summons: db.summons });
});

app.post('/api/summons', (req, res) => {
  const {
    type,
    complainant,
    respondent,
    respondentResidentId,
    location,
    incidentDetails,
    hearingSchedule,
    presidingOfficer,
  } = req.body;

  const targetResident =
    db.residents.find((r) => r.id === respondentResidentId || r.fullName.toLowerCase() === (respondent || '').toLowerCase()) ||
    db.residents[0];

  const caseNumber = `KP-MTG-2026-${String(db.summons.length + 15).padStart(3, '0')}`;
  const newSummons = {
    id: `KP-${Date.now()}`,
    caseNumber,
    type: type || 'Subpoena / Lupon Mediation Summons (KP Form #9)',
    complainant: complainant || 'Barangay Peace & Order Council',
    respondent: targetResident ? targetResident.fullName : respondent,
    respondentResidentId: targetResident?.id || 'RES-MTG-001',
    respondentEmail: targetResident?.email || 'resident@gmail.com',
    location: location || 'Aguinaldo St., Purok 1, Barangay Matatag',
    incidentDetails: incidentDetails || 'Mandatory appearance for Katarungang Pambarangay mediation conference.',
    hearingSchedule: hearingSchedule || new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'Scheduled',
    subpoenaServed: true,
    acknowledgedByResident: false,
    presidingOfficer: presidingOfficer || 'Hon. Hulma G. Abdurahman (Punong Barangay / Chairwoman)',
    createdAt: new Date().toISOString(),
  };

  db.summons.unshift(newSummons);

  // Create high-priority Subpoena notification for the resident account
  const notif = {
    id: `NOTIF-SUB-${Date.now()}`,
    targetResidentId: newSummons.respondentResidentId,
    type: 'SUBPOENA',
    title: `⚖️ OFFICIAL SUBPOENA / SUMMONS ISSUED (${caseNumber})`,
    message: `URGENT: You (${newSummons.respondent}) are hereby summoned to appear at the Barangay Matatag Lupon Hall on ${new Date(newSummons.hearingSchedule).toLocaleString()} for Case ${caseNumber}. Complainant: ${newSummons.complainant}.`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notif);

  // Also inject official subpoena message into Resident's Live Chat
  db.chatMessages.push({
    id: `MSG-SUB-${Date.now()}`,
    residentId: newSummons.respondentResidentId,
    residentName: newSummons.respondent,
    senderRole: 'Admin',
    senderName: '⚖️ Lupong Tagapamayapa • Subpoena Desk',
    message: `[OFFICIAL SUBPOENA ${caseNumber}] Respondent: ${newSummons.respondent}. You are formally notified to appear before ${newSummons.presidingOfficer} on ${new Date(newSummons.hearingSchedule).toLocaleString()} regarding: "${newSummons.incidentDetails}". Please click Acknowledge in your Subpoena Alert banner.`,
    imageUrl: null,
    driveFileId: null,
    driveFolderName: targetResident?.driveFolderName || 'Amir_K_Kalun_MTG001',
    createdAt: new Date().toISOString(),
  });

  persistDb();
  addActivityLog('admin@test.com', 'Admin', 'DISPATCH_SUBPOENA', 'Katarungang Pambarangay', `Issued Subpoena ${caseNumber} to ${newSummons.respondent}`);

  io.emit('subpoena:issued', newSummons);
  io.emit('notification:new', notif);
  io.emit('chat:message', db.chatMessages[db.chatMessages.length - 1]);

  res.status(201).json({ summons: newSummons });
});

app.patch('/api/summons/:id/acknowledge', (req, res) => {
  const item = db.summons.find((s) => s.id === req.params.id || s.caseNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Summons not found' });
  item.acknowledgedByResident = true;
  if (req.body.status) item.status = req.body.status;
  persistDb();
  io.emit('subpoena:updated', item);
  res.json({ summons: item });
});

// ==========================================
// LIVE EMERGENCY SOS & REAL-TIME GPS LOCATION
// ==========================================

app.get('/api/emergencies', (_req, res) => {
  res.json({ emergencies: db.emergencies });
});

app.post('/api/emergencies', (req, res) => {
  const { residentId, residentName, contactNumber, purok, type, severity, message, lat, lng, address, photoBase64 } =
    req.body;

  let photoUrl: string | null = null;
  if (photoBase64) {
    const saved = saveBase64ToResidentDrive({
      residentId: residentId || 'RES-MTG-001',
      residentName: residentName || 'Amir K. Kalun',
      base64Data: photoBase64,
      originalName: 'emergency_sos_evidence.png',
      category: 'emergency_photo',
      uploadedBy: residentName || 'Resident',
    });
    photoUrl = saved.publicUrl;
  }

  const newSos = {
    id: `SOS-${Date.now()}`,
    residentId: residentId || 'RES-MTG-001',
    residentName: residentName || 'Amir K. Kalun',
    contactNumber: contactNumber || '0917-542-1886',
    purok: purok || 'Purok 1 - Aguinaldo Central',
    type: type || 'Medical / Rescue Emergency',
    severity: severity || 'Critical',
    message: message || 'Immediate emergency assistance needed at my pinned/live GPS location!',
    lat: Number(lat || 6.66275),
    lng: Number(lng || 122.13485),
    address: address || 'Aguinaldo St., Purok 1, Barangay Matatag, Lamitan City',
    photoUrl,
    status: 'ACTIVE SOS • Dispatching Responders',
    responderNotes: 'Alert received by Barangay Matatag Command Center & BPAT Quick Response Team.',
    createdAt: new Date().toISOString(),
  };

  db.emergencies.unshift(newSos);

  // Update resident's live GPS location
  const resRecord = db.residents.find((r) => r.id === newSos.residentId);
  if (resRecord) {
    resRecord.liveLocation = {
      lat: newSos.lat,
      lng: newSos.lng,
      accuracy: 3.0,
      status: `🚨 EMERGENCY SOS: ${newSos.type}`,
      updatedAt: new Date().toISOString(),
    };
  }

  persistDb();
  addActivityLog(newSos.residentName, 'Resident', 'EMERGENCY_SOS', 'Emergency Command', `Triggered ${newSos.severity} SOS (${newSos.type}) at ${newSos.lat.toFixed(5)}, ${newSos.lng.toFixed(5)}`);
  io.emit('emergency:sos', newSos);

  res.status(201).json({ emergency: newSos });
});

app.patch('/api/emergencies/:id', (req, res) => {
  const item = db.emergencies.find((e) => e.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Emergency record not found' });
  if (req.body.status) item.status = req.body.status;
  if (req.body.responderNotes) item.responderNotes = req.body.responderNotes;
  persistDb();
  io.emit('emergency:updated', item);
  res.json({ emergency: item });
});

app.post('/api/residents/:id/location', (req, res) => {
  const resident = db.residents.find((r) => r.id === req.params.id);
  if (!resident) return res.status(404).json({ error: 'Resident not found' });
  const { lat, lng, status, updatePin, lotLabel, street, purok } = req.body;

  resident.liveLocation = {
    lat: Number(lat || resident.liveLocation.lat),
    lng: Number(lng || resident.liveLocation.lng),
    accuracy: 3.5,
    status: status || 'Live GPS Active',
    updatedAt: new Date().toISOString(),
  };

  if (updatePin) {
    resident.pinnedLocation = {
      lat: Number(lat),
      lng: Number(lng),
      lotLabel: lotLabel || resident.pinnedLocation.lotLabel,
      street: street || resident.street,
      purok: purok || resident.purok,
      confirmedAt: new Date().toISOString(),
    };
  }

  persistDb();
  io.emit('resident:location', { residentId: resident.id, liveLocation: resident.liveLocation, pinnedLocation: resident.pinnedLocation });
  res.json({ resident });
});

// ==========================================
// REAL-TIME CHAT + GOOGLE DRIVE IMAGE VAULT
// ==========================================

app.get('/api/chat', (req, res) => {
  const { residentId } = req.query;
  const messages = residentId
    ? db.chatMessages.filter((m) => m.residentId === residentId)
    : db.chatMessages;
  res.json({ messages, driveFiles: loadDriveIndex() });
});

app.post('/api/chat', (req, res) => {
  const { residentId, residentName, senderRole, senderName, message, imageBase64, imageName } = req.body;
  const targetResident =
    db.residents.find((r) => r.id === residentId) || db.residents[0];

  let imageUrl: string | null = null;
  let driveFileId: string | null = null;
  let driveFolderName = targetResident.driveFolderName;

  if (imageBase64) {
    const savedFile = saveBase64ToResidentDrive({
      residentId: targetResident.id,
      residentName: targetResident.fullName,
      base64Data: imageBase64,
      originalName: imageName || 'chat_upload.png',
      category: 'chat_image',
      uploadedBy: senderName || targetResident.fullName,
    });
    imageUrl = savedFile.publicUrl;
    driveFileId = savedFile.id;
    driveFolderName = savedFile.driveFolderName;
  }

  const newMsg = {
    id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    residentId: targetResident.id,
    residentName: targetResident.fullName,
    senderRole: senderRole || 'Resident',
    senderName: senderName || targetResident.fullName,
    message: message || (imageUrl ? '📎 Shared an image to Google Drive Vault' : ''),
    imageUrl,
    driveFileId,
    driveFolderName,
    createdAt: new Date().toISOString(),
  };

  db.chatMessages.push(newMsg);
  persistDb();

  io.emit('chat:message', newMsg);
  res.status(201).json({ message: newMsg, driveFiles: loadDriveIndex() });
});

app.get('/api/drive-vault', (req, res) => {
  const { residentId } = req.query;
  const allFiles = loadDriveIndex();
  const files = residentId ? allFiles.filter((f) => f.residentId === residentId) : allFiles;
  const folders = db.residents.map((r) => ({
    residentId: r.id,
    residentName: r.fullName,
    purok: r.purok,
    driveFolderName: r.driveFolderName,
    driveFolderId: r.driveFolderId,
    fileCount: allFiles.filter((f) => f.residentId === r.id).length,
  }));
  res.json({ folders, files });
});

// ==========================================
// BULLETINS / BROADCAST ANNOUNCEMENTS
// ==========================================

app.post('/api/bulletins', (req, res) => {
  const { title, category, priority, content, pinned, postedBy } = req.body;
  const newBul = {
    id: `BUL-${Date.now()}`,
    pinned: Boolean(pinned),
    category: category || 'Community Advisory',
    priority: priority || 'High',
    title,
    content,
    publishedDate: new Date().toISOString().slice(0, 10),
    postedBy: postedBy || 'Hon. Hulma G. Abdurahman (Punong Barangay / Chairwoman)',
    likes: 1,
    helpful: 1,
    comments: [],
  };
  db.bulletins.unshift(newBul);

  const notif = {
    id: `NOTIF-BUL-${Date.now()}`,
    targetResidentId: 'ALL',
    type: 'BROADCAST',
    title: `📢 [${newBul.category}] ${newBul.title}`,
    message: newBul.content,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notif);
  persistDb();

  addActivityLog('admin@test.com', 'Admin', 'BROADCAST_BULLETIN', 'Bulletins', `Broadcasted "${newBul.title}" to all Barangay Matatag residents`);
  io.emit('announcement:broadcast', newBul);
  io.emit('notification:new', notif);

  res.status(201).json({ bulletin: newBul });
});

app.post('/api/bulletins/:id/react', (req, res) => {
  const bul = db.bulletins.find((b) => b.id === req.params.id);
  if (!bul) return res.status(404).json({ error: 'Bulletin not found' });
  const { type, comment, author } = req.body;
  if (type === 'like') bul.likes += 1;
  if (type === 'helpful') bul.helpful += 1;
  if (comment) {
    bul.comments.push({
      id: `CMT-${Date.now()}`,
      author: author || 'Resident of Brgy. Matatag',
      role: 'Verified Resident',
      text: comment,
      createdAt: new Date().toISOString(),
    });
  }
  persistDb();
  io.emit('announcement:updated', bul);
  res.json({ bulletin: bul });
});

// ==========================================
// BORROW REQUESTS, RESIDENTS, OFFICIALS, ARCHIVE & LOGS
// ==========================================

app.get('/api/admin/full-data', (_req, res) => {
  res.json({
    ...db,
    driveVault: {
      files: loadDriveIndex(),
      folders: db.residents.map((r) => ({
        residentId: r.id,
        residentName: r.fullName,
        driveFolderName: r.driveFolderName,
        driveFolderId: r.driveFolderId,
      })),
    },
  });
});

app.post('/api/borrows', (req, res) => {
  const { residentId, residentName, contactNumber, itemsBorrowed, quantity, borrowDate, returnDate, purpose } =
    req.body;
  const newBorrow = {
    id: `BRW-${Date.now()}`,
    residentId: residentId || 'RES-MTG-001',
    residentName: residentName || 'Amir K. Kalun',
    contactNumber: contactNumber || '0917-542-1886',
    itemsBorrowed,
    quantity: Number(quantity || 1),
    borrowDate: borrowDate || new Date().toISOString().slice(0, 10),
    returnDate: returnDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    purpose: purpose || 'Community Event',
    verificationDoc: 'Verified Digital Resident ID',
    status: 'Pending',
    remarks: 'Submitted for Barangay Property Custodian approval.',
    processedBy: 'Pending',
    createdAt: new Date().toISOString(),
  };
  db.borrows.unshift(newBorrow);
  persistDb();
  io.emit('borrow:created', newBorrow);
  res.status(201).json({ borrow: newBorrow });
});

app.patch('/api/borrows/:id', (req, res) => {
  const item = db.borrows.find((b) => b.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.body.status) item.status = req.body.status;
  if (req.body.remarks) item.remarks = req.body.remarks;
  item.processedBy = 'Hon. Hulma G. Abdurahman';
  persistDb();
  io.emit('borrow:updated', item);
  res.json({ borrow: item });
});

app.post('/api/archive/:id/restore', (req, res) => {
  const idx = db.archives.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Archive item not found' });
  const [restored] = db.archives.splice(idx, 1);
  persistDb();
  addActivityLog('admin@test.com', 'Admin', 'RESTORE_ARCHIVE', 'Archive Vault', `Restored ${restored.name} (${restored.category})`);
  res.json({ restored, archives: db.archives });
});

// Socket.IO Real-Time Connection Handler
io.on('connection', (socket) => {
  socket.on('location:ping', (payload) => {
    const resRecord = db.residents.find((r) => r.id === payload?.residentId);
    if (resRecord && payload.lat && payload.lng) {
      resRecord.liveLocation = {
        lat: Number(payload.lat),
        lng: Number(payload.lng),
        accuracy: Number(payload.accuracy || 4.0),
        status: payload.status || 'Live GPS Stream Active',
        updatedAt: new Date().toISOString(),
      };
      io.emit('resident:location', {
        residentId: resRecord.id,
        liveLocation: resRecord.liveLocation,
        pinnedLocation: resRecord.pinnedLocation,
      });
    }
  });
});

// Serve built frontend in production & remote tunnel preview
const DIST_PATH = path.resolve('./dist');
app.use(express.static(DIST_PATH));
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/drive-vault') ||
    req.path.startsWith('/downloads') ||
    req.path.startsWith('/socket.io')
  ) {
    return next();
  }
  const indexHtml = path.join(DIST_PATH, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  return next();
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Barangay Matatag Smart E-Governance Server running on http://localhost:${PORT}`);
  });
}

export { app, server };
export default app;

