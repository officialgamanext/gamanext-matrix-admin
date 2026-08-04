"use client";

import Image from "next/image";
import { Search, Bell, Eye, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-gradient-to-r from-[#003680] via-[#0B4FBA] to-[#0A47A4] text-white h-14 px-4 flex items-center justify-between border-b border-blue-900/40 shadow-md sticky top-0 z-50">
      {/* Left section: Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-white px-2.5 py-1 rounded-md shadow-sm flex items-center justify-center transition-transform hover:scale-[1.02]">
          <Image
            src="/gama-next-logo-reserved.png"
            alt="GamaNext Software Solutions"
            width={130}
            height={32}
            className="h-6 w-auto object-contain"
            priority
          />
        </div>
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
        <button className="relative p-1.5 text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-blue-900" />
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-blue-400/30 cursor-pointer">
          <div className="w-7 h-7 rounded-md bg-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            GNA
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-blue-50">
            GamaNext Admin
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
        </div>
      </div>
    </header>
  );
}
