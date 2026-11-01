"""Reglas de negocio de autenticacion."""
import asyncio

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_token, hash_password, verify_password
from app.repositories import usuario_repository
from app.schemas.auth import LoginIn, RegisterIn

# Hash falso para "gastar el mismo tiempo" cuando el email no existe
_HASH_FALSO = hash_password("contrasena-falsa")


async def registrar(conn, datos: RegisterIn) -> dict:
    if await usuario_repository.get_by_email(conn, datos.email):
        raise ConflictError("El email ya está registrado")

    # PBKDF2 consume CPU a proposito: lo mandamos a otro hilo para no frenar la API
    password_hash = await asyncio.to_thread(hash_password, datos.password)

    # Todo registro publico es 'cliente'. Los admin se crean a mano en la base.
    nuevo_id = await usuario_repository.crear(conn, datos.nombre, datos.email, password_hash, "cliente")
    return await usuario_repository.get_by_id(conn, nuevo_id)


async def login(conn, datos: LoginIn) -> dict:
    usuario = await usuario_repository.get_by_email(conn, datos.email)
    hash_guardado = usuario["password_hash"] if usuario else _HASH_FALSO

    es_valida = await asyncio.to_thread(verify_password, datos.password, hash_guardado)

    # Mismo mensaje si falla el email o la clave: no le decimos al atacante cual fue
    if usuario is None or not es_valida:
        raise UnauthorizedError("Email o contraseña incorrectos")

    token = create_token({"sub": str(usuario["id"]), "rol": usuario["rol"]})
    return {"access_token": token, "token_type": "bearer", "usuario": usuario}
