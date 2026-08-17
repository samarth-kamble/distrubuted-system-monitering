"use client"

import * as React from "react"

export function OrbitalPulse() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-background transition-colors duration-500">
      {/* 1. Cyber Grid Backdrop */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-20 dark:opacity-10"
        style={{
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)"
        }}
      />

      {/* 2. Overlapping Mesh Glow spots */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      <div className="absolute top-1/3 left-1/4 w-87.5 h-87.5 rounded-full bg-secondary/5 blur-[90px] dark:bg-secondary/10" />

      {/* 3. The Radar Sweep line */}
      <div className="absolute inset-y-0 w-0.5 bg-linear-to-b from-transparent via-primary/30 to-transparent left-0 animate-[radar-sweep_10s_ease-in-out_infinite]" />

      {/* 4. Orbital Concentric Rings System */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-200 h-200">
        
        {/* Outer Orbit (Slow Clockwise) */}
        <div className="absolute w-170 h-170 rounded-full border border-dashed border-muted/50 animate-[spin_55s_linear_infinite] flex items-center justify-center">
          {/* Node 1: Critical (sa-east-1) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="h-3 w-3 rounded-full bg-destructive shadow-[0_0_12px_var(--destructive)]" />
            <span className="absolute -top-6 text-[10px] font-mono tracking-wider text-destructive font-semibold">SA-ALERT</span>
          </div>
          {/* Node 2: Healthy */}
          <div className="absolute bottom-1/4 left-0 -translate-x-1/2 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
          </div>
        </div>

        {/* Middle Orbit (Medium Counter-Clockwise) */}
        <div className="absolute w-115 h-115 rounded-full border border-border/80 animate-[spin_40s_linear_infinite_reverse] flex items-center justify-center">
          {/* Node 3: Warning (ap-south-1) */}
          <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
            <span className="absolute -right-14 text-[9px] font-mono text-amber-500/80">LATENCY_WARN</span>
          </div>
          {/* Node 4: Healthy */}
          <div className="absolute left-1/4 bottom-0 -translate-y-1/2 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>
        </div>

        {/* Inner Orbit (Fast Clockwise) */}
        <div className="absolute w-60 h-60 rounded-full border border-primary/20 animate-[spin_25s_linear_infinite] flex items-center justify-center">
          {/* Node 5: Gateway Sync */}
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          </div>
        </div>

        {/* Core Heartbeat Center Node */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 rounded-full bg-primary/10 border border-primary/20 animate-ping opacity-60" />
          <div className="absolute h-10 w-10 rounded-full bg-primary/20 border border-primary/30 animate-pulse" />
          <div className="h-6 w-6 rounded-full bg-primary shadow-[0_0_15px_var(--primary)] flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-background" />
          </div>
        </div>

      </div>
    </div>
  )
}
