"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading) {
      if (!user && !isLoginPage) {
        // Not logged in -> redirect to /login
        const redirectUrl = `/login${pathname !== "/" ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;
        router.replace(redirectUrl);
      } else if (user && isLoginPage) {
        // Already logged in -> redirect to dashboard
        router.replace("/");
      }
    }
  }, [user, loading, isLoginPage, pathname, router]);

  // If on login page, render children directly
  if (isLoginPage) {
    if (user && !loading) {
      return null;
    }
    return <>{children}</>;
  }

  // If loading or not authenticated on protected pages, show secure loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-[#0B4FBA] selection:text-white">
        <div className="bg-white p-4 rounded-[10px] shadow-md mb-4 border border-slate-100 animate-pulse flex items-center justify-center">
          <Image
            src="/gama-next-logo-reserved.png"
            alt="GamaNext"
            width={150}
            height={38}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>

        <div className="flex items-center space-x-2 text-slate-600 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#0052cc]" />
          <span>Verifying Admin Authorization...</span>
        </div>

        <div className="mt-4 flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Matrix Security 256-Bit Encrypted Portal</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
