"""Conexion asincrona a MySQL mediante un pool de conexiones."""
import aiomysql

from app.core.config import settings

pool: aiomysql.Pool | None = None


async def connect_db() -> None:
    """Crea el pool al arrancar la aplicacion."""
    global pool
    pool = await aiomysql.create_pool(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        db=settings.db_name,
        charset="utf8mb4",
        autocommit=True,
        minsize=1,
        maxsize=10,
    )


async def close_db() -> None:
    """Cierra el pool al apagar la aplicacion."""
    global pool
    if pool is not None:
        pool.close()
        await pool.wait_closed()
        pool = None


async def get_connection():
    """Dependencia de FastAPI: presta una conexion y la devuelve al terminar."""
    async with pool.acquire() as conn:
        yield conn
