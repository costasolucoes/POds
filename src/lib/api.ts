// src/lib/api.ts
const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/+$/,'');
export const API_BASE =
  fromEnv ||
  (location.protocol.startsWith("http")
    ? `${location.protocol}//${location.hostname}${location.port ? ":"+location.port : ""}`
    : "");

export const api = {
  checkout: () => `${API_BASE}/checkout`,
  tx: (id: string) => `${API_BASE}/tx/${encodeURIComponent(id)}`,
};