"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      return apiRequest<UserAccount[]>("/api/v1/admin/users");
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest<UserAccount>(`/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        body: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      return apiRequest<AuditLogItem[]>("/api/v1/admin/audit-logs?limit=50");
    },
  });
}

export function useCreateTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      return apiRequest<UserAccount>("/api/v1/admin/users", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; bio?: string }) => {
      return apiRequest<{ id: string; name: string; bio: string | null }>("/api/v1/admin/tenant", {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        const userStr = localStorage.getItem("pulseguard_user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user?.tenant) {
              user.tenant.name = data.name;
              user.tenant.bio = data.bio;
              localStorage.setItem("pulseguard_user", JSON.stringify(user));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
