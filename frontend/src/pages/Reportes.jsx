import { useEffect, useState } from "react";

import { reporteCanchasLibres, reporteClientesFrecuentes, reporteIngresos } from "../api/reportes";
import TablaReporte from "../components/TablaReporte";
import { exportarPDF } from "../utils/exportar";
import { hoy } from "../utils/horarios";

const columnasIngresos = [
  { clave: "mes", titulo: "Mes" },
  { clave: "cancha", titulo: "Cancha" },
  { clave: "turnos", titulo: "Turnos" },
  { clave: "ingresos", titulo: "Ingresos", dinero: true },
];

const columnasClientes = [
  { clave: "nombre", titulo: "Cliente" },
  { clave: "email", titulo: "Email" },
  { clave: "total_turnos", titulo: "Turnos" },
];

const columnasLibres = [
  { clave: "nombre", titulo: "Cancha" },
  { clave: "tipo", titulo: "Tipo" },
  { clave: "precio_hora", titulo: "Precio por hora", dinero: true },
];

export default function Reportes() {
  const [ingresos, setIngresos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [libres, setLibres] = useState(null); // null = todavía no se buscó
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  // Al abrir la pantalla pedimos los dos primeros reportes
  useEffect(() => {
    Promise.all([reporteIngresos(), reporteClientesFrecuentes()])
      .then(([datosIngresos, datosClientes]) => {
        setIngresos(datosIngresos);
        setClientes(datosClientes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  async function buscarLibres() {
    setError("");
    if (!fecha) {
      setError("Elegí una fecha");
      return;
    }
    try {
      setLibres(await reporteCanchasLibres(fecha));
    } catch (err) {
      setError(err.message);
    }
  }

  // Datos del dashboard, calculados a partir del reporte de ingresos
  const totalTurnos = ingresos.reduce((suma, fila) => suma + fila.turnos, 0);
  const totalIngresos = ingresos.reduce((suma, fila) => suma + fila.ingresos, 0);

  return (
    <>
      <div className="reporte-cabecera">
        <h1>Reportes</h1>
        <button className="no-imprimir" onClick={exportarPDF}>Exportar a PDF</button>
      </div>

      {error && <p className="error-api">{error}</p>}
      {cargando && <p className="mensaje">Cargando reportes...</p>}

      {!cargando && (
        <>
          <div className="resumen">
            <div className="dato">
              Turnos (sin cancelados)
              <strong>{totalTurnos}</strong>
            </div>
            <div className="dato">
              Ingresos totales
              <strong>${totalIngresos.toLocaleString("es-AR")}</strong>
            </div>
            <div className="dato">
              Clientes frecuentes
              <strong>{clientes.length}</strong>
            </div>
          </div>

          <TablaReporte titulo="Ingresos por mes y cancha" archivo="ingresos"
                        columnas={columnasIngresos} filas={ingresos} />

          <TablaReporte titulo="Clientes con más turnos que el promedio" archivo="clientes-frecuentes"
                        columnas={columnasClientes} filas={clientes} />

          <section className="reporte">
            <h2>Canchas libres en una fecha</h2>
            <div className="busqueda no-imprimir">
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <button onClick={buscarLibres}>Ver canchas libres</button>
            </div>
          </section>
          {libres !== null && (
            <TablaReporte titulo={"Canchas sin turnos el " + fecha.split("-").reverse().join("/")}
                          archivo="canchas-libres" columnas={columnasLibres} filas={libres} />
          )}
        </>
      )}
    </>
  );
}
