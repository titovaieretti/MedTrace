from enum import Enum


class RoleEnum(str, Enum):
    farmaceutico = "farmaceutico"
    tecnico = "tecnico"
    enfermero = "enfermero"
    auditor = "auditor"


class FormaFarmaceuticaEnum(str, Enum):
    comprimido = "comprimido"
    ampolla = "ampolla"
    capsula = "capsula"
    jarabe = "jarabe"
    crema = "crema"
    supositorio = "supositorio"
    inyectable = "inyectable"
    gotas = "gotas"


class EstadoMedicamentoEnum(str, Enum):
    activo = "activo"
    inactivo = "inactivo"


class EstadoLoteEnum(str, Enum):
    borrador = "borrador"
    impreso = "impreso"


class EstadoPedidoEnum(str, Enum):
    borrador = "borrador"
    en_preparacion = "en_preparacion"
    entregado = "entregado"


class CustodiaEventoEnum(str, Enum):
    unitarizada = "unitarizada"
    asignada = "asignada"
    entregada_a_sala = "entregada_a_sala"
    devuelta = "devuelta"
    descartada = "descartada"


class TipoUbicacionEnum(str, Enum):
    farmacia = "farmacia"
    sala = "sala"
    carro = "carro"
    deposito = "deposito"


class AlertaTipoEnum(str, Enum):
    vencimiento = "vencimiento"
    faltante = "faltante"
    duplicado = "duplicado"
    asignacion_incorrecta = "asignacion_incorrecta"
