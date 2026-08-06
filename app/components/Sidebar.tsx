"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Briefcase,
  FolderKanban,
  Target,
  FileText,
  Building2,
  Settings,
  ChevronRight,
  Sparkles,
  MessageCircle,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Customers",
      href: "/customers",
      icon: Users,
    },
    {
      name: "Invoices",
      href: "/invoices",
      icon: Receipt,
    },
    {
      name: "Employees",
      href: "/employees",
      icon: Briefcase,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderKanban,
    },
    {
      name: "Departments & Roles",
      href: "/departments-roles",
      icon: Building2,
    },
    {
      name: "Leads",
      href: "/leads",
      icon: Target,
    },
    {
      name: "Quotations",
      href: "/quotations",
      icon: FileText,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
    },
  ];

  const isCurrentPage = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 bg-[#f6f6f7] border-r border-gray-200/80 flex flex-col justify-between h-full select-none shrink-0">
      {/* Top Menu Links */}
      <div className="p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isCurrentPage(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-white text-[#0B4FBA] shadow-xs border border-gray-200/60 font-semibold"
                  : "text-gray-700 hover:bg-gray-200/60 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  active ? "text-[#0B4FBA]" : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Section: Settings & Status */}
      <div className="p-2 border-t border-gray-200/80 space-y-2 bg-gray-50/50">
        <Link
          href="/settings"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isCurrentPage("/settings")
              ? "bg-white text-[#0B4FBA] shadow-xs border border-gray-200/60 font-semibold"
              : "text-gray-700 hover:bg-gray-200/60 hover:text-gray-900"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Settings
              className={`w-4 h-4 ${
                isCurrentPage("/settings") ? "text-[#0B4FBA]" : "text-gray-500"
              }`}
            />
            <span>Settings</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        {/* System Version Card */}
        <div className="bg-blue-50/70 border border-blue-200/60 rounded-lg p-2.5 text-xs text-blue-900 flex items-center justify-between">
          <div>
            <div className="font-semibold text-[#0B4FBA] flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#0B4FBA]" />
              <span>GamaNext v1.0</span>
            </div>
            <div className="text-gray-500 text-[11px]">10 Core Modules</div>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
