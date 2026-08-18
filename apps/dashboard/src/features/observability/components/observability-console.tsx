"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Radio,
  Terminal,
  Bell,
  AlertTriangle,
  TrendingUp,
  Power,
  Search,
  Globe,
  Plus,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

// Import hooks and types from the telemetry module
import {
  useTelemetry,
  useCreateService,
  useDeleteService,
} from "../hooks/use-telemetry";
import type { ServiceNode } from "../hooks/use-telemetry";

// Export it for reuse by child components
export type { ServiceNode };

// Import observability sub-components
import { StatsRow } from "./stats-row";
import { ServiceGrid } from "./service-grid";
import { ServiceInspector } from "./service-inspector";
import { LogsTerminal } from "./logs-terminal";
import { IncidentsTimeline } from "./incidents-timeline";
import { AlertsFeed } from "./alerts-feed";
import { MetricsDashboard } from "./metrics-dashboard";
import { RegisterServiceModal } from "./register-service-modal";

export interface LogItem {
  timestamp: string;
  serviceName: string;
  url: string;
  method: string;
  status: string;
  latency: number;
  type: "success" | "warning" | "error";
}

const EMPTY_SERVICES: ServiceNode[] = [];

export function ObservabilityConsole() {
  // Tenant & Role State for Multi-Tenant display
  const [tenantName, setTenantName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("pulseguard_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.tenant?.name) {
            setTenantName(user.tenant.name);
          }
          if (user?.role) {
            setUserRole(user.role);
          }
        } catch (e) {
          console.error("Failed to parse user session", e);
        }
      }
    }
  }, []);

  // TanStack Query backend bindings
  const {
    data: dbServices = EMPTY_SERVICES,
    isLoading,
    error: telemetryError,
  } = useTelemetry();
  const { mutate: createService } = useCreateService();
  const { mutate: deleteService } = useDeleteService();

  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    "nodes" | "logs" | "incidents" | "alerts" | "metrics"
  >("nodes");
  const [liveLogs, setLiveLogs] = useState<LogItem[]>([]);
  const [isLogStreamPaused, setIsLogStreamPaused] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState<
    "all" | "success" | "warning" | "error"
  >("all");
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const seededRef = useRef(false);

  // Use a Ref to hold the latest services array to avoid tearing down intervals on every update
  const servicesRef = useRef(dbServices);
  useEffect(() => {
    servicesRef.current = dbServices;
  }, [dbServices]);

  // Form states for adding a new service
  const [formData, setFormData] = useState({
    name: "",
    targetUrl: "",
    method: "GET",
    intervalSeconds: 30,
    timeoutMs: 5000,
  });

  // Automatically select the first service once loaded
  useEffect(() => {
    if (dbServices.length > 0) {
      // Retain active selection if it still exists, otherwise fallback to index 0
      const exists = dbServices.find((s) => s.id === selectedNode?.id);
      if (!exists) {
        setSelectedNode(dbServices[0]);
      }
    } else {
      setSelectedNode(null);
    }
  }, [dbServices.length, selectedNode?.id]);

  // Toast notification for telemetry fetch failures
  useEffect(() => {
    if (telemetryError) {
      toast.error(
        telemetryError.message || "Failed to load telemetry services.",
      );
    }
  }, [telemetryError]);

  // Auto-scroll SRE logs terminal view to bottom
  useEffect(() => {
    if (activeView === "logs" && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveLogs, activeView]);

  // Seed initial historical pings ONCE when dbServices is first loaded
  useEffect(() => {
    if (dbServices.length > 0 && !seededRef.current) {
      seededRef.current = true;
      const initial: LogItem[] = [];
      const now = Date.now();
      for (let i = 0; i < 25; i++) {
        const svc = dbServices[Math.floor(Math.random() * dbServices.length)];
        let type: "success" | "warning" | "error" = "success";
        let statusText = "200 OK";
        let latency = Math.floor(Math.random() * 80) + 20;

        if (svc.status === "DOWN") {
          type = "error";
          statusText = "504 TIMEOUT";
          latency = 0;
        } else if (svc.status === "DEGRADED") {
          type = "warning";
          statusText = "200 OK - DEGRADED";
          latency = Math.floor(Math.random() * 180) + 180;
        }

        initial.push({
          timestamp: new Date(now - (25 - i) * 3000).toLocaleTimeString(),
          serviceName: svc.name,
          url: svc.targetUrl,
          method: svc.method,
          status: statusText,
          latency,
          type,
        });
      }
      setLiveLogs(initial);
    }
  }, [dbServices.length]);

  // Generator loop for distributed pings (independent of services reference changes)
  useEffect(() => {
    if (isLogStreamPaused) return;

    const interval = setInterval(() => {
      const currentServices = servicesRef.current;
      if (currentServices.length === 0) return;

      const svc =
        currentServices[Math.floor(Math.random() * currentServices.length)];
      let type: "success" | "warning" | "error" = "success";
      let statusText = "200 OK";
      let latency = Math.floor(Math.random() * 80) + 20;

      if (svc.status === "DOWN") {
        type = "error";
        statusText = "504 TIMEOUT";
        latency = 0;
      } else if (svc.status === "DEGRADED") {
        type = "warning";
        statusText = "200 OK - DEGRADED";
        latency = Math.floor(Math.random() * 180) + 180;
      }

      const newLog: LogItem = {
        timestamp: new Date().toLocaleTimeString(),
        serviceName: svc.name,
        url: svc.targetUrl,
        method: svc.method,
        status: statusText,
        latency,
        type,
      };

      setLiveLogs((prev) => [...prev.slice(-99), newLog]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLogStreamPaused]);

  const filteredLogs = useMemo(() => {
    return liveLogs.filter((log) => {
      if (logLevelFilter === "all") return true;
      return log.type === logLevelFilter;
    });
  }, [liveLogs, logLevelFilter]);

  // Compute summary stats from database values
  const stats = useMemo(() => {
    const total = dbServices.length;
    const healthy = dbServices.filter((s) => s.status === "HEALTHY").length;
    const degraded = dbServices.filter((s) => s.status === "DEGRADED").length;
    const offline = dbServices.filter((s) => s.status === "DOWN").length;

    return { total, healthy, degraded, offline };
  }, [dbServices]);

  // Generate chart data on selection changes
  const chartData = useMemo(() => {
    if (!selectedNode) return [];

    const dataPoints = 15;
    const now = new Date();
    const points = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timeLabel = new Date(now.getTime() - i * 60000).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );

      let baseLatency = 45;
      if (selectedNode.status === "DEGRADED") {
        baseLatency = 340 + Math.floor(Math.random() * 80);
      } else if (selectedNode.status === "DOWN") {
        baseLatency = 0;
      } else {
        baseLatency = 35 + Math.floor(Math.random() * 30);
      }

      points.push({
        time: timeLabel,
        latency: baseLatency,
      });
    }

    return points;
  }, [selectedNode]);

  // Form submission handler connected to backend API
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();

    const isUrlValid =
      formData.targetUrl.startsWith("http://") ||
      formData.targetUrl.startsWith("https://");

    if (!isUrlValid) {
      toast.error("URL must start with http:// or https://");
      return;
    }

    createService(formData, {
      onSuccess: (newService) => {
        setIsAddModalOpen(false);
        setSelectedNode(newService);
        toast.success(
          `Microservice '${formData.name}' successfully registered!`,
        );
        setFormData({
          name: "",
          targetUrl: "",
          method: "GET",
          intervalSeconds: 30,
          timeoutMs: 5000,
        });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to register service.");
      },
    });
  };

  // Deletion logic connected to backend API
  const handleDeleteService = (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent selecting card

    deleteService(id, {
      onSuccess: () => {
        toast.success(`Service '${name}' successfully deleted.`);
        if (selectedNode?.id === id) {
          setSelectedNode(null);
        }
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to delete service.");
      },
    });
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden relative font-sans select-none">
      {/* Mobile drawer backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* 🚀 Mobile Slide-out Sidebar Drawer */}
      <nav
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center py-6 bg-card border-r border-border/40 w-20 transition-transform duration-300 md:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center py-4 mb-8 border-b border-border/30 w-full cursor-pointer">
          <Image
            src="/logo.svg"
            alt="PulseGuard Logo"
            width={30}
            height={28}
            className="h-7 w-auto dark:brightness-110"
          />
        </div>

        <div className="flex flex-col w-full space-y-4 grow">
          <button
            onClick={() => {
              setActiveView("nodes");
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeView === "nodes"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <Radio className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Nodes
            </span>
          </button>

          <button
            onClick={() => {
              setActiveView("alerts");
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeView === "alerts"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <Bell className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Alerts
            </span>
          </button>

          <button
            onClick={() => {
              setActiveView("metrics");
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeView === "metrics"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Metrics
            </span>
          </button>
          <button
            onClick={() => {
              setActiveView("logs");
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeView === "logs"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <Terminal className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Logs
            </span>
          </button>

          <button
            onClick={() => {
              setActiveView("incidents");
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeView === "incidents"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Incidents
            </span>
          </button>

          {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
            <button
              onClick={() => {
                window.location.href = "/admin";
                setIsMobileSidebarOpen(false);
              }}
              className="flex flex-col items-center justify-center w-full py-3 transition-all text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <Shield className="h-4.5 w-4.5 mb-1 text-orange-500" />
              <span className="font-mono text-[9px] uppercase tracking-tighter">
                Admin
              </span>
            </button>
          )}

          {userRole === "SUPER_ADMIN" && (
            <button
              onClick={() => {
                window.location.href = "/super";
                setIsMobileSidebarOpen(false);
              }}
              className="flex flex-col items-center justify-center w-full py-3 transition-all text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <ShieldAlert className="h-4.5 w-4.5 mb-1 text-rose-500 animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-tighter">
                Super
              </span>
            </button>
          )}
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            document.cookie =
              "pulseguard_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            window.location.reload();
          }}
          className="mt-auto p-3 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
          title="LOGOUT_SESSION"
        >
          <Power className="h-5 w-5" />
        </button>
      </nav>

      {/* 🚀 Left Floating Sidebar (Desktop only) */}
      <nav className="hidden md:flex md:fixed left-0 top-0 h-screen z-40 flex-col items-center py-4 bg-card border-r border-border/40 w-20 transition-all duration-300">
        <div className="flex flex-col items-center py-4 mb-8 border-b border-border/30 w-full group cursor-pointer">
          <Image
            src="/logo.svg"
            alt="PulseGuard Logo"
            width={34}
            height={32}
            className="h-8 w-auto dark:brightness-110"
          />
        </div>

        <div className="flex flex-col w-full space-y-4 grow">
          <button
            onClick={() => setActiveView("nodes")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all cursor-pointer ${
              activeView === "nodes"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Radio className="h-4.5 w-4.5 mb-1 z-10" />
            <span className="font-mono text-[9px] uppercase tracking-tighter z-10">
              Nodes
            </span>
          </button>

          <button
            onClick={() => setActiveView("alerts")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all cursor-pointer ${
              activeView === "alerts"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Bell className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Alerts
            </span>
          </button>

          <button
            onClick={() => setActiveView("metrics")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all cursor-pointer ${
              activeView === "metrics"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <TrendingUp className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Metrics
            </span>
          </button>

          <button
            onClick={() => setActiveView("logs")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all cursor-pointer ${
              activeView === "logs"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Terminal className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Logs
            </span>
          </button>

          <button
            onClick={() => setActiveView("incidents")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all cursor-pointer ${
              activeView === "incidents"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Incidents
            </span>
          </button>

          {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
            <button
              onClick={() => window.location.href = "/admin"}
              className="flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <Shield className="h-4.5 w-4.5 mb-1 text-orange-500" />
              <span className="font-mono text-[9px] uppercase tracking-tighter">
                Admin
              </span>
            </button>
          )}

          {userRole === "SUPER_ADMIN" && (
            <button
              onClick={() => window.location.href = "/super"}
              className="flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <ShieldAlert className="h-4.5 w-4.5 mb-1 text-rose-500 animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-tighter">
                Super
              </span>
            </button>
          )}
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            document.cookie =
              "pulseguard_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            window.location.reload();
          }}
          className="mt-auto p-3 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
          title="LOGOUT_SESSION"
        >
          <Power className="h-5 w-5" />
        </button>
      </nav>

      {/* Main Workspace Frame */}
      <div className="grow ml-0 md:ml-20 flex flex-col h-screen relative bg-muted/20">
        {/* Top Floating Glass Header Navbar */}
        <header className="fixed top-3 left-0 md:left-20 right-0 z-40 mx-4 h-12 bg-card/75 backdrop-blur-md border border-border/40 shadow-xs rounded-xl flex justify-between items-center px-4 transition-all">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Toggle on Mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted md:hidden focus:outline-none cursor-pointer"
              title="OPEN_MENU"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Globe className="h-5 w-5 text-primary" />
            <h1 className="font-sans text-xs font-semibold text-foreground tracking-tight hidden sm:block">
              <span className="bg-linear-to-r from-primary to-orange-500 bg-clip-text text-transparent font-bold">
                PulseGuard
              </span>
              <span className="text-muted-foreground/60 mx-1.5">/</span>
              <span>{tenantName ? `${tenantName} Dashboard` : "Telemetry Dashboard"}</span>
            </h1>
            <h1 className="font-sans text-xs font-bold bg-linear-to-r from-primary to-orange-500 bg-clip-text text-transparent tracking-tight sm:hidden">
              {tenantName || "PulseGuard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Keyboard Search Input */}
            <div className="relative hidden lg:flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search endpoints..."
                className="bg-muted/40 border border-border/50 rounded-lg text-[10px] pl-8 pr-8 py-1.5 focus:outline-none focus:border-primary transition-all w-36 placeholder-muted-foreground/50 focus:w-44"
              />
              <kbd className="absolute right-2 px-1.5 py-0.5 rounded bg-muted text-[7px] font-mono text-muted-foreground border border-border">
                ⌘K
              </kbd>
            </div>

            {/* Notification Alerts Bell */}
            <button
              className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Alerts"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </button>

            {/* Configured Theme switcher Toggle */}
            <ThemeToggle />

            {/* Premium status chip */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              Operational
            </div>
          </div>
        </header>

        {/* Dashboard Grid Workspace */}
        <main className="flex-1 mt-16 overflow-y-auto p-4 sm:p-6 flex flex-col space-y-6">
          {activeView === "nodes" ? (
            <>
              {/* 📊 Summary Counters Row */}
              <StatsRow stats={stats} />

              {/* 🛠️ Dashboard Actions row */}
              <div className="flex items-center justify-between bg-card border border-border/50 px-5 py-4 rounded-xl shadow-2xs">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Registered Telemetry Services
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Click any service to view full metrics details on the right
                    panel.
                  </p>
                </div>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Register Service
                </Button>
              </div>

              {/* 🗂️ Split Workspace Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: Services List Grid (col-span-2) */}
                <div className="lg:col-span-2 flex flex-col space-y-4">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-28 rounded-xl bg-card border border-border/40"
                        />
                      ))}
                    </div>
                  ) : (
                    <ServiceGrid
                      services={dbServices}
                      selectedNodeId={selectedNode?.id}
                      onSelectNode={setSelectedNode}
                      onDeleteNode={handleDeleteService}
                    />
                  )}
                </div>

                {/* Right: Selected Node Details Inspector (col-span-1) */}
                <div className="lg:col-span-1">
                  <ServiceInspector
                    selectedNode={selectedNode}
                    chartData={chartData}
                  />
                </div>
              </div>
            </>
          ) : activeView === "logs" ? (
            /* Live Logs Terminal View */
            <LogsTerminal
              filteredLogs={filteredLogs}
              logLevelFilter={logLevelFilter}
              setLogLevelFilter={setLogLevelFilter}
              isLogStreamPaused={isLogStreamPaused}
              setIsLogStreamPaused={setIsLogStreamPaused}
              onClearLogs={() => setLiveLogs([])}
              logsEndRef={logsEndRef}
            />
          ) : activeView === "incidents" ? (
            /* Incidents Timeline View */
            <IncidentsTimeline />
          ) : activeView === "metrics" ? (
            /* Metrics Dashboard View */
            <MetricsDashboard />
          ) : (
            /* Alerts Feed View */
            <AlertsFeed />
          )}
        </main>
      </div>

      {/* ➕ Add Service Modal dialog */}
      <RegisterServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddService}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
}
