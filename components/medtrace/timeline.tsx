"use client";

import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

interface TimelineEvent {
  id: string;
  tipo: string;
  fechaHora: string;
  ubicacion: string;
  actor: string;
  rol: string;
  notas: string;
  pendienteSincronizacion?: boolean;
}

interface TimelineProps {
  eventos: TimelineEvent[];
}

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Timeline({ eventos }: TimelineProps) {
  if (eventos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay eventos registrados
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
      <div className="flex flex-col gap-4">
        {[...eventos].reverse().map((ev, i) => (
          <div key={ev.id} className="relative flex gap-3">
            <div
              className={cn(
                "absolute -left-3.5 top-1.5 h-3 w-3 rounded-full border-2 border-card",
                i === 0 ? "bg-primary" : "bg-border"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={ev.tipo} />
                {ev.pendienteSincronizacion && (
                  <span className="text-xs text-warning font-medium">
                    Pendiente de sincronizacion
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFechaHora(ev.fechaHora)} &middot; {ev.ubicacion}
              </p>
              <p className="text-sm text-card-foreground mt-0.5">
                {ev.actor} ({ev.rol})
              </p>
              {ev.notas && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ev.notas}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
