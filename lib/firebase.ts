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
  salaryStructure?: EmployeeSalaryStructure;
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
  status: "Active" | "Inactive" | "Completed";
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

export interface HolidayItem {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  dayOfWeek?: string; // e.g. "Monday"
  type: "National Holiday" | "Public Holiday" | "Festival Holiday" | "Company Holiday" | "Optional / Restricted";
  description?: string;
  year?: number | string;
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

export interface SalaryAttribute {
  id: string;
  name: string;
  amount: number;
}

export interface EmployeeSalaryStructure {
  id?: string;
  employeeId: string;
  earnings: SalaryAttribute[];
  deductions: SalaryAttribute[];
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  updatedAt?: string;
}

export interface MonthlyPayslip {
  id: string;
  employeeId: string;
  month: string; // e.g. "August 2026"
  year: number;
  monthIndex: number; // 0 to 11
  paymentDate: string; // e.g. "01 Aug 2026"
  workingDays: number;
  paidDays: number;
  earnings: SalaryAttribute[];
  deductions: SalaryAttribute[];
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  status: "Generated" | "Paid" | "Processing";
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
const LOCAL_STORAGE_KEY_SALARY_STRUCTURES = "gamanext_salary_structures";

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
    status: project.status || "Active",
    createdAt: new Date().toISOString(),
  };

  // If newly added project is Active, mark all other existing projects for this employee as Inactive
  if (item.status === "Active") {
    try {
      const existingProjects = await getProjectsForEmployee(project.employeeId);
      for (const p of existingProjects) {
        if (p.id && p.status === "Active") {
          const docRef = doc(db, "project_allocations", p.id);
          await updateDoc(docRef, { status: "Inactive" });
        }
      }
    } catch (e) {}

    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
      if (existingStr) {
        const allProjects: ProjectAllocation[] = JSON.parse(existingStr);
        const updated = allProjects.map((p) =>
          p.employeeId === project.employeeId && p.status === "Active"
            ? { ...p, status: "Inactive" as const }
            : p
        );
        localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      }
    }
  }

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

export async function setProjectAllocationStatus(
  employeeId: string,
  targetProjectId: string,
  newStatus: "Active" | "Inactive"
): Promise<boolean> {
  try {
    const existingProjects = await getProjectsForEmployee(employeeId);
    for (const p of existingProjects) {
      if (p.id) {
        if (p.id === targetProjectId) {
          const docRef = doc(db, "project_allocations", p.id);
          await updateDoc(docRef, { status: newStatus });
        } else if (newStatus === "Active" && p.status === "Active") {
          // If enabling target project, disable all other active projects to guarantee only 1 is active
          const docRef = doc(db, "project_allocations", p.id);
          await updateDoc(docRef, { status: "Inactive" });
        }
      }
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
    if (existingStr) {
      const allProjects: ProjectAllocation[] = JSON.parse(existingStr);
      const updated = allProjects.map((p) => {
        if (p.employeeId === employeeId) {
          if (p.id === targetProjectId) {
            return { ...p, status: newStatus };
          }
          if (newStatus === "Active" && p.status === "Active") {
            return { ...p, status: "Inactive" as const };
          }
        }
        return p;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    }
  }
  return true;
}

export async function setActiveProjectForEmployee(
  employeeId: string,
  targetProjectId: string
): Promise<boolean> {
  return setProjectAllocationStatus(employeeId, targetProjectId, "Active");
}

export async function deleteProjectAllocation(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "project_allocations", id));
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
    if (existingStr) {
      const allProjects: ProjectAllocation[] = JSON.parse(existingStr);
      const updated = allProjects.filter((p) => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    }
  }
  return true;
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

/* ==========================================================================
   CUSTOMERS, WORKS, INSTALLMENTS & INVOICES MANAGEMENT MODULE
   ========================================================================== */

export interface CustomerData {
  id?: string;
  name: string;
  mobileNumber: string;
  businessName: string;
  email?: string;
  address: string;
  gstin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerWork {
  id?: string;
  customerId: string;
  name: string;
  amount: number;
  status: "Pending" | "In Progress" | "Completed";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkInstallment {
  id?: string;
  workId: string;
  customerId: string;
  amount: number;
  paymentMode: "UPI" | "Cash" | "Bank Transfer" | "Cheque";
  date: string;
  note?: string;
  createdAt?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CompanySettings {
  id?: string;
  companyName: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  gstin: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  upiQrCodeUrl?: string;
  signatoryName?: string;
  signatoryImageUrl?: string;
  termsAndConditions?: string;
  updatedAt?: string;
}

export interface CustomerInvoice {
  id?: string;
  customerId: string;
  invoiceNumber: string;
  poNumber?: string;
  issueDate: string;
  dueDate: string;
  status: "Paid" | "Unpaid" | "Partially Paid" | "Overdue";
  myCompanyDetails: {
    companyName: string;
    email: string;
    phone: string;
    website?: string;
    address: string;
    gstin: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
    upiQrCodeUrl?: string;
    signatoryName?: string;
    signatoryImageUrl?: string;
  };
  customerDetails: {
    name: string;
    businessName: string;
    mobileNumber: string;
    email?: string;
    address: string;
    gstin?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  notes?: string;
  terms?: string;
  createdAt?: string;
}

const LOCAL_STORAGE_KEY_CUSTOMERS = "gamanext_customers_v1";
const LOCAL_STORAGE_KEY_CUSTOMER_WORKS = "gamanext_customer_works_v1";
const LOCAL_STORAGE_KEY_WORK_INSTALLMENTS = "gamanext_work_installments_v1";
const LOCAL_STORAGE_KEY_CUSTOMER_INVOICES = "gamanext_customer_invoices_v1";
const LOCAL_STORAGE_KEY_COMPANY_SETTINGS = "gamanext_company_settings_v1";

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "Gamanext Software Solutions Pvt. Ltd.",
  phone: "+91 6281288314",
  email: "hello@gamanext.com",
  website: "www.gamanext.com",
  address: "123, Tech Park, 4th Floor, Bengaluru, Karnataka - 560001, India",
  gstin: "37JVXPK4914E1ZY",
  bankName: "HDFC Bank",
  accountName: "Gamanext Software Solutions Pvt. Ltd.",
  accountNumber: "50200012345678",
  ifscCode: "HDFC0001234",
  branch: "Koramangala, Bengaluru",
  upiId: "6281288314@upi",
  signatoryName: "Siva Krishna",
  termsAndConditions:
    "• Payment is due within 30 days from the invoice date.\n• Late payments may be subject to a 2% monthly interest charge.\n• All disputes are subject to Bengaluru jurisdiction.",
};

/* --- COMPANY SETTINGS FUNCTIONS --- */

export async function getCompanySettingsFromStorage(): Promise<CompanySettings> {
  try {
    const snapshot = await getDocs(collection(db, "company_settings"));
    const items: CompanySettings[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as CompanySettings);
    });
    if (items.length > 0) return items[0];
  } catch (e) {}

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY_SETTINGS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    } else {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_COMPANY_SETTINGS,
        JSON.stringify(DEFAULT_COMPANY_SETTINGS)
      );
      return DEFAULT_COMPANY_SETTINGS;
    }
  }
  return DEFAULT_COMPANY_SETTINGS;
}

export async function saveCompanySettingsToStorage(
  settings: CompanySettings
): Promise<CompanySettings> {
  const now = new Date().toISOString();
  const itemToSave: CompanySettings = {
    ...settings,
    updatedAt: now,
  };

  try {
    if (itemToSave.id && !itemToSave.id.startsWith("setting-")) {
      const docId = itemToSave.id;
      const { id, ...data } = itemToSave;
      await updateDoc(doc(db, "company_settings", docId), data);
    } else {
      const docRef = await addDoc(collection(db, "company_settings"), itemToSave);
      itemToSave.id = docRef.id;
    }
  } catch (e) {
    if (!itemToSave.id) itemToSave.id = "setting-main";
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_COMPANY_SETTINGS,
      JSON.stringify(itemToSave)
    );
  }

  return itemToSave;
}

// Initial seed data for immediate demonstration
const SEED_CUSTOMERS: CustomerData[] = [
  {
    id: "cust-101",
    name: "Rajesh Sharma",
    mobileNumber: "+91 98765 43210",
    businessName: "Sharma Digital Solutions",
    email: "rajesh@sharmadigital.com",
    address: "Plot 42, Hitech City, Hyderabad, Telangana 500081",
    createdAt: "2026-07-15T10:00:00.000Z",
  },
  {
    id: "cust-102",
    name: "Ananya Roy",
    mobileNumber: "+91 91234 56789",
    businessName: "Vogue Interior Studio",
    email: "info@vogueinteriors.in",
    address: "12/A Jubilee Hills, Road No. 36, Hyderabad, Telangana 500033",
    createdAt: "2026-08-01T14:30:00.000Z",
  },
];

const SEED_WORKS: CustomerWork[] = [
  {
    id: "work-1",
    customerId: "cust-101",
    name: "Enterprise ERP Portal Development",
    amount: 150000,
    status: "In Progress",
    notes: "Full stack NEXT.js web application with Firebase database",
    createdAt: "2026-07-16T11:00:00.000Z",
  },
  {
    id: "work-2",
    customerId: "cust-101",
    name: "SEO & Brand Strategy",
    amount: 35000,
    status: "Completed",
    notes: "Organic search optimization & social media branding assets",
    createdAt: "2026-07-20T09:15:00.000Z",
  },
  {
    id: "work-3",
    customerId: "cust-102",
    name: "E-Commerce Website & Payment Setup",
    amount: 85000,
    status: "In Progress",
    notes: "Shopify custom storefront with Razorpay & WhatsApp order tracking",
    createdAt: "2026-08-02T16:00:00.000Z",
  },
];

const SEED_INSTALLMENTS: WorkInstallment[] = [
  {
    id: "inst-1",
    workId: "work-1",
    customerId: "cust-101",
    amount: 50000,
    paymentMode: "UPI",
    date: "2026-07-16",
    note: "Advance 33% payment received via GPay",
    createdAt: "2026-07-16T11:30:00.000Z",
  },
  {
    id: "inst-2",
    workId: "work-1",
    customerId: "cust-101",
    amount: 40000,
    paymentMode: "Cash",
    date: "2026-08-05",
    note: "Milestone 2 payment received in cash",
    createdAt: "2026-08-05T15:20:00.000Z",
  },
  {
    id: "inst-3",
    workId: "work-2",
    customerId: "cust-101",
    amount: 35000,
    paymentMode: "Bank Transfer",
    date: "2026-07-25",
    note: "Full payment via NEFT",
    createdAt: "2026-07-25T12:00:00.000Z",
  },
  {
    id: "inst-4",
    workId: "work-3",
    customerId: "cust-102",
    amount: 30000,
    paymentMode: "UPI",
    date: "2026-08-03",
    note: "Initial deposit via PhonePe",
    createdAt: "2026-08-03T10:00:00.000Z",
  },
];

const SEED_INVOICES: CustomerInvoice[] = [
  {
    id: "inv-1",
    customerId: "cust-101",
    invoiceNumber: "INV-2026-0001",
    poNumber: "PO-2026-0054",
    issueDate: "2026-05-29",
    dueDate: "2026-06-28",
    status: "Partially Paid",
    myCompanyDetails: {
      companyName: "Gamanext Software Solutions Pvt. Ltd.",
      email: "hello@gamanext.com",
      phone: "+91 6281288314",
      website: "www.gamanext.com",
      address: "123, Tech Park, 4th Floor, Bengaluru, Karnataka - 560001, India",
      gstin: "37JVXPK4914E1ZY",
      bankName: "HDFC Bank",
      accountName: "Gamanext Software Solutions Pvt. Ltd.",
      accountNumber: "50200012345678",
      ifscCode: "HDFC0001234",
      branch: "Koramangala, Bengaluru",
      upiId: "6281288314@upi",
      signatoryName: "Siva Krishna",
    },
    customerDetails: {
      name: "Rajesh Sharma",
      businessName: "Sharma Digital Solutions Pvt. Ltd.",
      mobileNumber: "+91 98765 43210",
      email: "rajesh@sharmadigital.com",
      address: "45, Industrial Area, Whitefield, Bengaluru, Karnataka - 560066, India",
      gstin: "29ACME1234B1Z2",
    },
    items: [
      {
        id: "item-1",
        description: "Custom Software Development\nRequirement Analysis, UI/UX, Development & Testing",
        hsnSac: "998313",
        quantity: 1,
        unitPrice: 75000,
        amount: 75000,
      },
      {
        id: "item-2",
        description: "Web Application Maintenance\nMonthly Maintenance & Support",
        hsnSac: "998313",
        quantity: 1,
        unitPrice: 15000,
        amount: 15000,
      },
      {
        id: "item-3",
        description: "API Integration Services\nThird-party API Integration & Configuration",
        hsnSac: "998313",
        quantity: 1,
        unitPrice: 10000,
        amount: 10000,
      },
      {
        id: "item-4",
        description: "Cloud Hosting & Deployment\nServer Setup & Deployment",
        hsnSac: "998313",
        quantity: 1,
        unitPrice: 5000,
        amount: 5000,
      },
    ],
    subtotal: 105000,
    cgstRate: 9,
    cgstAmount: 9450,
    sgstRate: 9,
    sgstAmount: 9450,
    taxAmount: 18900,
    discount: 0,
    total: 123900,
    notes: "Thank you for your business.\nWe appreciate your trust in Gamanext.",
    terms:
      "• Payment is due within 30 days from the invoice date.\n• Late payments may be subject to a 2% monthly interest charge.\n• All disputes are subject to Bengaluru jurisdiction.",
    createdAt: "2026-05-29T10:00:00.000Z",
  },
];

/* --- CUSTOMER FUNCTIONS --- */

export async function getCustomersFromStorage(): Promise<CustomerData[]> {
  try {
    const snapshot = await getDocs(collection(db, "customers"));
    const items: CustomerData[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as CustomerData);
    });
    if (items.length > 0) return items;
  } catch (e) {}

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOMERS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
      return SEED_CUSTOMERS;
    }
  }
  return SEED_CUSTOMERS;
}

export async function saveCustomerToStorage(customer: CustomerData): Promise<CustomerData> {
  const isEdit = Boolean(customer.id);
  const now = new Date().toISOString();
  const itemToSave: CustomerData = {
    ...customer,
    updatedAt: now,
    createdAt: customer.createdAt || now,
  };

  try {
    if (isEdit && itemToSave.id && !itemToSave.id.startsWith("cust-")) {
      const docId = itemToSave.id;
      const { id, ...data } = itemToSave;
      await updateDoc(doc(db, "customers", docId), data);
    } else {
      const docRef = await addDoc(collection(db, "customers"), itemToSave);
      itemToSave.id = docRef.id;
    }
  } catch (e) {
    if (!itemToSave.id) {
      itemToSave.id = `cust-${Date.now()}`;
    }
  }

  if (typeof window !== "undefined") {
    const existing = await getCustomersFromStorage();
    let updatedList: CustomerData[];
    if (isEdit) {
      updatedList = existing.map((c) => (c.id === itemToSave.id ? itemToSave : c));
    } else {
      updatedList = [itemToSave, ...existing];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(updatedList));
  }

  return itemToSave;
}

export async function deleteCustomerFromStorage(id: string): Promise<boolean> {
  try {
    if (id && !id.startsWith("cust-")) {
      await deleteDoc(doc(db, "customers", id));
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getCustomersFromStorage();
    const filtered = existing.filter((c) => c.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(filtered));
  }
  return true;
}

/* --- CUSTOMER WORKS FUNCTIONS --- */

export async function getCustomerWorksFromStorage(customerId?: string): Promise<CustomerWork[]> {
  try {
    const snapshot = await getDocs(collection(db, "customer_works"));
    const items: CustomerWork[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as CustomerWork);
    });
    if (items.length > 0) {
      return customerId ? items.filter((w) => w.customerId === customerId) : items;
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOMER_WORKS);
    if (stored) {
      try {
        const all: CustomerWork[] = JSON.parse(stored);
        return customerId ? all.filter((w) => w.customerId === customerId) : all;
      } catch (e) {}
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMER_WORKS, JSON.stringify(SEED_WORKS));
      return customerId ? SEED_WORKS.filter((w) => w.customerId === customerId) : SEED_WORKS;
    }
  }
  return customerId ? SEED_WORKS.filter((w) => w.customerId === customerId) : SEED_WORKS;
}

export async function saveCustomerWorkToStorage(work: CustomerWork): Promise<CustomerWork> {
  const isEdit = Boolean(work.id);
  const now = new Date().toISOString();
  const itemToSave: CustomerWork = {
    ...work,
    updatedAt: now,
    createdAt: work.createdAt || now,
  };

  try {
    if (isEdit && itemToSave.id && !itemToSave.id.startsWith("work-")) {
      const docId = itemToSave.id;
      const { id, ...data } = itemToSave;
      await updateDoc(doc(db, "customer_works", docId), data);
    } else {
      const docRef = await addDoc(collection(db, "customer_works"), itemToSave);
      itemToSave.id = docRef.id;
    }
  } catch (e) {
    if (!itemToSave.id) {
      itemToSave.id = `work-${Date.now()}`;
    }
  }

  if (typeof window !== "undefined") {
    const existing = await getCustomerWorksFromStorage();
    let updatedList: CustomerWork[];
    if (isEdit) {
      updatedList = existing.map((w) => (w.id === itemToSave.id ? itemToSave : w));
    } else {
      updatedList = [itemToSave, ...existing];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMER_WORKS, JSON.stringify(updatedList));
  }

  return itemToSave;
}

export async function deleteCustomerWorkFromStorage(id: string): Promise<boolean> {
  try {
    if (id && !id.startsWith("work-")) {
      await deleteDoc(doc(db, "customer_works", id));
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getCustomerWorksFromStorage();
    const filtered = existing.filter((w) => w.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMER_WORKS, JSON.stringify(filtered));
  }
  return true;
}

/* --- WORK INSTALLMENTS FUNCTIONS --- */

export async function getWorkInstallmentsFromStorage(
  customerId?: string,
  workId?: string
): Promise<WorkInstallment[]> {
  try {
    const snapshot = await getDocs(collection(db, "work_installments"));
    const items: WorkInstallment[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as WorkInstallment);
    });
    if (items.length > 0) {
      let filtered = items;
      if (customerId) filtered = filtered.filter((i) => i.customerId === customerId);
      if (workId) filtered = filtered.filter((i) => i.workId === workId);
      return filtered;
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_WORK_INSTALLMENTS);
    if (stored) {
      try {
        let all: WorkInstallment[] = JSON.parse(stored);
        if (customerId) all = all.filter((i) => i.customerId === customerId);
        if (workId) all = all.filter((i) => i.workId === workId);
        return all;
      } catch (e) {}
    } else {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_WORK_INSTALLMENTS,
        JSON.stringify(SEED_INSTALLMENTS)
      );
      let all = SEED_INSTALLMENTS;
      if (customerId) all = all.filter((i) => i.customerId === customerId);
      if (workId) all = all.filter((i) => i.workId === workId);
      return all;
    }
  }
  let all = SEED_INSTALLMENTS;
  if (customerId) all = all.filter((i) => i.customerId === customerId);
  if (workId) all = all.filter((i) => i.workId === workId);
  return all;
}

export async function saveWorkInstallmentToStorage(
  installment: WorkInstallment
): Promise<WorkInstallment> {
  const isEdit = Boolean(installment.id);
  const now = new Date().toISOString();
  const itemToSave: WorkInstallment = {
    ...installment,
    createdAt: installment.createdAt || now,
  };

  try {
    if (isEdit && itemToSave.id && !itemToSave.id.startsWith("inst-")) {
      const docId = itemToSave.id;
      const { id, ...data } = itemToSave;
      await updateDoc(doc(db, "work_installments", docId), data);
    } else {
      const docRef = await addDoc(collection(db, "work_installments"), itemToSave);
      itemToSave.id = docRef.id;
    }
  } catch (e) {
    if (!itemToSave.id) {
      itemToSave.id = `inst-${Date.now()}`;
    }
  }

  if (typeof window !== "undefined") {
    const existing = await getWorkInstallmentsFromStorage();
    let updatedList: WorkInstallment[];
    if (isEdit) {
      updatedList = existing.map((i) => (i.id === itemToSave.id ? itemToSave : i));
    } else {
      updatedList = [itemToSave, ...existing];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_WORK_INSTALLMENTS, JSON.stringify(updatedList));
  }

  return itemToSave;
}

export async function deleteWorkInstallmentFromStorage(id: string): Promise<boolean> {
  try {
    if (id && !id.startsWith("inst-")) {
      await deleteDoc(doc(db, "work_installments", id));
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getWorkInstallmentsFromStorage();
    const filtered = existing.filter((i) => i.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_WORK_INSTALLMENTS, JSON.stringify(filtered));
  }
  return true;
}

/* --- CUSTOMER INVOICES FUNCTIONS --- */

export async function getCustomerInvoicesFromStorage(
  customerId?: string
): Promise<CustomerInvoice[]> {
  try {
    const snapshot = await getDocs(collection(db, "customer_invoices"));
    const items: CustomerInvoice[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as CustomerInvoice);
    });
    if (items.length > 0) {
      return customerId ? items.filter((inv) => inv.customerId === customerId) : items;
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOMER_INVOICES);
    if (stored) {
      try {
        const all: CustomerInvoice[] = JSON.parse(stored);
        return customerId ? all.filter((inv) => inv.customerId === customerId) : all;
      } catch (e) {}
    } else {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_CUSTOMER_INVOICES,
        JSON.stringify(SEED_INVOICES)
      );
      return customerId ? SEED_INVOICES.filter((inv) => inv.customerId === customerId) : SEED_INVOICES;
    }
  }
  return customerId ? SEED_INVOICES.filter((inv) => inv.customerId === customerId) : SEED_INVOICES;
}

export async function saveCustomerInvoiceToStorage(
  invoice: CustomerInvoice
): Promise<CustomerInvoice> {
  const isEdit = Boolean(invoice.id);
  const now = new Date().toISOString();
  const itemToSave: CustomerInvoice = {
    ...invoice,
    createdAt: invoice.createdAt || now,
  };

  try {
    if (isEdit && itemToSave.id && !itemToSave.id.startsWith("inv-")) {
      const docId = itemToSave.id;
      const { id, ...data } = itemToSave;
      await updateDoc(doc(db, "customer_invoices", docId), data);
    } else {
      const docRef = await addDoc(collection(db, "customer_invoices"), itemToSave);
      itemToSave.id = docRef.id;
    }
  } catch (e) {
    if (!itemToSave.id) {
      itemToSave.id = `inv-${Date.now()}`;
    }
  }

  if (typeof window !== "undefined") {
    const existing = await getCustomerInvoicesFromStorage();
    let updatedList: CustomerInvoice[];
    if (isEdit) {
      updatedList = existing.map((inv) => (inv.id === itemToSave.id ? itemToSave : inv));
    } else {
      updatedList = [itemToSave, ...existing];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMER_INVOICES, JSON.stringify(updatedList));
  }

  return itemToSave;
}

export async function deleteCustomerInvoiceFromStorage(id: string): Promise<boolean> {
  try {
    if (id && !id.startsWith("inv-")) {
      await deleteDoc(doc(db, "customer_invoices", id));
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getCustomerInvoicesFromStorage();
    const filtered = existing.filter((inv) => inv.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMER_INVOICES, JSON.stringify(filtered));
  }
  return true;
}

/* ---------------- HOLIDAYS STORAGE ---------------- */
export const LOCAL_STORAGE_KEY_HOLIDAYS = "gamanext_holidays";

export const DEFAULT_HOLIDAYS_2026: Omit<HolidayItem, "id">[] = [
  { title: "New Year's Day", date: "2026-01-01", dayOfWeek: "Thursday", type: "Public Holiday", description: "First day of the new year", year: 2026 },
  { title: "Makar Sankranti / Pongal", date: "2026-01-14", dayOfWeek: "Wednesday", type: "Festival Holiday", description: "Harvest Festival", year: 2026 },
  { title: "Republic Day", date: "2026-01-26", dayOfWeek: "Monday", type: "National Holiday", description: "Commemorates the adoption of Constitution of India", year: 2026 },
  { title: "Maha Shivaratri", date: "2026-02-15", dayOfWeek: "Sunday", type: "Festival Holiday", description: "Great Night of Lord Shiva", year: 2026 },
  { title: "Holi", date: "2026-03-04", dayOfWeek: "Wednesday", type: "Festival Holiday", description: "Festival of Colours", year: 2026 },
  { title: "Ugadi / Gudi Padwa", date: "2026-03-19", dayOfWeek: "Thursday", type: "Festival Holiday", description: "Traditional New Year Festival", year: 2026 },
  { title: "Eid-ul-Fitr (Ramzan)", date: "2026-03-21", dayOfWeek: "Saturday", type: "Festival Holiday", description: "Islamic celebration marking the end of Ramadan", year: 2026 },
  { title: "Good Friday", date: "2026-04-03", dayOfWeek: "Friday", type: "Public Holiday", description: "Christian holiday commemorating the crucifixion", year: 2026 },
  { title: "Dr. B.R. Ambedkar Jayanti", date: "2026-04-14", dayOfWeek: "Tuesday", type: "Public Holiday", description: "Birth anniversary of Dr. B.R. Ambedkar", year: 2026 },
  { title: "May Day / Labour Day", date: "2026-05-01", dayOfWeek: "Friday", type: "Public Holiday", description: "International Workers' Day", year: 2026 },
  { title: "Bakrid / Eid al-Adha", date: "2026-05-27", dayOfWeek: "Wednesday", type: "Festival Holiday", description: "Feast of the Sacrifice", year: 2026 },
  { title: "Independence Day", date: "2026-08-15", dayOfWeek: "Saturday", type: "National Holiday", description: "Indian Independence Day celebration", year: 2026 },
  { title: "Ganesh Chaturthi", date: "2026-09-14", dayOfWeek: "Monday", type: "Festival Holiday", description: "Celebrates the birth of Lord Ganesha", year: 2026 },
  { title: "Gandhi Jayanti", date: "2026-10-02", dayOfWeek: "Friday", type: "National Holiday", description: "Birth anniversary of Mahatma Gandhi", year: 2026 },
  { title: "Dussehra / Vijaya Dashami", date: "2026-10-20", dayOfWeek: "Tuesday", type: "Festival Holiday", description: "Victory of good over evil", year: 2026 },
  { title: "Diwali / Deepavali", date: "2026-11-08", dayOfWeek: "Sunday", type: "Festival Holiday", description: "Festival of Lights", year: 2026 },
  { title: "Christmas Day", date: "2026-12-25", dayOfWeek: "Friday", type: "Public Holiday", description: "Celebration of the birth of Jesus Christ", year: 2026 },
];

export async function getHolidaysFromStorage(filterYear?: string | number): Promise<HolidayItem[]> {
  try {
    const q = query(collection(db, "holidays"), orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    const holidays: HolidayItem[] = [];
    snapshot.forEach((docSnap) => {
      holidays.push({ id: docSnap.id, ...docSnap.data() } as HolidayItem);
    });
    if (holidays.length > 0) {
      if (filterYear && filterYear !== "All") {
        return holidays.filter((h) => String(h.year || new Date(h.date).getFullYear()) === String(filterYear));
      }
      return holidays;
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_HOLIDAYS);
    if (data) {
      try {
        const parsed: HolidayItem[] = JSON.parse(data);
        if (parsed.length > 0) {
          if (filterYear && filterYear !== "All") {
            return parsed.filter((h) => String(h.year || new Date(h.date).getFullYear()) === String(filterYear));
          }
          return parsed;
        }
      } catch (e) {}
    }

    // Seed default holidays if empty
    const seeded: HolidayItem[] = DEFAULT_HOLIDAYS_2026.map((h, i) => ({
      ...h,
      id: `hol-${Date.now()}-${i}`,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY_HOLIDAYS, JSON.stringify(seeded));
    if (filterYear && filterYear !== "All") {
      return seeded.filter((h) => String(h.year || new Date(h.date).getFullYear()) === String(filterYear));
    }
    return seeded;
  }
  return [];
}

export async function saveHolidayToStorage(
  holiday: Omit<HolidayItem, "id" | "createdAt"> & { id?: string }
): Promise<HolidayItem> {
  const dateObj = new Date(holiday.date);
  const dayOfWeek = isNaN(dateObj.getTime())
    ? ""
    : dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const year = isNaN(dateObj.getTime()) ? 2026 : dateObj.getFullYear();

  const itemToSave: HolidayItem = {
    ...holiday,
    dayOfWeek: holiday.dayOfWeek || dayOfWeek,
    year: holiday.year || year,
    createdAt: holiday.id ? undefined : new Date().toISOString(),
  };

  const isEdit = Boolean(itemToSave.id && !itemToSave.id.startsWith("hol-"));

  try {
    if (isEdit && itemToSave.id) {
      const docId = itemToSave.id;
      const { id, ...data } = itemToSave;
      await updateDoc(doc(db, "holidays", docId), data);
    } else {
      const docRef = await addDoc(collection(db, "holidays"), itemToSave);
      itemToSave.id = docRef.id;
    }
  } catch (e) {
    if (!itemToSave.id) {
      itemToSave.id = `hol-${Date.now()}`;
    }
  }

  if (typeof window !== "undefined") {
    const existing = await getHolidaysFromStorage();
    let updatedList: HolidayItem[];
    if (itemToSave.id && existing.some((h) => h.id === itemToSave.id)) {
      updatedList = existing.map((h) => (h.id === itemToSave.id ? { ...h, ...itemToSave } : h));
    } else {
      updatedList = [itemToSave, ...existing];
    }
    updatedList.sort((a, b) => (a.date > b.date ? 1 : -1));
    localStorage.setItem(LOCAL_STORAGE_KEY_HOLIDAYS, JSON.stringify(updatedList));
  }

  return itemToSave;
}

export async function deleteHolidayFromStorage(id: string): Promise<boolean> {
  try {
    if (id && !id.startsWith("hol-")) {
      await deleteDoc(doc(db, "holidays", id));
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const existing = await getHolidaysFromStorage();
    const filtered = existing.filter((h) => h.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_HOLIDAYS, JSON.stringify(filtered));
  }
  return true;
}

/* ---------------- SALARY & PAYROLL STORAGE HELPERS ---------------- */
export const DEFAULT_SALARY_STRUCTURE = (employeeId: string): EmployeeSalaryStructure => ({
  employeeId,
  earnings: [
    { id: "earn-1", name: "Basic Salary", amount: 25000 },
    { id: "earn-2", name: "House Rent Allowance (HRA)", amount: 12500 },
    { id: "earn-3", name: "Special Allowance", amount: 10000 },
    { id: "earn-4", name: "Conveyance Allowance", amount: 2500 },
  ],
  deductions: [
    { id: "ded-1", name: "Provident Fund (PF)", amount: 1800 },
    { id: "ded-2", name: "Professional Tax (PT)", amount: 200 },
    { id: "ded-3", name: "Health Insurance", amount: 1000 },
  ],
  grossSalary: 50000,
  totalDeductions: 3000,
  netPay: 47000,
});

export async function getSalaryStructureForEmployee(
  employeeId: string,
  employeeObj?: EmployeeData | null
): Promise<EmployeeSalaryStructure> {
  // 1. Check direct salaryStructure property on employee object
  if (employeeObj && employeeObj.salaryStructure && employeeObj.salaryStructure.earnings && employeeObj.salaryStructure.earnings.length > 0) {
    const s = employeeObj.salaryStructure;
    const gross = (s.earnings || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDed = (s.deductions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return {
      ...s,
      grossSalary: gross,
      totalDeductions: totalDed,
      netPay: gross - totalDed,
    };
  }

  // 2. Check Firestore collection "salary_structures"
  try {
    const q = query(
      collection(db, "salary_structures"),
      where("employeeId", "==", employeeId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      const earnings: SalaryAttribute[] = data.earnings || [];
      const deductions: SalaryAttribute[] = data.deductions || [];
      const gross = earnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const totalDed = deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const net = gross - totalDed;
      return {
        id: docSnap.id,
        employeeId,
        earnings,
        deductions,
        grossSalary: gross,
        totalDeductions: totalDed,
        netPay: net,
        updatedAt: data.updatedAt,
      };
    }
  } catch (e) {}

  // 3. Check LocalStorage salary structures
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_SALARY_STRUCTURES);
    if (data) {
      try {
        const list: EmployeeSalaryStructure[] = JSON.parse(data);
        const found = list.find(
          (s) => s.employeeId === employeeId || (employeeObj && s.employeeId === employeeObj.employeeId) || (employeeObj && s.employeeId === employeeObj.id)
        );
        if (found && found.earnings && found.earnings.length > 0) {
          const gross = (found.earnings || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const totalDed = (found.deductions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          return {
            ...found,
            grossSalary: gross,
            totalDeductions: totalDed,
            netPay: gross - totalDed,
          };
        }
      } catch (e) {}
    }

    // 4. Check LocalStorage employee data
    const empDataStr = localStorage.getItem(LOCAL_STORAGE_KEY_EMPLOYEES);
    if (empDataStr) {
      try {
        const employees: EmployeeData[] = JSON.parse(empDataStr);
        const foundEmp = employees.find(
          (e) => e.id === employeeId || e.employeeId === employeeId
        );
        if (foundEmp && foundEmp.salaryStructure && foundEmp.salaryStructure.earnings && foundEmp.salaryStructure.earnings.length > 0) {
          const s = foundEmp.salaryStructure;
          const gross = (s.earnings || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const totalDed = (s.deductions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          return {
            ...s,
            grossSalary: gross,
            totalDeductions: totalDed,
            netPay: gross - totalDed,
          };
        }
      } catch (e) {}
    }
  }

  return DEFAULT_SALARY_STRUCTURE(employeeId);
}

export async function saveSalaryStructureForEmployee(
  structure: EmployeeSalaryStructure,
  employeeDocId?: string
): Promise<EmployeeSalaryStructure> {
  const gross = structure.earnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalDed = structure.deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const net = gross - totalDed;

  const itemToSave: EmployeeSalaryStructure = {
    ...structure,
    grossSalary: gross,
    totalDeductions: totalDed,
    netPay: net,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in Firestore collection "salary_structures"
  try {
    if (itemToSave.id && !itemToSave.id.startsWith("sal-")) {
      const { id, ...data } = itemToSave;
      await updateDoc(doc(db, "salary_structures", itemToSave.id), data);
    } else {
      const docRef = await addDoc(collection(db, "salary_structures"), itemToSave);
      itemToSave.id = docRef.id;
    }
  } catch (e) {
    if (!itemToSave.id) {
      itemToSave.id = `sal-${Date.now()}`;
    }
  }

  // 2. Directly update the Employee document in Firestore collection "employees"
  const targetDocId = employeeDocId || structure.employeeId;
  if (targetDocId && !targetDocId.startsWith("emp-")) {
    try {
      await updateDoc(doc(db, "employees", targetDocId), {
        salaryStructure: itemToSave,
      });
    } catch (e) {}
  }

  // 3. Update in LocalStorage
  if (typeof window !== "undefined") {
    // Update salary structures key
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_SALARY_STRUCTURES);
    const existing: EmployeeSalaryStructure[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = existing.filter((s) => s.employeeId !== structure.employeeId);
    updated.unshift(itemToSave);
    localStorage.setItem(LOCAL_STORAGE_KEY_SALARY_STRUCTURES, JSON.stringify(updated));

    // Also update employee record in employees key
    const empDataStr = localStorage.getItem(LOCAL_STORAGE_KEY_EMPLOYEES);
    if (empDataStr) {
      try {
        const employees: EmployeeData[] = JSON.parse(empDataStr);
        const updatedEmployees = employees.map((emp) => {
          if (emp.id === targetDocId || emp.id === structure.employeeId || emp.employeeId === structure.employeeId) {
            return { ...emp, salaryStructure: itemToSave };
          }
          return emp;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY_EMPLOYEES, JSON.stringify(updatedEmployees));
      } catch (e) {}
    }
  }

  return itemToSave;
}

export function generateMonthlyPayslips(
  employee: EmployeeData,
  structure: EmployeeSalaryStructure,
  year = 2026
): MonthlyPayslip[] {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const empKey = employee.id || employee.employeeId;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();

  const payslips: MonthlyPayslip[] = [];

  // Parse employee joining date
  const joiningDate = employee.dateOfJoining ? new Date(employee.dateOfJoining) : new Date(2025, 0, 1);
  const joiningYear = isNaN(joiningDate.getTime()) ? 2025 : joiningDate.getFullYear();
  const joiningMonthIdx = isNaN(joiningDate.getTime()) ? 0 : joiningDate.getMonth();

  for (let m = 0; m < 12; m++) {
    // Only generate for months from joining date up to current month (or all months if viewing past years)
    const isPastOrCurrent =
      year < currentYear || (year === currentYear && m <= currentMonthIdx);

    const isAfterJoining =
      year > joiningYear || (year === joiningYear && m >= joiningMonthIdx);

    if (!isAfterJoining) continue;

    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const monthName = monthNames[m];
    const displayMonth = `${monthName} ${year}`;
    const paymentDate = `01 ${monthName.slice(0, 3)} ${year}`;

    payslips.push({
      id: `payslip-${empKey}-${year}-${m + 1}`,
      employeeId: empKey,
      month: displayMonth,
      year,
      monthIndex: m,
      paymentDate,
      workingDays: daysInMonth,
      paidDays: daysInMonth,
      earnings: structure.earnings,
      deductions: structure.deductions,
      grossSalary: structure.grossSalary,
      totalDeductions: structure.totalDeductions,
      netPay: structure.netPay,
      status: isPastOrCurrent ? "Generated" : "Processing",
    });
  }

  // Sort by month descending (most recent first)
  return payslips.sort((a, b) => b.monthIndex - a.monthIndex);
}

export function amountInWords(num: number): string {
  if (num <= 0) return "Rupees Zero Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n === 0) return "";
    let str = "";
    if (Math.floor(n / 10000000) > 0) {
      str += inWords(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      str += inWords(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      str += inWords(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      str += inWords(Math.floor(n / 100)) + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
      }
    }
    return str;
  }

  const result = inWords(Math.round(num)).trim();
  return `Rupees ${result} Only`;
}

