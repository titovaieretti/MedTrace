"use client";

import { useState } from "react";
import {
  BarChart3,
  Clock,
  Undo2,
  Download,
  MapPin,
  Shield,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../app-header";
import { EmptyState } from "../empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useUbicaciones,
  getAllUnidades,
  useLotes,
  useOfflineMode,
  useOfflineQueue,
  toggleOfflineMode,
  syncOfflineQueue,
} from "@/lib/store";
import { TrazabilidadScreen } from "./trazabilidad-screen";
import type { Ubicacion } from "@/lib/types";

type SubView = "menu" | "reportes" | "ubicaciones" | "roles" | "perfil" | "trazabilidad";

export function MasScreen() {
  const [subView, setSubView] = useState<SubView>("menu");
  const ubicaciones = useUbicaciones();
  const lotes = useLotes();
  const offline = useOfflineMode();
  const queue = useOfflineQueue();
  const [addUbiDialog, setAddUbiDialog] = useState(false);
  const [newUbiNombre, setNewUbiNombre] = useState("");
  const [newUbiTipo, setNewUbiTipo] = useState<Ubicacion["tipo"]>("sala");

  if (subView === "trazabilidad") {
    return (
      <div>
        <div className="px-4 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubView("menu")}
            className="text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Mas
          </Button>
        </div>
        <TrazabilidadScreen />
      </div>
    );
  }

  if (subView === "reportes") {
    const allUnidades = getAllUnidades();
    const byEstado = {
      unitarizada: allUnidades.filter((u) => u.estadoActual === "unitarizada").length,
      asignada: allUnidades.filter((u) => u.estadoActual === "asignada").length,
      entregada_a_sala: allUnidades.filter((u) => u.estadoActual === "entregada_a_sala").length,
      devuelta: allUnidades.filter((u) => u.estadoActual === "devuelta").length,
      descartada: allUnidades.filter((u) => u.estadoActual === "descartada").length,
    };
    const proximasVencer = lotes.filter(
      (l) => l.vencimiento <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );

    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo="Reportes">
          <Button variant="ghost" size="sm" onClick={() => setSubView("menu")} className="text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
          {/* By status */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-card-foreground mb-3">Unidades por estado</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(byEstado).map(([estado, count]) => (
                <div key={estado} className="flex items-center justify-between">
                  <span className="text-sm text-foreground capitalize">{estado.replace(/_/g, " ")}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-card-foreground mb-3">Proximas a vencer (7 dias)</h3>
            {proximasVencer.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay lotes por vencer</p>
            ) : (
              proximasVencer.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-foreground">Lote: {l.lote}</span>
                  <span className="text-sm text-warning font-medium">{l.vencimiento}</span>
                </div>
              ))
            )}
          </div>

          {/* Returns & discards */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-card-foreground mb-3">Devoluciones y descartes</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Devueltas</span>
              <span className="text-sm font-bold text-foreground">{byEstado.devuelta}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-foreground">Descartadas</span>
              <span className="text-sm font-bold text-foreground">{byEstado.descartada}</span>
            </div>
          </div>

          {/* Export placeholder */}
          <Button
            variant="outline"
            onClick={() => toast.info("Funcion de exportacion CSV pendiente de implementacion")}
            className="bg-transparent text-foreground border-border"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>
    );
  }

  if (subView === "ubicaciones") {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo="Ubicaciones">
          <Button variant="ghost" size="sm" onClick={() => setSubView("menu")} className="text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-4 flex flex-col gap-3 max-w-lg mx-auto w-full">
          <Button
            onClick={() => setAddUbiDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar ubicacion
          </Button>
          {ubicaciones.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-card-foreground">{u.nombre}</p>
                <p className="text-xs text-muted-foreground capitalize">{u.tipo}</p>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={addUbiDialog} onOpenChange={setAddUbiDialog}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Nueva ubicacion</DialogTitle>
              <DialogDescription>Agrega una nueva ubicacion al sistema</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <Input
                  value={newUbiNombre}
                  onChange={(e) => setNewUbiNombre(e.target.value)}
                  placeholder="Ej: Sala C"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select value={newUbiTipo} onValueChange={(v) => setNewUbiTipo(v as Ubicacion["tipo"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmacia">Farmacia</SelectItem>
                    <SelectItem value="sala">Sala</SelectItem>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="deposito">Deposito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUbiDialog(false)} className="bg-transparent text-foreground border-border">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // TODO: llamar a API POST /api/ubicaciones
                  toast.success("Ubicacion agregada (mock)");
                  setAddUbiDialog(false);
                  setNewUbiNombre("");
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (subView === "roles") {
    const roles = [
      { nombre: "Farmaceutico", permisos: "Acceso total" },
      { nombre: "Tecnico", permisos: "Escaneo, preparacion de pedidos" },
      { nombre: "Enfermero", permisos: "Administracion, devolucion" },
      { nombre: "Auditor", permisos: "Solo lectura, reportes" },
    ];

    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo="Roles y permisos">
          <Button variant="ghost" size="sm" onClick={() => setSubView("menu")} className="text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-4 flex flex-col gap-2 max-w-lg mx-auto w-full">
          {roles.map((r) => (
            <div
              key={r.nombre}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{r.nombre}</p>
                <p className="text-xs text-muted-foreground">{r.permisos}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subView === "perfil") {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <AppHeader titulo="Perfil">
          <Button variant="ghost" size="sm" onClick={() => setSubView("menu")} className="text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </AppHeader>
        <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
              FL
            </div>
            <div>
              <p className="text-base font-semibold text-card-foreground">Farm. Lopez</p>
              <p className="text-sm text-muted-foreground">Farmaceutico</p>
              <p className="text-xs text-muted-foreground">lopez@hospital.com.ar</p>
            </div>
          </div>

          {/* Offline settings */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-card-foreground mb-3">Configuracion offline</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Modo sin conexion</p>
                <p className="text-xs text-muted-foreground">
                  Los eventos se guardan en cola local
                </p>
              </div>
              <button
                onClick={toggleOfflineMode}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  offline ? "bg-warning" : "bg-border"
                }`}
                role="switch"
                aria-checked={offline}
                aria-label="Activar modo offline"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${
                    offline ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {queue.length > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-warning">{queue.length} eventos pendientes</p>
                <Button
                  size="sm"
                  onClick={() => {
                    syncOfflineQueue();
                    toast.success("Cola sincronizada");
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Sincronizar
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => toast.info("Funcion de cierre de sesion pendiente")}
            className="bg-transparent text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesion
          </Button>
        </div>
      </div>
    );
  }

  // MENU VIEW
  const menuItems = [
    {
      icon: Search,
      label: "Trazabilidad",
      desc: "Buscar y rastrear unidades",
      action: () => setSubView("trazabilidad"),
    },
    {
      icon: BarChart3,
      label: "Reportes",
      desc: "Unidades por estado, vencimientos, descartes",
      action: () => setSubView("reportes"),
    },
    {
      icon: MapPin,
      label: "Ubicaciones",
      desc: "Gestionar salas, carros y depositos",
      action: () => setSubView("ubicaciones"),
    },
    {
      icon: Shield,
      label: "Roles y permisos",
      desc: "Ver roles del sistema",
      action: () => setSubView("roles"),
    },
    {
      icon: User,
      label: "Perfil",
      desc: "Datos de usuario y configuracion offline",
      action: () => setSubView("perfil"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppHeader titulo="Mas" />
      <div className="px-4 py-4 flex flex-col gap-2 max-w-lg mx-auto w-full">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
