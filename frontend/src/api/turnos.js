import { pedir } from "./client";

export function listarTurnos() {
  return pedir("/turnos");
}

export function reservarTurno(datos) {
  return pedir("/turnos", "POST", datos);
}

export function cancelarTurno(id) {
  return pedir("/turnos/" + id, "DELETE");
}

export function cambiarEstadoTurno(id, estado) {
  return pedir("/turnos/" + id + "/estado", "PUT", { estado: estado });
}

export function listarOcupados(canchaId, fecha) {
  return pedir("/turnos/disponibilidad?cancha_id=" + canchaId + "&fecha=" + fecha);
}
