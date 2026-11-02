"""Consultas analiticas (solo lectura)."""
import aiomysql


async def ingresos_por_cancha_y_mes(conn) -> list[dict]:
    """CONSULTA 2: INNER JOIN + GROUP BY (cantidad de turnos e ingresos)."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """SELECT LEFT(t.fecha, 7) AS mes, c.nombre AS cancha,
                      COUNT(*) AS turnos, SUM(t.precio_total) AS ingresos
               FROM turnos t
               INNER JOIN canchas c ON c.id = t.cancha_id
               WHERE t.estado <> 'cancelado'
               GROUP BY mes, c.id, c.nombre
               ORDER BY mes DESC, ingresos DESC"""
        )
        return await cur.fetchall()


async def clientes_frecuentes(conn) -> list[dict]:
    """CONSULTA 3: SUBQUERY en HAVING (clientes con mas turnos que el promedio)."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """SELECT u.id, u.nombre, u.email, COUNT(*) AS total_turnos
               FROM usuarios u
               INNER JOIN turnos t ON t.usuario_id = u.id AND t.estado <> 'cancelado'
               GROUP BY u.id, u.nombre, u.email
               HAVING COUNT(*) > (
                   SELECT AVG(cant) FROM (
                       SELECT COUNT(*) AS cant FROM turnos
                       WHERE estado <> 'cancelado' GROUP BY usuario_id
                   ) AS por_usuario
               )
               ORDER BY total_turnos DESC"""
        )
        return await cur.fetchall()


async def canchas_sin_reservas(conn, fecha) -> list[dict]:
    """Extra (SUBQUERY con NOT IN): canchas activas sin ningun turno ese dia."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """SELECT id, nombre, tipo, precio_hora, activa FROM canchas
               WHERE activa = TRUE AND id NOT IN (
                   SELECT cancha_id FROM turnos WHERE fecha = %s AND estado <> 'cancelado'
               ) ORDER BY nombre""",
            (fecha,),
        )
        return await cur.fetchall()
