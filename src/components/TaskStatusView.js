import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTasks } from "../contexts/TaskContext";

const getWorkflowClass = (task) => {
  const today = new Date().toISOString().split("T")[0];

  if (task.completed) {
    return "workflow-card workflow-card--done";
  }

  if (task.date < today) {
    return "workflow-card workflow-card--overdue";
  }

  if (task.priority === "Alta") {
    return "workflow-card workflow-card--urgent";
  }

  return "workflow-card workflow-card--pending";
};

const getWorkflowLabel = (task) => {
  const today = new Date().toISOString().split("T")[0];

  if (task.completed) {
    return "Completada";
  }

  if (task.date < today) {
    return "Vencida";
  }

  if (task.priority === "Alta") {
    return "Urgente";
  }

  return "En curso";
};

const TaskStatusView = () => {
  const navigate = useNavigate();
  const { tasks, completeTask, loading, error } = useTasks();
  const [statusFilter, setStatusFilter] = useState("Pendientes");

  const filteredTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return tasks.filter((task) => {
      if (statusFilter === "Completadas") {
        return task.completed === true;
      }

      if (statusFilter === "Atrasadas") {
        return task.date < today && !task.completed;
      }

      if (statusFilter === "Pendientes") {
        return task.date >= today && !task.completed;
      }

      return true;
    });
  }, [statusFilter, tasks]);

  const handleCompleteTask = async (taskId) => {
    try {
      await completeTask(taskId);
      toast.success("Tarea marcada como completada.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (completeError) {
      toast.error(completeError.message || "No se pudo completar la tarea.", {
        position: "top-right",
        autoClose: 2500,
        className: "taskflow-toast",
      });
    }
  };

  return (
    <div className="dashboard-page">
      <ToastContainer />
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-topbar__title">Workflow</h1>
          <p className="dashboard-topbar__subtitle">
            Mueve tareas por estado, consulta completadas y abre detalles cuando necesites contexto.
          </p>
        </div>
      </div>

      <div className="surface-card">
        <div className="surface-card__body">
          <div className="section-title">
            <div>
              <h2>Estados del trabajo</h2>
              <p>Filtra el tablero según el punto del ciclo de cada tarea.</p>
            </div>
            <div className="pill-filter-group">
              {["Pendientes", "Completadas", "Atrasadas"].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`pill-filter pill-filter--${status.toLowerCase()} ${
                    statusFilter === status ? "pill-filter--active" : ""
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Cargando flujo...</div>
          ) : error ? (
            <div className="empty-state">{error}</div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">No hay tareas para este estado.</div>
          ) : (
            <div className="task-board task-board--workflow">
              {filteredTasks.map((task) => (
                <div key={task.id} className={`task-card ${getWorkflowClass(task)}`}>
                  <div className="workflow-card__status">{getWorkflowLabel(task)}</div>
                  <div className="task-card__row">
                    <div>
                      <h3 className="task-card__title">{task.name}</h3>
                      <p className="task-card__description">{task.description}</p>
                    </div>
                    <span
                      className={`task-chip ${
                        task.priority === "Alta"
                          ? "task-chip--danger"
                          : task.priority === "Media"
                          ? "task-chip--warning"
                          : "task-chip--success"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="task-card__meta">
                    <span className="task-chip task-chip--neutral">
                      <i className="bi bi-tags"></i>
                      {task.category}
                    </span>
                    <span className="task-chip task-chip--warning">
                      <i className="bi bi-calendar-event"></i>
                      {task.date}
                    </span>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      Ver detalle
                    </button>
                    {!task.completed && (
                      <button
                        type="button"
                        className={`soft-button ${
                          task.date < new Date().toISOString().split("T")[0]
                            ? "soft-button--danger"
                            : "soft-button--success"
                        }`}
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskStatusView;
