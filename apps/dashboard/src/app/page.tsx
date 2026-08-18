import { Suspense } from "react";
import { ObservabilityConsole } from "@/features/observability/components/observability-console"

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground font-mono text-xs">
        Loading PulseGuard telemetry...
      </div>
    }>
      <ObservabilityConsole />
    </Suspense>
  );
}

