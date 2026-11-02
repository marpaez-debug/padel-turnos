from pydantic import BaseModel


class IngresoOut(BaseModel):
    mes: str
    cancha: str
    turnos: int
    ingresos: float


class ClienteFrecuenteOut(BaseModel):
    id: int
    nombre: str
    email: str
    total_turnos: int
