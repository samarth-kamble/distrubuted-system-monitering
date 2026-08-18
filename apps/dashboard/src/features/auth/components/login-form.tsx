"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import {  Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "../hooks/use-auth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const { mutate: login, isPending, error } = useLogin()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  return (
    <div className="w-full max-w-105 space-y-8">
      {/* Header Brand & Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Image 
            src="/logo.svg" 
            alt="PulseGuard Logo" 
            width={34} 
            height={32} 
            className="h-8 w-auto dark:brightness-110"
          />
          <span className="text-lg font-bold tracking-tight">
            Pulse<span className="text-primary">Guard</span>
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your system metrics and check services health.
        </p>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 font-medium">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error.message}</span>
        </div>
      )}



      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
              <Mail className="h-4 w-4" />
            </span>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 bg-card border-border"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
              <Lock className="h-4 w-4" />
            </span>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-9 bg-card border-border"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              disabled={isPending}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isPending} 
          className="w-full font-bold cursor-pointer h-11 mt-2 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Signup Link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
