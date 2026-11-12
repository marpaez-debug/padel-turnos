import { hoy } from "./horarios";

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

export function validarCancha(datos) {
  const errores = {};
  const nombre = datos.nombre.trim();
  const precio = Number(datos.precio_hora);

  if (nombre.length < 2 || nombre.length > 50) {
    errores.nombre = "El nombre debe tener entre 2 y 50 caracteres";
  }
  if (datos.tipo !== "techada" && datos.tipo !== "descubierta") {
    errores.tipo = "Elegí un tipo válido";
  }
  if (datos.precio_hora === "" || isNaN(precio) || precio <= 0 || precio > 1000000) {
    errores.precio_hora = "El precio debe ser un número mayor a 0 (máximo 1.000.000)";
  }

  return errores;
}

export function validarTurno(datos) {
  const errores = {};

  if (!datos.cancha_id) {
    errores.cancha_id = "Elegí una cancha";
  }
  if (!datos.fecha) {
    errores.fecha = "Elegí una fecha";
  } else if (datos.fecha < hoy()) {
    errores.fecha = "La fecha no puede ser anterior a hoy";
  }
  if (!datos.hora_inicio) {
    errores.hora_inicio = "Elegí un horario";
  }
  if (![60, 90, 120].includes(Number(datos.duracion_min))) {
    errores.duracion_min = "Elegí una duración válida";
  }

  return errores;
}
