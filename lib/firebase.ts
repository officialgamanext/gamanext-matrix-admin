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
  // Personal Info
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth: string;
  address: string;
  city: string;
  pincode: string;

  // Employment Details
  employeeId: string;
  employeeRole: string;
  department: string;
  dateOfJoining: string;
  username: string;
  password?: string;
  aadharNumber: string;
  panCardNumber: string;

  // Documents & Photos (URLs from ImageKit)
  profilePhotoUrl: string;
  aadharFrontUrl: string;
  aadharBackUrl: string;
  panCardUrl: string;

  // Bank Details
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;

  // Emergency Contacts
  emergencyContact1: EmergencyContact;
  emergencyContact2: EmergencyContact;

  createdAt?: string;
}

const LOCAL_STORAGE_KEY = "gamanext_employees_data";

// Helper to fetch all employees (first tries Firebase Firestore, falls back to local storage if offline)
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

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
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

// Helper to save new employee to Firebase Firestore
export async function saveEmployeeToStorage(employee: EmployeeData): Promise<EmployeeData> {
  const newEmployee = {
    ...employee,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "employees"), newEmployee);
    const savedRecord = { ...newEmployee, id: docRef.id };

    // Also mirror in local cache for offline instant view
    if (typeof window !== "undefined") {
      const existing = await getEmployeesFromStorage();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([savedRecord, ...existing]));
    }

    return savedRecord;
  } catch (err) {
    console.error("Firestore write error, saving to local cache:", err);
    if (typeof window !== "undefined") {
      const existing = await getEmployeesFromStorage();
      const created = { ...newEmployee, id: `emp-${Date.now()}` };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([created, ...existing]));
      return created;
    }
  }

  return newEmployee;
}

// Helper to delete employee from Firebase Firestore
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
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  return true;
}
