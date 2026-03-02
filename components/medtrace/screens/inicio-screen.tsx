"use client";

import {
  Tag,
  UserCheck,
  Truck,
  Undo2,
  Trash2,
  AlertTriangle,
  Plus,
  ClipboardList,
  ScanLine,
  Clock,
  ShieldAlert,
  Search,
  Copy,
} from "lucide-react";
import { AppHeader } from "../app-header";
import { KpiCard } from "../kpi-card";
import { Button } from "@/components/ui/button";
import { getKPIs, useAlertas } from "@/lib/store";
import type { TabId } from "../bottom-tabs";

interface InicioScreenProps {
  onNavigate: (tab: TabId) => void;
  onAction: (action: string) => void;
}

const alertaIcons: Record<string, typeof AlertTriangle> = {
  vencimiento: Clock,
  faltante: Search,
  duplicado: Copy,
  asignacion_incorrecta: ShieldAlert,
};

const alertaColors: Record<string, string> = {
  vencimiento: "text-warning",
  faltante: "text-destructive",
  duplicado: "text-primary",
  asignacion_incorrecta: "text-destructive",
};

export function InicioScreen({ onNavigate, onAction }: InicioScreenProps) {
  const kpis = getKPIs();
  const alertas = useAlertas();

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppHeader titulo="MedTrace" />
      <main className="flex-1 px-4 py-4 flex flex-col gap-5 max-w-lg mx-auto w-full">
        {/* KPIs */}
        <section aria-label="Indicadores clave">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resumen del dia
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard titulo="Etiquetadas hoy" valor={kpis.etiquetadasHoy} icon={Tag} color="primary" />
            <KpiCard titulo="Asignadas" valor={kpis.asignadas} icon={UserCheck} color="warning" />
            <KpiCard titulo="Entregadas a sala" valor={kpis.entregadas} icon={Truck} color="accent" />
            <KpiCard titulo="Devueltas" valor={kpis.devueltas} icon={Undo2} color="muted" />
            <KpiCard titulo="Descartadas" valor={kpis.descartadas} icon={Trash2} color="destructive" />
            <KpiCard titulo="Proximas a vencer" valor={kpis.proximasVencer} icon={AlertTriangle} color="warning" />
          </div>
        </section>

        {/* Accesos rapidos */}
        <section aria-label="Accesos rapidos">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Accesos rapidos
          </h2>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onAction("crear-lote")}
              className="h-12 justify-start gap-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
              Crear lote de etiquetas
            </Button>
            <Button
              onClick={() => onAction("crear-pedido")}
              variant="outline"
              className="h-12 justify-start gap-3 border-border text-foreground bg-transparent hover:bg-secondary"
            >
              <ClipboardList className="h-5 w-5" />
              Crear pedido 24h
            </Button>
            <Button
              onClick={() => onNavigate("escaneo")}
              variant="outline"
              className="h-12 justify-start gap-3 border-border text-foreground bg-transparent hover:bg-secondary"
            >
              <ScanLine className="h-5 w-5" />
              Abrir escaneo
            </Button>
          </div>
        </section>

        {/* Alertas recientes */}
        <section aria-label="Alertas recientes">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Alertas recientes
          </h2>
          <div className="flex flex-col gap-2">
            {alertas.map((alerta) => {
              const Icon = alertaIcons[alerta.tipo] ?? AlertTriangle;
              const color = alertaColors[alerta.tipo] ?? "text-muted-foreground";
              return (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-card-foreground">{alerta.mensaje}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(alerta.fechaHora).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
