import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p className="mensaje">Cargando...</p>;
  }
  if (!usuario) {
    return <Navigate to="/login" />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" />;
  }
  return <Outlet />;
}
