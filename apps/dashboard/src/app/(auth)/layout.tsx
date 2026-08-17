"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Shield, Sparkles, Cpu, HardDrive, Activity, Network } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Live rolling logs terminal mock
function LiveTelemetryLogs() {
  const [logs, setLogs] = React.useState<string[]>([])
  
  React.useEffect(() => {
    const services = ["auth-service", "gateway-api", "postgres-replica", "redis-cache", "jobs-worker", "telemetry-agent"]
    const endpoints = ["/health", "/v2/metrics", "/auth/me", "/db/ping", "/ping", "/ssl/check"]
    
    // Seed initial historical logs
    const initialLogs: string[] = []
    for (let i = 0; i < 15; i++) {
      const time = new Date(Date.now() - (15 - i) * 3500).toLocaleTimeString()
      const service = services[Math.floor(Math.random() * services.length)]
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
      const latency = Math.floor(Math.random() * 120) + 12
      const code = Math.random() > 0.05 ? "200 OK" : "504 TIMEOUT"
      initialLogs.push(`[${time}] PING ${service}${endpoint} - ${code} (${latency}ms)`)
    }
    setLogs(initialLogs)

    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString()
      const service = services[Math.floor(Math.random() * services.length)]
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
      const latency = Math.floor(Math.random() * 120) + 12
      const isOk = Math.random() > 0.03
      const code = isOk ? "200 OK" : "504 TIMEOUT"
      const statusColor = isOk ? "" : "text-destructive"
      const newLog = `[${time}] PING ${service}${endpoint} - ${code} (${latency}ms)`
      
      setLogs((prev) => [...prev.slice(1), newLog])
    }, 2800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 flex flex-col font-mono text-[11px] leading-relaxed text-muted-foreground/80 overflow-hidden h-60 lg:h-80 border border-border/80 bg-background/50 backdrop-blur-md p-4 rounded-xl shadow-inner select-none">
      <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Live Metrics Pipeline
        </span>
        <span className="text-[9px] text-muted-foreground/50 font-semibold tracking-widest">STREAMING</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none scroll-smooth">
        {logs.map((log, idx) => {
          const isError = log.includes("TIMEOUT")
          return (
            <div 
              key={idx} 
              className={`whitespace-nowrap transition-all duration-300 opacity-75 hover:opacity-100 hover:text-foreground ${isError ? "text-destructive font-semibold" : ""}`}
            >
              <span className={isError ? "text-destructive" : "text-primary"}>&gt;</span> {log}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background text-foreground transition-colors duration-500">
      
      {/* Theme toggle float on top right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left Column: Telemetry Dashboard Console */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between bg-card p-12 border-r border-border overflow-hidden">
        
        {/* Neon meshes overlay */}
        <div className="absolute -top-[30%] -left-[10%] h-[70%] w-[70%] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[55%] w-[55%] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative flex items-center gap-2.5">
          <Image 
            src="/logo.svg" 
            alt="PulseGuard Logo" 
            width={34} 
            height={32} 
            className="h-8 w-auto dark:brightness-110"
          />
          <span className="text-xl font-bold tracking-tight">
            Pulse<span className="text-primary">Guard</span>
          </span>
        </div>

        {/* Observability Widgets Container */}
        <div className="relative my-auto max-w-lg z-10 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Sparkles className="h-3 w-3" />
              Observability Suite v1.2
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Observe, protect, and scale your cloud architecture.
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Sync metrics checkpoints and get instantly paged before your services crash. Let Telemetry heartbeats guard your infrastructure.
            </p>
          </div>

          {/* Mini Dashboard Widget Board */}
          <div className="grid grid-cols-3 gap-4">
            {/* Widget 1 */}
            <div className="rounded-xl border border-border bg-background/40 backdrop-blur-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">CPU</span>
                <Cpu className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4">
                <span className="text-xl font-bold font-mono">42.8%</span>
                <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "42.8%" }} />
                </div>
              </div>
            </div>

            {/* Widget 2 */}
            <div className="rounded-xl border border-border bg-background/40 backdrop-blur-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">MEMORY</span>
                <HardDrive className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4">
                <span className="text-xl font-bold font-mono">61.5%</span>
                <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "61.5%" }} />
                </div>
              </div>
            </div>

            {/* Widget 3 */}
            <div className="rounded-xl border border-border bg-background/40 backdrop-blur-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">SYNCS</span>
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              </div>
              <div className="mt-4">
                <span className="text-xl font-bold font-mono">100%</span>
                <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Scrolling Log Stream */}
          <LiveTelemetryLogs />
        </div>

        {/* Bottom Footer Info */}
        <div className="relative text-xs text-muted-foreground flex gap-4">
          <a href="#" className="hover:underline">Documentation</a>
          <span>&middot;</span>
          <a href="#" className="hover:underline">API Reference</a>
          <span>&middot;</span>
          <a href="#" className="hover:underline">Uptime Status</a>
        </div>
      </div>

      {/* Right Column: Form Console */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 md:px-12 bg-background">
        <div className="w-full max-w-105">
          {children}
        </div>
      </div>

    </div>
  )
}
