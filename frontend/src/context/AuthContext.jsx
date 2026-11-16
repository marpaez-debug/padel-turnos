import { createContext, useContext, useEffect, useState } from "react";

import { login as loginApi, obtenerPerfil } from "../api/auth";
import { borrarToken, configurarAlExpirarSesion, guardarToken, obtenerToken } from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [avisoSesion, setAvisoSesion] = useState("");

  // Si la API dice que la sesión venció, cerramos la sesión: ProtectedRoute nos manda al
  // login y ahí se muestra el aviso. (Va antes del efecto de abajo para que ya esté
  // registrado cuando se pide el perfil.)
  useEffect(() => {
    configurarAlExpirarSesion((mensaje) => {
      borrarToken();
      setUsuario(null);
      setAvisoSesion(mensaje);
    });
  }, []);

  useEffect(() => {
    if (!obtenerToken()) {
      setCargando(false);
      return;
    }
    obtenerPerfil()
      .then((datos) => setUsuario(datos))
      .catch(() => borrarToken()) // token vencido o inválido
      .finally(() => setCargando(false));
  }, []);

  async function login(email, password) {
    const respuesta = await loginApi(email, password);
    guardarToken(respuesta.access_token);
    setAvisoSesion("");
    setUsuario(respuesta.usuario);
  }

  function logout() {
    borrarToken();
    setAvisoSesion("");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, avisoSesion, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
