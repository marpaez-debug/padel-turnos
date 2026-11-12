import { pedir } from "./client";

export function reporteIngresos() {
  return pedir("/reportes/ingresos");
}

export function reporteClientesFrecuentes() {
  return pedir("/reportes/clientes-frecuentes");
}

export function reporteCanchasLibres(fecha) {
  return pedir("/reportes/canchas-libres?fecha=" + fecha);
}
