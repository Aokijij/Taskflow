import React, { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../contexts/TaskContext";
import { getTaskCategories, getTaskStatus, getTodayString } from "../utils/taskHelpers";

const statusColor = {
  Pendiente: "#f59e0b",
  Completada: "#10b981",
  Atrasada: "#ef4444",
};

const statusOptions = ["Todos", "Pendientes", "Completadas", "Atrasadas"];
const priorityOptions = ["Todas", "Alta", "Media", "Baja"];

const getStatusChip = (status) => {
  if (status === "Completada") return "task-chip task-chip--success";
  if (status === "Atrasada") return "task-chip task-chip--danger";
  return "task-chip task-chip--warning";
};

const TaskCalendar = () => {
  const navigate = useNavigate();
  const { tasks, loading, error } = useTasks();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const categories = useMemo(() => getTaskCategories(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const today = getTodayString();
    let nextTasks = [...tasks];

    if (statusFilter !== "Todos") {
      nextTasks = nextTasks.filter((task) => {
        if (statusFilter === "Completadas") return task.completed;
        if (statusFilter === "Pendientes") return task.date >= today && !task.completed;
        if (statusFilter === "Atrasadas") return task.date < today && !task.completed;
        return true;
      });
    }

    if (categoryFilter !== "Todas") {
      nextTasks = nextTasks.filter((task) => task.category === categoryFilter);
    }

    if (priorityFilter !== "Todas") {
      nextTasks = nextTasks.filter((task) => task.priority === priorityFilter);
    }

    return nextTasks;
  }, [categoryFilter, priorityFilter, statusFilter, tasks]);

  const selectedTask = useMemo(
    () => filteredTasks.find((task) => task.id === selectedTaskId) || filteredTasks[0],
    [filteredTasks, selectedTaskId]
  );

  const upcomingTasks = useMemo(
    () =>
      filteredTasks
        .filter((task) => !task.completed)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [filteredTasks]
  );

  const events = filteredTasks.map((task) => {
    const status = getTaskStatus(task);

    return {
      id: task.id,
      title: task.name,
      start: task.date,
      allDay: true,
      backgroundColor: statusColor[status] || "#2563eb",
      borderColor: "transparent",
      extendedProps: {
        category: task.category,
        status,
        priority: task.priority,
      },
    };
  });

  return (
    <div className="dashboard-page calendar-shell">
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-topbar__title">Calendario</h1>
          <p className="dashboard-topbar__subtitle">
            Planifica entregas, revisa prioridades y abre cualquier tarea desde el calendario.
          </p>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="surface-card calendar-workspace">
          <div className="surface-card__body">
            <div className="calendar-filter-bar">
              <div className="pill-filter-group" aria-label="Filtro por estado">
                {statusOptions.map((status) => (
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

              <div className="calendar-selectors">
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
              <div className="empty-state">Cargando calendario...</div>
            ) : error ? (
              <div className="empty-state">{error}</div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,dayGridWeek,dayGridDay",
                }}
                buttonText={{
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Dia",
                }}
                displayEventTime={false}
                events={events}
                height="auto"
                expandRows={true}
                eventClick={(eventInfo) => setSelectedTaskId(eventInfo.event.id)}
                eventClassNames={(eventInfo) =>
                  eventInfo.event.extendedProps.status === "Completada"
                    ? ["calendar-event--done"]
                    : []
                }
              />
            )}
          </div>
        </div>

        <aside className="calendar-side-panel">
          <div className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>Detalle rapido</h3>
                  <p>Selecciona una tarea del calendario.</p>
                </div>
              </div>
              {selectedTask ? (
                <div className="calendar-task-preview">
                  <span className={getStatusChip(getTaskStatus(selectedTask))}>
                    {getTaskStatus(selectedTask)}
                  </span>
                  <h2>{selectedTask.name}</h2>
                  <p>{selectedTask.description}</p>
                  <div className="task-card__meta">
                    <span className="task-chip task-chip--neutral">{selectedTask.category}</span>
                    <span className="task-chip task-chip--warning">{selectedTask.priority}</span>
                    <span className="task-chip task-chip--neutral">{selectedTask.date}</span>
                  </div>
                  <button
                    type="button"
                    className="dashboard-action calendar-detail-button"
                    onClick={() => navigate(`/task/${selectedTask.id}`)}
                  >
                    Ver detalle
                  </button>
                </div>
              ) : (
                <div className="empty-state">No hay tareas con estos filtros.</div>
              )}
            </div>
          </div>

          <div className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>Proximas fechas</h3>
                  <p>Lo que viene primero en tu agenda.</p>
                </div>
              </div>
              <div className="calendar-mini-list">
                {upcomingTasks.length === 0 ? (
                  <div className="empty-state">Sin entregas pendientes.</div>
                ) : (
                  upcomingTasks.map((task) => (
                    <button
                      type="button"
                      key={task.id}
                      className="calendar-mini-item"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <span>{task.date}</span>
                      <strong>{task.name}</strong>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TaskCalendar;
