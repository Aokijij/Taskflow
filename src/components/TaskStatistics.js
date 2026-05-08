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
import PageHelpButton from "./PageHelpButton";
import { useTasks } from "../contexts/TaskContext";
import { useTheme } from "../contexts/ThemeContext";

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
  const { isDark } = useTheme();

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
        <div className="dashboard-topbar__actions">
          <PageHelpButton
            title="Como usar Estadisticas"
            intro="Esta vista te ayuda a leer el comportamiento real de tu espacio y detectar donde se concentra el trabajo."
            items={[
              {
                icon: "bi-graph-up-arrow",
                title: "Medidores principales",
                text: "Muestran proporcion de tareas completadas, pendientes, atrasadas y la carga de alta prioridad.",
              },
              {
                icon: "bi-pie-chart",
                title: "Distribucion visual",
                text: "Los graficos te ayudan a detectar desbalances por estado y por prioridad sin revisar tarea por tarea.",
              },
              {
                icon: "bi-tags",
                title: "Categorias activas",
                text: "Puedes ver en que frentes de trabajo se esta concentrando mas esfuerzo dentro del espacio actual.",
              },
            ]}
          />
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
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "rgba(148,163,184,0.14)" : "rgba(20,33,61,0.08)"}
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: isDark ? "#cbd5e1" : "#6b7a90" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: isDark ? "#cbd5e1" : "#6b7a90" }}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? "rgba(37, 99, 235, 0.12)" : "rgba(37, 99, 235, 0.06)" }}
                      contentStyle={{
                        borderRadius: 16,
                        border: `1px solid ${isDark ? "rgba(148,163,184,0.14)" : "rgba(20,33,61,0.08)"}`,
                        background: isDark ? "rgba(15,23,42,0.96)" : "rgba(255,255,255,0.96)",
                        color: isDark ? "#e2e8f0" : "#14213d",
                      }}
                    />
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
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: `1px solid ${isDark ? "rgba(148,163,184,0.14)" : "rgba(20,33,61,0.08)"}`,
                        background: isDark ? "rgba(15,23,42,0.96)" : "rgba(255,255,255,0.96)",
                        color: isDark ? "#e2e8f0" : "#14213d",
                      }}
                    />
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
