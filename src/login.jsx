import { useState } from "react";
import { setToken } from "./auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      if (!email || !pass) throw new Error("Completá email y contraseña.");

      const res = await fetch("https://deecd96e0dd3.ngrok-free.app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password: pass }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "No pudimos iniciar sesión.");
      }

      const data = await res.json().catch(() => ({}));
      const token = data?.token || data?.accessToken;
      if (!token) throw new Error("Respuesta del servidor inválida.");

      setToken(token);
      onLogin?.();
    } catch (e2) {
      setErr(e2.message || "Error");
    }
  }

  return (
    <div className="login-card">
      <h2 className="login-title">
        <span className="shine-platinum">Iniciar sesión</span>
      </h2>
      <p className="login-subtitle">
        Para enviar consultas y guardar tu historial, necesitás estar logueado.
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@mail.com"
            type="email"
            autoComplete="email"
          />
        </div>

        <div className="login-field">
          <label>Contraseña</label>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
          />
        </div>

        {err && <div className="login-error">{err}</div>}

        <div className="login-actions">
          <button className="login-button" type="submit">
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
