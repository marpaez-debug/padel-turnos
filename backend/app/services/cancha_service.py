from app.core.exceptions import NotFoundError
from app.repositories import cancha_repository as repo


async def listar(conn, usuario: dict) -> list[dict]:
    # Los clientes solo ven canchas activas; el admin ve todas
    return await repo.listar(conn, solo_activas=usuario["rol"] != "admin")


async def obtener(conn, cancha_id: int) -> dict:
    cancha = await repo.get(conn, cancha_id)
    if cancha is None:
        raise NotFoundError("La cancha no existe")
    return cancha


async def crear(conn, datos) -> dict:
    return await obtener(conn, await repo.crear(conn, datos))


async def actualizar(conn, cancha_id: int, datos) -> dict:
    await obtener(conn, cancha_id)
    await repo.actualizar(conn, cancha_id, datos)
    return await obtener(conn, cancha_id)


async def eliminar(conn, cancha_id: int) -> None:
    await obtener(conn, cancha_id)
    await repo.eliminar(conn, cancha_id)
