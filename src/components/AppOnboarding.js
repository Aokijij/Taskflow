import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

const onboardingSlides = [
  {
    title: "Tu tablero principal",
    icon: "bi-grid-1x2-fill",
    text: "Empieza viendo métricas, tareas activas y la tarjeta de foco para decidir qué necesita tu atención primero.",
  },
  {
    title: "Workflow con contexto",
    icon: "bi-kanban-fill",
    text: "Cada tarea pasa por estados claros para que puedas avanzar, revisar vencidas y cerrar trabajo sin perder el hilo.",
  },
  {
    title: "Calendario y recordatorios",
    icon: "bi-calendar3",
    text: "Consulta entregas, sincroniza con Google Calendar y mantén visibles las fechas que marcan tu ritmo de trabajo.",
  },
  {
    title: "Grupos y colaboración",
    icon: "bi-people-fill",
    text: "Crea espacios compartidos, invita personas, asigna responsables y separa el trabajo personal del grupal.",
  },
];

function AppOnboarding() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const storageKey = useMemo(
    () => (user?.id ? `taskflow_onboarding_seen_v1_${user.id}` : null),
    [user?.id]
  );

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const wasSeen = window.localStorage.getItem(storageKey);
    if (!wasSeen) {
      setOpen(true);
    }
  }, [storageKey]);

  const currentSlide = onboardingSlides[step];

  const finishOnboarding = () => {
    if (storageKey) {
      window.localStorage.setItem(storageKey, "true");
    }
    setOpen(false);
    setStep(0);
  };

  return (
    <Modal
      show={open}
      onHide={finishOnboarding}
      centered
      backdrop="static"
      keyboard={false}
      dialogClassName="taskflow-modal taskflow-modal--wide"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-stars me-2"></i>Bienvenido a TaskFlow
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="onboarding">
          <div className="onboarding__hero">
            <span className="onboarding__badge">
              Paso {step + 1} de {onboardingSlides.length}
            </span>
            <div className="onboarding__progress">
              <span
                className="onboarding__progress-bar"
                style={{ width: `${((step + 1) / onboardingSlides.length) * 100}%` }}
              ></span>
            </div>
            <div className="onboarding__icon">
              <i className={`bi ${currentSlide.icon}`}></i>
            </div>
            <h2>{currentSlide.title}</h2>
            <p>{currentSlide.text}</p>
            <div className="onboarding__mini-grid">
              <article className="onboarding__mini-card">
                <strong>Espacios</strong>
                <span>Personal y grupos siempre separados para mantener contexto.</span>
              </article>
              <article className="onboarding__mini-card">
                <strong>Foco</strong>
                <span>Prioridades, workflow y calendario pensados para decidir rapido.</span>
              </article>
            </div>
            <div className="onboarding__pill-row">
              <span className="onboarding__feature-pill">
                <i className="bi bi-lightning-charge-fill"></i>
                Flujo claro
              </span>
              <span className="onboarding__feature-pill">
                <i className="bi bi-bell"></i>
                Alertas utiles
              </span>
              <span className="onboarding__feature-pill">
                <i className="bi bi-people"></i>
                Colaboracion
              </span>
            </div>
          </div>

          <div className="onboarding__timeline">
            {onboardingSlides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={`onboarding-step ${index === step ? "onboarding-step--active" : ""}`}
                onClick={() => setStep(index)}
              >
                <strong>{item.title}</strong>
                <span>{item.text}</span>
                {index === step && <b>Vista actual del recorrido</b>}
              </button>
            ))}
          </div>

          <div className="onboarding__actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
            >
              Anterior
            </button>
            {step === onboardingSlides.length - 1 ? (
              <button type="button" className="dashboard-action" onClick={finishOnboarding}>
                Empezar
              </button>
            ) : (
              <button
                type="button"
                className="dashboard-action"
                onClick={() => setStep((current) => Math.min(current + 1, onboardingSlides.length - 1))}
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default AppOnboarding;
