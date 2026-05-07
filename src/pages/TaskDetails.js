import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import EditTaskModal from "../components/EditTaskModal";
import { useTasks } from "../contexts/TaskContext";
import { getTaskCategories, getTaskStatus } from "../utils/taskHelpers";

const toneForStatus = (status) => {
  if (status === "Completada") return "task-chip task-chip--success";
  if (status === "Atrasada") return "task-chip task-chip--danger";
  return "task-chip task-chip--warning";
};

const getUrgencyCopy = (task, status) => {
  if (status === "Completada") return "Esta tarea ya esta cerrada.";
  if (status === "Atrasada") return "Necesita atencion inmediata.";
  if (task.priority === "Alta") return "Alta prioridad para esta semana.";
  return "Lista para avanzar.";
};

const getStepClass = (step, status) => {
  if (step === "created") return "task-detail-step task-detail-step--done";
  if (step === "tracking" && status !== "Completada") {
    return "task-detail-step task-detail-step--active";
  }
  if (step === "tracking" && status === "Completada") {
    return "task-detail-step task-detail-step--done";
  }
  if (step === "completed" && status === "Completada") {
    return "task-detail-step task-detail-step--done";
  }
  return "task-detail-step";
};

const getStatusClass = (status) => {
  if (status === "Completada") return "status-success";
  if (status === "Atrasada") return "status-danger";
  return "status-warning";
};

const formatActivityAction = (action) => {
  if (action === "created") return "Creo la tarea";
  if (action === "completed") return "Marco como completada";
  return "Actualizo la tarea";
};

const TaskDetails = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { tasks, categories, groups, getTaskById, updateTask, completeTask, removeTask, getTaskActivity } =
    useTasks();
  const [task, setTask] = useState(null);
  const [activity, setActivity] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryNames = useMemo(() => getTaskCategories(categories), [categories]);

  const relatedTasks = useMemo(
    () =>
      tasks
        .filter((item) => item.id !== task?.id && item.category === task?.category)
        .slice(0, 4),
    [task?.category, task?.id, tasks]
  );

  useEffect(() => {
    let mounted = true;

    const loadTask = async () => {
      try {
        setLoading(true);
        const taskData = await getTaskById(taskId);
        const taskActivity = await getTaskActivity(taskId);
        if (mounted) {
          setTask(taskData);
          setActivity(taskActivity);
          setError("");
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "No se encontro la tarea.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTask();

    return () => {
      mounted = false;
    };
  }, [getTaskActivity, getTaskById, taskId]);

  const handleTaskEdited = async (updates) => {
    try {
      setSaving(true);
      const updatedTask = await updateTask(taskId, { ...task, ...updates });
      const nextActivity = await getTaskActivity(taskId);
      setTask(updatedTask);
      setActivity(nextActivity);
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar la tarea.");
      throw updateError;
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!task || task.completed) return;

    try {
      setSaving(true);
      const completedTask = await completeTask(task.id);
      const nextActivity = await getTaskActivity(task.id);
      setTask(completedTask);
      setActivity(nextActivity);
    } catch (completeError) {
      setError(completeError.message || "No se pudo completar la tarea.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Swal.fire({
      title: "Eliminar tarea",
      text: "Esta accion quitara la tarea de tu workspace.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "taskflow-alert",
        confirmButton: "taskflow-alert__confirm",
        cancelButton: "taskflow-alert__cancel",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      await removeTask(task.id);
      navigate("/task");
    });
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="surface-card">
          <div className="surface-card__body empty-state">Cargando detalle...</div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="dashboard-page">
        <div className="surface-card">
          <div className="surface-card__body empty-state">{error || "No se encontro la tarea."}</div>
        </div>
      </div>
    );
  }

  const status = getTaskStatus(task);
  const group = groups.find((item) => item.id === task.groupId);
  const workspaceLabel = task.scope === "group" ? group?.name || "Grupo" : "Personal";
  const workspaceCode = task.scope === "group" && group?.code ? group.code : null;
  const assignedMember = group?.members.find((member) => member.userId === task.assignedTo);
  const assignedLabel =
    task.scope === "group" ? assignedMember?.email || "Sin responsable asignado" : "No aplica";

  return (
    <div className="dashboard-page">
      <div className={`task-detail-hero task-detail-hero--${getStatusClass(status)}`}>
        <div>
          <span className={toneForStatus(status)}>{status}</span>
          <h1>{task.name}</h1>
          <p>{getUrgencyCopy(task, status)}</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>

      <div className="detail-grid detail-grid--rich">
        <div className={`surface-card task-detail-main task-detail-main--${getStatusClass(status)}`}>
          <div className="surface-card__body">
            <div className="task-detail-description">
              <span>Descripcion</span>
              <p>{task.description}</p>
            </div>

            <div className="task-detail-meta-grid">
              <div>
                <span>Espacio</span>
                <strong>{workspaceLabel}</strong>
              </div>
              {workspaceCode && (
                <div>
                  <span>Codigo del grupo</span>
                  <strong>{workspaceCode}</strong>
                </div>
              )}
              <div>
                <span>Estado</span>
                <strong className={`detail-status-text detail-status-text--${getStatusClass(status)}`}>
                  {status}
                </strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>{task.date}</strong>
              </div>
              <div>
                <span>Categoria</span>
                <strong>{task.category}</strong>
              </div>
              <div>
                <span>Prioridad</span>
                <strong>{task.priority}</strong>
              </div>
              {task.scope === "group" && (
                <div>
                  <span>Responsable</span>
                  <strong>{assignedLabel}</strong>
                </div>
              )}
            </div>

            <div className="task-detail-flow">
              <div className={getStepClass("created", status)}>
                <i className="bi bi-plus-circle"></i>
                <span>Creada</span>
              </div>
              <div className={getStepClass("tracking", status)}>
                <i className="bi bi-lightning-charge"></i>
                <span>{status === "Completada" ? "Seguimiento cerrado" : "En seguimiento"}</span>
              </div>
              <div className={getStepClass("completed", status)}>
                <i className="bi bi-check2-circle"></i>
                <span>Completada</span>
              </div>
            </div>

            <div className="detail-action-row">
              <button type="button" className="soft-button" onClick={() => setShowEditModal(true)}>
                Editar tarea
              </button>
              {!task.completed && (
                <button type="button" className="soft-button soft-button--success" onClick={handleComplete} disabled={saving}>
                  Marcar completada
                </button>
              )}
              <button type="button" className="soft-button soft-button--danger" onClick={handleDelete}>
                Eliminar tarea
              </button>
            </div>
          </div>
        </div>

        <aside className="task-detail-side">
          <div className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>{task.scope === "group" ? "Historial del grupo" : "Historial"}</h3>
                  <p>Movimientos recientes de esta tarea.</p>
                </div>
              </div>
              <div className="activity-list">
                {activity.length === 0 ? (
                  <div className="empty-state">Aun no hay movimientos registrados.</div>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="activity-item">
                      <span className="activity-item__icon">
                        <i className="bi bi-clock-history"></i>
                      </span>
                      <div>
                        <strong>{formatActivityAction(item.action)}</strong>
                        <p>{item.actorEmail || "Miembro del workspace"}</p>
                        <small>{new Date(item.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>Relacionadas</h3>
                  <p>Mas tareas de {task.category}.</p>
                </div>
              </div>
              <div className="related-task-list">
                {relatedTasks.length === 0 ? (
                  <div className="empty-state">No hay tareas relacionadas.</div>
                ) : (
                  relatedTasks.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="related-task-item"
                      onClick={() => navigate(`/task/${item.id}`)}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.date}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <EditTaskModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        taskData={task}
        onSubmit={handleTaskEdited}
        submitting={saving}
        categories={categoryNames}
      />
    </div>
  );
};

export default TaskDetails;
