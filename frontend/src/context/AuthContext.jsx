import { createContext, useContext, useEffect, useState } from "react";

import { login as loginApi, obtenerPerfil } from "../api/auth";
import { borrarToken, guardarToken, obtenerToken } from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la página: si hay un token guardado, le preguntamos a la API quién es
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
    setUsuario(respuesta.usuario);
  }

  function logout() {
    borrarToken();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
