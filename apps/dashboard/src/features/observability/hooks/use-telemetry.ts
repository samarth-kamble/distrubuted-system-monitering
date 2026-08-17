"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"

// Service model matching Prisma schema
export interface ServiceNode {
  id: string
  name: string
  targetUrl: string
  method: string
  intervalSeconds: number
  timeoutMs: number
  status: "UNKNOWN" | "HEALTHY" | "DEGRADED" | "DOWN" | "RECOVERING"
  lastCheckedAt: string | null
  consecutiveFailures: number
  consecutiveSuccesses: number
}

export interface CreateServiceInput {
  name: string
  targetUrl: string
  method: string
  intervalSeconds: number
  timeoutMs: number
}

export function useTelemetry() {
  return useQuery({
    queryKey: ["services-telemetry"],
    queryFn: async () => {
      return apiRequest<ServiceNode[]>("/api/v1/services")
    },
    refetchInterval: 8000, // Poll services health status every 8 seconds
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateServiceInput) => {
      return apiRequest<ServiceNode>("/api/v1/services", {
        method: "POST",
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services-telemetry"] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<{ success: boolean }>(`/api/v1/services/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services-telemetry"] })
    },
  })
}
