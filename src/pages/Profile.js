import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "../services/profileService";
import { useTasks } from "../contexts/TaskContext";
import { resolveUserAvatar } from "../utils/userHelpers";
import "../css/Profile.css";

function Profile() {
  const { user, profile, refreshProfile, setProfile, logout, updatePassword } = useAuth();
  const {
    summary,
    groups,
    activeWorkspace,
    enableBrowserNotifications,
    browserNotificationPermission,
  } = useTasks();
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    nextPassword: "",
    confirmPassword: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [googleConnection, setGoogleConnection] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    let mounted = true;

    const loadGoogleConnection = async () => {
      const { data } = await supabase
        .from("google_calendar_connections")
        .select("calendar_id, connected_at, updated_at")
        .maybeSingle();

      if (mounted) {
        setGoogleConnection(data || null);
      }
    };

    loadGoogleConnection();

    return () => {
      mounted = false;
    };
  }, []);

  const profileStats = useMemo(
    () => [
      {
        label: "Tareas visibles",
        value: summary.total,
        icon: "bi-grid",
        tone: "primary",
      },
      {
        label: "Pendientes",
        value: summary.pending,
        icon: "bi-hourglass-split",
        tone: "warning",
      },
      {
        label: "Grupos activos",
        value: groups.length,
        icon: "bi-people",
        tone: "success",
      },
      {
        label: "Espacio actual",
        value: activeWorkspace.type === "group" ? activeWorkspace.name : "Personal",
        icon: "bi-compass",
        tone: "neutral",
      },
    ],
    [activeWorkspace.name, activeWorkspace.type, groups.length, summary.pending, summary.total]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({ ...current, [name]: value }));
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const updated = await updateProfile(user.id, {
        ...formData,
        browserNotificationsEnabled: profile.browserNotificationsEnabled,
      });
      setProfile(updated);
      await refreshProfile();
      setIsEditing(false);
      toast.success("Tu perfil quedo actualizado.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar el perfil.", {
        position: "top-right",
        autoClose: 2600,
        className: "taskflow-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async (enabled) => {
    try {
      if (enabled) {
        await enableBrowserNotifications();
      }

      const updated = await updateProfile(user.id, {
        name: profile.name,
        lastName: profile.lastName,
        phone: profile.phone,
        browserNotificationsEnabled: enabled,
      });

      setProfile(updated);
      await refreshProfile();

      toast.success(
        enabled ? "Las alertas del navegador quedaron activas." : "Las alertas quedaron en pausa.",
        {
          position: "top-right",
          autoClose: 2200,
          className: "taskflow-toast",
        }
      );
    } catch (error) {
      toast.error(error.message || "No se pudo cambiar la configuracion de alertas.", {
        position: "top-right",
        autoClose: 2600,
        className: "taskflow-toast",
      });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordData.nextPassword.length < 6) {
      toast.error("La nueva clave debe tener al menos 6 caracteres.", {
        position: "top-right",
        autoClose: 2400,
        className: "taskflow-toast",
      });
      return;
    }

    if (passwordData.nextPassword !== passwordData.confirmPassword) {
      toast.error("La confirmacion de clave no coincide.", {
        position: "top-right",
        autoClose: 2400,
        className: "taskflow-toast",
      });
      return;
    }

    try {
      setPasswordSaving(true);
      await updatePassword(passwordData.nextPassword);
      setPasswordData({
        nextPassword: "",
        confirmPassword: "",
      });
      toast.success("Tu contrasena se actualizo correctamente.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo cambiar la contrasena.", {
        position: "top-right",
        autoClose: 2600,
        className: "taskflow-toast",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/login";
    }
  };

  if (!profile) {
    return (
      <div className="dashboard-page">
        <ToastContainer />
        <div className="surface-card">
          <div className="surface-card__body empty-state">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page profile-container">
      <ToastContainer />

      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-topbar__title">Perfil</h1>
          <p className="dashboard-topbar__subtitle">
            Ajusta tu cuenta, revisa tu ritmo de trabajo y deja listo tu espacio para seguir.
          </p>
        </div>
        <div className="dashboard-topbar__actions">
          <button
            type="button"
            className={`ghost-button profile-settings-toggle ${
              isSettingsOpen ? "profile-settings-toggle--active" : ""
            }`}
            onClick={() => setIsSettingsOpen((current) => !current)}
          >
            <i className="bi bi-gear-wide-connected me-2"></i>
            Configuracion
          </button>
        </div>
      </div>

      <section className="surface-card profile-hero-card">
        <div className="surface-card__body profile-hero-card__body">
          <div className="profile-identity">
            <div className="profile-avatar">
              <img src={resolveUserAvatar(profile, user)} alt="Avatar" />
            </div>
            <div>
              <span className="workspace-eyebrow">Plan free</span>
              <h2>
                {profile.name} {profile.lastName}
              </h2>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="profile-status-strip">
            <div
              className={`profile-status-pill ${
                profile.browserNotificationsEnabled && browserNotificationPermission === "granted"
                  ? "profile-status-pill--active"
                  : "profile-status-pill--inactive"
              }`}
            >
              <i className="bi bi-bell"></i>
              <span>
                {profile.browserNotificationsEnabled && browserNotificationPermission === "granted"
                  ? "Alertas activas"
                  : "Alertas en pausa"}
              </span>
              <b></b>
            </div>
            <div
              className={`profile-status-pill ${
                googleConnection ? "profile-status-pill--active" : "profile-status-pill--inactive"
              }`}
            >
              <i className="bi bi-google"></i>
              <span>{googleConnection ? "Google Calendar conectado" : "Google Calendar inactivo"}</span>
              <b></b>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-grid dashboard-grid--stats">
        {profileStats.map((item) => (
          <div key={item.label} className={`surface-card metric-card metric-card--${item.tone}`}>
            <div className="surface-card__body">
              <div className="metric-card__icon">
                <i className={`bi ${item.icon}`}></i>
              </div>
              <div className="metric-card__label">{item.label}</div>
              <div className="metric-card__value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="profile-hero">
        <section className="surface-card">
          <div className="surface-card__body">
            <div className="section-title">
              <div>
                <h2>Informacion personal</h2>
                <p>Actualiza tus datos principales y manten tu perfil al dia.</p>
              </div>
            </div>

            {!isEditing ? (
              <div className="profile-summary-grid">
                <div className="info-list__item">
                  <span className="info-list__label">Nombre</span>
                  <span className="info-list__value">{profile.name}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Apellido</span>
                  <span className="info-list__value">{profile.lastName}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Telefono</span>
                  <span className="info-list__value">{profile.phone}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Correo</span>
                  <span className="info-list__value">{user?.email}</span>
                </div>
                <div className="task-actions">
                  <button
                    type="button"
                    className="dashboard-action"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar perfil
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveChanges} className="form-panel">
                <div className="form-panel__row">
                  <div className="info-list__item">
                    <span className="info-list__label">Nombre</span>
                    <input
                      className="form-control"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="info-list__item">
                    <span className="info-list__label">Apellido</span>
                    <input
                      className="form-control"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Telefono</span>
                  <input
                    className="form-control"
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="task-actions">
                  <button type="submit" className="dashboard-action" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="surface-card">
          <div className="surface-card__body">
            <div className="section-title">
              <div>
                <h2>Seguridad</h2>
                <p>Cambia tu contrasena y cierra sesion cuando lo necesites.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="form-panel">
              <div className="info-list__item">
                <span className="info-list__label">Nueva contrasena</span>
                <input
                  className="form-control"
                  type="password"
                  name="nextPassword"
                  value={passwordData.nextPassword}
                  onChange={handlePasswordChange}
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>
              <div className="info-list__item">
                <span className="info-list__label">Confirmar contrasena</span>
                <input
                  className="form-control"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Vuelve a escribirla"
                  required
                />
              </div>
              <div className="task-actions">
                <button type="submit" className="dashboard-action" disabled={passwordSaving}>
                  {passwordSaving ? "Actualizando..." : "Cambiar contrasena"}
                </button>
                <button type="button" className="soft-button soft-button--danger" onClick={handleLogout}>
                  Cerrar sesion
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <Modal show={isSettingsOpen} onHide={() => setIsSettingsOpen(false)} centered dialogClassName="taskflow-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-gear-wide-connected me-2"></i>Configuracion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="profile-setting-card">
            <div className="section-title">
              <div>
                <h3>Alertas del navegador</h3>
                <p>Activalas para ver avisos cuando una tarea vence manana o queda atrasada.</p>
              </div>
            </div>
            <div className="profile-toggle-row">
              <div>
                <strong>
                  {profile.browserNotificationsEnabled ? "Activadas" : "Desactivadas"}
                </strong>
                <span>
                  {browserNotificationPermission === "denied"
                    ? "Tu navegador bloqueo las notificaciones. Debes habilitarlas manualmente."
                    : "Puedes cambiarlas aqui en cualquier momento."}
                </span>
              </div>
              <div className="task-actions">
                <button
                  type="button"
                  className={`soft-button ${
                    profile.browserNotificationsEnabled
                      ? "soft-button--success profile-toggle-button--selected"
                      : ""
                  }`}
                  onClick={() => handleToggleNotifications(true)}
                >
                  {profile.browserNotificationsEnabled ? "Activado" : "Activar"}
                </button>
                <button
                  type="button"
                  className={`ghost-button ${
                    !profile.browserNotificationsEnabled ? "profile-toggle-button--selected-off" : ""
                  }`}
                  onClick={() => handleToggleNotifications(false)}
                >
                  {!profile.browserNotificationsEnabled ? "Desactivado" : "Desactivar"}
                </button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Profile;
