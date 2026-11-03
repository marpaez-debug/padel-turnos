import { pedir } from "./client";

export function listarCanchas() {
  return pedir("/canchas");
}
