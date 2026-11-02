"""Errores de negocio. Los services los lanzan; main.py los convierte en respuestas HTTP."""


class AppError(Exception):
    status_code = 500

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class ConflictError(AppError):       # 409: choca con algo existente (ej. email repetido)
    status_code = 409


class UnauthorizedError(AppError):   # 401: no estas autenticado
    status_code = 401


class ForbiddenError(AppError):      # 403: estas autenticado pero no tenes permiso
    status_code = 403


class NotFoundError(AppError):       # 404: no existe
    status_code = 404


class BadRequestError(AppError):     # 400: los datos son validos en tipo, pero violan una regla de negocio
    status_code = 400
