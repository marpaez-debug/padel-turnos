import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { validarLogin } from "../utils/validators";

export default function Login() {
  const { usuario, login } = useAuth();
  const [datos, setDatos] = useState({ email: "", password: "" });
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState("");

  // Si ya hay sesión, no tiene sentido mostrar el login
  if (usuario) {
    return <Navigate to="/" />;
  }

  function cambiar(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErrorApi("");

    // 1) validamos en el navegador
    const erroresForm = validarLogin(datos);
    setErrores(erroresForm);
    if (Object.keys(erroresForm).length > 0) {
      return;
    }

    // 2) la API vuelve a validar
    try {
      await login(datos.email.trim(), datos.password);
    } catch (error) {
      setErrorApi(error.message);
    }
  }

  return (
    <div className="tarjeta">
      <h1>Ingresar</h1>
      <form onSubmit={enviar} noValidate>
        <Field label="Email" name="email" type="email" value={datos.email}
               onChange={cambiar} error={errores.email} />
        <Field label="Contraseña" name="password" type="password" value={datos.password}
               onChange={cambiar} error={errores.password} />
        {errorApi && <p className="error-api">{errorApi}</p>}
        <button type="submit">Ingresar</button>
      </form>
      <p>
        ¿No tenés cuenta? <Link to="/registro">Crear cuenta</Link>
      </p>
    </div>
  );
}
