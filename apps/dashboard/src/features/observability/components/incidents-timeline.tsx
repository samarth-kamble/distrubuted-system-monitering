import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useIncidents,
  useAcknowledgeIncident,
  useResolveIncident,
} from "../hooks/use-incidents";
import type { Incident } from "../hooks/use-incidents";

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

function durationStr(startedAt: string, resolvedAt: string | null): string {
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const diff = end - new Date(startedAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainMins = minutes % 60;
  if (hours < 24) return `${hours}h ${remainMins}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20",
    dot: "bg-rose-500 animate-pulse",
  },
  HIGH: {
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
  },
  MEDIUM: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  LOW: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
};

const STATUS_CONFIG = {
  OPEN: {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20",
    label: "Open",
  },
  ACKNOWLEDGED: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    label: "Acknowledged",
  },
  RESOLVED: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    label: "Resolved",
  },
};

export function IncidentsTimeline() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { data: incidents = [], isLoading } = useIncidents(statusFilter);
  const { mutate: acknowledge, isPending: isAcking } = useAcknowledgeIncident();
  const { mutate: resolve, isPending: isResolving } = useResolveIncident();

  const handleAcknowledge = (incident: Incident) => {
    acknowledge(incident.id, {
      onSuccess: () =>
        toast.success(`Incident on '${incident.service.name}' acknowledged.`),
      onError: (err: any) =>
        toast.error(err.message || "Failed to acknowledge incident."),
    });
  };

  const handleResolve = (incident: Incident) => {
    resolve(incident.id, {
      onSuccess: () =>
        toast.success(
          `Incident on '${incident.service.name}' resolved. Service reset to HEALTHY.`,
        ),
      onError: (err: any) =>
        toast.error(err.message || "Failed to resolve incident."),
    });
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col space-y-4 shadow-2xs h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 font-sans">
            <AlertTriangle className="h-4.5 w-4.5 text-primary" />
            Incidents Timeline
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Service outage events with acknowledge &amp; resolve workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted border border-border/50 rounded-lg text-[10px] px-2.5 py-1.5 focus:outline-none focus:border-primary font-sans"
          >
            <option value="ALL">ALL STATUS</option>
            <option value="OPEN">OPEN</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Loading incidents...
            </p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                All clear!
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                No incidents found
                {statusFilter !== "ALL" ? ` with status "${statusFilter}"` : ""}
                . Your services are running smoothly.
              </p>
            </div>
          </div>
        ) : (
          /* Timeline Items */
          incidents.map((incident, index) => {
            const severity = SEVERITY_CONFIG[incident.severity];
            const status = STATUS_CONFIG[incident.status];
            const isLast = index === incidents.length - 1;

            return (
              <div key={incident.id} className="flex gap-4">
                {/* Timeline Rail */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className={`h-3 w-3 rounded-full ${severity.dot} ring-4 ring-background shrink-0 z-10`}
                  />
                  {!isLast && (
                    <div className="w-px flex-1 bg-border/60 min-h-6" />
                  )}
                </div>

                {/* Incident Card */}
                <div
                  className={`flex-1 mb-4 bg-card border rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all ${
                    incident.status === "OPEN"
                      ? "border-rose-500/30"
                      : incident.status === "ACKNOWLEDGED"
                        ? "border-amber-500/30"
                        : "border-border/50"
                  }`}
                >
                  {/* Top Row: Service + Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="text-xs font-bold text-foreground">
                      {incident.service.name}
                    </h4>

                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${severity.bg} ${severity.text} ${severity.border}`}
                    >
                      {incident.severity}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${status.bg} ${status.text} ${status.border}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    {incident.reason}
                  </p>

                  {/* Timestamps */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Started {timeAgo(incident.startedAt)}
                    </span>
                    {incident.acknowledgedAt && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Ack&apos;d {timeAgo(incident.acknowledgedAt)}
                      </span>
                    )}
                    {incident.resolvedAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolved {timeAgo(incident.resolvedAt)}
                      </span>
                    )}
                    <span className="font-mono text-muted-foreground/60">
                      Duration:{" "}
                      {durationStr(incident.startedAt, incident.resolvedAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  {incident.status !== "RESOLVED" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      {incident.status === "OPEN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-7 font-semibold cursor-pointer bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15"
                          onClick={() => handleAcknowledge(incident)}
                          disabled={isAcking}
                        >
                          {isAcking ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Eye className="h-3 w-3 mr-1" />
                          )}
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 font-semibold cursor-pointer bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                        onClick={() => handleResolve(incident)}
                        disabled={isResolving}
                      >
                        {isResolving ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
