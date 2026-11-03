// Validaciones del formulario. Son las mismas reglas que tiene el backend (Pydantic).
// Cada función devuelve un objeto con los errores; si está vacío, todo está bien.

const REGEX_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validarLogin(datos) {
  const errores = {};

  if (!REGEX_EMAIL.test(datos.email.trim())) {
    errores.email = "Ingresá un email válido";
  }
  if (datos.password === "") {
    errores.password = "Ingresá tu contraseña";
  }

  return errores;
}

export function validarRegistro(datos) {
  const errores = {};
  const nombre = datos.nombre.trim();

  if (nombre.length < 2 || nombre.length > 100) {
    errores.nombre = "El nombre debe tener entre 2 y 100 caracteres";
  }
  if (!REGEX_EMAIL.test(datos.email.trim()) || datos.email.length > 150) {
    errores.email = "Ingresá un email válido";
  }
  if (datos.password.length < 8 || datos.password.length > 128) {
    errores.password = "La contraseña debe tener entre 8 y 128 caracteres";
  }
  if (datos.confirmar !== datos.password) {
    errores.confirmar = "Las contraseñas no coinciden";
  }

  return errores;
}
