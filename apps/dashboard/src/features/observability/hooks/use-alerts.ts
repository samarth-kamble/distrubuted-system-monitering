"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface AlertService {
  id: string;
  name: string;
  targetUrl: string;
  status: string;
}

export interface AlertIncident {
  id: string;
  severity: string;
  status: string;
}

export interface Alert {
  id: string;
  serviceId: string;
  incidentId: string | null;
  type:
    | "SERVICE_DOWN"
    | "SERVICE_RECOVERED"
    | "SERVICE_DEGRADED"
    | "INCIDENT_CREATED"
    | "INCIDENT_RESOLVED"
    | "CIRCUIT_OPENED"
    | "CIRCUIT_CLOSED"
    | "CIRCUIT_HALF_OPEN";
  title: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  metadata: Record<string, unknown>;
  createdAt: string;
  service: AlertService;
  incident: AlertIncident | null;
}

export function useAlerts(severity?: string, type?: string) {
  const params = new URLSearchParams();
  params.set("limit", "50");
  if (severity && severity !== "ALL") {
    params.set("severity", severity);
  }
  if (type && type !== "ALL") {
    params.set("type", type);
  }

  return useQuery({
    queryKey: ["alerts", severity, type],
    queryFn: async () => {
      return apiRequest<Alert[]>(`/api/v1/alerts?${params.toString()}`);
    },
    refetchInterval: 15000,
  });
}
