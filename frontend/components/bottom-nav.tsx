"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Car,
  Users,
  Wallet,
  UserCog,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Flotte", href: "/flotte", icon: Car },
  { name: "Chauffeurs", href: "/chauffeurs", icon: Users },
  { name: "Trésorerie", href: "/tresorerie", icon: Wallet },
  { name: "RH", href: "/rh", icon: UserCog },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="h-16 bg-background border-t border-border flex items-center justify-around px-2">
      {navigation.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "text-success")} />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
