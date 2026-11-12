import { useEffect, useState } from "react";

import { actualizarCancha, crearCancha, eliminarCancha, listarCanchas } from "../api/canchas";
import Field from "../components/Field";
import { validarCancha } from "../utils/validators";

const FORM_VACIO = { nombre: "", tipo: "techada", precio_hora: "", activa: true };

export default function Canchas() {
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");       // errores de la lista (cargar, eliminar)
  const [mensaje, setMensaje] = useState("");   // avisos de "todo salió bien"

  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null); // null = estamos dando de alta
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState("");

  async function cargarCanchas() {
    try {
      setCanchas(await listarCanchas());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCanchas();
  }, []);

  function cambiar(e) {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: valor });
  }

  function limpiarFormulario() {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setErrores({});
    setErrorApi("");
  }

  // Carga los datos de la cancha en el formulario para modificarla
  function editar(cancha) {
    setForm({
      nombre: cancha.nombre,
      tipo: cancha.tipo,
      precio_hora: String(cancha.precio_hora),
      activa: cancha.activa,
    });
    setEditandoId(cancha.id);
    setErrores({});
    setErrorApi("");
    setMensaje("");
  }

  async function enviar(e) {
    e.preventDefault();
    setErrorApi("");
    setMensaje("");

    // 1) validamos en el navegador
    const erroresForm = validarCancha(form);
    setErrores(erroresForm);
    if (Object.keys(erroresForm).length > 0) {
      return;
    }

    const datos = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      precio_hora: Number(form.precio_hora),
      activa: form.activa,
    };

    // 2) la API valida otra vez y guarda
    try {
      if (editandoId === null) {
        await crearCancha(datos);
        setMensaje("Cancha creada");
      } else {
        await actualizarCancha(editandoId, datos);
        setMensaje("Cancha actualizada");
      }
      limpiarFormulario();
      await cargarCanchas();
    } catch (err) {
      setErrorApi(err.message);
    }
  }

  async function eliminar(cancha) {
    if (!window.confirm("¿Eliminar la " + cancha.nombre + "?")) {
      return;
    }
    setError("");
    setMensaje("");
    try {
      await eliminarCancha(cancha.id);
      if (editandoId === cancha.id) {
        limpiarFormulario();
      }
      setMensaje("Cancha eliminada");
      await cargarCanchas();
    } catch (err) {
      setError(err.message); // por ejemplo: la cancha tiene turnos
    }
  }

  return (
    <>
      <h1>Canchas</h1>

      <form className="formulario" onSubmit={enviar} noValidate>
        <h2>{editandoId === null ? "Nueva cancha" : "Modificar cancha"}</h2>
        <Field label="Nombre" name="nombre" value={form.nombre}
               onChange={cambiar} error={errores.nombre} />
        <label className="campo">
          Tipo
          <select name="tipo" value={form.tipo} onChange={cambiar}>
            <option value="techada">Techada</option>
            <option value="descubierta">Descubierta</option>
          </select>
          {errores.tipo && <span className="error">{errores.tipo}</span>}
        </label>
        <Field label="Precio por hora" name="precio_hora" type="number" value={form.precio_hora}
               onChange={cambiar} error={errores.precio_hora} />
        <label className="check">
          <input type="checkbox" name="activa" checked={form.activa} onChange={cambiar} />
          Cancha activa
        </label>
        {errorApi && <p className="error-api">{errorApi}</p>}
        <div className="acciones">
          <button type="submit">{editandoId === null ? "Crear cancha" : "Guardar cambios"}</button>
          {editandoId !== null && (
            <button type="button" className="secundario" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {mensaje && <p className="ok">{mensaje}</p>}
      {error && <p className="error-api">{error}</p>}
      {cargando && <p className="mensaje">Cargando canchas...</p>}

      {!cargando && (
        <table>
          <thead>
            <tr>
              <th>Cancha</th>
              <th>Tipo</th>
              <th>Precio por hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {canchas.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.tipo}</td>
                <td>${c.precio_hora.toLocaleString("es-AR")}</td>
                <td>{c.activa ? "Activa" : "Inactiva"}</td>
                <td className="acciones">
                  <button className="secundario" onClick={() => editar(c)}>Editar</button>
                  <button className="peligro" onClick={() => eliminar(c)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
