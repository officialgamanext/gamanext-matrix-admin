import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBfeBSE4MUESKvJqbGBE4xOvRPnv2leQ6o",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gamanext-matrix-admin.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gamanext-matrix-admin",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gamanext-matrix-admin.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "32000054720",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:32000054720:web:555195a6f11366e053e425",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-RDJDS59FS6",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export interface EmergencyContact {
  name: string;
  relation: string;
  mobileNumber: string;
  occupation: string;
  address: string;
}

export interface EmployeeData {
  id?: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth: string;
  address: string;
  city: string;
  pincode: string;
  employeeId: string;
  employeeRole: string;
  department: string;
  dateOfJoining: string;
  username: string;
  password?: string;
  aadharNumber: string;
  panCardNumber: string;
  profilePhotoUrl: string;
  aadharFrontUrl: string;
  aadharBackUrl: string;
  panCardUrl: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  emergencyContact1: EmergencyContact;
  emergencyContact2: EmergencyContact;
  jobType?: string;
  createdAt?: string;
}

export interface DepartmentItem {
  id?: string;
  name: string;
  createdAt?: string;
}

export interface RoleItem {
  id?: string;
  name: string;
  createdAt?: string;
}

export interface MasterProjectItem {
  id?: string;
  name: string;
  createdAt?: string;
}

export interface ProjectAllocation {
  id?: string;
  employeeId: string;
  projectName: string;
  role: string;
  startDate: string;
  endDate?: string;
  status: "Active" | "Completed";
  createdAt?: string;
}

export interface LeaveRequest {
  id?: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
  leaveType: "Casual Leave" | "Sick Leave" | "Maternity Leave" | "Paternity Leave";
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  quarter: string; // e.g. Q1, Q2, Q3, Q4
  daysCount: number;
  createdAt?: string;
}

export interface WFHRequest {
  id?: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
  month: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt?: string;
}

export interface TimesheetEntry {
  id?: string;
  employeeId: string;
  date: string;
  projectName: string;
  billingHours: number;
  tasks: string;
  createdAt?: string;
}

export interface EmployeeRequest {
  id?: string;
  employeeId: string;
  requestType: "Accessories Allowance" | "Monthly Network/WiFi Bill Reimbursement";
  amount: number;
  monthOrDescription: string;
  status: "Pending" | "Approved" | "Rejected" | "Amount Initiated" | "Amount Credited";
  createdAt?: string;
}

export interface YearlyReview {
  id?: string;
  employeeId: string;
  year: string;
  rating: number; // Out of 10
  feedback: string;
  createdAt?: string;
}

export interface PerformanceBandRecord {
  id?: string;
  employeeId: string;
  year: string;
  band: "Band A" | "Band B" | "Band C" | "Band D";
  remarks: string;
  createdAt?: string;
}

const LOCAL_STORAGE_KEY_EMPLOYEES = "gamanext_employees_data";
const LOCAL_STORAGE_KEY_DEPTS = "gamanext_departments_data";
const LOCAL_STORAGE_KEY_ROLES = "gamanext_roles_data";
const LOCAL_STORAGE_KEY_MASTER_PROJECTS = "gamanext_master_projects_data";
const LOCAL_STORAGE_KEY_PROJECTS = "gamanext_projects_data";
const LOCAL_STORAGE_KEY_LEAVES = "gamanext_leaves_data";
const LOCAL_STORAGE_KEY_WFH = "gamanext_wfh_data";
const LOCAL_STORAGE_KEY_TIMESHEETS = "gamanext_timesheets_data";
const LOCAL_STORAGE_KEY_REQUESTS = "gamanext_requests_data";
const LOCAL_STORAGE_KEY_REVIEWS = "gamanext_reviews_data";
const LOCAL_STORAGE_KEY_BANDS = "gamanext_bands_data";

/* ---------------- EMPLOYEES STORAGE HELPERS ---------------- */
export async function getEmployeesFromStorage(): Promise<EmployeeData[]> {
  try {
    const q = query(collection(db, "employees"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const employees: EmployeeData[] = [];
    snapshot.forEach((docSnap) => {
      employees.push({ id: docSnap.id, ...docSnap.data() } as EmployeeData);
    });
    if (employees.length > 0) return employees;
  } catch (err) {
    console.warn("Firestore fetch notice, using fallback cache:", err);
  }

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_EMPLOYEES);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Local storage parse error:", e);
      }
    }
  }

  return [];
}

export async function getEmployeeByIdFromStorage(id: string): Promise<EmployeeData | null> {
  const employees = await getEmployeesFromStorage();
  return (
    employees.find((emp) => emp.id === id || emp.employeeId === id) || null
  );
}

export async function saveEmployeeToStorage(employee: EmployeeData): Promise<EmployeeData> {
  const newEmployee = {
    ...employee,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "employees"), newEmployee);
    const savedRecord = { ...newEmployee, id: docRef.id };

    if (typeof window !== "undefined") {
      const existing = await getEmployeesFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY_EMPLOYEES, JSON.stringify([savedRecord, ...existing]));
    }

    return savedRecord;
  } catch (err) {
    console.error("Firestore write error, saving to local cache:", err);
    if (typeof window !== "undefined") {
      const existing = await getEmployeesFromStorage();
      const created = { ...newEmployee, id: `emp-${Date.now()}` };
      localStorage.setItem(LOCAL_STORAGE_KEY_EMPLOYEES, JSON.stringify([created, ...existing]));
      return created;
    }
  }

  return newEmployee;
}

export async function updateEmployeeInStorage(
  id: string,
  updatedData: Partial<EmployeeData>
): Promise<boolean> {
  try {
    if (id) {
      const docRef = doc(db, "employees", id);
      await updateDoc(docRef, updatedData);
    }
  } catch (err) {
    console.error("Firestore update error:", err);
  }

  if (typeof window !== "undefined") {
    const existing = await getEmployeesFromStorage();
    const updatedList = existing.map((emp) =>
      emp.id === id || emp.employeeId === id ? { ...emp, ...updatedData } : emp
    );
    localStorage.setItem(LOCAL_STORAGE_KEY_EMPLOYEES, JSON.stringify(updatedList));
  }

  return true;
}

export async function deleteEmployeeFromStorage(id: string): Promise<boolean> {
  try {
    if (id) {
      await deleteDoc(doc(db, "employees", id));
    }
  } catch (err) {
    console.error("Firestore delete error:", err);
  }

  if (typeof window !== "undefined") {
    const existing = await getEmployeesFromStorage();
    const filtered = existing.filter((emp) => emp.id !== id && emp.employeeId !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_EMPLOYEES, JSON.stringify(filtered));
  }

  return true;
}

/* ---------------- DEPARTMENTS STORAGE HELPERS ---------------- */
export async function getDepartmentsFromStorage(): Promise<DepartmentItem[]> {
  try {
    const q = query(collection(db, "departments"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    const items: DepartmentItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as DepartmentItem);
    });
    return items;
  } catch (err) {
    console.warn("Firestore departments fetch notice:", err);
  }

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_DEPTS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
  }

  return [];
}

export async function saveDepartmentToStorage(name: string): Promise<DepartmentItem> {
  const item: DepartmentItem = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "departments"), item);
    const created = { ...item, id: docRef.id };

    if (typeof window !== "undefined") {
      const existing = await getDepartmentsFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY_DEPTS, JSON.stringify([...existing, created]));
    }
    return created;
  } catch (err) {
    console.error("Firestore dept save error:", err);
    const created = { ...item, id: `dept-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existing = await getDepartmentsFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY_DEPTS, JSON.stringify([...existing, created]));
    }
    return created;
  }
}

export async function deleteDepartmentFromStorage(id: string): Promise<boolean> {
  try {
    if (id) await deleteDoc(doc(db, "departments", id));
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getDepartmentsFromStorage();
    const filtered = existing.filter((d) => d.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_DEPTS, JSON.stringify(filtered));
  }
  return true;
}

/* ---------------- EMPLOYEE ROLES STORAGE HELPERS ---------------- */
export async function getRolesFromStorage(): Promise<RoleItem[]> {
  try {
    const q = query(collection(db, "employee_roles"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    const items: RoleItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as RoleItem);
    });
    return items;
  } catch (err) {
    console.warn("Firestore roles fetch notice:", err);
  }

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_ROLES);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
  }

  return [];
}

export async function saveRoleToStorage(name: string): Promise<RoleItem> {
  const item: RoleItem = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "employee_roles"), item);
    const created = { ...item, id: docRef.id };

    if (typeof window !== "undefined") {
      const existing = await getRolesFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLES, JSON.stringify([...existing, created]));
    }
    return created;
  } catch (err) {
    console.error("Firestore role save error:", err);
    const created = { ...item, id: `role-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existing = await getRolesFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLES, JSON.stringify([...existing, created]));
    }
    return created;
  }
}

export async function deleteRoleFromStorage(id: string): Promise<boolean> {
  try {
    if (id) await deleteDoc(doc(db, "employee_roles", id));
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getRolesFromStorage();
    const filtered = existing.filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_ROLES, JSON.stringify(filtered));
  }
  return true;
}

/* ---------------- MASTER PROJECTS STORAGE HELPERS ---------------- */
export async function getMasterProjectsFromStorage(): Promise<MasterProjectItem[]> {
  try {
    const q = query(collection(db, "master_projects"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const items: MasterProjectItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as MasterProjectItem);
    });
    return items;
  } catch (err) {
    console.warn("Firestore master projects fetch notice:", err);
  }

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_MASTER_PROJECTS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
  }

  return [];
}

export async function saveMasterProjectToStorage(name: string): Promise<MasterProjectItem> {
  const item: MasterProjectItem = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "master_projects"), item);
    const created = { ...item, id: docRef.id };

    if (typeof window !== "undefined") {
      const existing = await getMasterProjectsFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY_MASTER_PROJECTS, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (err) {
    console.error("Firestore master project save error:", err);
    const created = { ...item, id: `mproj-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existing = await getMasterProjectsFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY_MASTER_PROJECTS, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

export async function deleteMasterProjectFromStorage(id: string): Promise<boolean> {
  try {
    if (id) await deleteDoc(doc(db, "master_projects", id));
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getMasterProjectsFromStorage();
    const filtered = existing.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_MASTER_PROJECTS, JSON.stringify(filtered));
  }
  return true;
}

/* ---------------- PROJECT ALLOCATIONS STORAGE ---------------- */
export async function getProjectsForEmployee(employeeId: string): Promise<ProjectAllocation[]> {
  try {
    const q = query(
      collection(db, "project_allocations"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    const projects: ProjectAllocation[] = [];
    snapshot.forEach((docSnap) => {
      projects.push({ id: docSnap.id, ...docSnap.data() } as ProjectAllocation);
    });
    if (projects.length > 0) return projects;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
    if (data) {
      try {
        const all: ProjectAllocation[] = JSON.parse(data);
        return all.filter((p) => p.employeeId === employeeId);
      } catch (e) {}
    }
  }
  return [];
}

export async function saveProjectForEmployee(project: ProjectAllocation): Promise<ProjectAllocation> {
  const item: ProjectAllocation = {
    ...project,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "project_allocations"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
      const existing: ProjectAllocation[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `proj-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
      const existing: ProjectAllocation[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

/* ---------------- LEAVES STORAGE ---------------- */
export async function getLeavesForEmployee(employeeId: string): Promise<LeaveRequest[]> {
  try {
    const q = query(
      collection(db, "leave_requests"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    const leaves: LeaveRequest[] = [];
    snapshot.forEach((docSnap) => {
      leaves.push({ id: docSnap.id, ...docSnap.data() } as LeaveRequest);
    });
    if (leaves.length > 0) return leaves;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_LEAVES);
    if (data) {
      try {
        const all: LeaveRequest[] = JSON.parse(data);
        return all.filter((l) => l.employeeId === employeeId);
      } catch (e) {}
    }
  }
  return [];
}

export async function saveLeaveForEmployee(leave: LeaveRequest): Promise<LeaveRequest> {
  const item: LeaveRequest = {
    ...leave,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "leave_requests"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_LEAVES);
      const existing: LeaveRequest[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_LEAVES, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `leave-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_LEAVES);
      const existing: LeaveRequest[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_LEAVES, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

export async function updateLeaveStatusInStorage(
  id: string,
  status: "Approved" | "Rejected"
): Promise<boolean> {
  try {
    if (id) {
      await updateDoc(doc(db, "leave_requests", id), { status });
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_LEAVES);
    if (existingStr) {
      const existing: LeaveRequest[] = JSON.parse(existingStr);
      const updated = existing.map((l) => (l.id === id ? { ...l, status } : l));
      localStorage.setItem(LOCAL_STORAGE_KEY_LEAVES, JSON.stringify(updated));
    }
  }
  return true;
}

/* ---------------- WFH STORAGE ---------------- */
export async function getWFHForEmployee(employeeId: string): Promise<WFHRequest[]> {
  try {
    const q = query(
      collection(db, "wfh_requests"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    const wfh: WFHRequest[] = [];
    snapshot.forEach((docSnap) => {
      wfh.push({ id: docSnap.id, ...docSnap.data() } as WFHRequest);
    });
    if (wfh.length > 0) return wfh;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_WFH);
    if (data) {
      try {
        const all: WFHRequest[] = JSON.parse(data);
        return all.filter((w) => w.employeeId === employeeId);
      } catch (e) {}
    }
  }
  return [];
}

export async function saveWFHForEmployee(wfh: WFHRequest): Promise<WFHRequest> {
  const item: WFHRequest = {
    ...wfh,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "wfh_requests"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_WFH);
      const existing: WFHRequest[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_WFH, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `wfh-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_WFH);
      const existing: WFHRequest[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_WFH, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

export async function updateWFHStatusInStorage(
  id: string,
  status: "Approved" | "Rejected"
): Promise<boolean> {
  try {
    if (id) {
      await updateDoc(doc(db, "wfh_requests", id), { status });
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_WFH);
    if (existingStr) {
      const existing: WFHRequest[] = JSON.parse(existingStr);
      const updated = existing.map((w) => (w.id === id ? { ...w, status } : w));
      localStorage.setItem(LOCAL_STORAGE_KEY_WFH, JSON.stringify(updated));
    }
  }
  return true;
}

/* ---------------- TIMESHEET STORAGE ---------------- */
export async function getTimesheetsForEmployee(employeeId: string): Promise<TimesheetEntry[]> {
  try {
    const q = query(
      collection(db, "timesheets"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    const entries: TimesheetEntry[] = [];
    snapshot.forEach((docSnap) => {
      entries.push({ id: docSnap.id, ...docSnap.data() } as TimesheetEntry);
    });
    if (entries.length > 0) return entries;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_TIMESHEETS);
    if (data) {
      try {
        const all: TimesheetEntry[] = JSON.parse(data);
        return all.filter((t) => t.employeeId === employeeId);
      } catch (e) {}
    }
  }
  return [];
}

export async function saveTimesheetForEmployee(entry: TimesheetEntry): Promise<TimesheetEntry> {
  const item: TimesheetEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "timesheets"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_TIMESHEETS);
      const existing: TimesheetEntry[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_TIMESHEETS, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `ts-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_TIMESHEETS);
      const existing: TimesheetEntry[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_TIMESHEETS, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

/* ---------------- EMPLOYEE REQUESTS STORAGE (ALLOWANCES / REIMBURSEMENTS) ---------------- */
export async function getRequestsForEmployee(employeeId: string): Promise<EmployeeRequest[]> {
  try {
    const q = query(
      collection(db, "employee_requests"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    const requests: EmployeeRequest[] = [];
    snapshot.forEach((docSnap) => {
      requests.push({ id: docSnap.id, ...docSnap.data() } as EmployeeRequest);
    });
    if (requests.length > 0) return requests;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_REQUESTS);
    if (data) {
      try {
        const all: EmployeeRequest[] = JSON.parse(data);
        return all.filter((r) => r.employeeId === employeeId);
      } catch (e) {}
    }
  }
  return [];
}

export async function saveRequestForEmployee(req: EmployeeRequest): Promise<EmployeeRequest> {
  const item: EmployeeRequest = {
    ...req,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "employee_requests"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_REQUESTS);
      const existing: EmployeeRequest[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_REQUESTS, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `req-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_REQUESTS);
      const existing: EmployeeRequest[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_REQUESTS, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

export async function updateRequestStatusInStorage(
  id: string,
  status: "Pending" | "Approved" | "Rejected" | "Amount Initiated" | "Amount Credited"
): Promise<boolean> {
  try {
    if (id) {
      await updateDoc(doc(db, "employee_requests", id), { status });
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_REQUESTS);
    if (existingStr) {
      const existing: EmployeeRequest[] = JSON.parse(existingStr);
      const updated = existing.map((r) => (r.id === id ? { ...r, status } : r));
      localStorage.setItem(LOCAL_STORAGE_KEY_REQUESTS, JSON.stringify(updated));
    }
  }
  return true;
}

/* ---------------- YEARLY REVIEWS STORAGE ---------------- */
export async function getYearlyReviewsForEmployee(employeeId: string): Promise<YearlyReview[]> {
  try {
    const q = query(
      collection(db, "yearly_reviews"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    const reviews: YearlyReview[] = [];
    snapshot.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() } as YearlyReview);
    });
    if (reviews.length > 0) return reviews;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS);
    if (data) {
      try {
        const all: YearlyReview[] = JSON.parse(data);
        return all.filter((r) => r.employeeId === employeeId);
      } catch (e) {}
    }
  }
  return [];
}

export async function saveYearlyReviewForEmployee(review: YearlyReview): Promise<YearlyReview> {
  const item: YearlyReview = {
    ...review,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "yearly_reviews"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS);
      const existing: YearlyReview[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `rev-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS);
      const existing: YearlyReview[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

/* ---------------- PERFORMANCE BANDS STORAGE ---------------- */
export async function getPerformanceBandsForEmployee(employeeId: string): Promise<PerformanceBandRecord[]> {
  try {
    const q = query(
      collection(db, "performance_bands"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    const bands: PerformanceBandRecord[] = [];
    snapshot.forEach((docSnap) => {
      bands.push({ id: docSnap.id, ...docSnap.data() } as PerformanceBandRecord);
    });
    if (bands.length > 0) return bands;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_BANDS);
    if (data) {
      try {
        const all: PerformanceBandRecord[] = JSON.parse(data);
        return all.filter((b) => b.employeeId === employeeId);
      } catch (e) {}
    }
  }
  return [];
}

export async function savePerformanceBandForEmployee(bandRecord: PerformanceBandRecord): Promise<PerformanceBandRecord> {
  const item: PerformanceBandRecord = {
    ...bandRecord,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "performance_bands"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_BANDS);
      const existing: PerformanceBandRecord[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_BANDS, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `band-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_BANDS);
      const existing: PerformanceBandRecord[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_BANDS, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

/* ================================================================
   WHATSAPP BUSINESS — CONTACTS & MESSAGES
   ================================================================ */

export interface WhatsAppContact {
  id?: string;
  name: string;
  phone: string; // E.164 format e.g. +919876543210
  avatar?: string;
  tags?: string[];
  notes?: string;
  lastMessageAt?: string;
  createdAt?: string;
}

export interface WhatsAppMessage {
  id?: string;
  phone: string; // E.164
  contactName?: string;
  direction: "outbound" | "inbound";
  type: "text" | "template";
  message: string;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  waMessageId?: string; // ID returned by Meta API
  timestamp: string; // ISO string
  createdAt?: string;
}

const LOCAL_STORAGE_KEY_WA_CONTACTS = "gamanext_wa_contacts";
const LOCAL_STORAGE_KEY_WA_MESSAGES = "gamanext_wa_messages";

/* --- CONTACTS --- */

export async function getWhatsAppContacts(): Promise<WhatsAppContact[]> {
  try {
    const q = query(collection(db, "whatsapp_contacts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const contacts: WhatsAppContact[] = [];
    snapshot.forEach((docSnap) => {
      contacts.push({ id: docSnap.id, ...docSnap.data() } as WhatsAppContact);
    });
    if (contacts.length > 0) return contacts;
  } catch (err) {
    console.warn("Firestore WA contacts fetch notice:", err);
  }
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_WA_CONTACTS);
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
  }
  return [];
}

export async function getWhatsAppContactByPhone(phone: string): Promise<WhatsAppContact | null> {
  const contacts = await getWhatsAppContacts();
  return contacts.find((c) => c.phone === phone) || null;
}

export async function saveWhatsAppContact(contact: WhatsAppContact): Promise<WhatsAppContact> {
  const item: WhatsAppContact = { ...contact, createdAt: new Date().toISOString() };
  try {
    const docRef = await addDoc(collection(db, "whatsapp_contacts"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existing = await getWhatsAppContacts();
      localStorage.setItem(LOCAL_STORAGE_KEY_WA_CONTACTS, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (err) {
    const created = { ...item, id: `wac-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existing = await getWhatsAppContacts();
      localStorage.setItem(LOCAL_STORAGE_KEY_WA_CONTACTS, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

export async function updateWhatsAppContact(id: string, data: Partial<WhatsAppContact>): Promise<boolean> {
  try {
    if (id) await updateDoc(doc(db, "whatsapp_contacts", id), data);
  } catch (e) {}
  if (typeof window !== "undefined") {
    const existing = await getWhatsAppContacts();
    const updated = existing.map((c) => (c.id === id ? { ...c, ...data } : c));
    localStorage.setItem(LOCAL_STORAGE_KEY_WA_CONTACTS, JSON.stringify(updated));
  }
  return true;
}

export async function deleteWhatsAppContact(id: string): Promise<boolean> {
  try {
    if (id) await deleteDoc(doc(db, "whatsapp_contacts", id));
  } catch (e) {}
  if (typeof window !== "undefined") {
    const existing = await getWhatsAppContacts();
    localStorage.setItem(
      LOCAL_STORAGE_KEY_WA_CONTACTS,
      JSON.stringify(existing.filter((c) => c.id !== id))
    );
  }
  return true;
}

/* --- MESSAGES --- */

export async function getWhatsAppMessages(phone: string): Promise<WhatsAppMessage[]> {
  try {
    const q = query(
      collection(db, "whatsapp_messages"),
      where("phone", "==", phone),
      orderBy("timestamp", "asc")
    );
    const snapshot = await getDocs(q);
    const msgs: WhatsAppMessage[] = [];
    snapshot.forEach((docSnap) => {
      msgs.push({ id: docSnap.id, ...docSnap.data() } as WhatsAppMessage);
    });
    if (msgs.length > 0) return msgs;
  } catch (e) {}
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_WA_MESSAGES);
    if (data) {
      try {
        const all: WhatsAppMessage[] = JSON.parse(data);
        return all.filter((m) => m.phone === phone).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      } catch (e) {}
    }
  }
  return [];
}

export async function getAllWhatsAppConversations(): Promise<WhatsAppMessage[]> {
  try {
    const q = query(collection(db, "whatsapp_messages"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const msgs: WhatsAppMessage[] = [];
    snapshot.forEach((docSnap) => {
      msgs.push({ id: docSnap.id, ...docSnap.data() } as WhatsAppMessage);
    });
    if (msgs.length > 0) return msgs;
  } catch (e) {}
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_WA_MESSAGES);
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
  }
  return [];
}

export async function saveWhatsAppMessage(msg: WhatsAppMessage): Promise<WhatsAppMessage> {
  const item: WhatsAppMessage = { ...msg, createdAt: new Date().toISOString() };
  try {
    const docRef = await addDoc(collection(db, "whatsapp_messages"), item);
    const created = { ...item, id: docRef.id };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_WA_MESSAGES);
      const existing: WhatsAppMessage[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_WA_MESSAGES, JSON.stringify([created, ...existing]));
    }
    return created;
  } catch (e) {
    const created = { ...item, id: `wam-${Date.now()}` };
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_WA_MESSAGES);
      const existing: WhatsAppMessage[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_STORAGE_KEY_WA_MESSAGES, JSON.stringify([created, ...existing]));
    }
    return created;
  }
}

export async function updateWhatsAppMessageStatus(
  id: string,
  status: WhatsAppMessage["status"],
  waMessageId?: string
): Promise<boolean> {
  const updateData: Partial<WhatsAppMessage> = { status };
  if (waMessageId) updateData.waMessageId = waMessageId;
  try {
    if (id && !id.startsWith("wam-")) await updateDoc(doc(db, "whatsapp_messages", id), updateData);
  } catch (e) {}
  if (typeof window !== "undefined") {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_WA_MESSAGES);
    if (existingStr) {
      const existing: WhatsAppMessage[] = JSON.parse(existingStr);
      const updated = existing.map((m) => (m.id === id ? { ...m, ...updateData } : m));
      localStorage.setItem(LOCAL_STORAGE_KEY_WA_MESSAGES, JSON.stringify(updated));
    }
  }
  return true;
}
