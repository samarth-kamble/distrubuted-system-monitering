import { RefObject } from "react"
import { Terminal } from "lucide-react"
import { LogItem } from "./observability-console"
import { Button } from "@/components/ui/button"

interface LogsTerminalProps {
  filteredLogs: LogItem[]
  logLevelFilter: "all" | "success" | "warning" | "error"
  setLogLevelFilter: (val: "all" | "success" | "warning" | "error") => void
  isLogStreamPaused: boolean
  setIsLogStreamPaused: (val: boolean | ((p: boolean) => boolean)) => void
  onClearLogs: () => void
  logsEndRef: RefObject<HTMLDivElement | null>
}

export function LogsTerminal({
  filteredLogs,
  logLevelFilter,
  setLogLevelFilter,
  isLogStreamPaused,
  setIsLogStreamPaused,
  onClearLogs,
  logsEndRef,
}: LogsTerminalProps) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col space-y-4 shadow-2xs h-[calc(100vh-140px)]">
      {/* Log Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 font-sans">
            <Terminal className="h-4.5 w-4.5 text-primary" />
            Live Telemetry Log Stream
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Real-time health heartbeat logs for active SRE workspace nodes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {/* Log level filter */}
          <select
            value={logLevelFilter}
            onChange={(e) =>
              setLogLevelFilter(e.target.value as "all" | "success" | "warning" | "error")
            }
            className="bg-muted border border-border/50 rounded-lg text-[10px] px-2.5 py-1.5 focus:outline-none focus:border-primary font-sans"
          >
            <option value="all">ALL LEVELS</option>
            <option value="success">INFO (200 OK)</option>
            <option value="warning">WARN (DEGRADED)</option>
            <option value="error">ERROR (TIMEOUT)</option>
          </select>

          {/* Pause/Resume button */}
          <Button
            onClick={() => setIsLogStreamPaused((prev) => !prev)}
            variant="outline"
            size="sm"
            className={`text-[10px] h-8 font-semibold cursor-pointer ${
              isLogStreamPaused
                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/15 border-amber-500/20"
            }`}
          >
            {isLogStreamPaused ? "RESUME" : "PAUSE"}
          </Button>

          {/* Clear logs */}
          <Button
            onClick={onClearLogs}
            variant="outline"
            size="sm"
            className="text-[10px] h-8 font-semibold cursor-pointer"
          >
            CLEAR
          </Button>
        </div>
      </div>

      {/* SRE TTY Terminal Viewport */}
      <div className="flex-1 bg-black/95 text-[11px] font-mono p-4 rounded-lg overflow-y-auto border border-border/30 shadow-inner flex flex-col space-y-1.5 select-text">
        {filteredLogs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground/50 text-xs uppercase tracking-wider font-mono">
            [SYSTEM] STREAM IDLE - NO LOG RECORDS MATCH FILTER
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            let logStyle = "text-emerald-400"
            let badgeStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
            let prefix = "[INFO]"

            if (log.type === "error") {
              logStyle = "text-rose-400 font-bold"
              badgeStyle = "bg-rose-500/15 text-rose-400 border-rose-500/20"
              prefix = "[CRIT]"
            } else if (log.type === "warning") {
              logStyle = "text-amber-400"
              badgeStyle = "bg-amber-500/15 text-amber-400 border-amber-500/20"
              prefix = "[WARN]"
            }

            return (
              <div
                key={idx}
                className={`leading-relaxed border-b border-white/5 pb-1 flex flex-wrap gap-x-2 ${logStyle}`}
              >
                <span className="text-muted-foreground/50 select-none">
                  [{log.timestamp}]
                </span>
                <span
                  className={`inline-flex px-1 rounded border text-[8px] font-bold ${badgeStyle} select-none`}
                >
                  {prefix}
                </span>
                <span className="text-white font-semibold">{log.serviceName}</span>
                <span className="text-muted-foreground/80">{log.method}</span>
                <span className="text-muted-foreground/60 select-all">{log.url}</span>
                <span className="mx-1 select-none">-</span>
                <span>{log.status}</span>
                {log.latency > 0 && (
                  <span className="text-muted-foreground/75">({log.latency}ms)</span>
                )}
              </div>
            )
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
