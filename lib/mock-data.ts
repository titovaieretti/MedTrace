import type {
  Medicamento,
  Paciente,
  Ubicacion,
  LoteEtiquetas,
  Pedido,
  Alerta,
  UnidadEtiqueta,
} from "./types";

export const medicamentosMock: Medicamento[] = [
  {
    id: "med-001",
    nombre: "Paracetamol",
    concentracion: "500 mg",
    forma: "comprimido",
    codigoInterno: "PAR500",
    gtin: "7790001000010",
    estado: "activo",
  },
  {
    id: "med-002",
    nombre: "Ibuprofeno",
    concentracion: "400 mg",
    forma: "comprimido",
    codigoInterno: "IBU400",
    gtin: "7790001000027",
    estado: "activo",
  },
  {
    id: "med-003",
    nombre: "Amoxicilina",
    concentracion: "500 mg",
    forma: "capsula",
    codigoInterno: "AMO500",
    gtin: "7790001000034",
    estado: "activo",
  },
  {
    id: "med-004",
    nombre: "Omeprazol",
    concentracion: "20 mg",
    forma: "capsula",
    codigoInterno: "OME020",
    estado: "activo",
  },
  {
    id: "med-005",
    nombre: "Diclofenac",
    concentracion: "75 mg/3ml",
    forma: "ampolla",
    codigoInterno: "DIC075",
    gtin: "7790001000058",
    estado: "activo",
  },
  {
    id: "med-006",
    nombre: "Metformina",
    concentracion: "850 mg",
    forma: "comprimido",
    codigoInterno: "MET850",
    estado: "activo",
  },
  {
    id: "med-007",
    nombre: "Enalapril",
    concentracion: "10 mg",
    forma: "comprimido",
    codigoInterno: "ENA010",
    gtin: "7790001000072",
    estado: "activo",
  },
  {
    id: "med-008",
    nombre: "Dexametasona",
    concentracion: "4 mg/ml",
    forma: "ampolla",
    codigoInterno: "DEX004",
    estado: "activo",
  },
  {
    id: "med-009",
    nombre: "Ranitidina",
    concentracion: "150 mg",
    forma: "comprimido",
    codigoInterno: "RAN150",
    estado: "inactivo",
  },
  {
    id: "med-010",
    nombre: "Salbutamol",
    concentracion: "5 mg/ml",
    forma: "gotas",
    codigoInterno: "SAL005",
    gtin: "7790001000096",
    estado: "activo",
  },
];

export const pacientesMock: Paciente[] = [
  {
    id: "pac-001",
    nombre: "Maria Garcia Lopez",
    mrn: "HC-2026-00123",
    sala: "Sala A",
    cama: "101-A",
  },
  {
    id: "pac-002",
    nombre: "Juan Carlos Martinez",
    mrn: "HC-2026-00456",
    sala: "Sala A",
    cama: "102-B",
  },
  {
    id: "pac-003",
    nombre: "Ana Rodriguez Fernandez",
    mrn: "HC-2026-00789",
    sala: "Sala B",
    cama: "201-A",
  },
  {
    id: "pac-004",
    nombre: "Roberto Diaz Perez",
    mrn: "HC-2026-01012",
    sala: "Sala B",
    cama: "202-A",
  },
  {
    id: "pac-005",
    nombre: "Laura Gonzalez Ruiz",
    mrn: "HC-2026-01345",
    sala: "Sala A",
    cama: "103-A",
  },
];

export const ubicacionesMock: Ubicacion[] = [
  { id: "ubi-001", nombre: "Farmacia Central", tipo: "farmacia" },
  { id: "ubi-002", nombre: "Sala A", tipo: "sala" },
  { id: "ubi-003", nombre: "Sala B", tipo: "sala" },
  { id: "ubi-004", nombre: "Carro 12", tipo: "carro" },
  { id: "ubi-005", nombre: "Carro 15", tipo: "carro" },
  { id: "ubi-006", nombre: "Deposito General", tipo: "deposito" },
];

function generarUnidades(
  medicamentoId: string,
  lote: string,
  vencimiento: string,
  cantidad: number,
  startIndex: number
): UnidadEtiqueta[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const idx = startIndex + i;
    const idUnitario = `U-2026-${String(idx).padStart(6, "0")}`;
    const estados: UnidadEtiqueta["estadoActual"][] = [
      "unitarizada",
      "asignada",
      "entregada_a_sala",
      "devuelta",
      "unitarizada",
      "asignada",
      "entregada_a_sala",
      "unitarizada",
      "unitarizada",
      "descartada",
    ];
    return {
      idUnitario,
      medicamentoId,
      lote,
      vencimiento,
      estadoActual: estados[i % estados.length],
      pacienteAsignado:
        estados[i % estados.length] === "asignada" ||
        estados[i % estados.length] === "entregada_a_sala"
          ? "pac-001"
          : undefined,
      eventos: [
        {
          id: `ev-${idUnitario}-1`,
          tipo: "unitarizada",
          fechaHora: "2026-01-28T09:00:00",
          ubicacion: "Farmacia Central",
          actor: "Farm. Lopez",
          rol: "Farmaceutico",
          notas: "Unitarizado del lote original",
        },
        ...(estados[i % estados.length] !== "unitarizada"
          ? [
              {
                id: `ev-${idUnitario}-2`,
                tipo: "asignada" as const,
                fechaHora: "2026-01-28T14:00:00",
                ubicacion: "Farmacia Central",
                actor: "Tec. Ramirez",
                rol: "Tecnico",
                notas: "Asignada a pedido P-2026-001",
              },
            ]
          : []),
        ...(estados[i % estados.length] === "entregada_a_sala"
          ? [
              {
                id: `ev-${idUnitario}-3`,
                tipo: "entregada_a_sala" as const,
                fechaHora: "2026-01-28T16:00:00",
                ubicacion: "Sala A",
                actor: "Enf. Gomez",
                rol: "Enfermero",
                notas: "Entregada en carro 12",
              },
            ]
          : []),
        ...(estados[i % estados.length] === "devuelta"
          ? [
              {
                id: `ev-${idUnitario}-3`,
                tipo: "devuelta" as const,
                fechaHora: "2026-01-29T08:00:00",
                ubicacion: "Farmacia Central",
                actor: "Enf. Gomez",
                rol: "Enfermero",
                notas: "No administrada - devuelta a farmacia",
              },
            ]
          : []),
        ...(estados[i % estados.length] === "descartada"
          ? [
              {
                id: `ev-${idUnitario}-3`,
                tipo: "descartada" as const,
                fechaHora: "2026-01-29T10:00:00",
                ubicacion: "Farmacia Central",
                actor: "Farm. Lopez",
                rol: "Farmaceutico",
                notas: "Descartada por rotura",
              },
            ]
          : []),
      ],
    };
  });
}

export const lotesMock: LoteEtiquetas[] = [
  {
    id: "lot-001",
    medicamentoId: "med-001",
    lote: "L2026-PAR-001",
    vencimiento: "2026-02-10",
    cantidad: 10,
    fechaCreacion: "2026-01-28",
    estado: "impreso",
    unidades: generarUnidades("med-001", "L2026-PAR-001", "2026-02-10", 10, 1),
  },
  {
    id: "lot-002",
    medicamentoId: "med-003",
    lote: "L2026-AMO-001",
    vencimiento: "2026-06-15",
    cantidad: 20,
    fechaCreacion: "2026-01-30",
    estado: "borrador",
    unidades: generarUnidades(
      "med-003",
      "L2026-AMO-001",
      "2026-06-15",
      20,
      11
    ),
  },
];

export const pedidosMock: Pedido[] = [
  {
    id: "ped-001",
    pacienteId: "pac-001",
    fecha: "2026-02-04",
    estado: "en_preparacion",
    items: [
      {
        id: "item-001",
        medicamentoId: "med-001",
        dosis: "1 comprimido",
        ventanaHoraria: "08:00 - 20:00",
        notas: "Administrar con alimentos",
        unidadAsignada: "U-2026-000002",
      },
      {
        id: "item-002",
        medicamentoId: "med-004",
        dosis: "1 capsula",
        ventanaHoraria: "07:00 - 07:30",
        notas: "En ayunas",
      },
    ],
    unidadesEscaneadas: ["U-2026-000002"],
    historial: [
      {
        id: "hp-001",
        timestamp: "2026-02-04T07:30:00",
        usuario: "Farm. Lopez",
        rol: "Farmaceutico",
        accion: "Pedido creado",
      },
      {
        id: "hp-002",
        timestamp: "2026-02-04T08:00:00",
        usuario: "Tec. Ramirez",
        rol: "Tecnico",
        accion: "Inicio de preparacion",
      },
      {
        id: "hp-003",
        timestamp: "2026-02-04T08:15:00",
        usuario: "Tec. Ramirez",
        rol: "Tecnico",
        accion: "Unidad U-2026-000002 escaneada y asignada",
      },
    ],
  },
  {
    id: "ped-002",
    pacienteId: "pac-003",
    fecha: "2026-02-04",
    estado: "borrador",
    items: [
      {
        id: "item-003",
        medicamentoId: "med-002",
        dosis: "1 comprimido",
        ventanaHoraria: "08:00 - 14:00 - 20:00",
        notas: "",
      },
    ],
    unidadesEscaneadas: [],
    historial: [
      {
        id: "hp-004",
        timestamp: "2026-02-04T09:00:00",
        usuario: "Farm. Lopez",
        rol: "Farmaceutico",
        accion: "Pedido creado como borrador",
      },
    ],
  },
];

export const alertasMock: Alerta[] = [
  {
    id: "al-001",
    tipo: "vencimiento",
    mensaje: "Paracetamol 500mg - Lote L2026-PAR-001 vence el 10/02/2026",
    fechaHora: "2026-02-04T06:00:00",
    unidadId: "U-2026-000001",
  },
  {
    id: "al-002",
    tipo: "faltante",
    mensaje: "Unidad U-2026-000005 no escaneada en 48hs",
    fechaHora: "2026-02-04T06:00:00",
    unidadId: "U-2026-000005",
  },
  {
    id: "al-003",
    tipo: "duplicado",
    mensaje: "Escaneo duplicado de U-2026-000002 en Sala A",
    fechaHora: "2026-02-03T18:30:00",
    unidadId: "U-2026-000002",
  },
  {
    id: "al-004",
    tipo: "asignacion_incorrecta",
    mensaje: "U-2026-000006 asignada a paciente diferente al del pedido",
    fechaHora: "2026-02-03T15:00:00",
    unidadId: "U-2026-000006",
  },
];
