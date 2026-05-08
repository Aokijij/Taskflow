import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHelpButton from "../components/PageHelpButton";
import { useTasks } from "../contexts/TaskContext";
import { getCategorySummary, getTaskStatus } from "../utils/taskHelpers";

const getStatusTone = (status) => {
  if (status === "Completada") return "task-chip task-chip--success";
  if (status === "Atrasada") return "task-chip task-chip--danger";
  return "task-chip task-chip--warning";
};

const getPriorityTone = (priority) => {
  if (priority === "Alta") return "task-chip task-chip--danger";
  if (priority === "Media") return "task-chip task-chip--warning";
  return "task-chip task-chip--success";
};

function Categories() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, categories, loading, error, activeWorkspace, deleteCategory } = useTasks();

  const categorySummary = useMemo(() => getCategorySummary(categories, tasks), [categories, tasks]);
  const selectedCategory = searchParams.get("name") || categorySummary[0]?.name || "";

  useEffect(() => {
    if (!selectedCategory && categorySummary[0]?.name) {
      setSearchParams({ name: categorySummary[0].name }, { replace: true });
    }
  }, [categorySummary, selectedCategory, setSearchParams]);

  const visibleTasks = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    return tasks.filter((task) => task.category === selectedCategory);
  }, [selectedCategory, tasks]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-topbar__title">Categorias</h1>
          <p className="dashboard-topbar__subtitle">
            Organiza tus frentes de trabajo y entra rapido a cada lista con contexto propio.
          </p>
        </div>
        <div className="dashboard-topbar__actions">
          <PageHelpButton
            title="Como usar Categorias"
            intro="Aqui tienes una lectura separada por frentes de trabajo para entrar a cada lista sin mezclar todo el tablero."
            items={[
              {
                icon: "bi-tags",
                title: "Categorias activas e inactivas",
                text: "Una categoria sigue visible aunque se quede sin tareas, para que puedas reutilizarla mas adelante.",
              },
              {
                icon: "bi-list-task",
                title: "Listado dedicado",
                text: "Al elegir una categoria ves solo sus tareas con una presentacion pensada para esa vista.",
              },
              {
                icon: "bi-trash3",
                title: "Limpieza segura",
                text: "Las categorias inactivas pueden eliminarse solo cuando ya no tienen tareas relacionadas.",
              },
            ]}
          />
        </div>
      </div>

      <div className="dashboard-grid categories-layout">
        <section className="surface-card">
          <div className="surface-card__body">
            <div className="section-title">
              <div>
                <h2>Mapa de categorias</h2>
                <p>
                  {activeWorkspace.type === "group"
                    ? `Estas viendo ${activeWorkspace.name}.`
                    : "Estas viendo tu espacio personal."}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Cargando categorias...</div>
            ) : error ? (
              <div className="empty-state">{error}</div>
            ) : categorySummary.length === 0 ? (
              <div className="empty-state">Aun no hay categorias en este espacio.</div>
            ) : (
              <div className="category-card-grid">
                {categorySummary.map((category) => (
                  <article
                    key={category.name}
                    className={`category-dashboard-card ${
                      selectedCategory === category.name ? "category-dashboard-card--active" : ""
                    } ${!category.active ? "category-dashboard-card--inactive" : ""}`}
                    onClick={() => setSearchParams({ name: category.name })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSearchParams({ name: category.name });
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="category-dashboard-card__top">
                      <span className="category-dashboard-card__badge">
                        {category.active
                          ? category.completed > 0
                            ? `${category.completed} cerradas`
                            : "Activa"
                          : "Inactiva"}
                      </span>
                      {!category.active && (
                        <button
                          type="button"
                          className="category-dashboard-card__trash"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await deleteCategory(category.id);
                            if (selectedCategory === category.name) {
                              setSearchParams({});
                            }
                          }}
                          aria-label={`Eliminar categoria ${category.name}`}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      )}
                    </div>
                    <div className="category-dashboard-card__content">
                      <strong>{category.name}</strong>
                      <b>{category.total}</b>
                      <small>{category.total === 1 ? "tarea" : "tareas"}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="surface-card">
          <div className="surface-card__body">
            <div className="section-title">
              <div>
                <h2>{selectedCategory || "Tareas por categoria"}</h2>
                <p>Un listado pensado para revisar esa categoria sin mezclarla con todo el tablero.</p>
              </div>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="empty-state">No hay tareas en esta categoria.</div>
            ) : (
              <div className="category-task-list">
                {visibleTasks.map((task) => {
                  const status = getTaskStatus(task);

                  return (
                    <article
                      key={task.id}
                      className="category-task-card"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <div className="category-task-card__header">
                        <div>
                          <h3>{task.name}</h3>
                          <p>{task.description}</p>
                        </div>
                        <span className={getPriorityTone(task.priority)}>{task.priority}</span>
                      </div>

                      <div className="category-task-card__meta">
                        <span className={getStatusTone(status)}>{status}</span>
                        <span className="task-chip task-chip--neutral">
                          <i className="bi bi-calendar-event"></i>
                          {task.date}
                        </span>
                        <span className="task-chip task-chip--primary">
                          <i className="bi bi-arrow-right-circle"></i>
                          Abrir detalle
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Categories;
