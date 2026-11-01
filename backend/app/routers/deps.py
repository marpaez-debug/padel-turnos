"""Dependencias de seguridad reutilizables en cualquier endpoint."""
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_connection
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import TokenError, decode_token
from app.repositories import usuario_repository

# auto_error=False para lanzar nuestro propio error en vez del de FastAPI
bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer),
    conn=Depends(get_connection),
) -> dict:
    if credenciales is None:
        raise UnauthorizedError("Falta el token de autenticación")
    try:
        payload = decode_token(credenciales.credentials)
        usuario_id = int(payload["sub"])
    except (TokenError, KeyError, ValueError) as e:
        raise UnauthorizedError(str(e) if isinstance(e, TokenError) else "Token inválido")

    # Buscamos al usuario en la base: si lo borraron o le cambiaron el rol, se nota
    usuario = await usuario_repository.get_by_id(conn, usuario_id)
    if usuario is None:
        raise UnauthorizedError("El usuario ya no existe")
    return usuario


def require_roles(*roles: str):
    """Uso: Depends(require_roles('admin')) protege un endpoint por rol."""

    async def verificador(usuario: dict = Depends(get_current_user)) -> dict:
        if usuario["rol"] not in roles:
            raise ForbiddenError("No tenés permisos para esta acción")
        return usuario

    return verificador
