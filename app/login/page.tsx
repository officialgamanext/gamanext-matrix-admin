"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Shield,
  HelpCircle,
  X,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [returnUrl, setReturnUrl] = useState("/");
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ret = params.get("returnUrl");
      if (ret) {
        setReturnUrl(ret);
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(returnUrl);
    }
  }, [user, authLoading, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Please enter your admin username or email.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const res = await login(identifier.trim(), password);

    if (res.success) {
      router.replace(returnUrl);
    } else {
      setErrorMsg(res.error || "Invalid username or password. Please verify your credentials.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-white to-slate-100 flex flex-col justify-between items-center px-4 py-8 relative selection:bg-[#0B4FBA] selection:text-white">
      {/* Top Bar with Matrix Badge */}
      <div className="w-full max-w-sm flex justify-between items-center pb-2">
        <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-[#0052cc] text-xs px-2.5 py-1 rounded-full font-medium shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#0052cc]" />
          <span>Matrix Admin Portal</span>
        </div>
        <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] px-2 py-0.5 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Enterprise Secure</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center space-y-4 my-auto">
        {/* 1. Brand Logo */}
        <div className="flex flex-col items-center">
          <Image
            src="/gama-next-logo-reserved.png"
            alt="GamaNext Software Solutions"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        {/* 2. Visual Graphic Illustration */}
        <div className="relative w-36 h-36 flex items-center justify-center my-1">
          {/* Outer glow circle */}
          <div className="absolute inset-0 bg-blue-100/60 rounded-full blur-xs" />

          {/* Decorative ambient dots */}
          <div className="absolute top-2 left-5 w-2.5 h-2.5 bg-blue-300/60 rounded-full" />
          <div className="absolute top-10 right-4 w-3 h-3 bg-blue-300/50 rounded-full" />
          <div className="absolute bottom-6 left-4 w-2 h-2 bg-blue-400/40 rounded-full" />

          {/* Shield Badge top-left */}
          <div className="absolute top-2 left-6 w-10 h-10 rounded-full bg-blue-50 border-2 border-white shadow-xs flex items-center justify-center z-10">
            <Shield className="w-5 h-5 text-[#0052cc]" />
          </div>

          {/* Matrix Card Graphic */}
          <div className="relative z-20 w-24 h-26 bg-white rounded-[10px] shadow-md border border-slate-100 overflow-hidden flex flex-col">
            <div className="h-6 bg-gradient-to-r from-[#003680] via-[#0B4FBA] to-[#0A47A4] flex items-center justify-center">
              <div className="w-8 h-1 bg-white/40 rounded-full" />
            </div>
            <div className="flex-1 p-2 grid grid-cols-3 gap-1 content-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-2 bg-blue-50 rounded-[2px]" />
              ))}
            </div>

            {/* Lock badge bottom right */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0052cc] text-white flex items-center justify-center border-2 border-white shadow-xs">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 3. White Sign In Card */}
        <div className="w-full bg-white rounded-[10px] shadow-lg border border-slate-100 p-6 space-y-4">
          {/* Title & Subtitle */}
          <div className="text-center space-y-1">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Admin Matrix Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Sign in with your administrator account
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username / Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Username or Admin Email
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-slate-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] text-slate-900 placeholder:text-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot / Help link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-xs font-bold text-[#0052cc] hover:underline cursor-pointer"
              >
                Need Help?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#003680] via-[#0B4FBA] to-[#0A47A4] hover:from-[#002d6b] hover:to-[#093c8b] text-white text-xs font-bold rounded-[8px] shadow-sm active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <span className="text-[11px] text-slate-400 font-medium">
          © {new Date().getFullYear()} GamaNext Software Solutions Pvt Ltd
        </span>
      </div>

      {/* Admin Assistance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[10px] shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="w-4.5 h-4.5 text-[#0052cc]" />
                <span>Admin Login Assistance</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                To reset your administrator credentials or request access to the Matrix Admin Portal, please contact the IT Administrator:
              </p>
              <div className="p-3 bg-blue-50 rounded-[8px] border border-blue-100 font-mono text-[#0052cc] text-center font-bold">
                admin@gamanext.com
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#0052cc] text-white text-xs font-bold rounded-[8px] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
