import { Globe, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface StatsRowProps {
  stats: {
    total: number
    healthy: number
    degraded: number
    offline: number
  }
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
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
  )
}
