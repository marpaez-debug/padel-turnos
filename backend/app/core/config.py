"""Configuracion central: lee las variables del archivo .env"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "padel_db"

    # Clave con la que se FIRMAN los tokens. Si alguien la conoce, puede falsificarlos.
    jwt_secret: str = "clave-solo-para-desarrollo-cambiar"
    jwt_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
