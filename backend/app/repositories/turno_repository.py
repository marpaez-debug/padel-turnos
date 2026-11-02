"""SQL de turnos."""
import aiomysql

from app.core.exceptions import ConflictError

# CONSULTA 1 (INNER JOIN): turno + nombre del usuario + nombre de la cancha
_SELECT_DETALLE = """
    SELECT t.id, t.fecha,
           LEFT(t.hora_inicio, 5) AS hora_inicio, LEFT(t.hora_fin, 5) AS hora_fin,
           t.estado, t.precio_total,
           u.id AS usuario_id, u.nombre AS usuario_nombre,
           c.id AS cancha_id,  c.nombre AS cancha_nombre
    FROM turnos t
    INNER JOIN usuarios u ON u.id = t.usuario_id
    INNER JOIN canchas  c ON c.id = t.cancha_id
"""


async def reservar(conn, usuario_id: int, d) -> int:
    """Llama al stored procedure: la transaccion (COMMIT/ROLLBACK) vive en la base."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        try:
            await cur.execute(
                "CALL sp_reservar_turno(%s, %s, %s, %s, %s, %s, @nuevo_id)",
                (usuario_id, d.cancha_id, d.fecha, d.hora_inicio, d.duracion_min, d.metodo_pago),
            )
        except aiomysql.OperationalError as e:
            if e.args[0] == 1644:          # nuestros SIGNAL del procedure
                raise ConflictError(e.args[1])
            raise
        await cur.execute("SELECT @nuevo_id AS id")  # leemos el parametro OUT
        return (await cur.fetchone())["id"]


async def listar(conn, usuario_id: int | None = None, fecha=None) -> list[dict]:
    sql, params = _SELECT_DETALLE + " WHERE 1 = 1", []
    if usuario_id is not None:
        sql += " AND t.usuario_id = %s"
        params.append(usuario_id)
    if fecha is not None:
        sql += " AND t.fecha = %s"
        params.append(fecha)
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(sql + " ORDER BY t.fecha, t.hora_inicio", params)
        return await cur.fetchall()


async def get(conn, turno_id: int) -> dict | None:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(_SELECT_DETALLE + " WHERE t.id = %s", (turno_id,))
        return await cur.fetchone()


async def ocupados(conn, cancha_id: int, fecha) -> list[dict]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """SELECT LEFT(hora_inicio, 5) AS hora_inicio, LEFT(hora_fin, 5) AS hora_fin
               FROM turnos WHERE cancha_id = %s AND fecha = %s AND estado <> 'cancelado'
               ORDER BY hora_inicio""",
            (cancha_id, fecha),
        )
        return await cur.fetchall()


async def actualizar_estado(conn, turno_id: int, estado: str) -> None:
    try:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE turnos SET estado = %s WHERE id = %s", (estado, turno_id))
    except aiomysql.IntegrityError:  # reactivar un turno cuyo horario ya fue tomado
        raise ConflictError("Ese horario ya fue reservado por otro turno")
