  /* eslint-disable react/prop-types */
import React, { useState } from "react";
import Card from "../components/Card.jsx";
import { authApi, setAccessToken } from "../api/client.js";

export default function AuthPage({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: ""
  });
  const [status, setStatus] = useState("");

  async function submit() {
    if (isRegister && form.password !== form.confirm_password) {
      setStatus("Las contraseñas no coinciden.");
      return;
    }

    try {
      setStatus(isRegister ? "Creando cuenta..." : "Iniciando sesión...");
      const payload = isRegister
        ? {
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name
        }
        : { email: form.email, password: form.password };
      const result = isRegister
        ? await authApi.register(payload)
        : await authApi.login(payload);

      setAccessToken(result.access_token);
      setStatus("Autenticado correctamente.");
      onAuth?.();
    } catch (e) {
      setStatus(String(e));
    }
  }

  return (
    <Card
      title={isRegister ? "Crear cuenta" : "Iniciar sesión"}
      subtitle="Accede para editar perfil y usar la extensión"
      right={
        <button onClick={() => setIsRegister((v) => !v)}>
          {isRegister ? "Ya tengo cuenta" : "Crear cuenta"}
        </button>
      }
    >
      <p className="muted">{status}</p>

      {isRegister && (
        <div className="row2">
          <label>
            <span>Nombre</span>
            <input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </label>
          <label>
            <span>Apellido</span>
            <input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </label>
        </div>
      )}

      <label>
        <span>Email</span>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>

      <label>
        <span>Contraseña</span>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>

      {isRegister && (
        <label>
          <span>Confirmar contraseña</span>
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
          />
        </label>
      )}

      <button onClick={submit}>{isRegister ? "Crear cuenta" : "Entrar"}</button>
    </Card>
  );
}
