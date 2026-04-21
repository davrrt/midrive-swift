"use client"

import { Menu, Car } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-2">
        <Car className="h-6 w-6 text-success" />
        <span className="font-bold text-lg">Drive Besa</span>
      </div>

      <div className="w-10">
        <ThemeToggle compact />
      </div>
    </header>
  )
}
