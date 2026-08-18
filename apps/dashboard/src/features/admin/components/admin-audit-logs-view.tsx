"use client";

import { ShieldAlert, Shield, Clock, Info, ShieldCheck, Loader2 } from "lucide-react";
import { useAdminAuditLogs } from "../hooks/use-admin";

export function AdminAuditLogsView() {
  const { data: dbAuditLogs = [], isLoading: isLoadingAudit } = useAdminAuditLogs();

  return (
    <div className="space-y-5 bg-card border border-border/50 rounded-xl p-5 shadow-2xs">
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-primary" />
          Security Audit Trail
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Immutable record of operations performed across cluster nodes
          by authorized operators.
        </p>
      </div>

      <div className="space-y-3">
        {isLoadingAudit ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-card border border-border/40 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading audit records...</p>
          </div>
        ) : dbAuditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card border border-border/40 rounded-xl text-center">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs font-semibold text-foreground">No operations recorded yet</p>
          </div>
        ) : (
          dbAuditLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col border border-border/40 rounded-xl bg-card/60 p-4 shadow-3xs"
            >
              {/* Log Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-foreground font-black bg-muted px-2 py-0.5 rounded-md uppercase">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        by
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {log.userEmail}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">
                      Resource: {log.resource} ({log.resourceId})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                  <span className="hidden sm:inline bg-muted/40 px-2 py-0.5 rounded">
                    IP: {log.ipAddress || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Metadata Context Breakdown */}
              <div className="bg-muted/40 rounded-lg p-2.5 border border-border/20">
                <div className="flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Execution Payload Metadata
                    </span>
                    <pre className="text-[10px] font-mono text-muted-foreground leading-normal whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
