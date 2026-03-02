from pydantic import BaseModel


class DashboardKPIRead(BaseModel):
    etiquetadas_hoy: int
    asignadas: int
    entregadas: int
    devueltas: int
    descartadas: int
    proximas_vencer: int
