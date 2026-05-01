import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddTaskModal from "../components/AddTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../contexts/TaskContext";
import {
  getTaskCategories,
  getTaskStatus,
  isRecentlyCompleted,
} from "../utils/taskHelpers";
import "../css/Task.css";

const priorityOptions = ["Todas", "Alta", "Media", "Baja"];
const statusOptions = ["Todos", "Pendiente", "Completada", "Atrasada"];

const getPriorityTone = (priority) => {
  switch (priority) {
    case "Alta":
      return "task-chip task-chip--danger";
    case "Media":
      return "task-chip task-chip--warning";
    default:
      return "task-chip task-chip--success";
  }
};

const getStatusTone = (status) => {
  switch (status) {
    case "Completada":
      return "task-chip task-chip--success";
    case "Atrasada":
      return "task-chip task-chip--danger";
    default:
      return "task-chip task-chip--warning";
  }
};

function Task() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    tasks,
    groups,
    activeWorkspace,
    summary,
    loading,
    error,
    createTask,
    updateTask,
    removeTask,
    groupedTasks,
  } = useTasks();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [savingTask, setSavingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");

  const categories = useMemo(() => getTaskCategories(tasks), [tasks]);
  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeWorkspace.id),
    [activeWorkspace.id, groups]
  );

  const visibleTasks = useMemo(() => {
    let nextTasks = tasks.filter((task) => !task.completed || isRecentlyCompleted(task, 7));

    if (categoryFilter !== "Todas") {
      nextTasks = nextTasks.filter((task) => task.category === categoryFilter);
    }

    if (priorityFilter !== "Todas") {
      nextTasks = nextTasks.filter((task) => task.priority === priorityFilter);
    }

    if (statusFilter !== "Todos") {
      nextTasks = nextTasks.filter((task) => getTaskStatus(task) === statusFilter);
    }

    return nextTasks;
  }, [categoryFilter, priorityFilter, statusFilter, tasks]);

  const spotlightTask = useMemo(
    () => groupedTasks.overdue[0] || groupedTasks.upcoming[0],
    [groupedTasks]
  );

  const getTaskWorkspaceLabel = (task) => {
    if (task.scope !== "group") {
      return "Personal";
    }

    const group = groups.find((item) => item.id === task.groupId);
    return group?.code ? `Grupo ${group.code}` : "Grupo";
  };

  const handleCreateTask = async (newTask) => {
    try {
      setSavingTask(true);
      await createTask(newTask);
      toast.success("Tarea creada y lista para avanzar.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (saveError) {
      toast.error(saveError.message || "No se pudo crear la tarea.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
      throw saveError;
    } finally {
      setSavingTask(false);
    }
  };

  const handleEditTask = async (updates) => {
    if (!taskToEdit) {
      return;
    }

    try {
      setEditingTask(true);
      await updateTask(taskToEdit.id, {
        ...taskToEdit,
        ...updates,
      });
      toast.info("Tarea actualizada correctamente.", {
        position: "top-right",
        autoClose: 2400,
        className: "taskflow-toast",
      });
    } catch (updateError) {
      toast.error(updateError.message || "No se pudo actualizar la tarea.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
      throw updateError;
    } finally {
      setEditingTask(false);
    }
  };

  const handleDeleteTask = (taskId) => {
    Swal.fire({
      title: "Eliminar tarea",
      text: "La tarea desaparecera del tablero y del calendario.",
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
      if (!result.isConfirmed) {
        return;
      }

      try {
        await removeTask(taskId);
        toast.success("Tarea eliminada correctamente.", {
          position: "top-right",
          autoClose: 2200,
          className: "taskflow-toast",
        });
      } catch (deleteError) {
        toast.error(deleteError.message || "No se pudo eliminar la tarea.", {
          position: "top-right",
          autoClose: 3000,
          className: "taskflow-toast",
        });
      }
    });
  };

  return (
    <div className="dashboard-page">
      <ToastContainer />
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-topbar__title">Hola, {profile?.name || "equipo"}.</h1>
          <p className="dashboard-topbar__subtitle">
            Revisa prioridades, filtra tu tablero y avanza en lo que necesita atencion.
          </p>
        </div>
        <div className="dashboard-topbar__actions">
          <button type="button" className="ghost-button" onClick={() => navigate("/groups")}>
            <i className="bi bi-people me-2"></i>Grupos
          </button>
          <button
            type="button"
            className="dashboard-action"
            onClick={() => setShowAddTaskModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>Nueva tarea
          </button>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--stats">
        {[
          { label: "Total", value: summary.total, note: "tareas registradas" },
          { label: "Pendientes", value: summary.pending, note: "listas para avanzar" },
          { label: "Atrasadas", value: summary.overdue, note: "requieren atencion" },
          { label: "Alta prioridad", value: summary.highPriority, note: "impacto alto" },
        ].map((metric) => (
          <div key={metric.label} className="surface-card metric-card">
            <div className="surface-card__body">
              <div className="metric-card__label">{metric.label}</div>
              <div className="metric-card__value">{metric.value}</div>
              <div className="metric-card__note">{metric.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--main">
        <div className="surface-card">
          <div className="surface-card__body">
            <div className="section-title section-title--stacked">
              <div>
                <h2>Tablero principal</h2>
                <p>Tareas activas y completadas recientes con acciones rapidas.</p>
              </div>
              <div className="board-filter-bar">
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="Todas">Todas las categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "Todos" ? "Todos los estados" : status}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority === "Todas" ? "Todas las prioridades" : priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Cargando tareas...</div>
            ) : error ? (
              <div className="empty-state">{error}</div>
            ) : visibleTasks.length === 0 ? (
              <div className="empty-state">
                No hay tareas con estos filtros.
              </div>
            ) : (
              <div className="scroll-panel">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Espacio</th>
                      <th>Tarea</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.map((task) => {
                      const status = getTaskStatus(task);

                      return (
                        <tr key={task.id}>
                          <td>
                            <div className="task-table__title">{getTaskWorkspaceLabel(task)}</div>
                            <div className="task-table__subtle">{task.category}</div>
                          </td>
                          <td>
                            <div className="task-table__title">{task.name}</div>
                            <div className="task-table__subtle">{task.description}</div>
                          </td>
                          <td>
                            <span className={getStatusTone(status)}>{status}</span>
                          </td>
                          <td>
                            <span className={getPriorityTone(task.priority)}>{task.priority}</span>
                          </td>
                          <td>{task.date}</td>
                          <td>
                            <div className="task-actions">
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() => navigate(`/task/${task.id}`)}
                              >
                                Ver
                              </button>
                              <button
                                type="button"
                                className="soft-button"
                                onClick={() => {
                                  setTaskToEdit(task);
                                  setShowTaskEditModal(true);
                                }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="soft-button soft-button--danger"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>En foco</h3>
                  <p>La tarea que mas atencion necesita ahora.</p>
                </div>
              </div>

              {spotlightTask ? (
                <div className="task-card">
                  <div className="task-card__row">
                    <div>
                      <h3 className="task-card__title">{spotlightTask.name}</h3>
                      <p className="task-card__description">{spotlightTask.description}</p>
                    </div>
                    <span className={getPriorityTone(spotlightTask.priority)}>
                      {spotlightTask.priority}
                    </span>
                  </div>
                  <div className="task-card__meta">
                    <span className="task-chip task-chip--neutral">
                      <i className="bi bi-calendar-event"></i>
                      {spotlightTask.date}
                    </span>
                    <span className={getStatusTone(getTaskStatus(spotlightTask))}>
                      {getTaskStatus(spotlightTask)}
                    </span>
                  </div>
                  <div className="task-actions">
                    <button
                      type="button"
                      className="soft-button"
                      onClick={() => navigate(`/task/${spotlightTask.id}`)}
                    >
                      Abrir detalle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">No hay una tarea destacada por ahora.</div>
              )}
            </div>
          </div>

          <div className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>Pulso del workspace</h3>
                  <p>Un resumen corto del estado actual del trabajo.</p>
                </div>
              </div>
              <div className="info-list">
                <div className="info-list__item">
                  <span className="info-list__label">Ritmo de trabajo</span>
                  <span className="info-list__value">{summary.completed} tareas completadas.</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Atencion inmediata</span>
                  <span className="info-list__value">
                    {groupedTasks.overdue.length} tareas necesitan revision.
                  </span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Proximas entregas</span>
                  <span className="info-list__value">
                    {groupedTasks.upcoming.length} tareas vienen en camino.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddTaskModal
        show={showAddTaskModal}
        onHide={() => setShowAddTaskModal(false)}
        onSubmit={handleCreateTask}
        submitting={savingTask}
        categories={categories}
        workspace={activeWorkspace}
        assignableMembers={(activeGroup?.members || []).filter((member) => member.status === "active" && member.userId)}
      />

      <EditTaskModal
        show={showTaskEditModal}
        onHide={() => setShowTaskEditModal(false)}
        taskData={taskToEdit}
        onSubmit={handleEditTask}
        submitting={editingTask}
        categories={categories}
      />
    </div>
  );
}

export default Task;
