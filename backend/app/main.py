"""Punto de entrada de la API."""
from contextlib import asynccontextmanager

import aiomysql
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.database import close_db, connect_db, get_connection
from app.core.exceptions import AppError
from app.routers import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()   # al arrancar
    yield
    await close_db()     # al apagar


app = FastAPI(title="API Turnos de Padel", version="0.2.0", lifespan=lifespan)

# Permite que el frontend de React (puerto 5173) llame a esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def manejar_error_de_negocio(request: Request, error: AppError):
    return JSONResponse(status_code=error.status_code, content={"detail": error.detail})


app.include_router(auth.router)


@app.get("/health")
async def health(conn=Depends(get_connection)):
    """Verifica que la API y la base de datos respondan."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT COUNT(*) AS canchas FROM canchas")
        fila = await cur.fetchone()
    return {"estado": "ok", "canchas": fila["canchas"]}
