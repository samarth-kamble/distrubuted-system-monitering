"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"

export interface IncidentService {
  id: string
  name: string
  targetUrl: string
  status: string
}

export interface Incident {
  id: string
  serviceId: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED"
  reason: string
  metadata: Record<string, unknown>
  startedAt: string
  acknowledgedAt: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  service: IncidentService
}

export function useIncidents(status?: string) {
  const params = new URLSearchParams()
  params.set("limit", "50")
  if (status && status !== "ALL") {
    params.set("status", status)
  }

  return useQuery({
    queryKey: ["incidents", status],
    queryFn: async () => {
      return apiRequest<Incident[]>(`/api/v1/incidents?${params.toString()}`)
    },
    refetchInterval: 15000,
  })
}

export function useAcknowledgeIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<Incident>(`/api/v1/incidents/${id}/acknowledge`, {
        method: "POST",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] })
    },
  })
}

export function useResolveIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<Incident>(`/api/v1/incidents/${id}/resolve`, {
        method: "POST",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] })
      queryClient.invalidateQueries({ queryKey: ["services-telemetry"] })
    },
  })
}
