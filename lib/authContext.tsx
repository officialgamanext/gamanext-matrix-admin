"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_SESSION_CACHE_KEY = "gamanext_admin_auth_cached_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for quick sync check
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(ADMIN_SESSION_CACHE_KEY);
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch (e) {}
      }
    }

    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (typeof window !== "undefined") {
        if (firebaseUser) {
          localStorage.setItem(
            ADMIN_SESSION_CACHE_KEY,
            JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            })
          );
        } else {
          localStorage.removeItem(ADMIN_SESSION_CACHE_KEY);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (
    emailOrUsername: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const rawInput = emailOrUsername.trim();
    const cleanPassword = pass.trim();

    if (!rawInput) {
      return { success: false, error: "Please enter your email or username." };
    }
    if (!cleanPassword) {
      return { success: false, error: "Please enter your password." };
    }

    // Convert username to email if no @ was provided
    let emailToTry = rawInput.toLowerCase();
    if (!emailToTry.includes("@")) {
      emailToTry = `${emailToTry}@gamanext.com`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToTry, cleanPassword);
      setUser(userCredential.user);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          ADMIN_SESSION_CACHE_KEY,
          JSON.stringify({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
          })
        );
      }
      return { success: true };
    } catch (err: any) {
      console.error("Firebase Admin Login error:", err);
      let message = "Authentication failed. Please verify your credentials.";
      const code = err.code || "";

      if (
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password"
      ) {
        message = "Invalid email/username or password. Please check your credentials.";
      } else if (code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (code === "auth/too-many-requests") {
        message = "Too many failed login attempts. Please wait a moment and try again.";
      } else if (err.message) {
        message = err.message;
      }

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(ADMIN_SESSION_CACHE_KEY);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
