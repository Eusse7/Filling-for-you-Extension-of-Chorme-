  /* eslint-disable react/prop-types */
import React, { useState } from "react";
import Card from "../components/Card.jsx";
import { authApi, setAccessToken } from "../api/client.js";

function getAuthTitle(mode) {
  switch (mode) {
    case "register":
      return "Crear cuenta";
    case "reset-request":
      return "Recuperar contraseña";
    case "reset-confirm":
      return "Validar código";
    default:
      return "Iniciar sesión";
  }
}

function getAuthSubtitle(mode) {
  if (mode === "reset-request" || mode === "reset-confirm") {
    return "Te enviaremos un código al correo de tu cuenta";
  }

  return "Accede para editar perfil y usar la extensión";
}

function AuthNameFields({ form, setForm }) {
  return (
    <div className="row2">
      <label>
        <span>Nombre</span>
        <input
          autoComplete="given-name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
      </label>
      <label>
        <span>Apellido</span>
        <input
          autoComplete="family-name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
      </label>
    </div>
  );
}

function AuthEmailField({ value, onChange }) {
  return (
    <label>
      <span>Email</span>
      <input autoComplete="email" type="email" value={value} onChange={onChange} />
    </label>
  );
}

function AuthPasswordField({ value, onChange, autoComplete = "current-password" }) {
  return (
    <label>
      <span>Contraseña</span>
      <input autoComplete={autoComplete} type="password" value={value} onChange={onChange} />
    </label>
  );
}

function extractErrorDetails(rawMessage) {
  const match = /HTTP\s+(\d+):\s*(.*)/i.exec(rawMessage);
  if (!match) return null;
  return { status: Number(match[1]), detail: match[2] || "" };
}

function formatValidationError(detail) {
  try {
    const parsed = JSON.parse(detail);
    const issues = Array.isArray(parsed) ? parsed : [];
    const messages = [];

    if (issues.some((issue) => issue?.loc?.includes?.("email"))) {
      messages.push("Ingresa un email válido.");
    }
    if (issues.some((issue) => issue?.loc?.includes?.("password"))) {
      messages.push("La contraseña debe tener al menos 8 caracteres.");
    }
    return messages.length > 0 ? messages.join(" ") : "Revisa los datos e intenta de nuevo.";
  } catch (parseError) {
    console.debug("No se pudo parsear el detalle de validacion", parseError);
    return "Revisa los datos e intenta de nuevo.";
  }
}

function formatModeSpecificError(mode, status) {
  switch (mode) {
    case "login":
      return status === 401 ? "Correo o contraseña incorrectos." : null;
    case "register":
      return status === 409 ? "El correo ya esta registrado." : null;
    case "reset-request":
      return status === 503
        ? "No pudimos enviar el correo. Intenta de nuevo."
        : "No pudimos procesar la solicitud. Intenta de nuevo.";
    case "reset-confirm":
      return status === 400
        ? "El código o el correo no son válidos."
        : "No pudimos actualizar la contraseña. Intenta de nuevo.";
    default:
      return null;
  }
}

function formatAuthError(mode, error) {
  const rawMessage = error instanceof Error ? error.message : String(error || "");

  if (/failed to fetch|network/i.test(rawMessage)) {
    return "No se pudo conectar con el servidor. Intenta de nuevo.";
  }

  const details = extractErrorDetails(rawMessage);
  if (!details) {
    return "Ocurrió un error. Intenta de nuevo.";
  }

  const { status, detail } = details;

  if (status === 422) {
    return formatValidationError(detail);
  }

  const modeSpecific = formatModeSpecificError(mode, status);
  if (modeSpecific) {
    return modeSpecific;
  }

  if (status >= 500) {
    return "Ocurrió un error en el servidor. Intenta de nuevo.";
  }

  const detailLower = detail.toLowerCase();
  if (detailLower.includes("invalid") || detailLower.includes("credenciales")) {
    return "Correo o contraseña incorrectos.";
  }

  return "Ocurrió un error. Intenta de nuevo.";
}

function ResetRequestInfo({ setMode }) {
  return (
    <div className="authLinks">
      <button type="button" className="linkButton" onClick={() => setMode("reset-request")}>
        ¿Olvidaste tu contraseña?
      </button>
    </div>
  );
}

function ResetCodeFields({ resetForm, setResetForm }) {
  return (
    <>
      <label>
        <span>Código</span>
        <input
          autoComplete="one-time-code"
          inputMode="numeric"
          value={resetForm.code}
          onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })}
        />
      </label>

      <label>
        <span>Nueva contraseña</span>
        <input
          autoComplete="new-password"
          type="password"
          value={resetForm.new_password}
          onChange={(e) => setResetForm({ ...resetForm, new_password: e.target.value })}
        />
      </label>

      <label>
        <span>Confirmar nueva contraseña</span>
        <input
          autoComplete="new-password"
          type="password"
          value={resetForm.confirm_new_password}
          onChange={(e) => setResetForm({ ...resetForm, confirm_new_password: e.target.value })}
        />
      </label>
    </>
  );
}

function AuthActionRow({ mode, isRegister, onSubmit, onRequestReset, onConfirmReset, onBack }) {
  if (mode === "reset-request") {
    return (
      <>
        <button onClick={onRequestReset}>Enviar código</button>
        <button type="button" className="secondary" onClick={onBack}>Volver</button>
      </>
    );
  }

  if (mode === "reset-confirm") {
    return (
      <>
        <button onClick={onConfirmReset}>Cambiar contraseña</button>
        <button type="button" className="secondary" onClick={onRequestReset}>Reenviar código</button>
        <button type="button" className="secondary" onClick={onBack}>Volver</button>
      </>
    );
  }

  return <button onClick={onSubmit}>{isRegister ? "Crear cuenta" : "Entrar"}</button>;
}

function renderModeSpecificFields(mode, resetForm, setResetForm, form, setForm, isRegister) {
  if (mode === "reset-confirm") {
    return <ResetCodeFields resetForm={resetForm} setResetForm={setResetForm} />;
  }

  if (mode === "reset-request") {
    return null;
  }

  return (
    <AuthPasswordField
      autoComplete={isRegister ? "new-password" : "current-password"}
      value={form.password}
      onChange={(e) => setForm({ ...form, password: e.target.value })}
    />
  );
}

function submitAuth(mode, form, setStatus, setAccessToken, onAuth) {
  return async function submit() {
    if (mode === "register" && form.password !== form.confirm_password) {
      setStatus("Las contraseñas no coinciden.");
      return;
    }

    try {
      setStatus(mode === "register" ? "Creando cuenta..." : "Iniciando sesión...");
      const payload = mode === "register"
        ? {
            email: form.email,
            password: form.password,
            first_name: form.first_name,
            last_name: form.last_name
          }
        : { email: form.email, password: form.password };
      const result = mode === "register"
        ? await authApi.register(payload)
        : await authApi.login(payload);

      setAccessToken(result.access_token);
      window.postMessage({ type: "FFY_LOGIN", token: result.access_token }, globalThis.location.origin);
      setStatus("Autenticado correctamente.");
      onAuth?.();
    } catch (e) {
      setStatus(formatAuthError(mode, e));
    }
  };
}

function requestPasswordResetFlow(resetForm, form, setStatus, setMode, setResetForm) {
  return async function requestResetCode() {
    try {
      const email = resetForm.email || form.email;
      setStatus("Enviando código de recuperación...");
      await authApi.requestPasswordReset({ email });
      setStatus("Si la cuenta existe, enviamos un código al correo.");
      setMode("reset-confirm");
      setResetForm((current) => ({
        ...current,
        email,
      }));
    } catch (e) {
      setStatus(formatAuthError("reset-request", e));
    }
  };
}

function confirmPasswordResetFlow(resetForm, setStatus, setMode, setForm, setResetForm) {
  return async function confirmResetCode() {
    if (resetForm.new_password !== resetForm.confirm_new_password) {
      setStatus("Las contraseñas no coinciden.");
      return;
    }

    try {
      setStatus("Validando código y actualizando contraseña...");
      await authApi.confirmPasswordReset({
        email: resetForm.email,
        code: resetForm.code,
        new_password: resetForm.new_password,
      });
      setStatus("Contraseña actualizada. Ahora puedes iniciar sesión.");
      setMode("login");
      setForm((current) => ({ ...current, email: resetForm.email, password: "" }));
      setResetForm({ email: resetForm.email, code: "", new_password: "", confirm_new_password: "" });
    } catch (e) {
      setStatus(formatAuthError("reset-confirm", e));
    }
  };
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: ""
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    code: "",
    new_password: "",
    confirm_new_password: ""
  });
  const [status, setStatus] = useState("");

  const isRegister = mode === "register";
  const isResetRequest = mode === "reset-request";
  const isResetConfirm = mode === "reset-confirm";

  const submit = submitAuth(mode, form, setStatus, setAccessToken, onAuth);
  const requestResetCode = requestPasswordResetFlow(resetForm, form, setStatus, setMode, setResetForm);
  const confirmResetCode = confirmPasswordResetFlow(resetForm, setStatus, setMode, setForm, setResetForm);

  const cardTitle = getAuthTitle(mode);
  const cardSubtitle = getAuthSubtitle(mode);
  const emailValue = isResetRequest || isResetConfirm ? resetForm.email : form.email;
  const showRegisterFields = isRegister;

  return (
    <div className="authContainer">
      <Card
        title={cardTitle}
        subtitle={cardSubtitle}
        right={
          isResetRequest || isResetConfirm ? (
            <button type="button" onClick={() => setMode("login")}>Volver</button>
          ) : (
            <button type="button" onClick={() => setMode(isRegister ? "login" : "register")}>
              {isRegister ? "Ya tengo cuenta" : "Crear cuenta"}
            </button>
          )
        }
      >
        {status && <p className="statusMessage">{status}</p>}

        {showRegisterFields && <AuthNameFields form={form} setForm={setForm} />}

        <AuthEmailField
          value={emailValue}
          onChange={(e) => {
            const value = e.target.value;
            if (isResetRequest || isResetConfirm) {
              setResetForm({ ...resetForm, email: value });
              return;
            }
            setForm({ ...form, email: value });
          }}
        />

        {renderModeSpecificFields(mode, resetForm, setResetForm, form, setForm, isRegister)}

        {showRegisterFields && (
          <label>
            <span>Confirmar contraseña</span>
            <input
              autoComplete="new-password"
              type="password"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            />
          </label>
        )}

        {!isRegister && !isResetRequest && !isResetConfirm && <ResetRequestInfo setMode={setMode} />}

        <div className="authActions">
          <AuthActionRow
            mode={mode}
            isRegister={isRegister}
            onSubmit={submit}
            onRequestReset={requestResetCode}
            onConfirmReset={confirmResetCode}
            onBack={() => setMode("login")}
          />
        </div>
      </Card>
    </div>
  );
}
