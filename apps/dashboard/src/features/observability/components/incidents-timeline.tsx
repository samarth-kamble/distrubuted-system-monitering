import { useState, useEffect } from "react";
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

function durationStr(start: string, end: string | null): string {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const diff = endTime - startTime;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}

export function IncidentsTimeline() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { data: incidents = [], isLoading } = useIncidents(statusFilter);
  const { mutate: acknowledge, isPending: isAcking } = useAcknowledgeIncident();
  const { mutate: resolve, isPending: isResolving } = useResolveIncident();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(incidents.length / itemsPerPage);
  const paginatedIncidents = incidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

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
    <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col space-y-4 shadow-2xs">
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
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Loading incidents...
            </p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                All Systems Operational
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                No incidents recorded
                {statusFilter !== "ALL" ? " matching your filter" : ""}.
              </p>
            </div>
          </div>
        ) : (
          <>
            {paginatedIncidents.map((incident, index) => {
              const isLast = index === paginatedIncidents.length - 1;

              return (
                <div key={incident.id} className="relative flex gap-4">
                  {/* Timeline Node Connector Line */}
                  {!isLast && (
                    <span className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-border/40" />
                  )}

                  {/* Severity Indicator Node */}
                  <div
                    className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center border z-10 ${
                      incident.status === "RESOLVED"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : incident.status === "ACKNOWLEDGED"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>

                  {/* Incident Details Card */}
                  <div className="flex-1 bg-muted/20 border border-border/40 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-foreground">
                            Outage: {incident.severity} Severity
                          </h4>
                          <span
                            className={`text-[8px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                              incident.status === "RESOLVED"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : incident.status === "ACKNOWLEDGED"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}
                          >
                            {incident.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          Service: {incident.service.name} (
                          {incident.service.targetUrl})
                        </p>
                      </div>

                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        {timeAgo(incident.startedAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-normal font-sans">
                      {incident.reason}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-mono border-t border-border/30 pt-2 gap-2 flex-wrap">
                      {incident.resolvedAt && (
                        <span className="text-muted-foreground/50">
                          Resolved: {new Date(incident.resolvedAt).toLocaleString()}
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
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-4">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, incidents.length)} of {incidents.length} incidents
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                  >
                    Previous
                  </Button>
                  <div className="text-[10px] font-mono font-bold bg-muted px-2.5 py-1 rounded-md border border-border/40">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
