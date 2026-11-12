import { useEffect, useState } from "react";

import { listarCanchas } from "../api/canchas";
import {
  cambiarEstadoTurno,
  cancelarTurno,
  listarOcupados,
  listarTurnos,
  reservarTurno,
} from "../api/turnos";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { hoy, horariosLibres } from "../utils/horarios";
import { validarTurno } from "../utils/validators";

const FORM_VACIO = {
  cancha_id: "",
  fecha: "",
  hora_inicio: "",
  duracion_min: "90",
  metodo_pago: "efectivo",
};

export default function Turnos() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === "admin";

  const [canchas, setCanchas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [ocupados, setOcupados] = useState([]); // horarios ocupados de la cancha y fecha elegidas
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState("");

  async function cargarTurnos() {
    try {
      setTurnos(await listarTurnos());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function cargarOcupados(canchaId, fecha) {
    if (!canchaId || !fecha) {
      setOcupados([]);
      return;
    }
    try {
      setOcupados(await listarOcupados(canchaId, fecha));
    } catch (err) {
      setErrorApi(err.message);
    }
  }

  // Al abrir la pantalla: canchas activas y turnos
  useEffect(() => {
    listarCanchas()
      .then((datos) => setCanchas(datos.filter((c) => c.activa)))
      .catch((err) => setError(err.message));
    cargarTurnos();
  }, []);

  // Cada vez que cambia la cancha o la fecha, pedimos qué horarios están ocupados
  useEffect(() => {
    cargarOcupados(form.cancha_id, form.fecha);
  }, [form.cancha_id, form.fecha]);

  function cambiar(e) {
    const { name, value } = e.target;
    const nuevo = { ...form, [name]: value };
    // si cambia algo que modifica los horarios posibles, borramos el horario elegido
    if (name !== "hora_inicio" && name !== "metodo_pago") {
      nuevo.hora_inicio = "";
    }
    setForm(nuevo);
  }

  const hayCanchaYFecha = form.cancha_id !== "" && form.fecha !== "";
  const libres = hayCanchaYFecha ? horariosLibres(ocupados, Number(form.duracion_min), form.fecha) : [];

  async function enviar(e) {
    e.preventDefault();
    setErrorApi("");
    setMensaje("");

    // 1) validamos en el navegador
    const erroresForm = validarTurno(form);
    setErrores(erroresForm);
    if (Object.keys(erroresForm).length > 0) {
      return;
    }

    // 2) la API valida otra vez y ejecuta el procedimiento almacenado
    try {
      await reservarTurno({
        cancha_id: Number(form.cancha_id),
        fecha: form.fecha,
        hora_inicio: form.hora_inicio,
        duracion_min: Number(form.duracion_min),
        metodo_pago: form.metodo_pago,
      });
      setMensaje("Turno reservado");
      setForm({ ...form, hora_inicio: "" });
      await cargarTurnos();
      await cargarOcupados(form.cancha_id, form.fecha);
    } catch (err) {
      setErrorApi(err.message);
    }
  }

  // Ejecuta una acción sobre un turno y después refresca todo
  async function accion(funcion, textoOk) {
    setError("");
    setMensaje("");
    try {
      await funcion();
      setMensaje(textoOk);
      await cargarTurnos();
      await cargarOcupados(form.cancha_id, form.fecha);
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelar(turno) {
    if (window.confirm("¿Cancelar el turno del " + turno.fecha + " a las " + turno.hora_inicio + "?")) {
      accion(() => cancelarTurno(turno.id), "Turno cancelado");
    }
  }

  function completar(turno) {
    accion(() => cambiarEstadoTurno(turno.id, "completado"), "Turno marcado como completado");
  }

  return (
    <>
      <h1>Turnos</h1>

      <form className="formulario" onSubmit={enviar} noValidate>
        <h2>Reservar un turno</h2>

        <label className="campo">
          Cancha
          <select name="cancha_id" value={form.cancha_id} onChange={cambiar}>
            <option value="">Elegí una cancha</option>
            {canchas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo}) - ${c.precio_hora.toLocaleString("es-AR")} la hora
              </option>
            ))}
          </select>
          {errores.cancha_id && <span className="error">{errores.cancha_id}</span>}
        </label>

        <Field label="Fecha" name="fecha" type="date" min={hoy()} value={form.fecha}
               onChange={cambiar} error={errores.fecha} />

        <label className="campo">
          Duración
          <select name="duracion_min" value={form.duracion_min} onChange={cambiar}>
            <option value="60">60 minutos</option>
            <option value="90">90 minutos</option>
            <option value="120">120 minutos</option>
          </select>
        </label>

        {ocupados.length > 0 && (
          <p className="mensaje">
            Ocupado ese día: {ocupados.map((o) => o.hora_inicio + " a " + o.hora_fin).join(", ")}
          </p>
        )}

        <label className="campo">
          Horario de inicio
          <select name="hora_inicio" value={form.hora_inicio} onChange={cambiar} disabled={!hayCanchaYFecha}>
            <option value="">
              {hayCanchaYFecha && libres.length === 0 ? "No hay horarios libres" : "Elegí un horario"}
            </option>
            {libres.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          {errores.hora_inicio && <span className="error">{errores.hora_inicio}</span>}
        </label>

        <label className="campo">
          Método de pago de la seña
          <select name="metodo_pago" value={form.metodo_pago} onChange={cambiar}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </label>

        {errorApi && <p className="error-api">{errorApi}</p>}
        <button type="submit">Reservar</button>
      </form>

      {mensaje && <p className="ok">{mensaje}</p>}
      {error && <p className="error-api">{error}</p>}

      <h2>{esAdmin ? "Todos los turnos" : "Mis turnos"}</h2>
      {cargando && <p className="mensaje">Cargando turnos...</p>}
      {!cargando && turnos.length === 0 && <p className="mensaje">Todavía no hay turnos.</p>}

      {turnos.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Cancha</th>
              {esAdmin && <th>Cliente</th>}
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((t) => (
              <tr key={t.id}>
                <td>{t.fecha.split("-").reverse().join("/")}</td>
                <td>{t.hora_inicio} a {t.hora_fin}</td>
                <td>{t.cancha_nombre}</td>
                {esAdmin && <td>{t.usuario_nombre}</td>}
                <td>${t.precio_total.toLocaleString("es-AR")}</td>
                <td>{t.estado}</td>
                <td className="acciones">
                  {t.estado === "reservado" && (
                    <>
                      {esAdmin && (
                        <button className="secundario" onClick={() => completar(t)}>Completar</button>
                      )}
                      <button className="peligro" onClick={() => cancelar(t)}>Cancelar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
