// MedTrace - Estado global con SWR conectado a FastAPI

import useSWR, { mutate } from "swr";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _authUser: AuthUser | null = null;
let _medicamentos: Medicamento[] = [];
let _lotes: LoteEtiquetas[] = [];
let _pedidos: Pedido[] = [];
let _alertas: Alerta[] = [];
let _pacientes: Paciente[] = [];
let _ubicaciones: Ubicacion[] = [];
let _offlineMode = false;
let _offlineQueue: EventoCustodia[] = [];
let _offlineQueuePayload: {
  id: string;
  unitId: string;
  tipo: TipoEventoCustodia;
  ubicacion: string;
  notas: string;
  fechaHora: string;
}[] = [];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("medtrace_access_token");
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("medtrace_refresh_token");
}

function setStoredTokens(accessToken: string | null, refreshToken: string | null) {
  if (typeof window === "undefined") return;
  if (!accessToken) {
    localStorage.removeItem("medtrace_access_token");
  } else {
    localStorage.setItem("medtrace_access_token", accessToken);
  }
  if (!refreshToken) {
    localStorage.removeItem("medtrace_refresh_token");
  } else {
    localStorage.setItem("medtrace_refresh_token", refreshToken);
  }
}

async function ensureToken(): Promise<string> {
  if (!_accessToken) {
    _accessToken = getStoredAccessToken();
  }
  if (!_refreshToken) {
    _refreshToken = getStoredRefreshToken();
  }
  if (_accessToken) return _accessToken;
  if (_refreshToken) {
    return refreshAccessToken();
  }
  throw new Error("No autenticado");
}

async function refreshAccessToken(): Promise<string> {
  if (!_refreshToken) {
    _refreshToken = getStoredRefreshToken();
  }
  if (!_refreshToken) throw new Error("No autenticado");

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: _refreshToken }),
  });
  if (!response.ok) {
    throw new Error("Sesion expirada");
  }
  const data = await response.json();
  _accessToken = data.access_token;
  _refreshToken = data.refresh_token ?? _refreshToken;
  setStoredTokens(_accessToken, _refreshToken);
  return _accessToken!;
}

function clearSession() {
  _accessToken = null;
  _refreshToken = null;
  _authUser = null;
  setStoredTokens(null, null);
  mutate("authUser", null, false);
}

async function api<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (auth) {
    const token = await ensureToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (auth && response.status === 401) {
    try {
      const token = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    } catch {
      clearSession();
      throw new Error("No autenticado");
    }
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") message = errorData.detail;
    } catch {
      // noop
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function mapMedicamento(raw: any): Medicamento {
  return {
    id: raw.id,
    nombre: raw.nombre,
    concentracion: raw.concentracion,
    forma: raw.forma,
    codigoInterno: raw.codigo_interno,
    gtin: raw.gtin ?? undefined,
    estado: raw.estado,
  };
}

function mapEventoCustodia(raw: any): EventoCustodia {
  return {
    id: raw.id,
    tipo: raw.tipo,
    fechaHora: raw.fecha_hora,
    ubicacion: raw.ubicacion_nombre,
    actor: raw.actor_nombre,
    rol: raw.rol,
    notas: raw.notas ?? "",
    pendienteSincronizacion: raw.pendiente_sincronizacion ?? false,
  };
}

function mapUnidad(raw: any): UnidadEtiqueta {
  return {
    idUnitario: raw.id_unitario,
    medicamentoId: raw.medicamento_id,
    lote: raw.lote,
    vencimiento: raw.vencimiento,
    estadoActual: raw.estado_actual,
    pacienteAsignado: raw.paciente_asignado_id ?? undefined,
    eventos: Array.isArray(raw.eventos) ? raw.eventos.map(mapEventoCustodia) : [],
  };
}

function mapLote(raw: any): LoteEtiquetas {
  return {
    id: raw.id,
    medicamentoId: raw.medicamento_id,
    lote: raw.lote,
    vencimiento: raw.vencimiento,
    cantidad: raw.cantidad,
    fechaCreacion: raw.fecha_creacion,
    estado: raw.estado,
    unidades: Array.isArray(raw.unidades) ? raw.unidades.map(mapUnidad) : [],
  };
}

function mapPedido(raw: any): Pedido {
  return {
    id: raw.id,
    pacienteId: raw.paciente_id,
    fecha: raw.fecha,
    estado: raw.estado,
    items: (raw.items ?? []).map((item: any) => ({
      id: item.id,
      medicamentoId: item.medicamento_id,
      dosis: item.dosis,
      ventanaHoraria: item.ventana_horaria,
      notas: item.notas,
      unidadAsignada: item.unidad_asignada_id ?? undefined,
    })),
    unidadesEscaneadas: raw.unidades_escaneadas ?? [],
    historial: (raw.historial ?? []).map((ev: any) => ({
      id: ev.id,
      timestamp: ev.timestamp,
      usuario: ev.usuario,
      rol: ev.rol,
      accion: ev.accion,
    })),
  };
}

function mapPaciente(raw: any): Paciente {
  return {
    id: raw.id,
    nombre: raw.nombre,
    mrn: raw.mrn,
    sala: raw.sala,
    cama: raw.cama,
  };
}

function mapUbicacion(raw: any): Ubicacion {
  return {
    id: raw.id,
    nombre: raw.nombre,
    tipo: raw.tipo,
  };
}

function mapAlerta(raw: any): Alerta {
  return {
    id: raw.id,
    tipo: raw.tipo,
    mensaje: raw.mensaje,
    fechaHora: raw.fecha_hora,
    unidadId: raw.unidad_id ?? undefined,
  };
}

async function fetchMedicamentos(): Promise<Medicamento[]> {
  const data = await api<any[]>("/medications");
  _medicamentos = data.map(mapMedicamento);
  return _medicamentos;
}

async function fetchAuthUser(): Promise<AuthUser | null> {
  if (!_accessToken) {
    _accessToken = getStoredAccessToken();
  }
  if (!_accessToken) return null;
  const me = await api<any>("/auth/me");
  _authUser = {
    id: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
  };
  return _authUser;
}

async function fetchLotes(): Promise<LoteEtiquetas[]> {
  const data = await api<any[]>("/label-batches");
  _lotes = data.map(mapLote);
  return _lotes;
}

async function fetchPedidos(): Promise<Pedido[]> {
  const data = await api<any[]>("/orders");
  _pedidos = data.map(mapPedido);
  return _pedidos;
}

async function fetchAlertas(): Promise<Alerta[]> {
  const data = await api<any[]>("/alerts");
  _alertas = data.map(mapAlerta);
  return _alertas;
}

async function fetchPacientes(): Promise<Paciente[]> {
  const data = await api<any[]>("/patients");
  _pacientes = data.map(mapPaciente);
  return _pacientes;
}

async function fetchUbicaciones(): Promise<Ubicacion[]> {
  const data = await api<any[]>("/locations");
  _ubicaciones = data.map(mapUbicacion);
  return _ubicaciones;
}

// Hooks
export function useMedicamentos() {
  const { data } = useSWR<Medicamento[]>("medicamentos", fetchMedicamentos, {
    fallbackData: _medicamentos,
  });
  return data ?? [];
}

export function useAuthUser() {
  const { data, isLoading, error } = useSWR<AuthUser | null>("authUser", fetchAuthUser, {
    revalidateOnFocus: false,
  });
  return { user: data ?? null, isLoading, error };
}

export function useLotes() {
  const { data } = useSWR<LoteEtiquetas[]>("lotes", fetchLotes, {
    fallbackData: _lotes,
  });
  return data ?? [];
}

export function usePedidos() {
  const { data } = useSWR<Pedido[]>("pedidos", fetchPedidos, {
    fallbackData: _pedidos,
  });
  return data ?? [];
}

export function useAlertas() {
  const { data } = useSWR<Alerta[]>("alertas", fetchAlertas, {
    fallbackData: _alertas,
  });
  return data ?? [];
}

export function usePacientes() {
  const { data } = useSWR<Paciente[]>("pacientes", fetchPacientes, {
    fallbackData: _pacientes,
  });
  return data ?? [];
}

export function useUbicaciones() {
  const { data } = useSWR<Ubicacion[]>("ubicaciones", fetchUbicaciones, {
    fallbackData: _ubicaciones,
  });
  return data ?? [];
}

export function useOfflineMode() {
  const { data } = useSWR<boolean>("offlineMode", () => _offlineMode, {
    fallbackData: _offlineMode,
  });
  return data ?? false;
}

export function useOfflineQueue() {
  const { data } = useSWR<EventoCustodia[]>("offlineQueue", () => _offlineQueue, {
    fallbackData: _offlineQueue,
  });
  return data ?? [];
}

// Helpers
export function getAllUnidades(): UnidadEtiqueta[] {
  return _lotes.flatMap((l) => l.unidades);
}

export async function findUnidad(idUnitario: string): Promise<UnidadEtiqueta | undefined> {
  try {
    const unidadRaw = await api<any>(`/units/${idUnitario}`);
    return mapUnidad(unidadRaw);
  } catch {
    return undefined;
  }
}

export function getMedicamento(id: string): Medicamento | undefined {
  return _medicamentos.find((m) => m.id === id);
}

export function getPaciente(id: string): Paciente | undefined {
  return _pacientes.find((p) => p.id === id);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await api<any>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false
  );

  _accessToken = response.access_token;
  _refreshToken = response.refresh_token;
  setStoredTokens(_accessToken, _refreshToken);
  _authUser = {
    id: response.user.id,
    name: response.user.name,
    email: response.user.email,
    role: response.user.role,
  };
  await mutate("authUser", _authUser, false);
  return _authUser;
}

export async function logout() {
  clearSession();
  _medicamentos = [];
  _lotes = [];
  _pedidos = [];
  _alertas = [];
  _pacientes = [];
  _ubicaciones = [];
  await Promise.all([
    mutate("medicamentos", [], false),
    mutate("lotes", [], false),
    mutate("pedidos", [], false),
    mutate("alertas", [], false),
    mutate("pacientes", [], false),
    mutate("ubicaciones", [], false),
  ]);
}

// Mutations
export async function addMedicamento(med: Omit<Medicamento, "id">) {
  const created = await api<any>("/medications", {
    method: "POST",
    body: JSON.stringify({
      nombre: med.nombre,
      concentracion: med.concentracion,
      forma: med.forma,
      codigo_interno: med.codigoInterno,
      gtin: med.gtin ?? null,
      estado: med.estado,
    }),
  });
  await mutate("medicamentos");
  return mapMedicamento(created);
}

export async function updateMedicamento(id: string, data: Partial<Medicamento>) {
  const current = getMedicamento(id);
  if (!current) throw new Error("Medicamento no encontrado");

  await api(`/medications/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      nombre: data.nombre ?? current.nombre,
      concentracion: data.concentracion ?? current.concentracion,
      forma: data.forma ?? current.forma,
      codigo_interno: data.codigoInterno ?? current.codigoInterno,
      gtin: data.gtin ?? current.gtin ?? null,
      estado: data.estado ?? current.estado,
    }),
  });
  await mutate("medicamentos");
}

export async function toggleMedicamentoEstado(id: string) {
  const med = getMedicamento(id);
  if (!med) throw new Error("Medicamento no encontrado");
  const nextStatus = med.estado === "activo" ? "inactivo" : "activo";
  await api(`/medications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: nextStatus }),
  });
  await mutate("medicamentos");
}

export async function createLote(
  medicamentoId: string,
  lote: string,
  vencimiento: string,
  cantidad: number
): Promise<LoteEtiquetas> {
  const created = await api<any>("/label-batches", {
    method: "POST",
    body: JSON.stringify({
      medicamento_id: medicamentoId,
      lote,
      vencimiento,
      cantidad,
    }),
  });
  await mutate("lotes");
  return mapLote(created);
}

export async function markLoteImpreso(id: string) {
  await api(`/label-batches/${id}/print`, { method: "PATCH" });
  await mutate("lotes");
}

export async function createPedido(
  pedido: Omit<Pedido, "id" | "historial" | "unidadesEscaneadas">
): Promise<Pedido> {
  const created = await api<any>("/orders", {
    method: "POST",
    body: JSON.stringify({
      paciente_id: pedido.pacienteId,
      fecha: pedido.fecha,
      estado_inicial: pedido.estado,
      items: pedido.items.map((item) => ({
        medicamento_id: item.medicamentoId,
        dosis: item.dosis,
        ventana_horaria: item.ventanaHoraria,
        notas: item.notas,
      })),
    }),
  });
  await mutate("pedidos");
  return mapPedido(created);
}

export async function updatePedidoEstado(id: string, estado: Pedido["estado"]) {
  await api(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: estado }),
  });
  await mutate("pedidos");
}

export async function escanearUnidadPedido(
  pedidoId: string,
  unidadId: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await api<{ ok: boolean; error?: string }>(`/orders/${pedidoId}/scan`, {
    method: "POST",
    body: JSON.stringify({ unit_id: unidadId }),
  });
  await mutate("pedidos");
  await mutate("lotes");
  return result;
}

export async function registrarEventoCustodia(
  unidadId: string,
  tipo: TipoEventoCustodia,
  ubicacion: string,
  notas: string
): Promise<{ ok: boolean; error?: string }> {
  const eventoLocal: EventoCustodia = {
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
    _offlineQueue = [..._offlineQueue, eventoLocal];
    _offlineQueuePayload = [
      ..._offlineQueuePayload,
      {
        id: eventoLocal.id,
        unitId: unidadId,
        tipo,
        ubicacion,
        notas,
        fechaHora: eventoLocal.fechaHora,
      },
    ];
    mutate("offlineQueue");
    return { ok: true };
  }

  try {
    await api("/custody-events", {
      method: "POST",
      body: JSON.stringify({
        unit_id: unidadId,
        tipo,
        location_name: ubicacion,
        notas,
      }),
    });
    await mutate("lotes");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error" };
  }
}

export function toggleOfflineMode() {
  _offlineMode = !_offlineMode;
  mutate("offlineMode");
}

export async function syncOfflineQueue() {
  if (_offlineQueuePayload.length === 0) return;

  const payload = {
    events: _offlineQueuePayload.map((ev) => ({
      client_event_id: ev.id,
      unit_id: ev.unitId,
      tipo: ev.tipo,
      location_name: ev.ubicacion,
      notas: ev.notas,
      occurred_at: ev.fechaHora,
    })),
  };

  const result = await api<{ accepted: string[]; rejected: { client_event_id: string; error: string }[] }>(
    "/custody-events/sync",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const rejectedIds = new Set(result.rejected.map((r) => r.client_event_id));
  _offlineQueue = _offlineQueue.filter((ev) => rejectedIds.has(ev.id));
  _offlineQueuePayload = _offlineQueuePayload.filter((ev) => rejectedIds.has(ev.id));

  mutate("offlineQueue");
  await mutate("lotes");
}

export async function addUbicacion(nombre: string, tipo: Ubicacion["tipo"]) {
  await api("/locations", {
    method: "POST",
    body: JSON.stringify({ nombre, tipo }),
  });
  await mutate("ubicaciones");
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
      u.eventos.some((e) => e.tipo === "unitarizada" && e.fechaHora.startsWith(today))
    ).length,
    asignadas: allUnidades.filter((u) => u.estadoActual === "asignada").length,
    entregadas: allUnidades.filter((u) => u.estadoActual === "entregada_a_sala").length,
    devueltas: allUnidades.filter((u) => u.estadoActual === "devuelta").length,
    descartadas: allUnidades.filter((u) => u.estadoActual === "descartada").length,
    proximasVencer: _lotes.filter((l) => l.vencimiento <= sevenDaysFromNow).length,
  };
}
