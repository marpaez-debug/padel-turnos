import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { registrar } from "../api/auth";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { validarRegistro } from "../utils/validators";

export default function Register() {
  const { usuario, login } = useAuth();
  const [datos, setDatos] = useState({ nombre: "", email: "", password: "", confirmar: "" });
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState("");

  if (usuario) {
    return <Navigate to="/" />;
  }

  function cambiar(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErrorApi("");

    const erroresForm = validarRegistro(datos);
    setErrores(erroresForm);
    if (Object.keys(erroresForm).length > 0) {
      return;
    }

    try {
      const email = datos.email.trim();
      await registrar({ nombre: datos.nombre.trim(), email: email, password: datos.password });
      await login(email, datos.password); // después de registrarse entra directo
    } catch (error) {
      setErrorApi(error.message);
    }
  }

  return (
    <div className="tarjeta">
      <h1>Crear cuenta</h1>
      <form onSubmit={enviar} noValidate>
        <Field label="Nombre" name="nombre" value={datos.nombre}
               onChange={cambiar} error={errores.nombre} />
        <Field label="Email" name="email" type="email" value={datos.email}
               onChange={cambiar} error={errores.email} />
        <Field label="Contraseña" name="password" type="password" value={datos.password}
               onChange={cambiar} error={errores.password} />
        <Field label="Repetir contraseña" name="confirmar" type="password" value={datos.confirmar}
               onChange={cambiar} error={errores.confirmar} />
        {errorApi && <p className="error-api">{errorApi}</p>}
        <button type="submit">Crear cuenta</button>
      </form>
      <p>
        ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
      </p>
    </div>
  );
}
