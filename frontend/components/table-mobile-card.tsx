"use client"

import { cn } from "@/lib/utils"

interface TableMobileCardProps {
  title: string
  subtitle?: string
  data: { label: string; value: React.ReactNode }[]
  status?: {
    label: string
    variant?: "default" | "success" | "warning" | "destructive" | "info"
  }
  actions?: React.ReactNode
  className?: string
}

const statusVariants = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
}

export function TableMobileCard({
  title,
  subtitle,
  data,
  status,
  actions,
  className,
}: TableMobileCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground truncate">{title}</h4>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {status && (
          <span
            className={cn(
              "px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
              statusVariants[status.variant || "default"]
            )}
          >
            {status.label}
          </span>
        )}
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={index} className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      {actions && (
        <div className="pt-2 border-t border-border">
          {actions}
        </div>
      )}
    </div>
  )
}
