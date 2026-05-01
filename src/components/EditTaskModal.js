import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

function EditTaskModal({ show, onHide, taskData, onSubmit, submitting, categories = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    category: "",
    priority: "Baja",
    completed: false,
  });
  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(formData.category.toLowerCase())
  );

  useEffect(() => {
    if (taskData) {
      setFormData({
        name: taskData.name || "",
        description: taskData.description || "",
        date: taskData.date || new Date().toISOString().split("T")[0],
        category: taskData.category || "",
        priority: taskData.priority || "Baja",
        completed: Boolean(taskData.completed),
      });
    }
  }, [taskData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="taskflow-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>Editar Tarea
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group controlId="taskName" className="mb-3">
            <Form.Label>
              <i className="bi bi-card-text me-2"></i>T&iacute;tulo
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
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
              list="edit-task-category-options"
              name="category"
              placeholder="Ej: Producto, Estudio, Finanzas"
              value={formData.category}
              onChange={handleChange}
              required
            />
            <datalist id="edit-task-category-options">
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

          <Form.Group controlId="taskDescription" className="mb-3">
            <Form.Label>
              <i className="bi bi-textarea-t me-2"></i>Descripci&oacute;n
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" className="ghost-button" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" className="dashboard-action" type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EditTaskModal;
