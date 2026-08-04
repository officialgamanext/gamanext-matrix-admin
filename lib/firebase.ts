import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
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

const LOCAL_STORAGE_KEY_EMPLOYEES = "gamanext_employees_data";
const LOCAL_STORAGE_KEY_DEPTS = "gamanext_departments_data";
const LOCAL_STORAGE_KEY_ROLES = "gamanext_roles_data";

/* ---------------- EMPLOYEES STORAGE HELPERS ---------------- */
export async function getEmployeesFromStorage(): Promise<EmployeeData[]> {
  try {
    const q = query(collection(db, "employees"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const employees: EmployeeData[] = [];
    snapshot.forEach((docSnap) => {
      employees.push({ id: docSnap.id, ...docSnap.data() } as EmployeeData);
    });
    return employees;
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
    const filtered = existing.filter((emp) => emp.id !== id);
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
