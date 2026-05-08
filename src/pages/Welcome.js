import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../css/Welcome.css";

const featureCards = [
  {
    icon: "bi-stars",
    title: "Vista clara del trabajo",
    text: "Revisa lo pendiente, lo vencido y lo completado desde un tablero que muestra primero lo importante.",
  },
  {
    icon: "bi-people",
    title: "Espacios colaborativos",
    text: "Crea grupos, invita personas, asigna responsables y mantén cada espacio separado de tus tareas personales.",
  },
  {
    icon: "bi-calendar3",
    title: "Calendario conectado",
    text: "Consulta fechas, sincroniza con Google Calendar y mantén tus entregas visibles en un solo lugar.",
  },
  {
    icon: "bi-bell",
    title: "Alertas oportunas",
    text: "Recibe avisos del navegador y revisa tareas que vencen pronto o necesitan atención inmediata.",
  },
];

const workflowSteps = [
  {
    label: "1. Captura",
    text: "Crea tareas personales o grupales con prioridad, fecha, categoría y contexto claro desde el inicio.",
  },
  {
    label: "2. Organiza",
    text: "Filtra por estado, prioridad o categoría y mantén cada espacio con su propio tablero.",
  },
  {
    label: "3. Avanza",
    text: "Trabaja desde el workflow, abre detalles completos y revisa el progreso sin perder foco.",
  },
];

const planCards = [
  {
    name: "Free",
    price: "Gratis",
    note: "Para arrancar y organizar el trabajo esencial.",
    badge: "Base",
    features: [
      "Tareas personales ilimitadas",
      "Hasta 5 grupos",
      "Calendario interno",
      "Alertas del navegador",
    ],
  },
  {
    name: "Pro",
    price: "$7 USD / mes",
    note: "Para personas que quieren mas control y mas visibilidad.",
    badge: "Mas elegido",
    featured: true,
    features: [
      "Todo lo de Free",
      "Sincronizacion completa con Google Calendar",
      "Mas automatizaciones y recordatorios",
      "Historial extendido y mejores analiticas",
    ],
  },
  {
    name: "Team",
    price: "$19 USD / mes",
    note: "Para equipos que necesitan coordinar trabajo compartido.",
    badge: "Colaborativo",
    features: [
      "Todo lo de Pro",
      "Controles avanzados para grupos",
      "Mas espacios compartidos",
      "Funciones premium para coordinacion del equipo",
    ],
  },
];

function Welcome() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="welcome-page">
      <header className="welcome-hero">
        <nav className="welcome-nav">
          <div className="welcome-brand">
            <img src="/icon.jpg" alt="TaskFlow" />
            <span>
              <strong>TaskFlow</strong>
              <small>Workspace inteligente</small>
            </span>
          </div>

          <div className="welcome-nav__actions">
            <button
              type="button"
              className="welcome-button welcome-button--ghost welcome-theme-toggle"
              onClick={toggleTheme}
            >
              <i className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-stars-fill"}`}></i>
            </button>
            <Link to="/login" className="welcome-button welcome-button--ghost">
              Iniciar sesion
            </Link>
            <Link to="/register" className="welcome-button">
              Crear cuenta
            </Link>
          </div>
        </nav>

        <div className="welcome-hero__content">
          <div className="welcome-hero__text">
            <span className="welcome-pill">
              <i className="bi bi-lightning-charge-fill"></i> Productividad con enfoque real
            </span>
            <h1>Planifica, colabora y avanza con una experiencia clara para tus tareas.</h1>
            <p>
              TaskFlow reúne tablero, workflow, calendario, grupos, categorías y alertas
              en una sola experiencia pensada para mantener el trabajo en movimiento.
            </p>

            <div className="welcome-hero__cta">
              <Link to="/register" className="welcome-button">
                Empezar ahora
              </Link>
              <a href="#funcionalidades" className="welcome-button welcome-button--ghost">
                Ver funcionalidades
              </a>
            </div>

            <div className="welcome-stats">
              <div className="welcome-stat-card">
                <i className="bi bi-check2-square"></i>
                <strong>Tablero vivo</strong>
                <span>Prioridades, foco y seguimiento en una sola vista.</span>
              </div>
              <div className="welcome-stat-card">
                <i className="bi bi-kanban"></i>
                <strong>Workflow visual</strong>
                <span>Estados claros para saber qué hacer ahora.</span>
              </div>
              <div className="welcome-stat-card">
                <i className="bi bi-collection"></i>
                <strong>Espacios separados</strong>
                <span>Personal y grupos sin mezclar contexto.</span>
              </div>
            </div>
          </div>

          <div className="welcome-preview">
            <div className="welcome-preview__window">
              <div className="welcome-preview__topbar">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="welcome-preview__body">
                <aside className="welcome-preview__sidebar">
                  <strong>TaskFlow</strong>
                  <span>Inicio</span>
                  <span>Calendario</span>
                  <span>Workflow</span>
                  <span>Grupos</span>
                </aside>
                <div className="welcome-preview__panel">
                  <div className="welcome-preview__headline">
                    <span>Hoy</span>
                    <strong>Todo lo importante, en orden</strong>
                  </div>
                  <div className="welcome-preview__cards">
                    <article className="welcome-mini-card welcome-mini-card--warning">
                      <small>Pendiente</small>
                      <strong>Propuesta de entrega</strong>
                      <p>Revisión final antes de enviarla al grupo.</p>
                    </article>
                    <article className="welcome-mini-card welcome-mini-card--danger">
                      <small>Atrasada</small>
                      <strong>Actualizar presentación</strong>
                      <p>Necesita atención inmediata para no frenar el avance.</p>
                    </article>
                    <article className="welcome-mini-card welcome-mini-card--success">
                      <small>Completada</small>
                      <strong>Agenda semanal</strong>
                      <p>Cerrada y registrada en el historial del espacio.</p>
                    </article>
                  </div>
                </div>
              </div>
            </div>
            <div className="welcome-orb welcome-orb--one"></div>
            <div className="welcome-orb welcome-orb--two"></div>
          </div>
        </div>
      </header>

      <main className="welcome-sections">
        <section id="funcionalidades" className="welcome-section">
          <div className="welcome-section__header">
            <span className="welcome-pill welcome-pill--soft">Funcionalidades</span>
            <h2>Una plataforma pensada para mover tareas, no para perderlas de vista.</h2>
            <p>
              Cada vista responde a una necesidad puntual: decidir, organizar, coordinar,
              revisar y cerrar trabajo con menos fricción.
            </p>
          </div>

          <div className="welcome-feature-grid">
            {featureCards.map((feature, index) => (
              <article
                key={feature.title}
                className="welcome-feature-card"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <span className="welcome-feature-card__icon">
                  <i className={`bi ${feature.icon}`}></i>
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="welcome-section welcome-section--workflow">
          <div className="welcome-section__header">
            <span className="welcome-pill welcome-pill--soft">Como fluye</span>
            <h2>Del pendiente al cierre, con pasos visibles y simples.</h2>
          </div>

          <div className="welcome-flow">
            {workflowSteps.map((step, index) => (
              <article
                key={step.label}
                className="welcome-flow-card"
                style={{ animationDelay: `${index * 0.14}s` }}
              >
                <strong>{step.label}</strong>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="welcome-section welcome-section--highlight">
          <div className="welcome-highlight">
            <div>
              <span className="welcome-pill">Listo para probar</span>
              <h2>Trabaja solo o en equipo sin cambiar de ritmo.</h2>
              <p>
                Crea espacios por proyecto, usa categorías persistentes, asigna tareas,
                filtra por prioridad y mantén una vista limpia del progreso real.
              </p>
            </div>
            <div className="welcome-highlight__actions">
              <Link to="/register" className="welcome-button">
                Crear mi espacio
              </Link>
              <Link to="/login" className="welcome-button welcome-button--ghost">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        <section className="welcome-section">
          <div className="welcome-section__header">
            <span className="welcome-pill welcome-pill--soft">Planes</span>
            <h2>Una estructura simple para crecer contigo.</h2>
            <p>
              Por ahora los planes son informativos y te muestran una posible
              evolucion del producto.
            </p>
          </div>

          <div className="welcome-plans">
            {planCards.map((plan) => (
              <article
                key={plan.name}
                className={`welcome-plan-card ${plan.featured ? "welcome-plan-card--featured" : ""}`}
              >
                <span className="welcome-plan-card__badge">{plan.badge}</span>
                <h3>{plan.name}</h3>
                <strong>{plan.price}</strong>
                <p>{plan.note}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <i className="bi bi-check2-circle"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <div className="welcome-footer__brand">
          <strong>TaskFlow</strong>
          <span>Proyecto hecho por Jose Blanquicett para organizar trabajo personal y colaborativo.</span>
        </div>
        <div className="welcome-footer__links">
          <a href="https://github.com/Aokijij/Taskflow" target="_blank" rel="noreferrer">
            Repositorio
          </a>
          <a href="https://github.com/Aokijij" target="_blank" rel="noreferrer">
            Perfil GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Welcome;
