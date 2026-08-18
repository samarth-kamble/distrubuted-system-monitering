"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface SuperTenant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    services: number;
    auditLogs: number;
  };
}

export interface SuperUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
  } | null;
}

export interface SuperAuditLog {
  id: string;
  action: string;
  resource: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  } | null;
  tenant: {
    id: string;
    name: string;
  } | null;
}

export function useSuperTenants() {
  return useQuery({
    queryKey: ["super-tenants"],
    queryFn: async () => {
      return apiRequest<SuperTenant[]>("/api/v1/super/tenants");
    },
  });
}

export function useSuperUsers() {
  return useQuery({
    queryKey: ["super-users"],
    queryFn: async () => {
      return apiRequest<SuperUser[]>("/api/v1/super/users");
    },
  });
}

export function useSuperAuditLogs() {
  return useQuery({
    queryKey: ["super-audit-logs"],
    queryFn: async () => {
      return apiRequest<SuperAuditLog[]>("/api/v1/super/audit-logs?limit=100");
    },
  });
}
