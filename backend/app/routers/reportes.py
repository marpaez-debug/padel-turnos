from datetime import date

from fastapi import APIRouter, Depends

from app.core.database import get_connection
from app.routers.deps import require_roles
from app.schemas.cancha import CanchaOut
from app.schemas.reporte import ClienteFrecuenteOut, IngresoOut
from app.services import reporte_service as service

# Todo el router es solo para admin
router = APIRouter(prefix="/reportes", tags=["Reportes"], dependencies=[Depends(require_roles("admin"))])


@router.get("/ingresos", response_model=list[IngresoOut])
async def ingresos(conn=Depends(get_connection)):
    return await service.ingresos(conn)


@router.get("/clientes-frecuentes", response_model=list[ClienteFrecuenteOut])
async def clientes_frecuentes(conn=Depends(get_connection)):
    return await service.clientes_frecuentes(conn)


@router.get("/canchas-libres", response_model=list[CanchaOut])
async def canchas_libres(fecha: date, conn=Depends(get_connection)):
    return await service.canchas_libres(conn, fecha)
