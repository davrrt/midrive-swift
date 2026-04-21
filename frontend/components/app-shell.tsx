"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"
import { MobileDrawer } from "@/components/mobile-drawer"

const publicRoutes = ["/login"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Header - visible uniquement < 700px */}
      <div className="mobile:hidden fixed top-0 left-0 right-0 z-40">
        <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
      </div>

      {/* Desktop Sidebar - cachée < 700px */}
      <div className="hidden mobile:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="mobile:ml-60 pt-14 pb-16 mobile:pt-0 mobile:pb-0 p-4 mobile:p-8">
        {children}
      </main>

      {/* Mobile Bottom Nav - visible uniquement < 700px */}
      <div className="mobile:hidden fixed bottom-0 left-0 right-0 z-40">
        <BottomNav />
      </div>

      {/* Mobile Drawer (settings) */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
