// Funciones para trabajar con fechas y horarios

// Fecha de hoy en formato "2026-12-01" (el que usa el input de fecha)
export function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mes + "-" + dia;
}

// "19:30" -> 1170 (minutos desde la medianoche)
function aMinutos(hora) {
  const partes = hora.split(":");
  return Number(partes[0]) * 60 + Number(partes[1]);
}

// 1170 -> "19:30"
function aHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return h + ":" + m;
}

// Devuelve los horarios de inicio que se pueden reservar: cada 30 minutos,
// entre las 08:00 y las 24:00, que no se pisen con un turno ocupado.
// Son las mismas reglas que valida el backend.
export function horariosLibres(ocupados, duracion, fecha) {
  const libres = [];
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  for (let inicio = 8 * 60; inicio + duracion <= 24 * 60; inicio += 30) {
    const fin = inicio + duracion;

    // si es hoy, no ofrecemos horarios que ya pasaron
    if (fecha === hoy() && inicio <= minutosAhora) {
      continue;
    }

    // dos horarios se pisan si inicio < fin del otro y fin > inicio del otro
    const sePisa = ocupados.some(
      (o) => inicio < aMinutos(o.hora_fin) && fin > aMinutos(o.hora_inicio)
    );
    if (!sePisa) {
      libres.push(aHora(inicio));
    }
  }
  return libres;
}
