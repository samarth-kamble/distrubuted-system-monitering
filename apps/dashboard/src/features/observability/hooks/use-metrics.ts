"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface MetricsSummary {
  totalServices: number;
  activeIncidents: number;
  statusBreakdown: {
    HEALTHY: number;
    DEGRADED: number;
    DOWN: number;
    RECOVERING: number;
    UNKNOWN: number;
  };
}

export function useMetricsSummary() {
  return useQuery({
    queryKey: ["metrics-summary"],
    queryFn: async () => {
      return apiRequest<MetricsSummary>("/api/v1/metrics/summary");
    },
    refetchInterval: 30000,
  });
}
