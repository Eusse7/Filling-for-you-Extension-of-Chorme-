const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN_KEY = "ffy_access_token";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

function buildHeaders(initHeaders = {}, withAuth = true) {
  const headers = { ...initHeaders };
  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

async function request(path, init = {}, withAuth = true) {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: buildHeaders(init.headers, withAuth)
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

  if (r.status === 204) {
    return null;
  }

  return r.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body)
    }),
  put: (path, body) =>
    request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body)
    }),
  delete: (path) => request(path, { method: "DELETE" })
};

export const authApi = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    }, false),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    }, false),
  me: () => request("/auth/me"),
  requestPasswordReset: (payload) =>
    request("/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    }, false),
  confirmPasswordReset: (payload) =>
    request("/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    }, false)
};
