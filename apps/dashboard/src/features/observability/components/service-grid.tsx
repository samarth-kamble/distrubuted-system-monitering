import { Globe, Clock, Trash2 } from "lucide-react"
import { ServiceNode } from "./observability-console"
import { Button } from "@/components/ui/button"

interface ServiceGridProps {
  services: ServiceNode[]
  selectedNodeId: string | undefined
  onSelectNode: (node: ServiceNode) => void
  onDeleteNode: (id: string, name: string, e: React.MouseEvent) => void
}

export function ServiceGrid({
  services,
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
}: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-10 text-center flex flex-col items-center justify-center shadow-2xs">
        <Globe className="h-10 w-10 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-semibold">No services registered yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Register your first microservice to start tracking response times and outages.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => {
        const isSelected = selectedNodeId === service.id
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
          statusBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-emerald-500/20"
        } else if (isDown) {
          statusColor = "bg-rose-500"
          statusBg = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
        }

        return (
          <div
            key={service.id}
            onClick={() => onSelectNode(service)}
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
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => onDeleteNode(service.id, service.name, e)}
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                title="DELETE_SERVICE"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
