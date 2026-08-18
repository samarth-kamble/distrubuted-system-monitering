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
  const [organizationBio, setOrganizationBio] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: signup, isPending, error } = useSignup()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    signup({ name, email, password, organizationName, organizationBio })
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
          <Label htmlFor="orgBio">Organization Bio</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
              <Shield className="h-4 w-4" />
            </span>
            <Input
              id="orgBio"
              type="text"
              placeholder="What does your company do?"
              value={organizationBio}
              onChange={(e) => setOrganizationBio(e.target.value)}
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
