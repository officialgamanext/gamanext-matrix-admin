"use client";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[#f1f2f4] text-gray-900 font-sans flex flex-col overflow-hidden antialiased">
      {/* Top Navbar styled in GamaNext Logo Color */}
      <Navbar />

      {/* Main Admin Body: Left Sidebar + Right Content Workspace */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-5 bg-[#f1f2f4]">
          <div className="max-w-7xl mx-auto space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
