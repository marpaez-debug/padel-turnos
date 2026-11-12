import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Canchas from "./pages/Canchas";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Turnos from "./pages/Turnos";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      {/* Estas rutas solo se ven si hay sesión iniciada */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/turnos" element={<Turnos />} />

          {/* Y estas, además, solo para el admin */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/canchas" element={<Canchas />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
