"use client";

import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  activo: "bg-accent/15 text-accent border-accent/30",
  inactivo: "bg-muted text-muted-foreground border-border",
  borrador: "bg-secondary text-secondary-foreground border-border",
  impreso: "bg-primary/15 text-primary border-primary/30",
  en_preparacion: "bg-warning/15 text-warning border-warning/30",
  entregado: "bg-accent/15 text-accent border-accent/30",
  unitarizada: "bg-primary/15 text-primary border-primary/30",
  asignada: "bg-warning/15 text-warning border-warning/30",
  entregada_a_sala: "bg-accent/15 text-accent border-accent/30",
  devuelta: "bg-muted text-muted-foreground border-border",
  descartada: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  borrador: "Borrador",
  impreso: "Impreso",
  en_preparacion: "En preparacion",
  entregado: "Entregado",
  unitarizada: "Unitarizada",
  asignada: "Asignada",
  entregada_a_sala: "Entregada a sala",
  devuelta: "Devuelta",
  descartada: "Descartada",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        statusStyles[status] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
