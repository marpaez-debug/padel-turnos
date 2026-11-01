"""Acceso a la tabla usuarios. Es la UNICA capa que escribe SQL para usuarios."""
import aiomysql

_COLUMNAS = "id, nombre, email, password_hash, rol"


async def get_by_email(conn, email: str) -> dict | None:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        # %s es un parametro: el valor viaja aparte, no se pega al texto SQL
        await cur.execute(f"SELECT {_COLUMNAS} FROM usuarios WHERE email = %s", (email,))
        return await cur.fetchone()


async def get_by_id(conn, usuario_id: int) -> dict | None:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(f"SELECT {_COLUMNAS} FROM usuarios WHERE id = %s", (usuario_id,))
        return await cur.fetchone()


async def crear(conn, nombre: str, email: str, password_hash: str, rol: str) -> int:
    async with conn.cursor() as cur:
        await cur.execute(
            "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (%s, %s, %s, %s)",
            (nombre, email, password_hash, rol),
        )
        return cur.lastrowid
