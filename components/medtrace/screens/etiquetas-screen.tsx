"use client";

import { useState } from "react";
import { Plus, Tag, ArrowLeft, Search, Printer, Check } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../app-header";
import { StatusBadge } from "../status-badge";
import { EmptyState } from "../empty-state";
import { Stepper } from "../stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useLotes,
  useMedicamentos,
  createLote,
  markLoteImpreso,
  getMedicamento,
} from "@/lib/store";
import type { LoteEtiquetas } from "@/lib/types";

type ViewMode = "lista" | "crear" | "detalle";

export function EtiquetasScreen({ autoCreate }: { autoCreate?: boolean }) {
  const lotes = useLotes();
  const medicamentos = useMedicamentos();
  const [view, setView] = useState<ViewMode>(autoCreate ? "crear" : "lista");
  const [detalleLote, setDetalleLote] = useState<LoteEtiquetas | null>(null);

  // Stepper state
  const [paso, setPaso] = useState(0);
  const [medId, setMedId] = useState("");
  const [loteNombre, setLoteNombre] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cantidad, setCantidad] = useState("10");
  const [medSearch, setMedSearch] = useState("");
  const [createdLote, setCreatedLote] = useState<LoteEtiquetas | null>(null);

  const activeMeds = medicamentos.filter((m) => m.estado === "activo");
  const filteredMeds = medSearch
    ? activeMeds.filter(
        (m) =>
          m.nombre.toLowerCase().includes(medSearch.toLowerCase()) ||
          m.codigoInterno.toLowerCase().includes(medSearch.toLowerCase())
      )
    : activeMeds;

  function resetForm() {
    setPaso(0);
    setMedId("");
    setLoteNombre("");
    setVencimiento("");
    setCantidad("10");
    setMedSearch("");
    setCreatedLote(null);
  }

  function handleCrear() {
    resetForm();
    setView("crear");
  }

  function handleBack() {
    resetForm();
    setView("lista");
  }

  function handleNextStep() {
    if (paso === 0) {
      if (!medId) {
        toast.error("Selecciona un medicamento");
        return;
      }
      if (!loteNombre.trim()) {
        toast.error("Ingresa el numero de lote");
        return;
      }
      if (!vencimiento) {
        toast.error("Ingresa la fecha de vencimiento");
        return;
      }
      if (!cantidad || Number(cantidad) < 1) {
        toast.error("La cantidad debe ser al menos 1");
        return;
      }
      // Create the lote
      const newLote = createLote(medId, loteNombre, vencimiento, Number(cantidad));
      setCreatedLote(newLote);
      setPaso(1);
    } else if (paso === 1) {
      setPaso(2);
    }
  }

  function handleMarcarImpreso() {
    if (createdLote) {
      markLoteImpreso(createdLote.id);
      toast.success("Lote marcado como impreso");
      handleBack();
    }
  }

  const selectedMed = medId ? getMedicamento(medId) : null;

  // DETAIL VIEW
  if (view === "detalle" && detalleLote) {
    const med = getMedicamento(detalleLote.medicamentoId);
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo="Detalle del lote">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDetalleLote(null);
              setView("lista");
            }}
            className="text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
          {/* Summary */}
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-card-foreground">Resumen del lote</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Medicamento</p>
                <p className="text-sm font-medium text-foreground">
                  {med ? `${med.nombre} ${med.concentracion}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lote</p>
                <p className="text-sm font-medium text-foreground">{detalleLote.lote}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencimiento</p>
                <p className="text-sm font-medium text-foreground">{detalleLote.vencimiento}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cantidad</p>
                <p className="text-sm font-medium text-foreground">{detalleLote.cantidad} unidades</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creacion</p>
                <p className="text-sm font-medium text-foreground">{detalleLote.fechaCreacion}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <StatusBadge status={detalleLote.estado} />
              </div>
            </div>
            {detalleLote.estado === "borrador" && (
              <Button
                onClick={() => {
                  markLoteImpreso(detalleLote.id);
                  toast.success("Lote marcado como impreso");
                  setDetalleLote(null);
                  setView("lista");
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Printer className="h-4 w-4 mr-2" />
                Marcar como impreso
              </Button>
            )}
          </div>

          {/* Units grid */}
          <h3 className="font-semibold text-foreground">Etiquetas generadas</h3>
          <div className="grid grid-cols-2 gap-2">
            {detalleLote.unidades.map((u) => (
              <div
                key={u.idUnitario}
                className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1"
              >
                <p className="text-xs font-bold text-primary truncate">
                  {u.idUnitario}
                </p>
                <p className="text-xs text-card-foreground">
                  {med ? `${med.nombre} ${med.concentracion}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Lote: {u.lote} | Vto: {u.vencimiento}
                </p>
                <div className="mt-1 h-10 w-10 bg-foreground rounded-sm" title="DataMatrix placeholder" />
                <StatusBadge status={u.estadoActual} className="mt-1 self-start" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CREATE VIEW (Stepper)
  if (view === "crear") {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo="Crear lote">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-4 flex flex-col gap-5 max-w-lg mx-auto w-full">
          <Stepper
            pasos={["Datos del lote", "Vista previa", "Confirmacion"]}
            pasoActual={paso}
          />

          {/* Step 1 */}
          {paso === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Medicamento *
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="Buscar medicamento..."
                    className="pl-9"
                  />
                </div>
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {filteredMeds.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMedId(m.id)}
                      className={`w-full text-left px-3 py-2 text-sm border-b border-border last:border-0 transition-colors ${
                        medId === m.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {m.nombre} {m.concentracion}
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({m.codigoInterno})
                      </span>
                    </button>
                  ))}
                  {filteredMeds.length === 0 && (
                    <p className="text-sm text-muted-foreground p-3">
                      No se encontraron medicamentos
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Numero de lote *</label>
                <Input
                  value={loteNombre}
                  onChange={(e) => setLoteNombre(e.target.value)}
                  placeholder="Ej: L2026-PAR-002"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Vencimiento *</label>
                <Input
                  type="date"
                  value={vencimiento}
                  onChange={(e) => setVencimiento(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cantidad de unidades *</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
              <Button
                onClick={handleNextStep}
                className="h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Generar etiquetas
              </Button>
            </div>
          )}

          {/* Step 2 - Preview */}
          {paso === 1 && createdLote && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-card-foreground mb-2">
                  {selectedMed?.nombre} {selectedMed?.concentracion}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Lote: {createdLote.lote} | Vencimiento: {createdLote.vencimiento} |{" "}
                  {createdLote.cantidad} unidades
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {createdLote.unidades.slice(0, 6).map((u) => (
                  <div
                    key={u.idUnitario}
                    className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1"
                  >
                    <p className="text-xs font-bold text-primary truncate">
                      {u.idUnitario}
                    </p>
                    <p className="text-xs text-card-foreground">
                      {selectedMed?.nombre} {selectedMed?.concentracion}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Lote: {u.lote} | Vto: {u.vencimiento}
                    </p>
                    <div className="mt-1 h-10 w-10 bg-foreground rounded-sm" title="DataMatrix placeholder" />
                  </div>
                ))}
              </div>
              {createdLote.unidades.length > 6 && (
                <p className="text-xs text-muted-foreground text-center">
                  ...y {createdLote.unidades.length - 6} etiquetas mas
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPaso(0)}
                  className="flex-1 bg-transparent text-foreground border-border"
                >
                  Atras
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 - Confirmation */}
          {paso === 2 && createdLote && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
                <Check className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground text-center">
                Lote listo para imprimir
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Se generaron {createdLote.cantidad} etiquetas para{" "}
                {selectedMed?.nombre} {selectedMed?.concentracion}
              </p>
              <div className="rounded-lg border border-border bg-card p-4 w-full">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Lote</p>
                    <p className="font-medium text-foreground">{createdLote.lote}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimiento</p>
                    <p className="font-medium text-foreground">{createdLote.vencimiento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <StatusBadge status={createdLote.estado} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cantidad</p>
                    <p className="font-medium text-foreground">{createdLote.cantidad}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 bg-transparent text-foreground border-border"
                >
                  Volver a lotes
                </Button>
                <Button
                  onClick={handleMarcarImpreso}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Marcar impreso
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppHeader titulo="Etiquetas">
        <Button onClick={handleCrear} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Crear lote
        </Button>
      </AppHeader>
      <div className="px-4 py-3 flex flex-col gap-3 max-w-lg mx-auto w-full">
        {lotes.length === 0 ? (
          <EmptyState
            icon={Tag}
            titulo="Todavia no hay lotes"
            descripcion="Crea tu primer lote de etiquetas unitarias"
          >
            <Button onClick={handleCrear} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" />
              Crear lote
            </Button>
          </EmptyState>
        ) : (
          lotes.map((l) => {
            const med = getMedicamento(l.medicamentoId);
            return (
              <button
                key={l.id}
                onClick={() => {
                  setDetalleLote(l);
                  setView("detalle");
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">
                    {med ? `${med.nombre} ${med.concentracion}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Lote: {l.lote} | Vto: {l.vencimiento} | {l.cantidad} uds
                  </p>
                </div>
                <StatusBadge status={l.estado} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
