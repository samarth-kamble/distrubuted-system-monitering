"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting until mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-[52px] h-6.5 rounded-full bg-muted/60 border border-border/40 animate-pulse" />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center h-6.5 w-[52px] rounded-full p-0.5 cursor-pointer transition-all duration-300 bg-linear-to-b focus:outline-none select-none border shadow-inner dark:from-slate-800/90 dark:to-slate-900/90 dark:border-slate-700/80 from-slate-100 to-slate-200 border-slate-300"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Background Icons (fades dynamically inside the track) */}
      <div className="absolute inset-[3px] flex justify-between items-center px-1 pointer-events-none">
        <Sun className={`h-2.5 w-2.5 transition-opacity duration-300 ${isDark ? "text-amber-500 opacity-60" : "text-amber-500/10 opacity-0"}`} />
        <Moon className={`h-2.5 w-2.5 transition-opacity duration-300 ${isDark ? "text-indigo-400/10 opacity-0" : "text-indigo-500 opacity-60"}`} />
      </div>

      {/* Floating sliding knob */}
      <div
        className={`flex items-center justify-center h-5 w-5 rounded-full transition-all duration-500 ease-out shadow-md transform ${
          isDark 
            ? "translate-x-[26px] bg-slate-955 border border-slate-700 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            : "translate-x-0 bg-amber-400 border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.7)]"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
      >
        {isDark ? (
          <Moon className="h-2.5 w-2.5 text-indigo-400 fill-indigo-400/20" />
        ) : (
          <Sun className="h-2.5 w-2.5 text-amber-500 fill-amber-300/30" />
        )}
      </div>
    </button>
  )
}
