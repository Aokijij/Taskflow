import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppOnboarding from "./AppOnboarding";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../contexts/TaskContext";
import { useTheme } from "../contexts/ThemeContext";
import { resolveUserAvatar } from "../utils/userHelpers";

const navItems = [
  { path: "/task", label: "Inicio", icon: "bi-grid-1x2" },
  { path: "/calendar", label: "Calendario", icon: "bi-calendar3" },
  { path: "/task-status", label: "Workflow", icon: "bi-kanban" },
  { path: "/statistics", label: "Estadisticas", icon: "bi-graph-up" },
  { path: "/categories", label: "Categorias", icon: "bi-tags" },
  { path: "/groups", label: "Grupos", icon: "bi-people" },
];

const personalWorkspace = {
  id: "personal",
  type: "personal",
  name: "Personal",
  code: null,
  members: [],
};

const getNotificationTone = (task) => {
  const today = new Date().toISOString().split("T")[0];

  if (task.date < today) {
    return {
      label: "Vencida",
      icon: "bi-exclamation-triangle-fill",
      className: "inbox-alert inbox-alert--danger",
    };
  }

  if (task.priority === "Alta") {
    return {
      label: "Alta prioridad",
      icon: "bi-lightning-charge-fill",
      className: "inbox-alert inbox-alert--warning",
    };
  }

  return {
    label: "Proxima",
    icon: "bi-bell-fill",
    className: "inbox-alert inbox-alert--info",
  };
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    groupedTasks,
    summary,
    groups,
    invitations,
    activeWorkspace,
    setActiveWorkspace,
    acceptInvitation,
    declineInvitation,
  } = useTasks();
  const [readNotifications, setReadNotifications] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const unreadNotifications = useMemo(() => {
    const pendingNotifications = [...groupedTasks.overdue, ...groupedTasks.upcoming].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    return pendingNotifications.filter((task) => !readNotifications.includes(task.id));
  }, [groupedTasks.overdue, groupedTasks.upcoming, readNotifications]);

  const alertCount = unreadNotifications.length + invitations.length;

  const openNotification = (taskId) => {
    setReadNotifications((current) =>
      current.includes(taskId) ? current : [...current, taskId]
    );
    setIsMenuOpen(false);
    navigate(`/task/${taskId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  const handleInvitation = async (event, invitationId, action) => {
    event.stopPropagation();
    try {
      if (action === "accept") {
        await acceptInvitation(invitationId);
        toast.success("Invitacion aceptada.", {
          position: "top-right",
          autoClose: 2200,
          className: "taskflow-toast",
        });
        return;
      }

      await declineInvitation(invitationId);
      toast.info("Invitacion rechazada.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo responder la invitacion.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    }
  };

  return (
    <>
      <AppOnboarding />
      <aside className={`dashboard-sidebar ${isMenuOpen ? "dashboard-sidebar--open" : ""}`}>
        <div className="sidebar-brand">
        <img src="/icon.jpg" alt="TaskFlow" />
        <div>
          <strong>TaskFlow</strong>
          <span>Workspace</span>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
          title={isDark ? "Modo claro" : "Modo oscuro"}
        >
          <i className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-stars-fill"}`}></i>
        </button>
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <i className={`bi ${isMenuOpen ? "bi-x-lg" : "bi-list"}`}></i>
        </button>
      </div>

      <div className="sidebar-collapsible">
      <nav className="sidebar-nav" aria-label="Navegacion principal">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMenuOpen(false)}
            className={`sidebar-nav__item ${
              location.pathname === item.path ? "sidebar-nav__item--active" : ""
            }`}
          >
            <i className={`bi ${item.icon}`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <section className="sidebar-workspaces">
        <div className="sidebar-workspaces__title">
          <strong>{activeWorkspace.type === "group" ? activeWorkspace.name : "Personal"}</strong>
        </div>
        <button
          type="button"
          className={`sidebar-workspace ${
            activeWorkspace.type === "personal" ? "sidebar-workspace--active" : ""
          }`}
          onClick={() => {
            setActiveWorkspace(personalWorkspace);
            setIsMenuOpen(false);
          }}
        >
          <i className="bi bi-person"></i>
          <span>Mis tareas</span>
        </button>
        {groups.slice(0, 4).map((group) => (
          <button
            key={group.id}
            type="button"
            className={`sidebar-workspace ${
              activeWorkspace.id === group.id ? "sidebar-workspace--active" : ""
            }`}
            style={{
              "--workspace-accent": group.color || "#2563eb",
            }}
            onClick={() => {
              setActiveWorkspace(group);
              setIsMenuOpen(false);
            }}
          >
            <i className="bi bi-people"></i>
            <span>{group.name}</span>
            <small>{group.code}</small>
          </button>
        ))}
      </section>

      <div className="sidebar-overview">
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            navigate("/task-status?status=Pendientes");
          }}
        >
          <span>Pendientes</span>
          <strong>{summary.pending}</strong>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            navigate("/task-status?status=Atrasadas");
          }}
        >
          <span>Vencidas</span>
          <strong>{summary.overdue}</strong>
        </button>
      </div>

      <section className="sidebar-inbox">
        <div className="inbox-header">
          <div>
            <h3>Alertas</h3>
            <p>{summary.overdue > 0 ? `${summary.overdue} vencidas` : "Todo bajo control"}</p>
          </div>
          {alertCount > 0 && <span className="inbox-count">{alertCount}</span>}
        </div>

        <div className="inbox-list">
          {alertCount === 0 ? (
            <div className="inbox-empty">
              <i className="bi bi-check2-circle"></i>
              <span>Sin alertas activas.</span>
            </div>
          ) : (
            <>
              {invitations.map((invitation) => (
                <div key={invitation.id} className="inbox-alert inbox-alert--invite">
                  <span className="inbox-alert__icon">
                    <i className="bi bi-envelope-heart-fill"></i>
                  </span>
                  <span>
                    <small>Invitacion</small>
                    <strong>{invitation.group?.name || "Grupo compartido"}</strong>
                    <em>Codigo {invitation.group?.code || "pendiente"}</em>
                    <span className="inbox-alert__actions">
                      <button
                        type="button"
                        onClick={(event) => handleInvitation(event, invitation.id, "accept")}
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleInvitation(event, invitation.id, "decline")}
                      >
                        Rechazar
                      </button>
                    </span>
                  </span>
                </div>
              ))}

              {unreadNotifications.slice(0, 5).map((task) => {
                const tone = getNotificationTone(task);

                return (
                  <button
                    type="button"
                    key={task.id}
                    className={tone.className}
                    onClick={() => openNotification(task.id)}
                  >
                    <span className="inbox-alert__icon">
                      <i className={`bi ${tone.icon}`}></i>
                    </span>
                    <span>
                      <small>{tone.label}</small>
                      <strong>{task.name}</strong>
                      <em>{task.date}</em>
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </section>

      <div className="sidebar-user">
        <button
          type="button"
          className="sidebar-user__profile"
          onClick={() => {
            setIsMenuOpen(false);
            navigate("/profile");
          }}
        >
          <img src={resolveUserAvatar(profile, user)} alt="User avatar" />
          <span>
            <strong>{profile?.name || "Mi perfil"}</strong>
            <em>{user?.email}</em>
          </span>
        </button>
        <button type="button" className="sidebar-user__logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
      </div>
      </aside>
    </>
  );
};

export default Navbar;
