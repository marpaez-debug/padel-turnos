from typing import Literal

from pydantic import BaseModel, Field, field_validator


class CanchaIn(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    tipo: Literal["techada", "descubierta"]
    precio_hora: float = Field(gt=0, le=1_000_000)
    activa: bool = True

    @field_validator("nombre")
    @classmethod
    def limpiar_nombre(cls, v: str) -> str:
        return v.strip()


class CanchaOut(CanchaIn):
    id: int
