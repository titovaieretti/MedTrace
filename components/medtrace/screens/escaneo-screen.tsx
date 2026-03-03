"use client";

import { useState } from "react";
import { ScanLine, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../app-header";
import { ScanInput } from "../scan-input";
import { StatusBadge } from "../status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  useUbicaciones,
  registrarEventoCustodia,
  useOfflineMode,
} from "@/lib/store";
import type { TipoEventoCustodia } from "@/lib/types";

interface LogEntry {
  id: string;
  unidadId: string;
  tipo: TipoEventoCustodia;
  ubicacion: string;
  ok: boolean;
  error?: string;
  timestamp: string;
}

const tiposEvento: { value: TipoEventoCustodia; label: string }[] = [
  { value: "unitarizada", label: "Unitarizada" },
  { value: "asignada", label: "Asignada" },
  { value: "entregada_a_sala", label: "Entregada a sala" },
  { value: "devuelta", label: "Devuelta" },
  { value: "descartada", label: "Descartada" },
];

export function EscaneoScreen() {
  const ubicaciones = useUbicaciones();
  const offline = useOfflineMode();
  const [tipoEvento, setTipoEvento] = useState<TipoEventoCustodia>("unitarizada");
  const [ubicacionId, setUbicacionId] = useState(ubicaciones[0]?.nombre ?? "");
  const [notas, setNotas] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);

  async function handleScan(unidadId: string) {
    if (!tipoEvento) {
      toast.error("Selecciona un tipo de evento");
      return;
    }
    if (!ubicacionId) {
      toast.error("Selecciona una ubicacion");
      return;
    }

    const result = await registrarEventoCustodia(
      unidadId,
      tipoEvento,
      ubicacionId,
      notas
    );

    const entry: LogEntry = {
      id: `log-${Date.now()}`,
      unidadId,
      tipo: tipoEvento,
      ubicacion: ubicacionId,
      ok: result.ok,
      error: result.error,
      timestamp: new Date().toLocaleTimeString("es-AR"),
    };

    setLog((prev) => [entry, ...prev]);

    if (result.ok) {
      toast.success(
        `Evento "${tiposEvento.find((t) => t.value === tipoEvento)?.label}" registrado para ${unidadId}${offline ? " (pendiente de sincronizacion)" : ""}`
      );
    } else {
      toast.error(result.error ?? "Error al registrar evento");
    }
    setNotas("");
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppHeader titulo="Estacion de escaneo" />
      <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Main scan input */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">Escanear unidad</h2>
          </div>
          <ScanInput
            placeholder="Escanear unidad / cajetin / ubicacion"
            onScan={handleScan}
          />
        </div>

        {/* Event type chips */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Tipo de evento
          </label>
          <div className="flex flex-wrap gap-2">
            {tiposEvento.map((t) => (
              <button
                key={t.value}
                onClick={() => setTipoEvento(t.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  tipoEvento === t.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location selector */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Ubicacion
          </label>
          <Select value={ubicacionId} onValueChange={setUbicacionId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ubicacion..." />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.map((u) => (
                <SelectItem key={u.id} value={u.nombre}>
                  {u.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Notas (opcional)
          </label>
          <Input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas adicionales..."
          />
        </div>

        {/* Live log */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Log en vivo
          </h3>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Los eventos escaneados apareceran aqui
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {log.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  {entry.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-medium text-card-foreground">
                        {entry.unidadId}
                      </span>
                      <StatusBadge status={entry.tipo} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.timestamp} &middot; {entry.ubicacion}
                    </p>
                    {entry.error && (
                      <p className="text-xs text-destructive mt-0.5">{entry.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
