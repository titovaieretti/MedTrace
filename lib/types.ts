// MedTrace - Tipos del sistema

export type FormaFarmaceutica =
  | "comprimido"
  | "ampolla"
  | "capsula"
  | "jarabe"
  | "crema"
  | "supositorio"
  | "inyectable"
  | "gotas";

export type EstadoMedicamento = "activo" | "inactivo";

export interface Medicamento {
  id: string;
  nombre: string;
  concentracion: string;
  forma: FormaFarmaceutica;
  codigoInterno: string;
  gtin?: string;
  estado: EstadoMedicamento;
}

export type EstadoLote = "borrador" | "impreso";

export interface UnidadEtiqueta {
  idUnitario: string;
  medicamentoId: string;
  lote: string;
  vencimiento: string;
  estadoActual: EstadoCustodia;
  pacienteAsignado?: string;
  eventos: EventoCustodia[];
}

export interface LoteEtiquetas {
  id: string;
  medicamentoId: string;
  lote: string;
  vencimiento: string;
  cantidad: number;
  fechaCreacion: string;
  estado: EstadoLote;
  unidades: UnidadEtiqueta[];
}

export type EstadoPedido =
  | "borrador"
  | "en_preparacion"
  | "entregado";

export interface Paciente {
  id: string;
  nombre: string;
  mrn: string;
  sala: string;
  cama: string;
  historiaClinica?: HistoriaClinica;
}

export type FuenteHistoriaClinica = "local" | "centralizada";

export interface HistoriaClinica {
  id: string;
  patientId: string;
  source: FuenteHistoriaClinica;
  sourceLabel: string;
  sourceReference?: string;
  importedAt?: string;
  motivoIngreso: string;
  diagnosticoPrincipal: string;
  alergias: string;
  medicacionCronica: string;
  antecedentes: string;
  notas: string;
}

export interface HistoriaClinicaCentralizada {
  mrn: string;
  source: "centralizada";
  sourceLabel: string;
  sourceReference: string;
  importedAt: string;
  motivoIngreso: string;
  diagnosticoPrincipal: string;
  alergias: string;
  medicacionCronica: string;
  antecedentes: string;
  notas: string;
}

export interface ItemPedido {
  id: string;
  medicamentoId: string;
  dosis: string;
  ventanaHoraria: string;
  notas: string;
  unidadAsignada?: string;
}

export interface Pedido {
  id: string;
  pacienteId: string;
  fecha: string;
  estado: EstadoPedido;
  items: ItemPedido[];
  unidadesEscaneadas: string[];
  historial: EventoPedido[];
}

export interface EventoPedido {
  id: string;
  timestamp: string;
  usuario: string;
  rol: string;
  accion: string;
}

export type TipoEventoCustodia =
  | "unitarizada"
  | "asignada"
  | "entregada_a_sala"
  | "devuelta"
  | "descartada";

export type EstadoCustodia =
  | "unitarizada"
  | "asignada"
  | "entregada_a_sala"
  | "devuelta"
  | "descartada";

export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: "farmacia" | "sala" | "carro" | "deposito";
}

export interface EventoCustodia {
  id: string;
  tipo: TipoEventoCustodia;
  fechaHora: string;
  ubicacion: string;
  actor: string;
  rol: string;
  notas: string;
  pendienteSincronizacion?: boolean;
}

export interface Alerta {
  id: string;
  tipo: "vencimiento" | "faltante" | "duplicado" | "asignacion_incorrecta";
  mensaje: string;
  fechaHora: string;
  unidadId?: string;
}
