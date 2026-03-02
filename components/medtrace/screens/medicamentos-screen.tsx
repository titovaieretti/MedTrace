"use client";

import { useState } from "react";
import { Plus, Search, Pill, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../app-header";
import { StatusBadge } from "../status-badge";
import { EmptyState } from "../empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMedicamentos,
  addMedicamento,
  updateMedicamento,
  toggleMedicamentoEstado,
  getMedicamento,
} from "@/lib/store";
import type { Medicamento, FormaFarmaceutica } from "@/lib/types";

const formas: { value: FormaFarmaceutica; label: string }[] = [
  { value: "comprimido", label: "Comprimido" },
  { value: "ampolla", label: "Ampolla" },
  { value: "capsula", label: "Capsula" },
  { value: "jarabe", label: "Jarabe" },
  { value: "crema", label: "Crema" },
  { value: "supositorio", label: "Supositorio" },
  { value: "inyectable", label: "Inyectable" },
  { value: "gotas", label: "Gotas" },
];

interface MedicamentoFormData {
  nombre: string;
  concentracion: string;
  forma: FormaFarmaceutica;
  codigoInterno: string;
  gtin: string;
}

const emptyForm: MedicamentoFormData = {
  nombre: "",
  concentracion: "",
  forma: "comprimido",
  codigoInterno: "",
  gtin: "",
};

export function MedicamentosScreen() {
  const medicamentos = useMedicamentos();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activo" | "inactivo">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MedicamentoFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof MedicamentoFormData, string>>>({});
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const filtered = medicamentos.filter((m) => {
    const matchBusqueda =
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.codigoInterno.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === "todos" || m.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  function openNew() {
    setFormData(emptyForm);
    setEditingId(null);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(med: Medicamento) {
    setFormData({
      nombre: med.nombre,
      concentracion: med.concentracion,
      forma: med.forma,
      codigoInterno: med.codigoInterno,
      gtin: med.gtin ?? "",
    });
    setEditingId(med.id);
    setErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.concentracion.trim())
      newErrors.concentracion = "La concentracion es obligatoria";
    if (!formData.codigoInterno.trim())
      newErrors.codigoInterno = "El codigo interno es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    // TODO: llamar a API correspondiente
    if (editingId) {
      updateMedicamento(editingId, {
        nombre: formData.nombre,
        concentracion: formData.concentracion,
        forma: formData.forma,
        codigoInterno: formData.codigoInterno,
        gtin: formData.gtin || undefined,
      });
      toast.success("Medicamento actualizado correctamente");
    } else {
      addMedicamento({
        nombre: formData.nombre,
        concentracion: formData.concentracion,
        forma: formData.forma,
        codigoInterno: formData.codigoInterno,
        gtin: formData.gtin || undefined,
        estado: "activo",
      });
      toast.success("Medicamento agregado correctamente");
    }
    setDialogOpen(false);
  }

  function handleToggle(id: string) {
    toggleMedicamentoEstado(id);
    const med = getMedicamento(id);
    toast.success(
      med?.estado === "activo"
        ? "Medicamento activado"
        : "Medicamento desactivado"
    );
  }

  const detalleMed = detalleId
    ? medicamentos.find((m) => m.id === detalleId)
    : null;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppHeader titulo="Medicamentos">
        <Button onClick={openNew} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </AppHeader>

      <div className="px-4 py-3 flex flex-col gap-3 max-w-lg mx-auto w-full">
        {/* Search & filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar medicamento..."
              className="pl-9"
            />
          </div>
          <Select
            value={filtroEstado}
            onValueChange={(v) => setFiltroEstado(v as typeof filtroEstado)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="inactivo">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Pill}
            titulo="No se encontraron medicamentos"
            descripcion={
              busqueda
                ? "Intenta con otra busqueda"
                : "Agrega tu primer medicamento"
            }
          >
            {!busqueda && (
              <Button onClick={openNew} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((med) => (
              <button
                key={med.id}
                onClick={() => setDetalleId(med.id)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">
                    {med.nombre} {med.concentracion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {med.codigoInterno} &middot;{" "}
                    {formas.find((f) => f.value === med.forma)?.label ?? med.forma}
                  </p>
                </div>
                <StatusBadge status={med.estado} />
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar medicamento" : "Nuevo medicamento"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Modifica los datos del medicamento"
                : "Completa los datos del medicamento"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Ej: Paracetamol"
              />
              {errors.nombre && (
                <p className="text-xs text-destructive mt-1">{errors.nombre}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Concentracion *</label>
              <Input
                value={formData.concentracion}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, concentracion: e.target.value }))
                }
                placeholder="Ej: 500 mg"
              />
              {errors.concentracion && (
                <p className="text-xs text-destructive mt-1">
                  {errors.concentracion}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Forma farmaceutica</label>
              <Select
                value={formData.forma}
                onValueChange={(v) =>
                  setFormData((f) => ({
                    ...f,
                    forma: v as FormaFarmaceutica,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formas.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Codigo interno *</label>
              <Input
                value={formData.codigoInterno}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, codigoInterno: e.target.value }))
                }
                placeholder="Ej: PAR500"
              />
              {errors.codigoInterno && (
                <p className="text-xs text-destructive mt-1">
                  {errors.codigoInterno}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                GTIN <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Input
                value={formData.gtin}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, gtin: e.target.value }))
                }
                placeholder="Ej: 7790001000010"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="bg-transparent text-foreground border-border"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editingId ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detalleId} onOpenChange={() => setDetalleId(null)}>
        <DialogContent className="max-w-md mx-4">
          {detalleMed && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {detalleMed.nombre} {detalleMed.concentracion}
                </DialogTitle>
                <DialogDescription>Detalle del medicamento</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Forma</p>
                    <p className="text-sm font-medium text-foreground">
                      {formas.find((f) => f.value === detalleMed.forma)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Codigo interno</p>
                    <p className="text-sm font-medium text-foreground">
                      {detalleMed.codigoInterno}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">GTIN</p>
                    <p className="text-sm font-medium text-foreground">
                      {detalleMed.gtin ?? "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <StatusBadge status={detalleMed.estado} />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleToggle(detalleMed.id)}
                  className="flex-1 bg-transparent text-foreground border-border"
                >
                  {detalleMed.estado === "activo" ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  onClick={() => {
                    setDetalleId(null);
                    openEdit(detalleMed);
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
