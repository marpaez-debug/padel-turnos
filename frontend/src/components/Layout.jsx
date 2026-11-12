import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <>
      <header className="barra">
        <strong>Turnos de pádel</strong>
        <nav>
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/turnos">Turnos</NavLink>
          {usuario.rol === "admin" && <NavLink to="/canchas">Canchas</NavLink>}
          {usuario.rol === "admin" && <NavLink to="/reportes">Reportes</NavLink>}
        </nav>
        <span>
          {usuario.nombre} ({usuario.rol})
        </span>
        <button onClick={logout}>Salir</button>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
    </>
  );
}
