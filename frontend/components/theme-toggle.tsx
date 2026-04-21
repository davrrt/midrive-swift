"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

interface ThemeToggleProps {
  compact?: boolean
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

  if (!mounted) {
    return (
      <button className={compact
        ? "p-2 text-muted-foreground"
        : "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground"
      }>
        <Sun className="h-5 w-5" />
        {!compact && <span>Thème</span>}
      </button>
    )
  }

  if (compact) {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isDark ? "Mode clair" : "Mode sombre"}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {isDark ? (
        <>
          <Sun className="h-5 w-5" />
          <span>Mode clair</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span>Mode sombre</span>
        </>
      )}
    </button>
  )
}
