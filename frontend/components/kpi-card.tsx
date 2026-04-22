import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: KPICardProps) {
  return (
    <Card className={cn("p-3 mobile:p-6", className)}>
      <div className="flex flex-col gap-1 mobile:gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs mobile:text-sm text-muted-foreground line-clamp-1">{title}</p>
          {Icon && (
            <div className="rounded-md bg-secondary p-1.5 mobile:p-2 ml-2 shrink-0">
              <Icon className="h-4 w-4 mobile:h-5 mobile:w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-lg mobile:text-2xl font-bold tracking-tight whitespace-nowrap">{value}</p>
        {subtitle && (
          <p className="text-xs mobile:text-sm text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs mobile:text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </p>
        )}
      </div>
    </Card>
  );
}
