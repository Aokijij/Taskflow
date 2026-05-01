import React from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import { getTaskCode } from "../utils/taskHelpers";

function TaskDetailsModal({ show, onHide, taskDetails }) {
  const closeModal = () => {
    onHide();
  };

  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-info-circle me-2"></i>Detalles de Tarea
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!taskDetails ? (
          <Alert variant="danger">No se encontraron los detalles de la tarea.</Alert>
        ) : (
          <>
            <p>
              <strong>C&oacute;digo de la Tarea:</strong> {getTaskCode(taskDetails.id)}
            </p>
            <p>
              <strong>Name:</strong> {taskDetails.name}
            </p>
            <p>
              <strong>Date:</strong> {taskDetails.date}
            </p>
            <p>
              <strong>Category:</strong> {taskDetails.category}
            </p>
            <p>
              <strong>Priority:</strong> {taskDetails.priority}
            </p>
            <p>
              <strong>Description:</strong> {taskDetails.description}
            </p>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          <i className="bi bi-x-circle me-1"></i>Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TaskDetailsModal;
