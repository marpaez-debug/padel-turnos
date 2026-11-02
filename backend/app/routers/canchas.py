from fastapi import APIRouter, Depends

from app.core.database import get_connection
from app.routers.deps import get_current_user, require_roles
from app.schemas.cancha import CanchaIn, CanchaOut
from app.services import cancha_service as service

router = APIRouter(prefix="/canchas", tags=["Canchas"])


@router.get("", response_model=list[CanchaOut])
async def listar(usuario=Depends(get_current_user), conn=Depends(get_connection)):
    return await service.listar(conn, usuario)


@router.get("/{cancha_id}", response_model=CanchaOut)
async def obtener(cancha_id: int, _=Depends(get_current_user), conn=Depends(get_connection)):
    return await service.obtener(conn, cancha_id)


@router.post("", response_model=CanchaOut, status_code=201)
async def crear(datos: CanchaIn, _=Depends(require_roles("admin")), conn=Depends(get_connection)):
    return await service.crear(conn, datos)


@router.put("/{cancha_id}", response_model=CanchaOut)
async def actualizar(cancha_id: int, datos: CanchaIn, _=Depends(require_roles("admin")),
                     conn=Depends(get_connection)):
    return await service.actualizar(conn, cancha_id, datos)


@router.delete("/{cancha_id}", status_code=204)
async def eliminar(cancha_id: int, _=Depends(require_roles("admin")), conn=Depends(get_connection)):
    await service.eliminar(conn, cancha_id)
