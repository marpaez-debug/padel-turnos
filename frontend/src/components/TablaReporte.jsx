import { exportarExcel } from "../utils/exportar";

// Muestra una tabla de un reporte con su botón para exportar a Excel
// columnas: [{ clave, titulo, dinero? }]
export default function TablaReporte({ titulo, archivo, columnas, filas }) {
  return (
    <section className="reporte">
      <div className="reporte-cabecera">
        <h2>{titulo}</h2>
        <button
          className="secundario no-imprimir"
          onClick={() => exportarExcel(archivo, columnas, filas)}
          disabled={filas.length === 0}
        >
          Exportar a Excel
        </button>
      </div>

      {filas.length === 0 ? (
        <p className="mensaje">No hay datos para este reporte.</p>
      ) : (
        <table>
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.clave}>{c.titulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i}>
                {columnas.map((c) => (
                  <td key={c.clave}>
                    {c.dinero ? "$" + fila[c.clave].toLocaleString("es-AR") : fila[c.clave]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
