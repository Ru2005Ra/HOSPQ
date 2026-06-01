export type Role = "patient" | "doctor" | "manager" | "reception" | "laboratory" | "storekeeper";

export interface Room {
  id: string;
  name: string;
  departmentCode: string;
}

export interface StaffReport {
  id: string;
  userId: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface User {
  id: string;
  role: Role;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  password: string;
  sex?: "male" | "female";
  insurance?: string;
  province?: string;
  district?: string;
  sector?: string;
  village?: string;

  // For doctors: which departments/diseases they treat.
  // Example codes: "DC", "EY", "EN", "MA", "MH", "PD"
  departmentCodes?: string[];
}


export interface Vitals {
  weight?: string;
  temperature?: string;
  bloodPressure?: string;
  notes?: string;
}

export interface LabTestCatalogItem {
  id: string;
  name: string;
  description?: string;
  departmentCode: "LB";
}

export interface RequestedLabTest {
  testId: string;
  name: string;
  status: "requested" | "done";
}

export interface QueueTicket {
  id: string;
  patientId: string;
  patientName: string;
  insurance?: string;
  vitals: Vitals;
  token: string;
  department: string;
  departmentCode: string;
  createdAt: number;
  status: "waiting" | "with-doctor" | "paying" | "pharmacy" | "done" | "removed";

  // Assigned doctor for the consultation.
  assignedDoctorId?: string;
  assignedDoctorName?: string;

  diagnosis?: string;
  prescription?: { medicineId?: string; name: string; qty: number; price: number; transfer?: boolean }[];
  doctorNote?: string;
  paid?: boolean;
  paidAmount?: number;
  dispensedAt?: number;
  labRequestedTests?: RequestedLabTest[];
}



export interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export interface DepartmentOption {
  name: string;
  code: string;
  description: string;
  room: string;
}

export const DEPARTMENTS: DepartmentOption[] = [
  { name: "General Medicine", code: "DC", description: "Doctor consultation and general sickness care.", room: "Consultation room 1" },
  { name: "Eye", code: "EY", description: "Only eye-related conditions and vision checks.", room: "Eye clinic 3" },
  { name: "Ear, Nose & Throat", code: "EN", description: "Ear, nose and throat care for ENT issues.", room: "ENT room 4" },
  { name: "Maternity", code: "MA", description: "Care for pregnant women and maternity support.", room: "Maternity ward 5" },
  { name: "Emergency", code: "MH", description: "Emergency care and urgent treatment.", room: "Emergency unit" },
  { name: "Laboratory", code: "LB", description: "Sample testing and lab results for your visit.", room: "Lab section" },
  { name: "Pharmacy", code: "PH", description: "Collect medicines and prescriptions at the pharmacy.", room: "Pharmacy counter" },
  { name: "Pediatrics", code: "PD", description: "Care for children and teen patients.", room: "Pediatrics wing" },
];

export interface AttendanceEntry {
  id: string;
  doctorId: string;
  doctorName: string;
  role: Role;
  department: string;
  loginAt: number;
  logoutAt?: number;
}

const KEY = "hospiq_v1";

interface DB {
  users: User[];
  queue: QueueTicket[];
  medicines: Medicine[];
  labTests: LabTestCatalogItem[];
  attendance: AttendanceEntry[];
  session: { userId: string; justRegistered?: boolean } | null;
  rooms: Room[];
  reports: StaffReport[];
}


const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): DB {
  return {
    users: [
      { id: "u-doc", role: "doctor", firstName: "Jean", lastName: "Mugisha", username: "doctor", password: "doctor123", departmentCodes: ["DC","EY","EN","MA","PD"] },

      { id: "u-rec", role: "reception", firstName: "Aline", lastName: "Uwase", username: "reception", password: "reception123" },
      { id: "u-lab", role: "laboratory", firstName: "Lab", lastName: "Tech", username: "lab", password: "lab123" },
      { id: "u-stk", role: "storekeeper", firstName: "Eric", lastName: "Nshimiyimana", username: "pharmacy", password: "pharmacy123" },
      { id: "u-mgr", role: "manager", firstName: "Claire", lastName: "Ingabire", username: "manager", password: "manager123" },
    ],
    queue: [],
  labTests: [
    { id: "cbc", name: "Complete Blood Count (CBC)", description: "Blood cell counts", departmentCode: "LB" },
    { id: "malaria", name: "Malaria Rapid Test", description: "Detection of malaria", departmentCode: "LB" },
    { id: "urinalysis", name: "Urinalysis", description: "Urine screening", departmentCode: "LB" },
    { id: "rbs", name: "Random Blood Sugar (RBS)", description: "Blood sugar check", departmentCode: "LB" },
    { id: "preg", name: "Pregnancy Test (hCG)", description: "Hormone pregnancy test", departmentCode: "LB" },
    { id: "chol", name: "Cholesterol", description: "Lipid profile screening", departmentCode: "LB" },
  ],
    medicines: [

      { id: uid(), name: "Paracetamol 500mg", stock: 120, price: 500 },
      { id: uid(), name: "Amoxicillin 250mg", stock: 60, price: 1500 },
      { id: uid(), name: "Ibuprofen 200mg", stock: 80, price: 800 },
      { id: uid(), name: "ORS sachet", stock: 200, price: 300 },
    ],
    attendance: [],
    rooms: [
      { id: uid(), name: "Consultation room 1", departmentCode: "DC" },
      { id: uid(), name: "Eye clinic 3", departmentCode: "EY" },
      { id: uid(), name: "ENT room 4", departmentCode: "EN" },
      { id: uid(), name: "Maternity ward 5", departmentCode: "MA" },
      { id: uid(), name: "Emergency unit", departmentCode: "MH" },
      { id: uid(), name: "Lab section", departmentCode: "LB" },
      { id: uid(), name: "Pharmacy counter", departmentCode: "PH" },
      { id: uid(), name: "Pediatrics wing", departmentCode: "PD" },
    ],
    reports: [],
    session: null,
  };
}

function read(): DB {
  if (typeof window === "undefined") return seed();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const s = seed();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  try { return JSON.parse(raw); } catch { return seed(); }
}

function write(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("hospiq:change"));
}

export const db = {
  all: () => read(),
  reset: () => { localStorage.removeItem(KEY); read(); },

  
  registerPatient(data: { firstName: string; lastName: string; phone: string; password: string; sex: "male" | "female"; province?: string; district?: string; sector?: string; village?: string }): User {

    const d = read();
    if (d.users.find(u => u.role === "patient" && u.phone === data.phone)) {
      throw new Error("A patient with this phone already exists. Please login.");
    }
    const user: User = { id: uid(), role: "patient", ...data };
    d.users.push(user);
    d.session = { userId: user.id, justRegistered: true };
    write(d);
    return user;
  },
  resetPatientPassword(firstName: string, lastName: string, phone: string, newPassword: string): void {
    const d = read();
    const u = d.users.find(x => x.role === "patient" && x.firstName.toLowerCase() === firstName.toLowerCase() && x.lastName.toLowerCase() === lastName.toLowerCase() && x.phone === `+250${phone}`);
    if (!u) throw new Error("No patient found with those details");
    if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
    u.password = newPassword;
    write(d);
  },
  resetStaffPassword(username: string, firstName: string, lastName: string, newPassword: string): void {
    const d = read();
    const u = d.users.find(x => x.username === username && x.firstName.toLowerCase() === firstName.toLowerCase() && x.lastName.toLowerCase() === lastName.toLowerCase() && x.role !== "patient");
    if (!u) throw new Error("No staff account found with those details");
    if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
    u.password = newPassword;
    write(d);
  },
  loginPatient(firstName: string, lastName: string, password: string): User {
    const d = read();
    const u = d.users.find(x => x.role === "patient" && x.firstName.toLowerCase() === firstName.toLowerCase() && x.lastName.toLowerCase() === lastName.toLowerCase() && x.password === password);
    if (!u) throw new Error("Invalid credentials");
    d.session = { userId: u.id, justRegistered: false };
    write(d);
    return u;
  },
  loginStaff(username: string, password: string): User {
    const d = read();
    const u = d.users.find(x => x.username === username && x.password === password && x.role !== "patient");
    if (!u) throw new Error("Invalid credentials");
    d.session = { userId: u.id };
    const deptMap: Partial<Record<Role, string>> = {
      doctor: "Doctor Consultation",
      reception: "Reception Desk",
      storekeeper: "Pharmacy",
      laboratory: "Laboratory",
      manager: "Management",
    };
    d.attendance.push({
      id: uid(),
      doctorId: u.id,
      doctorName: `${u.firstName} ${u.lastName}`,
      role: u.role,
      department: deptMap[u.role] ?? u.role,
      loginAt: Date.now(),
    });
    write(d);
    return u;
  },
  logout() {
    const d = read();
    const s = d.session;
    if (s) {
      const u = d.users.find(x => x.id === s.userId);
      if (u) {
        const open = [...d.attendance].reverse().find(a => a.doctorId === u.id && !a.logoutAt);
        if (open) open.logoutAt = Date.now();
      }
    }
    d.session = null;
    write(d);
  },
  currentUser(): User | null {
    const d = read();
    if (!d.session) return null;
    return d.users.find(u => u.id === d.session!.userId) ?? null;
  },
  isJustRegistered(): boolean {
    return read().session?.justRegistered === true;
  },


  enqueue(patient: User, departmentCode: string, insurance: string, vitals: Vitals): QueueTicket {
    const d = read();
    const dept = DEPARTMENTS.find(x => x.code === departmentCode) ?? DEPARTMENTS[0];
    const count = d.queue.filter(t => t.departmentCode === departmentCode).length;
    const token = `${departmentCode}${String(count + 1).padStart(3, "0")}`;
    const ticket: QueueTicket = {
      id: uid(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      insurance,
      vitals,
      token,
      department: dept.name,
      departmentCode: dept.code,
      createdAt: Date.now(),
      status: "waiting",
    };
    d.queue.push(ticket);
    if (patient.insurance !== insurance) {
      const u = d.users.find(x => x.id === patient.id);
      if (u) u.insurance = insurance;
    }
    write(d);
    return ticket;
  },
  patientActiveTicket(patientId: string): QueueTicket | null {
    const d = read();
    return d.queue.find(t => t.patientId === patientId && t.status !== "done" && t.status !== "removed") ?? null;
  },
  positionAhead(ticket: QueueTicket): number {
    const d = read();
    return d.queue.filter(t => t.status === "waiting" && t.createdAt < ticket.createdAt).length;
  },
  callNext(): QueueTicket | null {
    const d = read();

    const next = d.queue
      .filter(t => t.status === "waiting" && t.departmentCode !== "LB")
      .sort((a, b) => a.createdAt - b.createdAt)[0];

    if (!next) return null;

    const doctors = d.users.filter(u => u.role === "doctor") as User[];
    const matching = doctors.filter(doc => (doc.departmentCodes ?? []).includes(next.departmentCode));
    const assigned = matching[0] ?? doctors[0];

    next.status = "with-doctor";
    next.assignedDoctorId = assigned?.id;
    next.assignedDoctorName = assigned ? `${assigned.firstName} ${assigned.lastName}` : undefined;

    write(d);
    return next;
  },

  currentWithDoctor(doctorId?: string): QueueTicket | null {
    const d = read();
    const all = d.queue.filter(t => t.status === "with-doctor");
    if (!doctorId) return all[0] ?? null;
    return all.find(t => t.assignedDoctorId === doctorId) ?? all[0] ?? null;
  },

  submitDiagnosis(ticketId: string, payload: { diagnosis: string; prescription: QueueTicket["prescription"]; doctorNote?: string }) {
    const d = read();
    const t = d.queue.find(x => x.id === ticketId);
    if (!t) return;
    t.diagnosis = payload.diagnosis;
    t.prescription = payload.prescription;
    t.doctorNote = payload.doctorNote;
    t.status = "paying";
    write(d);
  },
  labTests: () => read().labTests,

  sendToLab(ticketId: string, labTests: { testId: string }[]) {
    const d = read();
    const t = d.queue.find(x => x.id === ticketId);
    if (!t) return;

    const catalog = d.labTests;
    const requested: RequestedLabTest[] = (labTests ?? [])
      .map(it => {
        const cat = catalog.find(x => x.id === it.testId);
        if (!cat) return null;
        return { testId: cat.id, name: cat.name, status: "requested" as const };
      })
      .filter(Boolean) as RequestedLabTest[];

    t.labRequestedTests = requested;
    t.departmentCode = "LB";
    t.department = "Laboratory";
    t.status = "waiting";
    write(d);
  },

  removeTicket(ticketId: string) {
    const d = read();
    const t = d.queue.find(x => x.id === ticketId);
    if (t) t.status = "removed";
    write(d);
  },
  // Room management
  rooms: () => read().rooms,
  addRoom(data: { name: string; departmentCode: string }) {
    const d = read();
    d.rooms.push({ id: uid(), ...data });
    write(d);
  },
  updateRoom(id: string, patch: Partial<Room>) {
    const d = read();
    const r = d.rooms.find(x => x.id === id);
    if (r) Object.assign(r, patch);
    write(d);
  },
  deleteRoom(id: string) {
    const d = read();
    d.rooms = d.rooms.filter(x => x.id !== id);
    write(d);
  },
  // Staff management
  staff: () => read().users.filter(u => u.role !== "patient"),
  addStaff(data: Omit<User, "id">) {
    const d = read();
    if (d.users.find(u => u.username === data.username)) throw new Error("Username taken");
    d.users.push({ ...data, id: uid() });
    write(d);
  },
  updateStaff(id: string, patch: Partial<User>) {
    const d = read();
    const u = d.users.find(x => x.id === id);
    if (u) Object.assign(u, patch);
    write(d);
  },
  deleteStaff(id: string) {
    const d = read();
    d.users = d.users.filter(u => u.id !== id);
    write(d);
  },
  // Reports
  reports: () => read().reports,
  addReport(data: { userId: string; role: Role; content: string }) {
    const d = read();
    d.reports.push({ id: uid(), ...data, createdAt: Date.now() });
    write(d);
  },
  // Emergency triage
  markEmergency(ticketId: string, description: string) {
    const d = read();
    const t = d.queue.find(x => x.id === ticketId);
    if (!t) return;
    t.departmentCode = "MH";
    t.department = "Emergency";
    t.status = "waiting";
    t.diagnosis = description;
    write(d);
  },
  completeLabTicket(ticketId: string) {
    const d = read();
    const t = d.queue.find(x => x.id === ticketId);
    if (!t) return;

    if (t.labRequestedTests?.length) {
      t.labRequestedTests = t.labRequestedTests.map(x => ({ ...x, status: "done" }));
    }

    t.status = t.prescription?.length ? "paying" : "done";
    write(d);
  },

  updatePatientLocation(patientId: string, location: { province: string; district: string; sector: string; village: string }) {
    const d = read();
    const u = d.users.find(x => x.id === patientId);
    if (!u) return;
    u.province = location.province;
    u.district = location.district;
    u.sector = location.sector;
    u.village = location.village;
    write(d);
  },
  recordPayment(ticketId: string, amount: number) {
    const d = read();
    const t = d.queue.find(x => x.id === ticketId);
    if (!t) return;
    t.paid = true;
    t.paidAmount = amount;
    t.status = "pharmacy";
    write(d);
  },
  dispense(ticketId: string) {
    const d = read();
    const t = d.queue.find(x => x.id === ticketId);
    if (!t) return;
   //stoke infor
    for (const p of t.prescription ?? []) {
      if (p.transfer) continue;
      const m = d.medicines.find(m => m.id === p.medicineId);
      if (m) m.stock = Math.max(0, m.stock - p.qty);
    }
    t.dispensedAt = Date.now();
    t.status = "done";
    write(d);
  },

  // --- medicines ---
  medicines: () => read().medicines,
  addMedicine(m: Omit<Medicine, "id">) { const d = read(); d.medicines.push({ ...m, id: uid() }); write(d); },
  updateMedicine(id: string, patch: Partial<Medicine>) { const d = read(); const m = d.medicines.find(x => x.id === id); if (m) Object.assign(m, patch); write(d); },
  deleteMedicine(id: string) { const d = read(); d.medicines = d.medicines.filter(x => x.id !== id); write(d); },

  // --- staff/manager ---
  doctors: () => read().users.filter(u => u.role === "doctor"),
  addDoctor(data: { firstName: string; lastName: string; username: string; password: string }) {
    const d = read();
    if (d.users.find(u => u.username === data.username)) throw new Error("Username taken");
    d.users.push({ id: uid(), role: "doctor", ...data });
    write(d);
  },
  updateDoctor(id: string, patch: Partial<User>) { const d = read(); const u = d.users.find(x => x.id === id); if (u) Object.assign(u, patch); write(d); },
  deleteDoctor(id: string) { const d = read(); d.users = d.users.filter(u => u.id !== id); write(d); },
  updateStaffUser(id: string, patch: { firstName: string; lastName: string; username: string; password: string }) {
    const d = read();
    const u = d.users.find(x => x.id === id);
    if (!u) return;
    const conflict = d.users.find(x => x.id !== id && x.username === patch.username);
    if (conflict) throw new Error("Username already taken");
    Object.assign(u, patch);
    write(d);
  },
  addStaffUser(data: { firstName: string; lastName: string; username: string; password: string; role: Role }) {
    const d = read();
    if (d.users.find(u => u.username === data.username)) throw new Error("Username already taken");
    d.users.push({ id: uid(), ...data });
    write(d);
  },
  deleteStaffUser(id: string) { const d = read(); d.users = d.users.filter(u => u.id !== id); write(d); },
  allStaff: () => read().users.filter(u => u.role !== "patient" && u.role !== "manager"),
  attendance: () => read().attendance,

  // reports
  completedTickets: () => read().queue.filter(t => t.status === "done"),
};

export function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("hospiq:change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("hospiq:change", handler);
    window.removeEventListener("storage", handler);
  };
}

export function useDbVersion() {
  // simple bump-based hook
  if (typeof window === "undefined") return 0;
  return Date.now();
}
