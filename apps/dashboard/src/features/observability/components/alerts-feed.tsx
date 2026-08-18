import { useState } from "react";
import {
  Bell,
  ShieldOff,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  ZapOff,
  Loader2,
  BellOff,
} from "lucide-react";
import { useAlerts } from "../hooks/use-alerts";
import type { Alert } from "../hooks/use-alerts";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SEVERITY_COLORS: Record<
  Alert["severity"],
  { strip: string; bg: string; text: string; border: string }
> = {
  CRITICAL: {
    strip: "bg-rose-500",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20",
  },
  HIGH: {
    strip: "bg-orange-500",
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/20",
  },
  MEDIUM: {
    strip: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
  },
  LOW: {
    strip: "bg-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
  },
  INFO: {
    strip: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-500",
    border: "border-sky-500/20",
  },
};

const TYPE_ICONS: Record<Alert["type"], typeof ShieldOff> = {
  SERVICE_DOWN: ShieldOff,
  SERVICE_RECOVERED: ShieldCheck,
  SERVICE_DEGRADED: ShieldAlert,
  INCIDENT_CREATED: AlertTriangle,
  INCIDENT_RESOLVED: ShieldCheck,
  CIRCUIT_OPENED: ZapOff,
  CIRCUIT_CLOSED: Zap,
  CIRCUIT_HALF_OPEN: Zap,
};

const TYPE_LABELS: Record<Alert["type"], string> = {
  SERVICE_DOWN: "Service Down",
  SERVICE_RECOVERED: "Service Recovered",
  SERVICE_DEGRADED: "Service Degraded",
  INCIDENT_CREATED: "Incident Created",
  INCIDENT_RESOLVED: "Incident Resolved",
  CIRCUIT_OPENED: "Circuit Opened",
  CIRCUIT_CLOSED: "Circuit Closed",
  CIRCUIT_HALF_OPEN: "Circuit Half-Open",
};

export function AlertsFeed() {
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const { data: alerts = [], isLoading } = useAlerts(
    severityFilter,
    typeFilter,
  );

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col space-y-4 shadow-2xs h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 font-sans">
            <Bell className="h-4.5 w-4.5 text-primary" />
            Alerts Feed
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Real-time system alerts and notifications from monitored services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-muted border border-border/50 rounded-lg text-[10px] px-2.5 py-1.5 focus:outline-none focus:border-primary font-sans"
          >
            <option value="ALL">ALL SEVERITY</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-muted border border-border/50 rounded-lg text-[10px] px-2.5 py-1.5 focus:outline-none focus:border-primary font-sans"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="SERVICE_DOWN">Service Down</option>
            <option value="SERVICE_RECOVERED">Service Recovered</option>
            <option value="SERVICE_DEGRADED">Service Degraded</option>
            <option value="INCIDENT_CREATED">Incident Created</option>
            <option value="INCIDENT_RESOLVED">Incident Resolved</option>
            <option value="CIRCUIT_OPENED">Circuit Opened</option>
            <option value="CIRCUIT_CLOSED">Circuit Closed</option>
            <option value="CIRCUIT_HALF_OPEN">Circuit Half-Open</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center">
              <BellOff className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No alerts</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                No alerts found
                {severityFilter !== "ALL" || typeFilter !== "ALL"
                  ? " matching your filters"
                  : ""}
                . Everything is quiet.
              </p>
            </div>
          </div>
        ) : (
          alerts.map((alert) => {
            const severity = SEVERITY_COLORS[alert.severity];
            const Icon = TYPE_ICONS[alert.type] || Bell;
            const typeLabel = TYPE_LABELS[alert.type] || alert.type;

            return (
              <div
                key={alert.id}
                className="flex overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xs hover:shadow-xs transition-all"
              >
                {/* Severity Color Strip */}
                <div className={`w-1 shrink-0 ${severity.strip}`} />

                {/* Card Content */}
                <div className="flex-1 p-4">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-7 w-7 rounded-lg ${severity.bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${severity.text}`} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-tight">
                          {alert.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {alert.service.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${severity.bg} ${severity.text} ${severity.border} uppercase tracking-wider`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono whitespace-nowrap">
                        {timeAgo(alert.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                    {alert.message}
                  </p>

                  {/* Footer Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-md">
                      <Icon className="h-2.5 w-2.5" />
                      {typeLabel}
                    </span>
                    {alert.incidentId && (
                      <span className="text-[9px] font-mono text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded-md">
                        INC:{alert.incidentId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
