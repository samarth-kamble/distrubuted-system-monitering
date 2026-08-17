"use client"

import * as React from "react"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Rocket, Radio, TrendingUp, Terminal, Shield, Power, Plus, Trash2, 
  CheckCircle, AlertTriangle, XCircle,  Globe, Clock, X, 
  Search
} from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { toast } from "sonner"

export interface ServiceNode {
  id: string
  name: string
  targetUrl: string
  method: string
  intervalSeconds: number
  timeoutMs: number
  status: "UNKNOWN" | "HEALTHY" | "DEGRADED" | "DOWN" | "RECOVERING"
  lastCheckedAt: string | null
  consecutiveFailures: number
  consecutiveSuccesses: number
}

const INITIAL_SERVICES: ServiceNode[] = [
  {
    id: "1",
    name: "Production Gateway",
    targetUrl: "https://api.pulseguard.io/health",
    method: "GET",
    intervalSeconds: 30,
    timeoutMs: 5000,
    status: "HEALTHY",
    lastCheckedAt: new Date().toISOString(),
    consecutiveFailures: 0,
    consecutiveSuccesses: 124,
  },
  {
    id: "2",
    name: "Authentication Core",
    targetUrl: "https://auth.pulseguard.io/v1/validate",
    method: "POST",
    intervalSeconds: 15,
    timeoutMs: 3000,
    status: "HEALTHY",
    lastCheckedAt: new Date().toISOString(),
    consecutiveFailures: 0,
    consecutiveSuccesses: 582,
  },
  {
    id: "3",
    name: "Billing DB Sync replica",
    targetUrl: "postgresql://db-replica-01.internal:5432",
    method: "GET",
    intervalSeconds: 60,
    timeoutMs: 10000,
    status: "DEGRADED",
    lastCheckedAt: new Date().toISOString(),
    consecutiveFailures: 2,
    consecutiveSuccesses: 0,
  },
  {
    id: "4",
    name: "Payment Webhook Worker",
    targetUrl: "https://api.pulseguard.io/webhooks/payments",
    method: "POST",
    intervalSeconds: 30,
    timeoutMs: 5000,
    status: "DOWN",
    lastCheckedAt: new Date().toISOString(),
    consecutiveFailures: 14,
    consecutiveSuccesses: 0,
  },
  {
    id: "5",
    name: "User Analytics Bucket",
    targetUrl: "https://s3.us-east-1.amazonaws.com/pulseguard-analytics",
    method: "HEAD",
    intervalSeconds: 120,
    timeoutMs: 15000,
    status: "HEALTHY",
    lastCheckedAt: new Date().toISOString(),
    consecutiveFailures: 0,
    consecutiveSuccesses: 41,
  }
]

export function ObservabilityConsole() {
  const [services, setServices] = React.useState<ServiceNode[]>(INITIAL_SERVICES)
  const [selectedNode, setSelectedNode] = React.useState<ServiceNode | null>(INITIAL_SERVICES[0])
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)

  // Form states for adding a new service
  const [formData, setFormData] = React.useState({
    name: "",
    targetUrl: "",
    method: "GET",
    intervalSeconds: 30,
    timeoutMs: 5000,
  })

  // Compute summary stats
  const stats = React.useMemo(() => {
    const total = services.length
    const healthy = services.filter(s => s.status === "HEALTHY").length
    const degraded = services.filter(s => s.status === "DEGRADED").length
    const offline = services.filter(s => s.status === "DOWN").length
    
    return { total, healthy, degraded, offline }
  }, [services])

  // Mock latency logs for the selected node
  const chartData = React.useMemo(() => {
    if (!selectedNode) return []
    const data = []
    const baseLatency = selectedNode.status === "DOWN" ? 0 : selectedNode.status === "DEGRADED" ? 280 : 85
    const now = Date.now()
    
    for (let i = 9; i >= 0; i--) {
      const timeStr = new Date(now - i * 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const variance = selectedNode.status === "DOWN" ? 0 : Math.floor(Math.random() * 30) - 15
      data.push({
        time: timeStr,
        latency: Math.max(0, baseLatency + variance),
      })
    }
    return data
  }, [selectedNode])

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.targetUrl) {
      toast.error("Please fill in all required fields.")
      return
    }

    const newService: ServiceNode = {
      id: Math.random().toString(),
      ...formData,
      status: "HEALTHY",
      lastCheckedAt: new Date().toISOString(),
      consecutiveFailures: 0,
      consecutiveSuccesses: 1,
    }

    setServices(prev => [...prev, newService])
    setSelectedNode(newService)
    setIsAddModalOpen(false)
    toast.success(`Service '${formData.name}' successfully registered.`)
    
    // Reset form
    setFormData({
      name: "",
      targetUrl: "",
      method: "GET",
      intervalSeconds: 30,
      timeoutMs: 5000,
    })
  }

  const handleDeleteService = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the card when clicking delete
    
    setServices(prev => prev.filter(s => s.id !== id))
    toast.success(`Service '${name}' successfully deleted.`)
    if (selectedNode?.id === id) {
      setSelectedNode(null)
    }
  }

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
      <nav className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center py-6 bg-card border-r border-border/40 w-20 transition-transform duration-300 md:hidden ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
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
          <a className="flex flex-col items-center justify-center w-full py-3 bg-primary/10 text-primary border-l-4 border-primary" href="#" onClick={() => setIsMobileSidebarOpen(false)}>
            <Radio className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Nodes</span>
          </a>
          
          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground" href="#" onClick={() => setIsMobileSidebarOpen(false)}>
            <TrendingUp className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Traffic</span>
          </a>
          
          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground" href="#" onClick={() => setIsMobileSidebarOpen(false)}>
            <Terminal className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Logs</span>
          </a>

          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground" href="#" onClick={() => setIsMobileSidebarOpen(false)}>
            <Shield className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Security</span>
          </a>
        </div>

        <button 
          onClick={() => {
            localStorage.clear()
            document.cookie = "pulseguard_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            window.location.reload()
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
          <a className="flex flex-col items-center justify-center w-full py-3 bg-primary/10 text-primary border-l-4 border-primary relative overflow-hidden group" href="#">
            <Radio className="h-4.5 w-4.5 mb-1 z-10" />
            <span className="font-mono text-[9px] uppercase tracking-tighter z-10">Nodes</span>
          </a>
          
          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all group" href="#">
            <TrendingUp className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Traffic</span>
          </a>
          
          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all group" href="#">
            <Terminal className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Logs</span>
          </a>

          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all group" href="#">
            <Shield className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Security</span>
          </a>
        </div>

        <button 
          onClick={() => {
            localStorage.clear()
            document.cookie = "pulseguard_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            window.location.reload()
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
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Globe className="h-5 w-5 text-primary" />
            <h1 className="font-sans text-xs font-semibold text-foreground tracking-tight hidden sm:block">
              <span className="bg-linear-to-r from-primary to-orange-500 bg-clip-text text-transparent font-bold">PulseGuard</span>
              <span className="text-muted-foreground/60 mx-1.5">/</span>
              <span>Telemetry Dashboard</span>
            </h1>
            <h1 className="font-sans text-xs font-bold bg-linear-to-r from-primary to-orange-500 bg-clip-text text-transparent tracking-tight sm:hidden">
              PulseGuard
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
            <button className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer" title="Alerts">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </button>

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
          
          {/* 📊 Summary Counters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Endpoints</span>
                <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.total}</h3>
              </div>
              <div className="p-3 bg-muted rounded-lg text-primary">
                <Globe className="h-5 w-5" />
              </div>
            </div>

            {/* Healthy */}
            <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Healthy Nodes</span>
                <h3 className="text-2xl font-bold mt-1 text-emerald-500">{stats.healthy}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

            {/* Degraded */}
            <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Degraded Checks</span>
                <h3 className="text-2xl font-bold mt-1 text-amber-500">{stats.degraded}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            {/* Down */}
            <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Offline Nodes</span>
                <h3 className="text-2xl font-bold mt-1 text-rose-500">{stats.offline}</h3>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* 🛠️ Dashboard Actions row */}
          <div className="flex items-center justify-between bg-card border border-border/50 px-5 py-4 rounded-xl shadow-2xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Registered Telemetry Services</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Click any service to view full metrics details on the right panel.</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Register Service
            </button>
          </div>

          {/* 🗂️ Split Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left: Services List Grid (col-span-2) */}
            <div className="lg:col-span-2 flex flex-col space-y-4">
              {services.length === 0 ? (
                <div className="bg-card border border-border/50 rounded-xl p-10 text-center flex flex-col items-center justify-center shadow-2xs">
                  <Globe className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold">No services registered yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">Register your first microservice to start tracking response times and outages.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => {
                    const isSelected = selectedNode?.id === service.id
                    const isHealthy = service.status === "HEALTHY"
                    const isDegraded = service.status === "DEGRADED"
                    const isDown = service.status === "DOWN"

                    // Status Badge config
                    let statusColor = "bg-slate-400"
                    let statusBg = "bg-slate-500/10 text-slate-500 border-slate-500/25"
                    if (isHealthy) {
                      statusColor = "bg-emerald-500"
                      statusBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    } else if (isDegraded) {
                      statusColor = "bg-amber-500"
                      statusBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    } else if (isDown) {
                      statusColor = "bg-rose-500"
                      statusBg = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }

                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedNode(service)}
                        className={`bg-card border rounded-xl p-4 cursor-pointer relative flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all ${
                          isSelected ? "border-primary ring-2 ring-primary/10" : "border-border/60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="pr-4">
                            <h4 className="text-xs font-bold text-foreground truncate max-w-40">{service.name}</h4>
                            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-45 mt-1">{service.targetUrl}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${statusBg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusColor} ${isDown ? "animate-pulse" : ""}`} />
                            {service.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-3 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {service.intervalSeconds}s
                            </span>
                            <span className="font-mono">{service.method}</span>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteService(service.id, service.name, e)}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                            title="DELETE_SERVICE"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Selected Node Details Inspector (col-span-1) */}
            <div className="lg:col-span-1">
              {!selectedNode ? (
                <div className="bg-card border border-border/50 rounded-xl p-6 text-center text-muted-foreground text-xs shadow-2xs">
                  Select a service from the dashboard grid to inspect metrics.
                </div>
              ) : (
                <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col space-y-5 shadow-2xs">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Service Inspector</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedNode.name}</p>
                  </div>

                  {/* Detailed attributes list */}
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-[11px] space-y-2.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL:</span>
                      <span className="text-foreground text-right truncate max-w-45">{selectedNode.targetUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">METHOD:</span>
                      <span className="text-foreground">{selectedNode.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">INTERVAL:</span>
                      <span className="text-foreground">{selectedNode.intervalSeconds} seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TIMEOUT:</span>
                      <span className="text-foreground">{selectedNode.timeoutMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FAIL_STREAK:</span>
                      <span className={selectedNode.consecutiveFailures > 0 ? "text-rose-500 font-bold" : "text-foreground"}>
                        {selectedNode.consecutiveFailures}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Response latency chart */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Latency History (ms)</span>
                    <div className="h-32 w-full border border-border/40 rounded-lg p-2 bg-muted/20">
                      {selectedNode.status === "DOWN" ? (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-rose-500 font-mono">
                          NO DATA - ENDPOINT OFFLINE
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%" minHeight={110}>
                          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <defs>
                              <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary, #e22935)" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="var(--color-primary, #e22935)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis fontSize={8} stroke="#888" tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ fontSize: '9px', background: 'rgba(0,0,0,0.85)', color: '#fff' }} />
                            <Area type="monotone" dataKey="latency" stroke="var(--color-primary, #e22935)" strokeWidth={1.5} fill="url(#glowColor)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </main>
      </div>

      {/* ➕ Add Service Modal dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/60 rounded-2xl w-full max-w-md overflow-hidden shadow-lg animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 bg-muted/40">
              <h3 className="text-xs font-bold text-foreground">Register New Service Node</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddService} className="p-5 flex flex-col space-y-4">
              {/* Service Name */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Identifier</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-muted/40 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground/60"
                  placeholder="e.g. Auth Gateway"
                  required
                />
              </div>

              {/* URL */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Target URL Endpoint</label>
                <input 
                  type="url" 
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
                  className="bg-muted/40 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground/60"
                  placeholder="https://api.my-app.com/health"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Method */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">HTTP Method</label>
                  <select 
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                    className="bg-muted/40 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>

                {/* Interval */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Ping Interval (s)</label>
                  <input 
                    type="number" 
                    value={formData.intervalSeconds}
                    onChange={(e) => setFormData({...formData, intervalSeconds: parseInt(e.target.value, 10)})}
                    className="bg-muted/40 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    min={5}
                    max={600}
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border/40 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-border/50 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/95 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Register Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  )
}
