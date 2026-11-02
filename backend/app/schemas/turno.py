from datetime import date, time
from typing import Literal

from pydantic import BaseModel, Field


class TurnoCreate(BaseModel):
    cancha_id: int = Field(gt=0)
    fecha: date
    hora_inicio: time
    duracion_min: Literal[60, 90, 120]
    metodo_pago: Literal["efectivo", "transferencia", "tarjeta"] = "efectivo"


class EstadoIn(BaseModel):
    estado: Literal["reservado", "cancelado", "completado"]


class TurnoOut(BaseModel):
    id: int
    fecha: date
    hora_inicio: str
    hora_fin: str
    estado: str
    precio_total: float
    usuario_id: int
    usuario_nombre: str
    cancha_id: int
    cancha_nombre: str


class OcupadoOut(BaseModel):
    hora_inicio: str
    hora_fin: str
