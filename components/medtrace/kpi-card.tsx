"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  titulo: string;
  valor: number;
  icon: LucideIcon;
  color?: "primary" | "accent" | "warning" | "destructive" | "muted";
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function KpiCard({ titulo, valor, icon: Icon, color = "primary" }: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", colorMap[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-card-foreground leading-tight">{valor}</p>
        <p className="text-xs text-muted-foreground truncate">{titulo}</p>
      </div>
    </div>
  );
}
