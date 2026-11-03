import { pedir } from "./client";

export function login(email, password) {
  return pedir("/auth/login", "POST", { email, password });
}

export function registrar(datos) {
  return pedir("/auth/register", "POST", datos);
}

export function obtenerPerfil() {
  return pedir("/auth/me");
}
