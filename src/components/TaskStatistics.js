import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTasks } from "../contexts/TaskContext";

const COLORS = ["#2563eb", "#10b981", "#ef4444"];

function MeterCard({ label, value, total, note, tone = "primary" }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={`surface-card insight-meter insight-meter--${tone}`}>
      <div className="surface-card__body">
        <div className="insight-meter__top">
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
          <div className="insight-meter__ring" style={{ "--meter": `${percentage}%` }}>
            {percentage}%
          </div>
        </div>
        <div className="insight-meter__bar">
          <span style={{ width: `${percentage}%` }}></span>
        </div>
        <p>{note}</p>
      </div>
    </div>
  );
}

function TaskStatistics() {
  const { tasks, loading, error, summary } = useTasks();

  const { priorityData, statusData, categoryData } = useMemo(() => {
    const priorities = ["Alta", "Media", "Baja"];
    const priorityCounts = priorities.map((priority) => ({
      name: priority,
      Cantidad: tasks.filter(
        (task) => (task.priority || "").toLowerCase() === priority.toLowerCase()
      ).length,
    }));

    const categories = [...new Set(tasks.map((task) => task.category).filter(Boolean))];

    return {
      priorityData: priorityCounts,
      statusData: [
        { name: "Pendientes", value: summary.pending },
        { name: "Completadas", value: summary.completed },
        { name: "Atrasadas", value: summary.overdue },
      ],
      categoryData: categories
        .map((category) => ({
          name: category,
          Cantidad: tasks.filter((task) => task.category === category).length,
        }))
        .sort((a, b) => b.Cantidad - a.Cantidad)
        .slice(0, 6),
    };
  }, [summary.completed, summary.overdue, summary.pending, tasks]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-topbar__title">Estadísticas</h1>
          <p className="dashboard-topbar__subtitle">
            Mide avance, carga activa y prioridades para decidir dónde poner atención.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="surface-card">
          <div className="surface-card__body empty-state">Cargando estadísticas...</div>
        </div>
      ) : error ? (
        <div className="surface-card">
          <div className="surface-card__body empty-state">{error}</div>
        </div>
      ) : (
        <>
          <div className="dashboard-grid dashboard-grid--stats">
            <MeterCard
              label="Completadas"
              value={summary.completed}
              total={summary.total}
              note="Trabajo cerrado frente al total."
              tone="success"
            />
            <MeterCard
              label="Pendientes"
              value={summary.pending}
              total={summary.total}
              note="Tareas listas para avanzar."
              tone="primary"
            />
            <MeterCard
              label="Atrasadas"
              value={summary.overdue}
              total={summary.total}
              note="Fechas que necesitan revisión."
              tone="danger"
            />
            <MeterCard
              label="Alta prioridad"
              value={summary.highPriority}
              total={summary.total}
              note="Impacto alto dentro del tablero."
              tone="warning"
            />
          </div>

          <div className="analytics-grid analytics-grid--wide">
            <div className="surface-card">
              <div className="surface-card__body">
                <div className="section-title">
                  <div>
                    <h2>Prioridades</h2>
                    <p>Distribución de la carga por nivel de urgencia.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(20,33,61,0.08)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} />
                    <Bar dataKey="Cantidad" radius={[8, 8, 0, 0]}>
                      {priorityData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Alta"
                              ? "#ef4444"
                              : entry.name === "Media"
                              ? "#f59e0b"
                              : "#10b981"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface-card">
              <div className="surface-card__body">
                <div className="section-title">
                  <div>
                    <h2>Estado del trabajo</h2>
                    <p>Balance entre avance, pendientes y riesgo.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="status-legend">
                  {statusData.map((item, index) => (
                    <span key={item.name}>
                      <i style={{ background: COLORS[index] }}></i>
                      {item.name}: {item.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card category-insights">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h2>Categorías con más movimiento</h2>
                  <p>Una lectura rápida de dónde se concentra tu trabajo.</p>
                </div>
              </div>
              <div className="category-bars">
                {categoryData.length === 0 ? (
                  <div className="empty-state">Aún no hay categorías registradas.</div>
                ) : (
                  categoryData.map((category) => {
                    const width =
                      summary.total > 0 ? Math.round((category.Cantidad / summary.total) * 100) : 0;

                    return (
                      <div key={category.name} className="category-bar">
                        <div>
                          <strong>{category.name}</strong>
                          <span>{category.Cantidad} tareas</span>
                        </div>
                        <div className="category-bar__track">
                          <span style={{ width: `${width}%` }}></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TaskStatistics;
