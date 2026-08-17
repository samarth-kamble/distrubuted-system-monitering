"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import { Radio, Terminal, TrendingUp, Shield, Power, Search, Globe, Plus } from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

// Import observability sub-components
import { StatsRow } from "./stats-row"
import { ServiceGrid } from "./service-grid"
import { ServiceInspector } from "./service-inspector"
import { LogsTerminal } from "./logs-terminal"
import { RegisterServiceModal } from "./register-service-modal"

export interface ServiceNode {
  id: string
  name: string
  targetUrl: string
  method: string
  intervalSeconds: number
  timeoutMs: number
  status: "HEALTHY" | "DEGRADED" | "DOWN"
  consecutiveFailures: number
  consecutiveSuccesses: number
}

export interface LogItem {
  timestamp: string
  serviceName: string
  url: string
  method: string
  status: string
  latency: number
  type: "success" | "warning" | "error"
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
    consecutiveFailures: 0,
    consecutiveSuccesses: 1204,
  },
  {
    id: "2",
    name: "Authentication Core",
    targetUrl: "https://auth.pulseguard.io/v1/health",
    method: "GET",
    intervalSeconds: 15,
    timeoutMs: 3000,
    status: "HEALTHY",
    consecutiveFailures: 0,
    consecutiveSuccesses: 2410,
  },
  {
    id: "3",
    name: "Payment Webhook Handler",
    targetUrl: "https://api.pulseguard.io/webhooks/payments",
    method: "POST",
    intervalSeconds: 60,
    timeoutMs: 10000,
    status: "DEGRADED",
    consecutiveFailures: 0,
    consecutiveSuccesses: 45,
  },
  {
    id: "4",
    name: "Internal DB Replica",
    targetUrl: "postgresql://db-replica-01.internal:5432",
    method: "GET",
    intervalSeconds: 10,
    timeoutMs: 2000,
    status: "DOWN",
    consecutiveFailures: 8,
    consecutiveSuccesses: 0,
  },
  {
    id: "5",
    name: "GraphQL Schema Registry",
    targetUrl: "https://gateway.internal/graphql/health",
    method: "HEAD",
    intervalSeconds: 45,
    timeoutMs: 4000,
    status: "HEALTHY",
    consecutiveFailures: 0,
    consecutiveSuccesses: 41,
  }
]

export function ObservabilityConsole() {
  const [services, setServices] = useState<ServiceNode[]>(INITIAL_SERVICES)
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(INITIAL_SERVICES[0])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<"nodes" | "logs">("nodes")
  const [liveLogs, setLiveLogs] = useState<LogItem[]>([])
  const [isLogStreamPaused, setIsLogStreamPaused] = useState(false)
  const [logLevelFilter, setLogLevelFilter] = useState<"all" | "success" | "warning" | "error">("all")
  const logsEndRef = useRef<HTMLDivElement | null>(null)

  // Form states for adding a new service
  const [formData, setFormData] = useState({
    name: "",
    targetUrl: "",
    method: "GET",
    intervalSeconds: 30,
    timeoutMs: 5000,
  })

  // Auto-scroll SRE logs terminal view to bottom
  useEffect(() => {
    if (activeView === "logs" && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [liveLogs, activeView])

  // Generator loop for distributed pings
  useEffect(() => {
    if (isLogStreamPaused) return

    // Seed initial historical pings
    if (liveLogs.length === 0) {
      const initial: LogItem[] = []
      const now = Date.now()
      for (let i = 0; i < 25; i++) {
        if (services.length === 0) break
        const svc = services[Math.floor(Math.random() * services.length)]
        let type: "success" | "warning" | "error" = "success"
        let statusText = "200 OK"
        let latency = Math.floor(Math.random() * 80) + 20
        
        if (svc.status === "DOWN") {
          type = "error"
          statusText = "504 TIMEOUT"
          latency = 0
        } else if (svc.status === "DEGRADED") {
          type = "warning"
          statusText = "200 OK - DEGRADED"
          latency = Math.floor(Math.random() * 180) + 180
        }
        
        initial.push({
          timestamp: new Date(now - (25 - i) * 3000).toLocaleTimeString(),
          serviceName: svc.name,
          url: svc.targetUrl,
          method: svc.method,
          status: statusText,
          latency,
          type
        })
      }
      setLiveLogs(initial)
    }

    const interval = setInterval(() => {
      if (services.length === 0) return
      
      const svc = services[Math.floor(Math.random() * services.length)]
      let type: "success" | "warning" | "error" = "success"
      let statusText = "200 OK"
      let latency = Math.floor(Math.random() * 80) + 20
      
      if (svc.status === "DOWN") {
        type = "error"
        statusText = "504 TIMEOUT"
        latency = 0
      } else if (svc.status === "DEGRADED") {
        type = "warning"
        statusText = "200 OK - DEGRADED"
        latency = Math.floor(Math.random() * 180) + 180
      }

      const newLog: LogItem = {
        timestamp: new Date().toLocaleTimeString(),
        serviceName: svc.name,
        url: svc.targetUrl,
        method: svc.method,
        status: statusText,
        latency,
        type
      }

      setLiveLogs(prev => [...prev.slice(-99), newLog])
    }, 2000)

    return () => clearInterval(interval)
  }, [isLogStreamPaused, services, liveLogs])

  const filteredLogs = useMemo(() => {
    return liveLogs.filter(log => {
      if (logLevelFilter === "all") return true
      return log.type === logLevelFilter
    })
  }, [liveLogs, logLevelFilter])

  // Compute summary stats
  const stats = useMemo(() => {
    const total = services.length
    const healthy = services.filter(s => s.status === "HEALTHY").length
    const degraded = services.filter(s => s.status === "DEGRADED").length
    const offline = services.filter(s => s.status === "DOWN").length

    return { total, healthy, degraded, offline }
  }, [services])

  // Generate chart data on selection changes
  const chartData = useMemo(() => {
    if (!selectedNode) return []
    
    // Generates latency history based on state health rules
    const dataPoints = 15
    const now = new Date()
    const points = []
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timeLabel = new Date(now.getTime() - i * 60000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
      
      let baseLatency = 45
      if (selectedNode.status === "DEGRADED") {
        baseLatency = 340 + Math.floor(Math.random() * 80)
      } else if (selectedNode.status === "DOWN") {
        baseLatency = 0
      } else {
        baseLatency = 35 + Math.floor(Math.random() * 30)
      }
      
      points.push({
        time: timeLabel,
        latency: baseLatency
      })
    }
    
    return points
  }, [selectedNode])

  // Form submission handler
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    
    const isUrlValid = formData.targetUrl.startsWith("http://") || 
                       formData.targetUrl.startsWith("https://") ||
                       formData.targetUrl.startsWith("postgresql://") ||
                       formData.targetUrl.startsWith("mongodb://")
                       
    if (!isUrlValid) {
      toast.error("Please enter a valid connection URL schema.")
      return
    }

    const newService: ServiceNode = {
      id: Date.now().toString(),
      name: formData.name,
      targetUrl: formData.targetUrl,
      method: formData.method,
      intervalSeconds: formData.intervalSeconds,
      timeoutMs: formData.timeoutMs,
      status: "HEALTHY", // Default registered status
      consecutiveFailures: 0,
      consecutiveSuccesses: 0
    }

    setServices(prev => [...prev, newService])
    setSelectedNode(newService)
    setIsAddModalOpen(false)
    toast.success(`Microservice '${formData.name}' successfully registered!`)
    
    // Clear inputs
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
          <button 
            onClick={() => { setActiveView("nodes"); setIsMobileSidebarOpen(false); }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeView === "nodes" ? "bg-primary/10 text-primary border-l-4 border-primary" : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <Radio className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Nodes</span>
          </button>
          
          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground opacity-40 cursor-not-allowed" href="#" onClick={(e) => e.preventDefault()}>
            <TrendingUp className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Traffic</span>
          </a>
          
          <button 
            onClick={() => { setActiveView("logs"); setIsMobileSidebarOpen(false); }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeView === "logs" ? "bg-primary/10 text-primary border-l-4 border-primary" : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <Terminal className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Logs</span>
          </button>

          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground opacity-40 cursor-not-allowed" href="#" onClick={(e) => e.preventDefault()}>
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
          <button 
            onClick={() => setActiveView("nodes")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all cursor-pointer ${
              activeView === "nodes" ? "bg-primary/10 text-primary border-l-4 border-primary" : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Radio className="h-4.5 w-4.5 mb-1 z-10" />
            <span className="font-mono text-[9px] uppercase tracking-tighter z-10">Nodes</span>
          </button>
          
          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all group opacity-40 cursor-not-allowed" href="#" onClick={(e) => e.preventDefault()}>
            <TrendingUp className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Traffic</span>
          </a>
          
          <button 
            onClick={() => setActiveView("logs")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden group transition-all cursor-pointer ${
              activeView === "logs" ? "bg-primary/10 text-primary border-l-4 border-primary" : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Terminal className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">Logs</span>
          </button>

          <a className="flex flex-col items-center justify-center w-full py-3 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all group opacity-40 cursor-not-allowed" href="#" onClick={(e) => e.preventDefault()}>
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

              <div className="flex items-center justify-between bg-card border border-border/50 px-5 py-4 rounded-xl shadow-2xs">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Registered Telemetry Services</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Click any service to view full metrics details on the right panel.</p>
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
                  <ServiceGrid
                    services={services}
                    selectedNodeId={selectedNode?.id}
                    onSelectNode={setSelectedNode}
                    onDeleteNode={handleDeleteService}
                  />
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
          ) : (
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
  )
}
