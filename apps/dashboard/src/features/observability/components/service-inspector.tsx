import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { ServiceNode } from "./observability-console"

interface ServiceInspectorProps {
  selectedNode: ServiceNode | null
  chartData: Array<{ time: string; latency: number }>
}

export function ServiceInspector({
  selectedNode,
  chartData,
}: ServiceInspectorProps) {
  if (!selectedNode) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 text-center text-muted-foreground text-xs shadow-2xs">
        Select a service from the dashboard grid to inspect metrics.
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col space-y-5 shadow-2xs">
      <div>
        <h3 className="text-xs font-bold text-foreground">Service Inspector</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">{selectedNode.name}</p>
      </div>

      {/* Detailed attributes list */}
      <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-[11px] space-y-2.5 font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">URL:</span>
          <span className="text-foreground text-right truncate max-w-45">
            {selectedNode.targetUrl}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">METHOD:</span>
          <span className="text-foreground">{selectedNode.method}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">INTERVAL:</span>
          <span className="text-foreground">{selectedNode.intervalSeconds} seconds</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">TIMEOUT:</span>
          <span className="text-foreground">{selectedNode.timeoutMs}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">FAIL_STREAK:</span>
          <span
            className={
              selectedNode.consecutiveFailures > 0
                ? "text-rose-500 font-bold"
                : "text-foreground"
            }
          >
            {selectedNode.consecutiveFailures}
          </span>
        </div>
      </div>

      {/* Real-time Response latency chart */}
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Latency History (ms)
        </span>
        <div className="h-32 w-full border border-border/40 rounded-lg p-2 bg-muted/20">
          {selectedNode.status === "DOWN" ? (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-rose-500 font-mono">
              NO DATA - ENDPOINT OFFLINE
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={110}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary, #e22935)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary, #e22935)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis fontSize={8} stroke="#888" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: "9px",
                    background: "rgba(0,0,0,0.85)",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="var(--color-primary, #e22935)"
                  strokeWidth={1.5}
                  fill="url(#glowColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
