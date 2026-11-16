export function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mes + "-" + dia;
}

// El fin de un turno que termina a medianoche viene como "24:00" (así se calcula bien);
// en pantalla se muestra como "00:00"
export function mostrarHora(hora) {
  return hora === "24:00" ? "00:00" : hora;
}

function aMinutos(hora) {
  const partes = hora.split(":");
  return Number(partes[0]) * 60 + Number(partes[1]);
}

function aHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return h + ":" + m;
}

export function horariosLibres(ocupados, duracion, fecha) {
  const libres = [];
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  for (let inicio = 8 * 60; inicio + duracion <= 24 * 60; inicio += 30) {
    const fin = inicio + duracion;

    if (fecha === hoy() && inicio <= minutosAhora) {
      continue;
    }

    const sePisa = ocupados.some(
      (o) => inicio < aMinutos(o.hora_fin) && fin > aMinutos(o.hora_inicio)
    );
    if (!sePisa) {
      libres.push(aHora(inicio));
    }
  }
  return libres;
}
