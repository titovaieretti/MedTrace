// MedTrace - Estado global con SWR

import useSWR, { mutate } from "swr";
import {
  medicamentosMock,
  pacientesMock,
  ubicacionesMock,
  lotesMock,
  pedidosMock,
  alertasMock,
} from "./mock-data";
import type {
  Medicamento,
  LoteEtiquetas,
  Pedido,
  Alerta,
  EventoCustodia,
  UnidadEtiqueta,
  TipoEventoCustodia,
  Paciente,
  Ubicacion,
} from "./types";

// Mutable in-memory store
let _medicamentos = [...medicamentosMock];
let _lotes = [...lotesMock];
let _pedidos = [...pedidosMock];
let _alertas = [...alertasMock];
let _pacientes = [...pacientesMock];
let _ubicaciones = [...ubicacionesMock];
let _offlineMode = false;
let _offlineQueue: EventoCustodia[] = [];
let _unitCounter = 30;

// SWR fetchers (return from in-memory)
const fetchers: Record<string, () => unknown> = {
  medicamentos: () => _medicamentos,
  lotes: () => _lotes,
  pedidos: () => _pedidos,
  alertas: () => _alertas,
  pacientes: () => _pacientes,
  ubicaciones: () => _ubicaciones,
  offlineMode: () => _offlineMode,
  offlineQueue: () => _offlineQueue,
};

function fetcher(key: string) {
  return fetchers[key]?.() ?? null;
}

// Hooks
export function useMedicamentos() {
  const { data } = useSWR<Medicamento[]>("medicamentos", fetcher, {
    fallbackData: _medicamentos,
  });
  return data ?? [];
}

export function useLotes() {
  const { data } = useSWR<LoteEtiquetas[]>("lotes", fetcher, {
    fallbackData: _lotes,
  });
  return data ?? [];
}

export function usePedidos() {
  const { data } = useSWR<Pedido[]>("pedidos", fetcher, {
    fallbackData: _pedidos,
  });
  return data ?? [];
}

export function useAlertas() {
  const { data } = useSWR<Alerta[]>("alertas", fetcher, {
    fallbackData: _alertas,
  });
  return data ?? [];
}

export function usePacientes() {
  const { data } = useSWR<Paciente[]>("pacientes", fetcher, {
    fallbackData: _pacientes,
  });
  return data ?? [];
}

export function useUbicaciones() {
  const { data } = useSWR<Ubicacion[]>("ubicaciones", fetcher, {
    fallbackData: _ubicaciones,
  });
  return data ?? [];
}

export function useOfflineMode() {
  const { data } = useSWR<boolean>("offlineMode", fetcher, {
    fallbackData: _offlineMode,
  });
  return data ?? false;
}

export function useOfflineQueue() {
  const { data } = useSWR<EventoCustodia[]>("offlineQueue", fetcher, {
    fallbackData: _offlineQueue,
  });
  return data ?? [];
}

// Helpers
export function getAllUnidades(): UnidadEtiqueta[] {
  return _lotes.flatMap((l) => l.unidades);
}

export function findUnidad(idUnitario: string): UnidadEtiqueta | undefined {
  return getAllUnidades().find((u) => u.idUnitario === idUnitario);
}

export function getMedicamento(id: string): Medicamento | undefined {
  return _medicamentos.find((m) => m.id === id);
}

export function getPaciente(id: string): Paciente | undefined {
  return _pacientes.find((p) => p.id === id);
}

// Mutations
export function addMedicamento(med: Omit<Medicamento, "id">) {
  // TODO: llamar a API POST /api/medicamentos
  const newMed: Medicamento = {
    ...med,
    id: `med-${String(_medicamentos.length + 1).padStart(3, "0")}`,
  };
  _medicamentos = [..._medicamentos, newMed];
  mutate("medicamentos");
  return newMed;
}

export function updateMedicamento(id: string, data: Partial<Medicamento>) {
  // TODO: llamar a API PUT /api/medicamentos/:id
  _medicamentos = _medicamentos.map((m) =>
    m.id === id ? { ...m, ...data } : m
  );
  mutate("medicamentos");
}

export function toggleMedicamentoEstado(id: string) {
  // TODO: llamar a API PATCH /api/medicamentos/:id/estado
  _medicamentos = _medicamentos.map((m) =>
    m.id === id
      ? { ...m, estado: m.estado === "activo" ? "inactivo" : "activo" }
      : m
  );
  mutate("medicamentos");
}

export function createLote(
  medicamentoId: string,
  lote: string,
  vencimiento: string,
  cantidad: number
): LoteEtiquetas {
  // TODO: llamar a API POST /api/lotes
  const unidades: UnidadEtiqueta[] = Array.from(
    { length: cantidad },
    (_, i) => {
      _unitCounter++;
      return {
        idUnitario: `U-2026-${String(_unitCounter).padStart(6, "0")}`,
        medicamentoId,
        lote,
        vencimiento,
        estadoActual: "unitarizada" as const,
        eventos: [
          {
            id: `ev-auto-${_unitCounter}`,
            tipo: "unitarizada" as const,
            fechaHora: new Date().toISOString(),
            ubicacion: "Farmacia Central",
            actor: "Sistema",
            rol: "Sistema",
            notas: "Generado automaticamente",
          },
        ],
      };
    }
  );

  const newLote: LoteEtiquetas = {
    id: `lot-${String(_lotes.length + 1).padStart(3, "0")}`,
    medicamentoId,
    lote,
    vencimiento,
    cantidad,
    fechaCreacion: new Date().toISOString().split("T")[0],
    estado: "borrador",
    unidades,
  };
  _lotes = [..._lotes, newLote];
  mutate("lotes");
  return newLote;
}

export function markLoteImpreso(id: string) {
  // TODO: llamar a API PATCH /api/lotes/:id/imprimir
  _lotes = _lotes.map((l) =>
    l.id === id ? { ...l, estado: "impreso" as const } : l
  );
  mutate("lotes");
}

export function createPedido(pedido: Omit<Pedido, "id" | "historial" | "unidadesEscaneadas">): Pedido {
  // TODO: llamar a API POST /api/pedidos
  const newPedido: Pedido = {
    ...pedido,
    id: `ped-${String(_pedidos.length + 1).padStart(3, "0")}`,
    unidadesEscaneadas: [],
    historial: [
      {
        id: `hp-auto-${Date.now()}`,
        timestamp: new Date().toISOString(),
        usuario: "Farm. Lopez",
        rol: "Farmaceutico",
        accion: pedido.estado === "borrador" ? "Pedido creado como borrador" : "Pedido creado",
      },
    ],
  };
  _pedidos = [..._pedidos, newPedido];
  mutate("pedidos");
  return newPedido;
}

export function updatePedidoEstado(id: string, estado: Pedido["estado"]) {
  // TODO: llamar a API PATCH /api/pedidos/:id/estado
  const estadoLabels: Record<string, string> = {
    en_preparacion: "Enviado a preparacion",
    entregado: "Marcado como entregado",
  };
  _pedidos = _pedidos.map((p) =>
    p.id === id
      ? {
          ...p,
          estado,
          historial: [
            ...p.historial,
            {
              id: `hp-${Date.now()}`,
              timestamp: new Date().toISOString(),
              usuario: "Farm. Lopez",
              rol: "Farmaceutico",
              accion: estadoLabels[estado] ?? `Estado cambiado a ${estado}`,
            },
          ],
        }
      : p
  );
  mutate("pedidos");
}

export function escanearUnidadPedido(
  pedidoId: string,
  unidadId: string
): { ok: boolean; error?: string } {
  // TODO: llamar a API POST /api/pedidos/:id/escanear
  const pedido = _pedidos.find((p) => p.id === pedidoId);
  if (!pedido) return { ok: false, error: "Pedido no encontrado" };

  if (pedido.unidadesEscaneadas.includes(unidadId)) {
    return { ok: false, error: "Unidad ya escaneada" };
  }

  const unidad = findUnidad(unidadId);
  if (!unidad) return { ok: false, error: "Unidad no encontrada" };

  if (
    unidad.pacienteAsignado &&
    unidad.pacienteAsignado !== pedido.pacienteId
  ) {
    return { ok: false, error: "Unidad asignada a otro paciente" };
  }

  const itemMatch = pedido.items.find(
    (item) => item.medicamentoId === unidad.medicamentoId && !item.unidadAsignada
  );
  if (!itemMatch) {
    return {
      ok: false,
      error: "Medicamento no coincide con lo esperado en el pedido",
    };
  }

  _pedidos = _pedidos.map((p) =>
    p.id === pedidoId
      ? {
          ...p,
          unidadesEscaneadas: [...p.unidadesEscaneadas, unidadId],
          items: p.items.map((item) =>
            item.id === itemMatch.id
              ? { ...item, unidadAsignada: unidadId }
              : item
          ),
          historial: [
            ...p.historial,
            {
              id: `hp-${Date.now()}`,
              timestamp: new Date().toISOString(),
              usuario: "Tec. Ramirez",
              rol: "Tecnico",
              accion: `Unidad ${unidadId} escaneada y asignada`,
            },
          ],
        }
      : p
  );
  mutate("pedidos");
  return { ok: true };
}

export function registrarEventoCustodia(
  unidadId: string,
  tipo: TipoEventoCustodia,
  ubicacion: string,
  notas: string
): { ok: boolean; error?: string } {
  // TODO: llamar a API POST /api/custodia/eventos
  const evento: EventoCustodia = {
    id: `ev-${Date.now()}`,
    tipo,
    fechaHora: new Date().toISOString(),
    ubicacion,
    actor: "Farm. Lopez",
    rol: "Farmaceutico",
    notas,
    pendienteSincronizacion: _offlineMode,
  };

  if (_offlineMode) {
    _offlineQueue = [..._offlineQueue, evento];
    mutate("offlineQueue");
  }

  let found = false;
  _lotes = _lotes.map((l) => ({
    ...l,
    unidades: l.unidades.map((u) => {
      if (u.idUnitario === unidadId) {
        found = true;
        return {
          ...u,
          estadoActual: tipo,
          eventos: [...u.eventos, evento],
        };
      }
      return u;
    }),
  }));

  if (!found) return { ok: false, error: "Unidad no encontrada" };

  mutate("lotes");
  return { ok: true };
}

export function toggleOfflineMode() {
  _offlineMode = !_offlineMode;
  mutate("offlineMode");
}

export function syncOfflineQueue() {
  // TODO: llamar a API POST /api/custodia/sync
  _offlineQueue = [];
  mutate("offlineQueue");
}

// KPI helpers
export function getKPIs() {
  const allUnidades = getAllUnidades();
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return {
    etiquetadasHoy: allUnidades.filter((u) =>
      u.eventos.some(
        (e) => e.tipo === "unitarizada" && e.fechaHora.startsWith(today)
      )
    ).length || 12,
    asignadas: allUnidades.filter((u) => u.estadoActual === "asignada").length,
    entregadas: allUnidades.filter((u) => u.estadoActual === "entregada_a_sala")
      .length,
    devueltas: allUnidades.filter((u) => u.estadoActual === "devuelta").length,
    descartadas: allUnidades.filter((u) => u.estadoActual === "descartada")
      .length,
    proximasVencer: _lotes.filter((l) => l.vencimiento <= sevenDaysFromNow)
      .length,
  };
}
