import { useEffect, useState } from "react";

import { listarCanchas } from "../api/canchas";
import { useAuth } from "../context/AuthContext";

export default function Inicio() {
  const { usuario } = useAuth();
  const [canchas, setCanchas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  // Cuando se abre la pantalla, pedimos las canchas a la API
  useEffect(() => {
    listarCanchas()
      .then((datos) => setCanchas(datos))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <>
      <h1>Hola, {usuario.nombre}</h1>
      <h2>Canchas</h2>

      {cargando && <p className="mensaje">Cargando canchas...</p>}
      {error && <p className="error-api">{error}</p>}

      {!cargando && !error && (
        <table>
          <thead>
            <tr>
              <th>Cancha</th>
              <th>Tipo</th>
              <th>Precio por hora</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {canchas.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.tipo}</td>
                <td>${c.precio_hora.toLocaleString("es-AR")}</td>
                <td>{c.activa ? "Disponible" : "Inactiva"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
