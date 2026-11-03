// Acá se hacen todos los pedidos a la API (con fetch) y se maneja el token

const URL_API = "http://127.0.0.1:8000";

export function guardarToken(token) {
  localStorage.setItem("token", token);
}

export function obtenerToken() {
  return localStorage.getItem("token");
}

export function borrarToken() {
  localStorage.removeItem("token");
}

export async function pedir(ruta, metodo = "GET", datos) {
  const headers = { "Content-Type": "application/json" };
  const token = obtenerToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  let respuesta;
  try {
    respuesta = await fetch(URL_API + ruta, {
      method: metodo,
      headers: headers,
      body: datos ? JSON.stringify(datos) : undefined,
    });
  } catch (error) {
    throw new Error("No se pudo conectar con la API. ¿Está corriendo el backend?");
  }

  if (respuesta.status === 204) {
    return null;
  }

  const json = await respuesta.json();

  if (!respuesta.ok) {
    // "detail" es un texto, o una lista cuando el error es 422 (validación)
    const detalle = json.detail;
    if (typeof detalle === "string") {
      throw new Error(detalle);
    }
    throw new Error("Hay datos inválidos, revisá el formulario");
  }

  return json;
}
