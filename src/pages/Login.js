import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import "../css/Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await login({ email, password });
      toast.success("Sesion iniciada correctamente", {
        position: "top-right",
        autoClose: 1500,
        className: "taskflow-toast",
      });
      setTimeout(() => navigate("/task"), 1500);
    } catch (error) {
      toast.error(error.message || "No se pudo iniciar sesion.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      const lowerMessage = error.message?.toLowerCase() || "";
      const googleMessage =
        lowerMessage.includes("provider") || lowerMessage.includes("oauth")
          ? "Activa Google en Supabase Auth y agrega el redirect URL del proyecto."
          : error.message || "No se pudo iniciar con Google.";

      toast.error(googleMessage, {
        position: "top-right",
        autoClose: 4500,
        className: "taskflow-toast",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <ToastContainer />
      <section className="auth-showcase">
        <div>
          <span className="auth-showcase__badge">
            <i className="bi bi-lightning-charge-fill"></i> TaskFlow
          </span>
          <h1 className="auth-showcase__title">
            Organiza tu dia con una vista <span>clara</span> de prioridades.
          </h1>
          <p className="auth-showcase__subtitle">
            Entra a tu workspace para ver pendientes, fechas cercanas y avances
            sin perder el foco entre pantallas.
          </p>
        </div>

        <div className="auth-showcase__panel">
          <div className="auth-showcase__metric">
            <strong>Hoy</strong>
            <span>Revisa lo importante antes de empezar.</span>
          </div>
          <div className="auth-showcase__metric">
            <strong>Prioridad</strong>
            <span>Ubica rapido las tareas que necesitan accion.</span>
          </div>
          <div className="auth-showcase__metric">
            <strong>Avance</strong>
            <span>Mantente al tanto de lo pendiente y completado.</span>
          </div>
        </div>
      </section>

      <section className="auth-card-shell">
        <div className="auth-card">
          <img src="/icon.jpg" alt="TaskFlow Logo" className="auth-card__logo" />
          <h2 className="auth-card__title">Bienvenido</h2>
          <p className="auth-card__subtitle">
            Inicia sesion para continuar con tu tablero de trabajo.
          </p>

          <form onSubmit={handleSubmit} className="auth-form-grid">
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Tu password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="primary-submit" disabled={submitting}>
              {submitting ? "Ingresando..." : "Entrar al dashboard"}
            </button>
            <button
              type="button"
              className="secondary-submit"
              onClick={handleGoogleLogin}
              disabled={submitting}
            >
              <i className="bi bi-google"></i>Continuar con Google
            </button>
          </form>

          <p className="auth-footer-link">
            No tienes cuenta? <a href="/register">Crear una ahora</a>
          </p>
          <p className="auth-legal">
            Tus tareas se sincronizan de forma segura con tu cuenta.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
