from datetime import date

from fastapi import APIRouter, Depends

from app.core.database import get_connection
from app.routers.deps import get_current_user, require_roles
from app.schemas.turno import EstadoIn, OcupadoOut, TurnoCreate, TurnoOut
from app.services import turno_service as service

router = APIRouter(prefix="/turnos", tags=["Turnos"])


@router.post("", response_model=TurnoOut, status_code=201)
async def reservar(datos: TurnoCreate, usuario=Depends(get_current_user), conn=Depends(get_connection)):
    return await service.reservar(conn, usuario, datos)


@router.get("", response_model=list[TurnoOut])
async def listar(fecha: date | None = None, usuario=Depends(get_current_user),
                 conn=Depends(get_connection)):
    return await service.listar(conn, usuario, fecha)


# Va ANTES de /{turno_id}, si no FastAPI interpretaria "disponibilidad" como un id
@router.get("/disponibilidad", response_model=list[OcupadoOut])
async def disponibilidad(cancha_id: int, fecha: date, _=Depends(get_current_user),
                         conn=Depends(get_connection)):
    return await service.disponibilidad(conn, cancha_id, fecha)


@router.get("/{turno_id}", response_model=TurnoOut)
async def obtener(turno_id: int, usuario=Depends(get_current_user), conn=Depends(get_connection)):
    return await service.obtener(conn, usuario, turno_id)


@router.put("/{turno_id}/estado", response_model=TurnoOut)
async def cambiar_estado(turno_id: int, datos: EstadoIn, usuario=Depends(require_roles("admin")),
                         conn=Depends(get_connection)):
    return await service.cambiar_estado(conn, usuario, turno_id, datos.estado)


@router.delete("/{turno_id}", response_model=TurnoOut)
async def cancelar(turno_id: int, usuario=Depends(get_current_user), conn=Depends(get_connection)):
    """No borra la fila: la marca como cancelada (y libera el horario)."""
    return await service.cancelar(conn, usuario, turno_id)
