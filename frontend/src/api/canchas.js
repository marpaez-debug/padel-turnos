import { pedir } from "./client";

export function listarCanchas() {
  return pedir("/canchas");
}

export function crearCancha(datos) {
  return pedir("/canchas", "POST", datos);
}

export function actualizarCancha(id, datos) {
  return pedir("/canchas/" + id, "PUT", datos);
}

export function eliminarCancha(id) {
  return pedir("/canchas/" + id, "DELETE");
}
