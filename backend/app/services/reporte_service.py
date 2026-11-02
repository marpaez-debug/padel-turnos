from app.repositories import reporte_repository as repo


async def ingresos(conn):
    return await repo.ingresos_por_cancha_y_mes(conn)


async def clientes_frecuentes(conn):
    return await repo.clientes_frecuentes(conn)


async def canchas_libres(conn, fecha):
    return await repo.canchas_sin_reservas(conn, fecha)
