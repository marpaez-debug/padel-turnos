"""SQL de la tabla canchas."""
import aiomysql

from app.core.exceptions import ConflictError

_COLS = "id, nombre, tipo, precio_hora, activa"


async def listar(conn, solo_activas: bool = False) -> list[dict]:
    sql = f"SELECT {_COLS} FROM canchas"
    if solo_activas:
        sql += " WHERE activa = TRUE"
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(sql + " ORDER BY nombre")
        return await cur.fetchall()


async def get(conn, cancha_id: int) -> dict | None:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(f"SELECT {_COLS} FROM canchas WHERE id = %s", (cancha_id,))
        return await cur.fetchone()


async def crear(conn, d) -> int:
    try:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO canchas (nombre, tipo, precio_hora, activa) VALUES (%s, %s, %s, %s)",
                (d.nombre, d.tipo, d.precio_hora, d.activa),
            )
            return cur.lastrowid
    except aiomysql.IntegrityError:  # viola el UNIQUE del nombre
        raise ConflictError("Ya existe una cancha con ese nombre")


async def actualizar(conn, cancha_id: int, d) -> None:
    try:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE canchas SET nombre=%s, tipo=%s, precio_hora=%s, activa=%s WHERE id=%s",
                (d.nombre, d.tipo, d.precio_hora, d.activa, cancha_id),
            )
    except aiomysql.IntegrityError:
        raise ConflictError("Ya existe una cancha con ese nombre")


async def eliminar(conn, cancha_id: int) -> None:
    try:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM canchas WHERE id = %s", (cancha_id,))
    except aiomysql.IntegrityError:  # la FK de turnos lo impide
        raise ConflictError("No se puede eliminar: la cancha tiene turnos. Desactivala en su lugar.")
