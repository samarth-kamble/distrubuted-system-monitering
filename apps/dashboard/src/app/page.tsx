import { ThemeToggle } from "@/components/theme-toggle"
import { Activity, Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Pulse<span className="text-primary">Guard</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="text-foreground transition-colors hover:text-foreground">Dashboard</a>
            <a href="#" className="transition-colors hover:text-foreground">Services</a>
            <a href="#" className="transition-colors hover:text-foreground">Metrics</a>
            <a href="#" className="transition-colors hover:text-foreground">Alerts</a>
            <a href="#" className="transition-colors hover:text-foreground">Settings</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome Hero */}
        <div className="mb-10 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Live Monitoring Active
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight">System Status Overview</h1>
              <p className="mt-2 text-muted-foreground">
                Monitoring 8 active microservices across 3 clusters. All endpoints are responding within normal parameters.
              </p>
            </div>
            <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium shadow-2xs hover:bg-muted transition-all">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Card 1: API Gateways */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">API Gateways</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold">100%</span>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">All 4 nodes healthy</p>
            </div>
          </div>

          {/* Card 2: Avg Response Time */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Avg Response Time</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold">142 ms</span>
              <p className="mt-1 text-xs text-muted-foreground">Last updated 12s ago</p>
            </div>
          </div>

          {/* Card 3: Memory Usage */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Memory Load</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold">84.2%</span>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">High usage in Cluster B</p>
            </div>
          </div>

          {/* Card 4: Incidents */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Active Alerts</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold">0</span>
              <p className="mt-1 text-xs text-muted-foreground">No unresolved incidents</p>
            </div>
          </div>
        </div>

        {/* Services Table Card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="border-b border-border bg-card px-6 py-4">
            <h2 className="text-lg font-bold">Monitored Services</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Service Name</th>
                  <th className="px-6 py-3">Target URL</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Row 1 */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-semibold">Production Frontend</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">https://pulseguard.io/health</td>
                  <td className="px-6 py-4">HTTPS GET</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
                      Healthy
                    </span>
                  </td>
                  <td className="px-6 py-4">98 ms</td>
                </tr>
                {/* Row 2 */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-semibold">Authentication API</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">https://api.pulseguard.io/auth/health</td>
                  <td className="px-6 py-4">JSON POST</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
                      Healthy
                    </span>
                  </td>
                  <td className="px-6 py-4">124 ms</td>
                </tr>
                {/* Row 3 */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-semibold">Database Cluster (Read-Replica)</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">db-replica.internal:5432</td>
                  <td className="px-6 py-4">TCP Ping</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Degraded
                    </span>
                  </td>
                  <td className="px-6 py-4">421 ms</td>
                </tr>
                {/* Row 4 */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-semibold">Payment Webhook Worker</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">https://api.pulseguard.io/webhooks/payments</td>
                  <td className="px-6 py-4">HTTP POST</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                      Offline
                    </span>
                  </td>
                  <td className="px-6 py-4">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-20 py-8 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>&copy; 2026 PulseGuard Monitoring Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Documentation</a>
            <a href="#" className="hover:underline">Support</a>
            <a href="#" className="hover:underline">API Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
