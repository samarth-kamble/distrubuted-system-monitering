"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export interface UserProfile {
  id: string
  email: string
  name: string
  role: "ADMIN" | "VIEWER"
  createdAt?: string
  isActive?: boolean
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: UserProfile
}

export interface RegisterResponse {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      return apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: credentials,
      })
    },
    onSuccess: (data) => {
      localStorage.setItem("pulseguard_token", data.accessToken)
      localStorage.setItem("pulseguard_user", JSON.stringify(data.user))
      
      // Set secure cookie for middleware route protection
      document.cookie = `pulseguard_token=${data.accessToken}; path=/; max-age=86400; SameSite=Lax; Secure`
      
      queryClient.setQueryData(["user-profile"], data.user)
      
      toast.success("Successfully logged in!")
      router.push("/")
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to log in.")
    },
  })
}

export function useSignup() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (userData: Record<string, string>) => {
      return apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: userData,
      })
    },
    onSuccess: () => {
      toast.success("Account created successfully! Please sign in.")
      router.push("/login")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create account.")
    },
  })
}
