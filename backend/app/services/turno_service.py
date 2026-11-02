"""Reglas de negocio de los turnos."""
from datetime import datetime

from app.core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.repositories import cancha_repository, turno_repository as repo

APERTURA_MIN = 8 * 60      # 08:00
CIERRE_MIN = 24 * 60       # el turno debe terminar antes de las 24:00


def _validar_reglas(d) -> None:
    if datetime.combine(d.fecha, d.hora_inicio) <= datetime.now():
        raise BadRequestError("No se puede reservar en el pasado")
    if d.hora_inicio.minute not in (0, 30) or d.hora_inicio.second:
        raise BadRequestError("Los turnos empiezan en punto o y media")
    inicio = d.hora_inicio.hour * 60 + d.hora_inicio.minute
    if inicio < APERTURA_MIN or inicio + d.duracion_min > CIERRE_MIN:
        raise BadRequestError("Horario fuera de atención (08:00 a 24:00)")


async def reservar(conn, usuario: dict, datos) -> dict:
    _validar_reglas(datos)
    if await cancha_repository.get(conn, datos.cancha_id) is None:
        raise NotFoundError("La cancha no existe")
    nuevo_id = await repo.reservar(conn, usuario["id"], datos)
    return await repo.get(conn, nuevo_id)


async def listar(conn, usuario: dict, fecha=None) -> list[dict]:
    solo_mios = None if usuario["rol"] == "admin" else usuario["id"]
    return await repo.listar(conn, solo_mios, fecha)


async def obtener(conn, usuario: dict, turno_id: int) -> dict:
    turno = await repo.get(conn, turno_id)
    if turno is None:
        raise NotFoundError("El turno no existe")
    if usuario["rol"] != "admin" and turno["usuario_id"] != usuario["id"]:
        raise ForbiddenError("No podés ver turnos de otros usuarios")
    return turno


async def cancelar(conn, usuario: dict, turno_id: int) -> dict:
    turno = await obtener(conn, usuario, turno_id)      # ya valida duenio o admin
    if turno["estado"] != "reservado":
        raise ConflictError("Solo se pueden cancelar turnos reservados")
    await repo.actualizar_estado(conn, turno_id, "cancelado")
    return await repo.get(conn, turno_id)


async def cambiar_estado(conn, usuario: dict, turno_id: int, estado: str) -> dict:
    await obtener(conn, usuario, turno_id)
    await repo.actualizar_estado(conn, turno_id, estado)
    return await repo.get(conn, turno_id)


async def disponibilidad(conn, cancha_id: int, fecha) -> list[dict]:
    return await repo.ocupados(conn, cancha_id, fecha)
