import base64
import hashlib
import hmac
import json
import secrets
import time

from app.core.config import settings

ITERACIONES = 600_000


class TokenError(Exception):
    """El token es invalido, fue alterado o esta vencido."""


def hash_password(password: str) -> str:
    sal = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), sal, ITERACIONES)
    return f"pbkdf2_sha256${ITERACIONES}${sal.hex()}${digest.hex()}"


def verify_password(password: str, guardado: str) -> bool:
    try:
        algoritmo, iteraciones, sal_hex, digest_hex = guardado.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        calculado = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(sal_hex), int(iteraciones)
        )
        return hmac.compare_digest(calculado, bytes.fromhex(digest_hex))
    except ValueError:
        return False


def _b64_encode(datos: bytes) -> str:
    return base64.urlsafe_b64encode(datos).rstrip(b"=").decode()


def _b64_decode(texto: str) -> bytes:
    relleno = "=" * (-len(texto) % 4)
    return base64.urlsafe_b64decode(texto + relleno)


def _json_b64(objeto: dict) -> str:
    return _b64_encode(json.dumps(objeto, separators=(",", ":")).encode())


def _firmar(contenido: str) -> bytes:
    return hmac.new(settings.jwt_secret.encode(), contenido.encode(), hashlib.sha256).digest()


def create_token(datos: dict, minutos: int | None = None) -> str:
    minutos = settings.jwt_expire_minutes if minutos is None else minutos
    ahora = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {**datos, "iat": ahora, "exp": ahora + minutos * 60}
    contenido = f"{_json_b64(header)}.{_json_b64(payload)}"
    return f"{contenido}.{_b64_encode(_firmar(contenido))}"


def decode_token(token: str) -> dict:
    try:
        header_b64, payload_b64, firma_b64 = token.split(".")
        esperada = _firmar(f"{header_b64}.{payload_b64}")
        if not hmac.compare_digest(esperada, _b64_decode(firma_b64)):
            raise TokenError("Firma invalida")
        header = json.loads(_b64_decode(header_b64))
        if header.get("alg") != "HS256":
            raise TokenError("Algoritmo no permitido")
        payload = json.loads(_b64_decode(payload_b64))
    except ValueError:  # token mal armado, base64 o JSON roto
        raise TokenError("Token mal formado")
    if payload.get("exp", 0) < time.time():
        raise TokenError("Token vencido")
    return payload
