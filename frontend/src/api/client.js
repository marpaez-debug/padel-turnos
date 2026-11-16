const URL_API = "http://127.0.0.1:8000";

// Función que avisa a la app cuando la sesión venció (la registra AuthContext)
let alExpirarSesion = null;

export function configurarAlExpirarSesion(funcion) {
  alExpirarSesion = funcion;
}

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
    const detalle = json.detail;

    // 401 con una sesión iniciada (y fuera del login/registro): el token venció o ya no sirve
    const esRutaPublica = ruta === "/auth/login" || ruta === "/auth/register";
    if (respuesta.status === 401 && token && !esRutaPublica) {
      const mensaje =
        detalle === "Token vencido"
          ? "Tu sesión expiró. Volvé a iniciar sesión."
          : "Tu sesión ya no es válida. Volvé a iniciar sesión.";
      if (alExpirarSesion) {
        alExpirarSesion(mensaje);
      }
      throw new Error(mensaje);
    }

    if (typeof detalle === "string") {
      throw new Error(detalle);
    }
    throw new Error("Hay datos inválidos, revisá el formulario");
  }

  return json;
}
