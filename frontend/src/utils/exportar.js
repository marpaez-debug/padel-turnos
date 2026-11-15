function celda(valor) {
  let texto = String(valor ?? "");
  if (typeof valor === "number") {
    texto = texto.replace(".", ",");
  }
  if (/[;"\n]/.test(texto)) {
    texto = '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

export function exportarExcel(nombreArchivo, columnas, filas) {
  const lineas = [columnas.map((c) => celda(c.titulo)).join(";")];
  filas.forEach((fila) => {
    lineas.push(columnas.map((c) => celda(fila[c.clave])).join(";"));
  });

  const contenido = "\uFEFF" + lineas.join("\r\n");
  const archivo = new Blob([contenido], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo + ".csv";
  enlace.click();
  URL.revokeObjectURL(url);
}

export function exportarPDF() {
  window.print();
}
