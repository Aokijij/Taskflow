import React, { useState } from "react";
import { Modal } from "react-bootstrap";

function PageHelpButton({ title, intro, items = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="ghost-button page-help-trigger"
        onClick={() => setOpen(true)}
        aria-label={`Abrir ayuda de ${title}`}
        title="Como usar esta vista"
      >
        <i className="bi bi-question-circle"></i>
      </button>

      <Modal show={open} onHide={() => setOpen(false)} centered dialogClassName="taskflow-modal taskflow-modal--wide">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-compass me-2"></i>{title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="page-help">
            <p className="page-help__intro">{intro}</p>
            <div className="page-help__grid">
              {items.map((item) => (
                <article key={item.title} className="page-help-card">
                  <span className="page-help-card__icon">
                    <i className={`bi ${item.icon || "bi-stars"}`}></i>
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default PageHelpButton;
