"use client";

import Image from "next/image";
import { Search, Bell, Eye, ChevronDown, Sparkles, LogOut, Shield, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out of Matrix Admin?")) {
      await logout();
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Admin";
  const userEmail = user?.email || "admin@gamanext.com";
  const initials = displayName.slice(0, 2).toUpperCase() || "GA";

  return (
    <header className="bg-gradient-to-r from-[#003680] via-[#0B4FBA] to-[#0A47A4] text-white h-14 px-4 flex items-center justify-between border-b border-blue-900/40 shadow-md sticky top-0 z-50">
      {/* Left section: Brand & Logo */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="bg-white px-2.5 py-1 rounded-md shadow-sm flex items-center justify-center transition-transform hover:scale-[1.02]">
          <Image
            src="/gama-next-logo-reserved.png"
            alt="GamaNext Software Solutions"
            width={130}
            height={32}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>
        <div className="hidden sm:flex items-center space-x-1.5 bg-blue-950/40 border border-blue-400/30 text-blue-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
          <Sparkles className="w-3 h-3 text-blue-300 animate-pulse" />
          <span>Matrix Admin</span>
        </div>
      </div>

      {/* Center section: Search Bar */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-blue-200/80 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, invoices, employees, leads..."
            className="w-full bg-blue-950/40 border border-blue-400/30 text-white placeholder-blue-200/60 text-sm pl-9 pr-24 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-blue-950/70 transition-all"
          />
          <div className="absolute right-2 flex items-center space-x-1.5">
            <kbd className="hidden md:inline-block bg-blue-900/60 text-blue-200 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-500/40">
              CTRL K
            </kbd>
            <button className="hidden sm:flex items-center space-x-1 bg-blue-800/60 hover:bg-blue-800 text-blue-100 text-xs px-2 py-1 rounded border border-blue-500/40 transition-colors">
              <Eye className="w-3.5 h-3.5" />
              <span>View as</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right section: Action badges & Profile */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <button className="relative p-1.5 text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-blue-900" />
        </button>

        {/* User Profile Badge & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-2 border-l border-blue-400/30 cursor-pointer hover:opacity-95 focus:outline-none"
          >
            <div className="w-7 h-7 rounded-md bg-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-xs font-semibold text-blue-50 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-blue-200/80 leading-tight truncate max-w-[120px]">
                {userEmail}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 text-gray-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/70">
                <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
                <div className="mt-1 flex items-center space-x-1 text-[10px] font-semibold text-emerald-600">
                  <Shield className="w-3 h-3" />
                  <span>Authenticated Administrator</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center space-x-2 px-3.5 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-[#0B4FBA] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Admin Settings</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out of Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
