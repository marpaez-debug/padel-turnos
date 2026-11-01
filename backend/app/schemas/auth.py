"""Schemas de autenticacion: validan tipos y formatos de lo que entra y sale de la API."""
from pydantic import BaseModel, Field, field_validator

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class RegisterIn(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=150, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("nombre")
    @classmethod
    def limpiar_nombre(cls, v: str) -> str:
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_en_minusculas(cls, v: str) -> str:
        return v.lower()


class LoginIn(BaseModel):
    email: str = Field(max_length=150)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def email_en_minusculas(cls, v: str) -> str:
        return v.strip().lower()


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
