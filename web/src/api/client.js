const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN = "demo-token";

async function request(path, init = {}) {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${TOKEN}`
    }
  });

  if (!r.ok) {
    const raw = await r.text();
    let message = raw;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.detail) {
        message = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
      }
    } catch (parseError) {
      console.debug("No se pudo parsear error JSON de la API", parseError);
    }

    throw new Error(`HTTP ${r.status}: ${message}`);
  }

  return r.json();
}

export const api = {
  get: (path) => request(path),
  put: (path, body) =>
    request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body)
    })
};
