"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { Shield, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSignup } from "../hooks/use-auth"

export function SignupForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: signup, isPending, error } = useSignup()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    signup({ name, email, password, organizationName })
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
        <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up today and get 10 custom service monitors free forever.
        </p>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 font-medium">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Social Sign-In Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium shadow-2xs hover:bg-muted/50 transition-all cursor-pointer"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          GitHub
        </button>
        <button 
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium shadow-2xs hover:bg-muted/50 transition-all cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="grow border-t border-border"></div>
        <span className="shrink mx-4 text-xs uppercase tracking-wider text-muted-foreground font-mono">or continue with</span>
        <div className="grow border-t border-border"></div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
              <User className="h-4 w-4" />
            </span>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9 bg-card border-border"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
              <Building2 className="h-4 w-4" />
            </span>
            <Input
              id="orgName"
              type="text"
              placeholder="Acme Corp"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="pl-9 bg-card border-border"
              disabled={isPending}
            />
          </div>
        </div>

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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
              <Lock className="h-4 w-4" />
            </span>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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

        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            required
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 bg-card cursor-pointer"
            disabled={isPending}
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground leading-none cursor-pointer">
            I agree to the{" "}
            <a href="#" className="font-semibold text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </a>.
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={isPending} 
          className="w-full font-bold cursor-pointer h-11 mt-2 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  )
}
