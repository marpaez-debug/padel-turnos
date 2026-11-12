// Exportación de reportes sin librerías

// Prepara un valor para ponerlo en una celda del CSV
function celda(valor) {
  let texto = String(valor ?? "");
  if (typeof valor === "number") {
    texto = texto.replace(".", ","); // Excel en español usa coma para los decimales
  }
  // si el texto tiene punto y coma, comillas o saltos de línea, va entre comillas
  if (/[;"\n]/.test(texto)) {
    texto = '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

// Descarga un archivo .csv que se abre con Excel
export function exportarExcel(nombreArchivo, columnas, filas) {
  const lineas = [columnas.map((c) => celda(c.titulo)).join(";")];
  filas.forEach((fila) => {
    lineas.push(columnas.map((c) => celda(fila[c.clave])).join(";"));
  });

  // "\uFEFF" al principio hace que Excel muestre bien las tildes
  const contenido = "\uFEFF" + lineas.join("\r\n");
  const archivo = new Blob([contenido], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo + ".csv";
  enlace.click();
  URL.revokeObjectURL(url);
}

// Abre el cuadro de impresión: ahí se elige "Guardar como PDF"
export function exportarPDF() {
  window.print();
}
