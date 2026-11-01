"""Endpoints de autenticacion. Solo traducen HTTP; la logica esta en el service."""
from fastapi import APIRouter, Depends

from app.core.database import get_connection
from app.routers.deps import get_current_user
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UsuarioOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=UsuarioOut, status_code=201)
async def register(datos: RegisterIn, conn=Depends(get_connection)):
    return await auth_service.registrar(conn, datos)


@router.post("/login", response_model=TokenOut)
async def login(datos: LoginIn, conn=Depends(get_connection)):
    return await auth_service.login(conn, datos)


@router.get("/me", response_model=UsuarioOut)
async def me(usuario=Depends(get_current_user)):
    return usuario
