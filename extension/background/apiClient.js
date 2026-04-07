import { getToken } from "./storage.js";

const API_BASE = "http://localhost:3000";

async function request(path, init = {}) {
  const token = await getToken();
  const headers = {
    ...init.headers
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
};
