"use client";

import { useState } from "react";
import {
  Plus,
  ClipboardList,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Truck,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../app-header";
import { StatusBadge } from "../status-badge";
import { EmptyState } from "../empty-state";
import { ScanInput } from "../scan-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePedidos,
  usePacientes,
  useMedicamentos,
  createPedido,
  createPaciente,
  updatePedidoEstado,
  escanearUnidadPedido,
  getMedicamento,
  getPaciente,
  lookupHistoriaClinicaCentralizada,
} from "@/lib/store";
import type {
  HistoriaClinica,
  HistoriaClinicaCentralizada,
  Pedido,
} from "@/lib/types";

type ViewMode = "lista" | "crear" | "detalle";

export function PedidosScreen({ autoCreate }: { autoCreate?: boolean }) {
  const pedidos = usePedidos();
  const pacientes = usePacientes();
  const medicamentos = useMedicamentos();
  const [view, setView] = useState<ViewMode>(autoCreate ? "crear" : "lista");
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);

  // Create form
  const [patientMode, setPatientMode] = useState<"existente" | "nuevo">("existente");
  const [pacienteId, setPacienteId] = useState("");
  const [newPatient, setNewPatient] = useState({
    nombre: "",
    mrn: "",
    sala: "",
    cama: "",
  });
  const [historyMode, setHistoryMode] = useState<"local" | "centralizada">("local");
  const [historyForm, setHistoryForm] = useState({
    motivoIngreso: "",
    diagnosticoPrincipal: "",
    alergias: "",
    medicacionCronica: "",
    antecedentes: "",
    notas: "",
  });
  const [centralizedPreview, setCentralizedPreview] = useState<HistoriaClinicaCentralizada | null>(null);
  const [loadingCentralizedHistory, setLoadingCentralizedHistory] = useState(false);
  const [items, setItems] = useState<
    { medicamentoId: string; dosis: string; ventana: string; notas: string }[]
  >([{ medicamentoId: "", dosis: "", ventana: "08:00 - 20:00", notas: "" }]);

  function resetForm() {
    setPatientMode("existente");
    setPacienteId("");
    setNewPatient({ nombre: "", mrn: "", sala: "", cama: "" });
    setHistoryMode("local");
    setHistoryForm({
      motivoIngreso: "",
      diagnosticoPrincipal: "",
      alergias: "",
      medicacionCronica: "",
      antecedentes: "",
      notas: "",
    });
    setCentralizedPreview(null);
    setItems([{ medicamentoId: "", dosis: "", ventana: "08:00 - 20:00", notas: "" }]);
  }

  function handleBack() {
    resetForm();
    setView("lista");
    setDetallePedido(null);
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { medicamentoId: "", dosis: "", ventana: "08:00 - 20:00", notas: "" },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function updateNewPatient(field: keyof typeof newPatient, value: string) {
    setNewPatient((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "mrn" && historyMode === "centralizada") {
        setCentralizedPreview(null);
      }
      return next;
    });
  }

  function updateHistoryField(field: keyof typeof historyForm, value: string) {
    setHistoryForm((prev) => ({ ...prev, [field]: value }));
  }

  function applyHistory(history: Pick<
    HistoriaClinica,
    | "motivoIngreso"
    | "diagnosticoPrincipal"
    | "alergias"
    | "medicacionCronica"
    | "antecedentes"
    | "notas"
  >) {
    setHistoryForm({
      motivoIngreso: history.motivoIngreso,
      diagnosticoPrincipal: history.diagnosticoPrincipal,
      alergias: history.alergias,
      medicacionCronica: history.medicacionCronica,
      antecedentes: history.antecedentes,
      notas: history.notas,
    });
  }

  async function handleImportCentralizedHistory() {
    if (!newPatient.mrn.trim()) {
      toast.error("Ingresa el MRN del paciente para importar la historia clinica");
      return;
    }

    setLoadingCentralizedHistory(true);
    try {
      const history = await lookupHistoriaClinicaCentralizada(newPatient.mrn.trim());
      setCentralizedPreview(history);
      applyHistory(history);
      toast.success("Historia clinica centralizada importada");
    } catch (error) {
      setCentralizedPreview(null);
      toast.error(error instanceof Error ? error.message : "No se pudo importar la historia clinica");
    } finally {
      setLoadingCentralizedHistory(false);
    }
  }

  async function resolvePacienteId(): Promise<string> {
    if (patientMode === "existente") {
      if (!pacienteId) {
        throw new Error("Selecciona un paciente");
      }
      return pacienteId;
    }

    if (!newPatient.nombre.trim() || !newPatient.mrn.trim() || !newPatient.sala.trim() || !newPatient.cama.trim()) {
      throw new Error("Completa los datos del nuevo paciente");
    }

    if (historyMode === "centralizada" && !centralizedPreview) {
      throw new Error("Importa la historia clinica centralizada antes de continuar");
    }

    if (
      historyMode === "local" &&
      !historyForm.motivoIngreso.trim() &&
      !historyForm.diagnosticoPrincipal.trim() &&
      !historyForm.notas.trim()
    ) {
      throw new Error("Carga al menos el motivo de ingreso, el diagnostico o una nota clinica");
    }

    const createdPatient = await createPaciente({
      nombre: newPatient.nombre.trim(),
      mrn: newPatient.mrn.trim(),
      sala: newPatient.sala.trim(),
      cama: newPatient.cama.trim(),
      historiaClinica: {
        source: historyMode,
        sourceLabel:
          historyMode === "centralizada"
            ? centralizedPreview?.sourceLabel
            : "Generada en MedTrace",
        sourceReference:
          historyMode === "centralizada"
            ? centralizedPreview?.sourceReference
            : undefined,
        motivoIngreso: historyForm.motivoIngreso,
        diagnosticoPrincipal: historyForm.diagnosticoPrincipal,
        alergias: historyForm.alergias,
        medicacionCronica: historyForm.medicacionCronica,
        antecedentes: historyForm.antecedentes,
        notas: historyForm.notas,
      },
    });

    return createdPatient.id;
  }

  async function handleGuardarBorrador() {
    if (items.some((it) => !it.medicamentoId)) {
      toast.error("Selecciona un medicamento para cada item");
      return;
    }
    try {
      const resolvedPacienteId = await resolvePacienteId();
      const newPedido = await createPedido({
        pacienteId: resolvedPacienteId,
        fecha: new Date().toISOString().split("T")[0],
        estado: "borrador",
        items: items.map((it, i) => ({
          id: `item-new-${Date.now()}-${i}`,
          medicamentoId: it.medicamentoId,
          dosis: it.dosis,
          ventanaHoraria: it.ventana,
          notas: it.notas,
        })),
      });
      toast.success("Pedido guardado como borrador");
      setDetallePedido(newPedido);
      setView("detalle");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear");
    }
  }

  async function handleEnviarPreparacion() {
    if (items.some((it) => !it.medicamentoId)) {
      toast.error("Selecciona un medicamento para cada item");
      return;
    }
    try {
      const resolvedPacienteId = await resolvePacienteId();
      const newPedido = await createPedido({
        pacienteId: resolvedPacienteId,
        fecha: new Date().toISOString().split("T")[0],
        estado: "en_preparacion",
        items: items.map((it, i) => ({
          id: `item-new-${Date.now()}-${i}`,
          medicamentoId: it.medicamentoId,
          dosis: it.dosis,
          ventanaHoraria: it.ventana,
          notas: it.notas,
        })),
      });
      toast.success("Pedido enviado a preparacion");
      setDetallePedido(newPedido);
      setView("detalle");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear");
    }
  }

  async function handleScan(pedidoId: string, unidadId: string) {
    const result = await escanearUnidadPedido(pedidoId, unidadId);
    if (result.ok) {
      toast.success(`Unidad ${unidadId} escaneada correctamente`);
      // Refresh detail
      const updated = pedidos.find((p) => p.id === pedidoId);
      if (updated) setDetallePedido({ ...updated });
    } else {
      toast.error(result.error ?? "Error al escanear");
    }
  }

  function renderHistoriaClinica(historiaClinica?: HistoriaClinica) {
    if (!historiaClinica) {
      return (
        <div className="rounded-lg border border-dashed border-border bg-card p-3">
          <p className="text-sm text-muted-foreground">
            El paciente no tiene una historia clinica cargada en MedTrace.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-card-foreground">Historia clinica</h3>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {historiaClinica.source === "centralizada" ? "API centralizada" : "Generada en MedTrace"}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Origen:</span>{" "}
            {historiaClinica.sourceLabel}
          </p>
          {historiaClinica.sourceReference && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Referencia:</span>{" "}
              {historiaClinica.sourceReference}
            </p>
          )}
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Motivo de ingreso:</span>{" "}
            {historiaClinica.motivoIngreso || "Sin datos"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Diagnostico principal:</span>{" "}
            {historiaClinica.diagnosticoPrincipal || "Sin datos"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Alergias:</span>{" "}
            {historiaClinica.alergias || "Sin datos"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Medicacion cronica:</span>{" "}
            {historiaClinica.medicacionCronica || "Sin datos"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Antecedentes:</span>{" "}
            {historiaClinica.antecedentes || "Sin datos"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Notas:</span>{" "}
            {historiaClinica.notas || "Sin datos"}
          </p>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  if (view === "detalle" && detallePedido) {
    // Re-fetch from store for fresh data
    const freshPedido = pedidos.find((p) => p.id === detallePedido.id) ?? detallePedido;
    const paciente = getPaciente(freshPedido.pacienteId);

    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo={`Pedido ${freshPedido.id}`}>
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-3 max-w-lg mx-auto w-full flex flex-col gap-4">
          {/* Patient card */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-card-foreground">Datos del paciente</h3>
              <StatusBadge status={freshPedido.estado} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium text-foreground">{paciente?.nombre ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MRN</p>
                <p className="font-medium text-foreground">{paciente?.mrn ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sala</p>
                <p className="font-medium text-foreground">{paciente?.sala ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cama</p>
                <p className="font-medium text-foreground">{paciente?.cama ?? "—"}</p>
              </div>
            </div>
          </div>

          {renderHistoriaClinica(paciente?.historiaClinica)}

          <Tabs defaultValue="items">
            <TabsList className="w-full">
              <TabsTrigger value="items" className="flex-1">
                Items
              </TabsTrigger>
              <TabsTrigger value="preparacion" className="flex-1">
                Preparacion
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex-1">
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items">
              <div className="flex flex-col gap-2 mt-2">
                {freshPedido.items.map((item) => {
                  const med = getMedicamento(item.medicamentoId);
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-card-foreground">
                            {med ? `${med.nombre} ${med.concentracion}` : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Dosis: {item.dosis} | Horario: {item.ventanaHoraria}
                          </p>
                          {item.notas && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Nota: {item.notas}
                            </p>
                          )}
                        </div>
                        {item.unidadAsignada && (
                          <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
                            {item.unidadAsignada}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="preparacion">
              <div className="flex flex-col gap-3 mt-2">
                {/* Expected items */}
                <div className="rounded-lg border border-border bg-card p-3">
                  <h4 className="text-sm font-semibold text-card-foreground mb-2">
                    Items esperados
                  </h4>
                  {freshPedido.items.map((item) => {
                    const med = getMedicamento(item.medicamentoId);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-foreground">
                          {med?.nombre} {med?.concentracion}
                        </span>
                        {item.unidadAsignada ? (
                          <span className="text-xs text-accent font-medium">
                            {item.unidadAsignada}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sin asignar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Scan section */}
                {freshPedido.estado !== "entregado" && (
                  <div className="rounded-lg border border-border bg-card p-3">
                    <h4 className="text-sm font-semibold text-card-foreground mb-2">
                      Escanear unidad
                    </h4>
                    <ScanInput
                      placeholder="Escanear ID unitario..."
                      onScan={(v) => handleScan(freshPedido.id, v)}
                    />
                  </div>
                )}

                {/* Scanned units */}
                {freshPedido.unidadesEscaneadas.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-3">
                    <h4 className="text-sm font-semibold text-card-foreground mb-2">
                      Unidades escaneadas ({freshPedido.unidadesEscaneadas.length})
                    </h4>
                    {freshPedido.unidadesEscaneadas.map((uid) => (
                      <div
                        key={uid}
                        className="flex items-center gap-2 py-1 border-b border-border last:border-0"
                      >
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                        <span className="text-sm text-foreground font-mono">{uid}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {freshPedido.estado === "en_preparacion" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await updatePedidoEstado(freshPedido.id, "entregado");
                          toast.success("Pedido marcado como entregado");
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "No se pudo actualizar el pedido"
                          );
                        }
                      }}
                      className="flex-1 bg-transparent text-foreground border-border"
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Entregado
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await updatePedidoEstado(freshPedido.id, "entregado");
                          toast.success("Preparacion completada");
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "No se pudo actualizar el pedido"
                          );
                        }
                      }}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completar
                    </Button>
                  </div>
                )}
                {freshPedido.estado === "borrador" && (
                  <Button
                    onClick={async () => {
                      try {
                        await updatePedidoEstado(freshPedido.id, "en_preparacion");
                        toast.success("Pedido enviado a preparacion");
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "No se pudo actualizar el pedido"
                        );
                      }
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Enviar a preparacion
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="historial">
              <div className="flex flex-col gap-2 mt-2">
                {freshPedido.historial.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin historial
                  </p>
                ) : (
                  [...freshPedido.historial].reverse().map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <p className="text-sm font-medium text-card-foreground">
                        {ev.accion}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ev.timestamp).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        &middot; {ev.usuario} ({ev.rol})
                      </p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // CREATE VIEW
  if (view === "crear") {
    const selectedPatient = pacienteId ? getPaciente(pacienteId) : undefined;

    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo="Crear pedido 24h">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
          {/* Patient */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-card-foreground mb-3">Datos del paciente</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                type="button"
                variant={patientMode === "existente" ? "default" : "outline"}
                onClick={() => setPatientMode("existente")}
                className={patientMode === "existente" ? "" : "bg-transparent"}
              >
                Paciente existente
              </Button>
              <Button
                type="button"
                variant={patientMode === "nuevo" ? "default" : "outline"}
                onClick={() => setPatientMode("nuevo")}
                className={patientMode === "nuevo" ? "" : "bg-transparent"}
              >
                Nuevo paciente
              </Button>
            </div>

            {patientMode === "existente" ? (
              <div className="space-y-3">
                <Select value={pacienteId} onValueChange={setPacienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} - {p.mrn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPatient ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Sala</p>
                        <p className="font-medium text-foreground">{selectedPatient.sala}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cama</p>
                        <p className="font-medium text-foreground">{selectedPatient.cama}</p>
                      </div>
                    </div>
                    {renderHistoriaClinica(selectedPatient.historiaClinica)}
                  </>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    value={newPatient.nombre}
                    onChange={(e) => updateNewPatient("nombre", e.target.value)}
                    placeholder="Nombre y apellido"
                  />
                  <Input
                    value={newPatient.mrn}
                    onChange={(e) => updateNewPatient("mrn", e.target.value)}
                    placeholder="MRN / Nro. historia clinica"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={newPatient.sala}
                      onChange={(e) => updateNewPatient("sala", e.target.value)}
                      placeholder="Sala"
                    />
                    <Input
                      value={newPatient.cama}
                      onChange={(e) => updateNewPatient("cama", e.target.value)}
                      placeholder="Cama"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <h4 className="font-medium text-foreground mb-3">Carga de historia clinica</h4>
                  <RadioGroup
                    value={historyMode}
                    onValueChange={(value) => setHistoryMode(value as "local" | "centralizada")}
                    className="gap-3"
                  >
                    <label className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer">
                      <RadioGroupItem value="local" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Generar en MedTrace</p>
                        <p className="text-xs text-muted-foreground">
                          El equipo completa la historia clinica desde este sistema.
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer">
                      <RadioGroupItem value="centralizada" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Importar por API</p>
                        <p className="text-xs text-muted-foreground">
                          Busca la historia clinica en el repositorio central usando el MRN.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>

                  {historyMode === "centralizada" && (
                    <div className="mt-3 space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImportCentralizedHistory}
                        disabled={loadingCentralizedHistory}
                        className="w-full bg-transparent"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {loadingCentralizedHistory ? "Consultando API centralizada..." : "Importar historia centralizada"}
                      </Button>
                      {centralizedPreview && (
                        <div className="rounded-md bg-primary/5 p-3 text-xs text-muted-foreground">
                          Importada desde {centralizedPreview.sourceLabel} con referencia{" "}
                          {centralizedPreview.sourceReference}.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <Textarea
                      value={historyForm.motivoIngreso}
                      onChange={(e) => updateHistoryField("motivoIngreso", e.target.value)}
                      placeholder="Motivo de ingreso"
                    />
                    <Textarea
                      value={historyForm.diagnosticoPrincipal}
                      onChange={(e) => updateHistoryField("diagnosticoPrincipal", e.target.value)}
                      placeholder="Diagnostico principal"
                    />
                    <Textarea
                      value={historyForm.alergias}
                      onChange={(e) => updateHistoryField("alergias", e.target.value)}
                      placeholder="Alergias"
                    />
                    <Textarea
                      value={historyForm.medicacionCronica}
                      onChange={(e) => updateHistoryField("medicacionCronica", e.target.value)}
                      placeholder="Medicacion cronica"
                    />
                    <Textarea
                      value={historyForm.antecedentes}
                      onChange={(e) => updateHistoryField("antecedentes", e.target.value)}
                      placeholder="Antecedentes"
                    />
                    <Textarea
                      value={historyForm.notas}
                      onChange={(e) => updateHistoryField("notas", e.target.value)}
                      placeholder="Notas clinicas"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Items del pedido</h3>
            {items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Item {idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <Select
                  value={item.medicamentoId}
                  onValueChange={(v) => updateItem(idx, "medicamentoId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar medicamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {medicamentos
                      .filter((m) => m.estado === "activo")
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nombre} {m.concentracion}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  value={item.dosis}
                  onChange={(e) => updateItem(idx, "dosis", e.target.value)}
                  placeholder="Dosis (ej: 1 comprimido)"
                />
                <Input
                  value={item.ventana}
                  onChange={(e) => updateItem(idx, "ventana", e.target.value)}
                  placeholder="Ventana horaria (ej: 08:00 - 20:00)"
                />
                <Input
                  value={item.notas}
                  onChange={(e) => updateItem(idx, "notas", e.target.value)}
                  placeholder="Notas (opcional)"
                />
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addItem}
              className="bg-transparent text-foreground border-border"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar item
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGuardarBorrador}
              className="flex-1 bg-transparent text-foreground border-border"
            >
              Guardar borrador
            </Button>
            <Button
              onClick={handleEnviarPreparacion}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Enviar a preparacion
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppHeader titulo="Pedidos">
        <Button
          onClick={() => {
            resetForm();
            setView("crear");
          }}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Crear pedido
        </Button>
      </AppHeader>
      <div className="px-4 py-3 flex flex-col gap-2 max-w-lg mx-auto w-full">
        {pedidos.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            titulo="No hay pedidos"
            descripcion="Crea tu primer pedido de 24h para un paciente"
          >
            <Button
              onClick={() => {
                resetForm();
                setView("crear");
              }}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Crear pedido
            </Button>
          </EmptyState>
        ) : (
          pedidos.map((p) => {
            const paciente = getPaciente(p.pacienteId);
            return (
              <button
                key={p.id}
                onClick={() => {
                  setDetallePedido(p);
                  setView("detalle");
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">
                    {paciente?.nombre ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {paciente?.mrn} | {paciente?.sala} - {paciente?.cama} |{" "}
                    {p.items.length} items
                  </p>
                  <p className="text-xs text-muted-foreground">{p.fecha}</p>
                </div>
                <StatusBadge status={p.estado} />
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
