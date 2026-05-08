import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import "../css/Auth.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await register(formData);
      const needsConfirmation = !result.session;

      toast.success(
        needsConfirmation
          ? "Cuenta creada. Revisa tu correo para confirmarla."
          : "Cuenta creada y lista para usarse.",
        {
          position: "top-right",
          autoClose: 2500,
          className: "taskflow-toast",
        }
      );

      setTimeout(() => navigate(needsConfirmation ? "/login" : "/task"), 1800);
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la cuenta.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <ToastContainer />
      <section className="auth-showcase">
        <div>
          <span className="auth-showcase__badge">
            <i className="bi bi-stars"></i> Nuevo workspace
          </span>
          <h1 className="auth-showcase__title">
            Crea tu espacio para trabajar con <span>orden</span> desde el primer dia.
          </h1>
          <p className="auth-showcase__subtitle">
            Guarda tus tareas, organiza prioridades y consulta tu progreso desde un
            tablero conectado a tu cuenta.
          </p>
        </div>

        <div className="auth-showcase__panel">
          <div className="auth-showcase__metric">
            <strong>Plan</strong>
            <span>Convierte pendientes sueltos en una lista accionable.</span>
          </div>
          <div className="auth-showcase__metric">
            <strong>Foco</strong>
            <span>Separa lo urgente, lo importante y lo que puede esperar.</span>
          </div>
          <div className="auth-showcase__metric">
            <strong>Control</strong>
            <span>Consulta tu calendario, estados y estadisticas cuando lo necesites.</span>
          </div>
        </div>
      </section>

      <section className="auth-card-shell">
        <div className="auth-card">
          <img src="/icon.jpg" alt="TaskFlow Logo" className="auth-card__logo" />
          <h2 className="auth-card__title">Crear cuenta</h2>
          <p className="auth-card__subtitle">
            Completa tus datos para preparar tu perfil de trabajo.
          </p>

          <form onSubmit={handleSubmit} className="auth-form-grid">
            <div className="auth-grid-2">
              <div className="auth-field">
                <label htmlFor="register-name">Nombre</label>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="Nombre"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="register-lastname">Apellido</label>
                <input
                  id="register-lastname"
                  type="text"
                  name="lastName"
                  placeholder="Apellido"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-phone">Telefono</label>
              <input
                id="register-phone"
                type="text"
                name="phone"
                placeholder="3000000000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="Minimo 8 caracteres"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
              />
            </div>

            <button type="submit" className="primary-submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear cuenta"}
            </button>
          </form>

          <p className="auth-footer-link">
            Ya tienes cuenta? <a href="/login">Inicia sesion</a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;
