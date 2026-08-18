"use client";

import { TrendingUp, AlertTriangle, Server, Loader2, RefreshCw } from "lucide-react";
import { useMetricsSummary } from "../hooks/use-metrics";

const STATUS_CONFIG = [
  {
    key: "HEALTHY" as const,
    label: "Healthy",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  {
    key: "DEGRADED" as const,
    label: "Degraded",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  {
    key: "DOWN" as const,
    label: "Down",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    bar: "bg-rose-500",
    dot: "bg-rose-500 animate-pulse",
  },
  {
    key: "RECOVERING" as const,
    label: "Recovering",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
  },
  {
    key: "UNKNOWN" as const,
    label: "Unknown",
    color: "text-muted-foreground",
    bg: "bg-muted/60",
    border: "border-border/40",
    bar: "bg-muted-foreground/40",
    dot: "bg-muted-foreground/40",
  },
];

// SVG Ring component — no external chart library needed
function HealthRing({ score, healthy, total }: { score: number; healthy: number; total: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  const ringColor =
    score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e";
  const ringGlow =
    score >= 80 ? "drop-shadow(0 0 8px rgba(16,185,129,0.5))"
    : score >= 50 ? "drop-shadow(0 0 8px rgba(245,158,11,0.5))"
    : "drop-shadow(0 0 8px rgba(244,63,94,0.5))";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          {/* Background track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/40"
          />
          {/* Filled arc */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
            style={{ filter: ringGlow, transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black tabular-nums" style={{ color: ringColor }}>
            {score}%
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
            Health Score
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-bold text-foreground">{healthy}</span> of{" "}
        <span className="font-bold text-foreground">{total}</span> services healthy
      </p>
    </div>
  );
}

export function MetricsDashboard() {
  const { data, isLoading, refetch, isFetching } = useMetricsSummary();

  const total = data?.totalServices ?? 0;
  const healthy = data?.statusBreakdown.HEALTHY ?? 0;
  const score = total > 0 ? Math.round((healthy / total) * 100) : 100;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col space-y-5 shadow-2xs h-[calc(100vh-140px)] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-border/40 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
            Metrics Dashboard
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Live system health overview. Refreshes every 30s.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh metrics"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Loading metrics...</p>
        </div>
      ) : (
        <>
          {/* Health Ring + Active Incidents row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Health Score Ring */}
            <div className="bg-muted/30 border border-border/40 rounded-xl p-5 flex items-center justify-center">
              <HealthRing score={score} healthy={healthy} total={total} />
            </div>

            {/* Stats column */}
            <div className="flex flex-col gap-3">
              {/* Total Services */}
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Server className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums text-foreground">{total}</p>
                  <p className="text-[11px] text-muted-foreground">Services Monitored</p>
                </div>
              </div>

              {/* Active Incidents */}
              <div className={`border rounded-xl p-4 flex items-center gap-3 ${
                (data?.activeIncidents ?? 0) > 0
                  ? "bg-rose-500/5 border-rose-500/20"
                  : "bg-muted/30 border-border/40"
              }`}>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                  (data?.activeIncidents ?? 0) > 0 ? "bg-rose-500/15" : "bg-muted/60"
                }`}>
                  <AlertTriangle className={`h-4.5 w-4.5 ${
                    (data?.activeIncidents ?? 0) > 0 ? "text-rose-500" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-black tabular-nums ${
                    (data?.activeIncidents ?? 0) > 0 ? "text-rose-500" : "text-foreground"
                  }`}>
                    {data?.activeIncidents ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Active Incidents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Status Breakdown
            </h3>

            <div className="flex flex-col gap-2.5">
              {STATUS_CONFIG.map((s) => {
                const count = data?.statusBreakdown[s.key] ?? 0;
                const pct = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={s.key} className={`flex items-center gap-3 rounded-xl border p-3.5 ${s.bg} ${s.border}`}>
                    {/* Dot */}
                    <div className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />

                    {/* Label */}
                    <span className={`text-[11px] font-semibold w-20 shrink-0 ${s.color}`}>
                      {s.label}
                    </span>

                    {/* Progress Bar */}
                    <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Count */}
                    <span className={`text-sm font-black tabular-nums w-6 text-right ${s.color}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
