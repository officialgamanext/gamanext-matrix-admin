"use client";

import { useState } from "react";
import {
  LucideIcon,
  Search,
  SlidersHorizontal,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Bell,
} from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  subtext?: string;
}

interface FeatureItem {
  title: string;
  description: string;
  status: "In Progress" | "Planned" | "Testing";
}

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stats: StatItem[];
  features: FeatureItem[];
  itemType: string;
}

export default function ComingSoonPage({
  title,
  description,
  icon: Icon,
  stats,
  features,
  itemType,
}: ComingSoonPageProps) {
  const [activeTab, setActiveTab] = useState("All");
  const [notifySubscribed, setNotifySubscribed] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  return (
    <div className="space-y-4">
      {/* 1. Page Header & Actions Bar (Shopify style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-lg text-[#0B4FBA]">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
              <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-2xs flex items-center space-x-1.5">
            <ExportIcon className="w-3.5 h-3.5 text-gray-500" />
            <span>Export</span>
          </button>
          <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-2xs flex items-center space-x-1.5">
            <ImportIcon className="w-3.5 h-3.5 text-gray-500" />
            <span>Import</span>
          </button>
          <button className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-2xs flex items-center space-x-1">
            <span>More actions</span>
            <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>Add {itemType}</span>
          </button>
        </div>
      </div>

      {/* 2. Stat / KPI Cards Bar (Shopify style top analytics bar) */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        {stats.map((stat, idx) => (
          <div key={idx} className={`pt-3 sm:pt-0 ${idx > 0 ? "sm:pl-6" : ""}`}>
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>{stat.label}</span>
              <span className="text-[10px] bg-blue-50 text-[#0B4FBA] px-1.5 py-0.5 rounded font-semibold">
                Est. Metric
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900 mt-1">{stat.value}</div>
            {stat.subtext && (
              <div className="text-[11px] text-gray-400 mt-0.5">{stat.subtext}</div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Main Data Container: Filter Bar + Coming Soon Card */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-3 border-b border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/40">
          <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["All", "Active", "Pending", "Archived"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? "bg-white text-[#0B4FBA] shadow-2xs border border-gray-200 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={`Search and filter ${title.toLowerCase()}...`}
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
              />
            </div>
            <button className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Coming Soon Interactive View */}
        <div className="p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          {/* Animated Icon Header */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#003882] to-[#0B4FBA] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Icon className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-1 rounded-full border-2 border-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {title} Module is Under Development
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
              We are crafting a powerful, modern {title.toLowerCase()} management suite for GamaNext.
              This module will be fully customizable and integrated with your core operations.
            </p>
          </div>

          {/* Development Status Bar */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-left max-w-lg mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0B4FBA]" />
                <span>Build Progress</span>
              </span>
              <span className="text-[#0B4FBA]">85% Ready</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#003882] to-[#0B4FBA] h-2 rounded-full w-[85%] animate-pulse" />
            </div>
            <div className="text-[11px] text-gray-500 flex justify-between pt-0.5">
              <span>Target Launch: Q3 2026</span>
              <span className="text-emerald-600 font-medium">Sprint 4 Active</span>
            </div>
          </div>

          {/* Feature Roadmap List */}
          <div className="pt-2 text-left">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
              Planned Features for {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feat, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-gray-200/80 bg-gray-50/50 hover:bg-white hover:shadow-2xs transition-all flex items-start space-x-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0B4FBA] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900 flex items-center space-x-1.5">
                      <span>{feat.title}</span>
                      <span className="text-[10px] bg-blue-100 text-[#0B4FBA] px-1.5 py-0.2 rounded font-medium">
                        {feat.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger / Notification Subscribe */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setNotifySubscribed(!notifySubscribed)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center space-x-2 ${
                notifySubscribed
                  ? "bg-emerald-600 text-white"
                  : "bg-[#0B4FBA] hover:bg-[#003882] text-white"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {notifySubscribed
                  ? "Subscribed for Updates!"
                  : `Notify Me when ${title} Launches`}
              </span>
            </button>

            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5">
              <span>Request Custom Workflow</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon helpers
function ExportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function ImportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
