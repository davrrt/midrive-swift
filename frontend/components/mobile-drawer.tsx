"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { X, TrendingUp, Settings, LogOut, Car } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border z-50 flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-success" />
            <span className="font-bold">Drive Besa</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/projection"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">Projection</span>
          </Link>

          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Paramètres</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Déconnexion</span>
          </button>

          <p className="px-3 pt-2 text-xs text-muted-foreground">
            Drive Besa v1.0
          </p>
        </div>
      </div>
    </>
  )
}
