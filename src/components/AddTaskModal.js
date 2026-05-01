import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

const initialState = {
  name: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  category: "",
  priority: "Baja",
  assignedTo: "",
};

function AddTaskModal({
  show,
  onHide,
  onSubmit,
  submitting,
  categories = [],
  workspace,
  assignableMembers = [],
}) {
  const [formData, setFormData] = useState(initialState);
  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(formData.category.toLowerCase())
  );

  useEffect(() => {
    if (!show) {
      setFormData(initialState);
    }
  }, [show]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="taskflow-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>Crear Nueva Tarea
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {workspace && (
            <div className="modal-workspace-note">
              <i className={workspace.type === "group" ? "bi bi-people" : "bi bi-person-check"}></i>
              <span>
                Se creara en <strong>{workspace.type === "group" ? workspace.name : "Mis tareas"}</strong>
              </span>
            </div>
          )}

          <Form.Group controlId="taskName" className="mb-3">
            <Form.Label>
              <i className="bi bi-card-text me-2"></i>T&iacute;tulo
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              placeholder="Ingresa el t&iacute;tulo de la tarea"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="taskDate" className="mb-3">
            <Form.Label>
              <i className="bi bi-calendar-event me-2"></i>Fecha
            </Form.Label>
            <Form.Control
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="category" className="mb-3">
            <Form.Label>
              <i className="bi bi-tags me-2"></i>Categor&iacute;a
            </Form.Label>
            <Form.Control
              list="task-category-options"
              name="category"
              placeholder="Selecciona o escribe una categor&iacute;a"
              value={formData.category}
              onChange={handleChange}
              required
            />
            <datalist id="task-category-options">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {filteredCategories.length > 0 && (
              <div className="category-suggestion-list">
                {filteredCategories.slice(0, 6).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="category-suggestion"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        category,
                      }))
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </Form.Group>

          <Form.Group controlId="priority" className="mb-3">
            <Form.Label>
              <i className="bi bi-flag me-2"></i>Prioridad
            </Form.Label>
            <Form.Select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </Form.Select>
          </Form.Group>

          {workspace?.type === "group" && assignableMembers.length > 0 && (
            <Form.Group controlId="assignedTo" className="mb-3">
              <Form.Label>
                <i className="bi bi-person-plus me-2"></i>Asignar a
              </Form.Label>
              <Form.Select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
              >
                <option value="">Sin asignar</option>
                {assignableMembers.map((member) => (
                  <option key={member.id || member.email} value={member.userId || ""}>
                    {member.email}
                  </option>
                ))}
              </Form.Select>
              <div className="modal-helper">Opcional: puedes dejar la tarea sin responsable.</div>
            </Form.Group>
          )}

          <Form.Group controlId="taskDescription" className="mb-3">
            <Form.Label>
              <i className="bi bi-textarea-t me-2"></i>Descripci&oacute;n
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="description"
              placeholder="Describe brevemente la tarea"
              value={formData.description}
              onChange={handleChange}
              required
              style={{ resize: "none", borderRadius: "10px" }}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" className="ghost-button" onClick={onHide}>
            <i className="bi bi-x-circle me-1"></i>Cancelar
          </Button>
          <Button variant="primary" className="dashboard-action" type="submit" disabled={submitting}>
            <i className="bi bi-check-circle me-1"></i>
            {submitting ? "Guardando..." : "Crear Tarea"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default AddTaskModal;
