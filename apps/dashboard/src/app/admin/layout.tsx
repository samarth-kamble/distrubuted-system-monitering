"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ShieldAlert,
  BarChart3,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [tenantName, setTenantName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("pulseguard_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.tenant?.name) {
            setTenantName(user.tenant.name);
          }
          if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
            toast.error("Access denied. Admin privileges required.");
            window.location.href = "/";
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const navItems = [
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
    },
    {
      href: "/admin/audit",
      label: "Audit",
      icon: ShieldAlert,
    },
    {
      href: "/admin/overview",
      label: "System",
      icon: BarChart3,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans select-none">
      {/* 🚀 Left Floating Admin Sidebar */}
      <nav className="flex flex-col items-center py-4 bg-card border-r border-border/40 w-20 transition-all duration-300">
        <div className="flex flex-col items-center py-4 mb-8 border-b border-border/30 w-full">
          <span className="font-mono text-xs font-black text-primary border border-primary px-1.5 py-0.5 rounded-lg bg-primary/5 uppercase tracking-wider">
            ADM
          </span>
        </div>

        <div className="flex flex-col w-full space-y-4 grow">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4.5 w-4.5 mb-1" />
                <span className="font-mono text-[9px] uppercase tracking-tighter">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/"
          className="mt-auto p-3 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center"
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-5 w-5 mb-0.5" />
          <span className="font-mono text-[9px] uppercase tracking-tighter">Exit</span>
        </Link>
      </nav>

      {/* Main Content Workspace Frame */}
      <div className="grow flex flex-col h-screen relative bg-muted/20">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border/40 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground">
              PulseGuard Admin HQ {tenantName ? `| ${tenantName}` : ""}
            </h1>
            <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide">
              Security Domain
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              Secure Environment
            </div>
          </div>
        </header>

        {/* Scrollable Work View */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
