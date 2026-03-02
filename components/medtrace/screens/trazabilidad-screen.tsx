"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";
import { AppHeader } from "../app-header";
import { StatusBadge } from "../status-badge";
import { Timeline } from "../timeline";
import { EmptyState } from "../empty-state";
import { ScanInput } from "../scan-input";
import { findUnidad, getMedicamento } from "@/lib/store";
import type { UnidadEtiqueta } from "@/lib/types";

export function TrazabilidadScreen() {
  const [unidad, setUnidad] = useState<UnidadEtiqueta | null>(null);
  const [notFound, setNotFound] = useState(false);

  function handleSearch(idUnitario: string) {
    const found = findUnidad(idUnitario);
    if (found) {
      setUnidad(found);
      setNotFound(false);
    } else {
      setUnidad(null);
      setNotFound(true);
    }
  }

  const med = unidad ? getMedicamento(unidad.medicamentoId) : null;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppHeader titulo="Trazabilidad" />
      <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        <ScanInput
          placeholder="Buscar por ID unitario (ej: U-2026-000001)"
          onScan={handleSearch}
        />

        {notFound && (
          <EmptyState
            icon={Search}
            titulo="Unidad no encontrada"
            descripcion="Verifica el ID unitario e intenta de nuevo"
          />
        )}

        {unidad && (
          <>
            {/* Unit detail card */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-card-foreground font-mono">
                  {unidad.idUnitario}
                </h3>
                <StatusBadge status={unidad.estadoActual} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Medicamento</p>
                  <p className="font-medium text-foreground">
                    {med ? `${med.nombre} ${med.concentracion}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <p className="font-medium text-foreground">{unidad.lote}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="font-medium text-foreground">{unidad.vencimiento}</p>
                </div>
                {unidad.pacienteAsignado && (
                  <div>
                    <p className="text-xs text-muted-foreground">Paciente</p>
                    <p className="font-medium text-foreground">
                      {unidad.pacienteAsignado}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-card-foreground mb-4">
                Historial de custodia
              </h3>
              <Timeline eventos={unidad.eventos} />
            </div>
          </>
        )}

        {!unidad && !notFound && (
          <EmptyState
            icon={Package}
            titulo="Buscar unidad"
            descripcion="Ingresa o escanea un ID unitario para ver su trazabilidad completa"
          />
        )}
      </div>
    </div>
  );
}
