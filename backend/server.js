const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    const fallback = {
      users: [],
      queue: [],
      medicines: [],
      labTests: [],
      attendance: [],
      rooms: [],
      reports: [],
      session: null,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function normalizeVitals(vitals = {}) {
  return {
    weight: vitals.weight ?? '',
    temperature: vitals.temperature ?? '',
    bloodPressure: vitals.bloodPressure ?? '',
    notes: vitals.notes ?? '',
  };
}

function hasCompleteVitals(vitals = {}) {
  const weight = String(vitals.weight ?? '').trim();
  const temperature = String(vitals.temperature ?? '').trim();
  const bloodPressure = String(vitals.bloodPressure ?? '').trim();

  if (!weight || !temperature || !bloodPressure) return false;

  const weightValue = Number(weight);
  const tempValue = Number(temperature);
  const normalizedBp = bloodPressure.replace(/\s*mmHg\s*/i, '').trim();
  const bpMatch = /^\d{2,3}\/\d{2,3}$/.test(normalizedBp);
  if (!bpMatch) return false;

  const [sys, dia] = normalizedBp.split('/').map(Number);
  if (
    Number.isNaN(weightValue) || weightValue < 20 || weightValue > 250 ||
    Number.isNaN(tempValue) || tempValue < 30 || tempValue > 45 ||
    Number.isNaN(sys) || Number.isNaN(dia) || sys < 60 || sys > 220 || dia < 30 || dia > 120
  ) {
    return false;
  }

  return true;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'HospiQ backend is running' });
});

app.get('/api/users', (req, res) => {
  const db = readStore();
  res.json(db.users);
});

app.get('/api/queue', (req, res) => {
  const db = readStore();
  res.json(db.queue);
});

app.get('/api/medicines', (req, res) => {
  const db = readStore();
  res.json(db.medicines);
});

app.get('/api/lab-tests', (req, res) => {
  const db = readStore();
  res.json(db.labTests);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readStore();
  const user = db.users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  db.session = { userId: user.id };
  writeStore(db);
  res.json({ user });
});

app.post('/api/register-patient', (req, res) => {
  const { username, firstName, lastName, phone, password, sex, province, district, sector, village } = req.body;
  const db = readStore();

  if (db.users.find((u) => u.username === username)) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  if (db.users.find((u) => u.role === 'patient' && u.phone === phone)) {
    return res.status(400).json({ message: 'Patient already exists with this phone' });
  }

  const user = {
    id: uid(),
    role: 'patient',
    username,
    firstName,
    lastName,
    phone,
    password,
    sex,
    province,
    district,
    sector,
    village,
  };

  db.users.push(user);
  db.session = { userId: user.id, justRegistered: true };
  writeStore(db);
  res.status(201).json({ user });
});

app.post('/api/patient/token', (req, res) => {
  const { patientId, departmentCode, insurance, vitals } = req.body;
  const db = readStore();
  const patient = db.users.find((u) => u.id === patientId);

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  const dept = [
    { name: 'General Medicine', code: 'DC', room: 'Consultation room 1' },
    { name: 'Eye', code: 'EY', room: 'Eye clinic 3' },
    { name: 'Ear, Nose & Throat', code: 'EN', room: 'ENT room 4' },
    { name: 'Maternity', code: 'MA', room: 'Maternity ward 5' },
    { name: 'Emergency', code: 'MH', room: 'Emergency unit' },
    { name: 'Laboratory', code: 'LB', room: 'Lab section' },
    { name: 'Pharmacy', code: 'PH', room: 'Pharmacy counter' },
    { name: 'Pediatrics', code: 'PD', room: 'Pediatrics wing' },
  ].find((d) => d.code === departmentCode) || { name: 'General Medicine', code: 'DC', room: 'Consultation room 1' };

  const count = db.queue.filter((t) => t.departmentCode === departmentCode).length;
  const token = `${departmentCode}${String(count + 1).padStart(3, '0')}`;

  const ticket = {
    id: uid(),
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    insurance,
    vitals: normalizeVitals(vitals),
    token,
    department: dept.name,
    departmentCode: dept.code,
    createdAt: Date.now(),
    status: 'waiting',
  };

  db.queue.push(ticket);
  if (patient.insurance !== insurance) patient.insurance = insurance;
  writeStore(db);
  res.status(201).json({ ticket });
});

app.post('/api/queue/pass-to-doctor', (req, res) => {
  const { ticketId, doctorId } = req.body;
  const db = readStore();
  const ticket = db.queue.find((t) => t.id === ticketId);
  const doctor = db.users.find((u) => u.id === doctorId && u.role === 'doctor');

  if (!ticket || !doctor) {
    return res.status(404).json({ message: 'Ticket or doctor not found' });
  }

  if (!hasCompleteVitals(ticket.vitals)) {
    return res.status(400).json({ message: 'Vitals are incomplete. Reception must record weight, temperature, and blood pressure.' });
  }

  ticket.status = 'with-doctor';
  ticket.assignedDoctorId = doctorId;
  ticket.assignedDoctorName = `${doctor.firstName} ${doctor.lastName}`;
  writeStore(db);
  res.json({ ticket });
});

app.post('/api/queue/call-next', (req, res) => {
  const db = readStore();
  const next = db.queue
    .filter((t) => t.status === 'waiting' && t.departmentCode !== 'LB' && hasCompleteVitals(t.vitals))
    .sort((a, b) => a.createdAt - b.createdAt)[0];

  if (!next) {
    return res.status(404).json({ message: 'No eligible patient available' });
  }

  const doctors = db.users.filter((u) => u.role === 'doctor');
  const assigned = doctors.find((doc) => (doc.departmentCodes ?? []).includes(next.departmentCode)) ?? doctors[0];
  next.status = 'with-doctor';
  next.assignedDoctorId = assigned?.id;
  next.assignedDoctorName = assigned ? `${assigned.firstName} ${assigned.lastName}` : undefined;

  writeStore(db);
  res.json({ ticket: next });
});

app.post('/api/queue/update-vitals', (req, res) => {
  const { ticketId, vitals } = req.body;
  const db = readStore();
  const ticket = db.queue.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  ticket.vitals = normalizeVitals({ ...ticket.vitals, ...vitals });
  writeStore(db);
  res.json({ ticket });
});

app.post('/api/lab/request', (req, res) => {
  const { ticketId, doctorId, tests } = req.body;
  const db = readStore();
  const ticket = db.queue.find((t) => t.id === ticketId);
  const doctor = db.users.find((u) => u.id === doctorId && u.role === 'doctor');

  if (!ticket || !doctor) {
    return res.status(404).json({ message: 'Ticket or doctor not found' });
  }

  const catalog = db.labTests;
  const requested = (tests || [])
    .map((it) => {
      const cat = catalog.find((x) => x.id === it.testId);
      if (!cat) return null;
      return {
        testId: cat.id,
        name: cat.name,
        status: 'requested',
        requestedByDoctorId: doctorId,
        requestedByDoctorName: `${doctor.firstName} ${doctor.lastName}`,
      };
    })
    .filter(Boolean);

  ticket.labRequestedTests = requested;
  ticket.returnDepartmentCode = ticket.returnDepartmentCode ?? ticket.departmentCode;
  ticket.departmentCode = 'LB';
  ticket.department = 'Laboratory';
  ticket.status = 'waiting';
  writeStore(db);
  res.json({ ticket });
});

app.post('/api/lab/result', (req, res) => {
  const { ticketId, result } = req.body;
  const db = readStore();
  const ticket = db.queue.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  if (!ticket.labResults) ticket.labResults = [];
  const existing = ticket.labResults.findIndex((r) => r.testId === result.testId);
  if (existing >= 0) {
    ticket.labResults[existing] = { ...result, enteredAt: Date.now() };
  } else {
    ticket.labResults.push({ ...result, enteredAt: Date.now() });
  }

  if (ticket.labRequestedTests?.length) {
    ticket.labRequestedTests = ticket.labRequestedTests.map((x) =>
      x.testId === result.testId ? { ...x, status: 'done' } : x,
    );
  }

  const returnCode = ticket.returnDepartmentCode ?? ticket.departmentCode;
  const returnDept = [
    { name: 'General Medicine', code: 'DC' },
    { name: 'Eye', code: 'EY' },
    { name: 'Ear, Nose & Throat', code: 'EN' },
    { name: 'Maternity', code: 'MA' },
    { name: 'Emergency', code: 'MH' },
    { name: 'Laboratory', code: 'LB' },
    { name: 'Pharmacy', code: 'PH' },
    { name: 'Pediatrics', code: 'PD' },
  ].find((x) => x.code === returnCode);

  ticket.departmentCode = returnCode;
  ticket.department = returnDept?.name ?? ticket.department;
  ticket.status = ticket.assignedDoctorId ? 'with-doctor' : 'waiting';

  writeStore(db);
  res.json({ ticket });
});

app.post('/api/diagnosis', (req, res) => {
  const { ticketId, diagnosis, prescription, doctorNote } = req.body;
  const db = readStore();
  const ticket = db.queue.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  ticket.diagnosis = diagnosis;
  ticket.prescription = prescription;
  ticket.doctorNote = doctorNote;
  ticket.status = 'paying';
  writeStore(db);
  res.json({ ticket });
});

app.post('/api/payment', (req, res) => {
  const { ticketId, amount } = req.body;
  const db = readStore();
  const ticket = db.queue.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  ticket.paid = true;
  ticket.paidAmount = amount;
  ticket.status = 'pharmacy';
  writeStore(db);
  res.json({ ticket });
});

app.post('/api/dispense', (req, res) => {
  const { ticketId } = req.body;
  const db = readStore();
  const ticket = db.queue.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  for (const p of ticket.prescription ?? []) {
    if (p.transfer) continue;
    const medicine = db.medicines.find((m) => m.id === p.medicineId);
    if (medicine) medicine.stock = Math.max(0, medicine.stock - p.qty);
  }

  ticket.dispensedAt = Date.now();
  ticket.status = 'done';
  writeStore(db);
  res.json({ ticket });
});

app.get('/api/session', (req, res) => {
  const db = readStore();
  res.json({ session: db.session || null });
});

app.post('/api/logout', (req, res) => {
  const db = readStore();
  db.session = null;
  writeStore(db);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`HospiQ backend running on http://localhost:${PORT}`);
});
