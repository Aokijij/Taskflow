import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "../services/profileService";
import { useTasks } from "../contexts/TaskContext";
import { resolveUserAvatar } from "../utils/userHelpers";
import "../css/Profile.css";

function Profile() {
  const { user, profile, refreshProfile, setProfile, logout } = useAuth();
  const { summary } = useTasks();
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    phone: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const updated = await updateProfile(user.id, formData);
      setProfile(updated);
      await refreshProfile();
      setIsEditing(false);
      toast.success("Perfil actualizado correctamente", {
        position: "top-right",
        autoClose: 2000,
        theme: "colored",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar el perfil.", {
        position: "top-right",
        autoClose: 2500,
        theme: "colored",
      });
    } finally {
      setSaving(false);
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
          <h1 className="dashboard-topbar__title">Profile</h1>
          <p className="dashboard-topbar__subtitle">
            Administra tu información principal y mantén tu espacio listo para trabajar.
          </p>
        </div>
      </div>

      <div className="profile-hero">
        <div className="surface-card">
          <div className="surface-card__body">
            <div className="profile-avatar">
              <img src={resolveUserAvatar(profile, user)} alt="Avatar" />
            </div>
            <h2 style={{ marginTop: 18, marginBottom: 6, fontWeight: 800 }}>
              {profile.name} {profile.lastName}
            </h2>
            <p className="metric-card__note" style={{ marginBottom: 20 }}>
              {user?.email}
            </p>
            <div className="info-list">
              <div className="info-list__item">
                <span className="info-list__label">Teléfono</span>
                <span className="info-list__value">{profile.phone}</span>
              </div>
              <div className="info-list__item">
                <span className="info-list__label">Carga actual</span>
                <span className="info-list__value">{summary.total} tareas visibles</span>
              </div>
              <div className="info-list__item">
                <span className="info-list__label">Pendientes</span>
                <span className="info-list__value">{summary.pending}</span>
              </div>
            </div>
            <div className="task-actions" style={{ marginTop: 18 }}>
              <button type="button" className="soft-button soft-button--danger" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        <div className="surface-card">
          <div className="surface-card__body">
            <div className="section-title">
              <div>
                <h2>Información personal</h2>
                <p>Actualiza los datos principales de tu cuenta.</p>
              </div>
            </div>

            {!isEditing ? (
              <div className="form-panel">
                <div className="info-list__item">
                  <span className="info-list__label">Nombre</span>
                  <span className="info-list__value">{profile.name}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Apellido</span>
                  <span className="info-list__value">{profile.lastName}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Teléfono</span>
                  <span className="info-list__value">{profile.phone}</span>
                </div>
                <button
                  type="button"
                  className="dashboard-action"
                  style={{ width: "fit-content" }}
                  onClick={() => setIsEditing(true)}
                >
                  Editar perfil
                </button>
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
                  <span className="info-list__label">Teléfono</span>
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
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </button>
                  <button type="button" className="soft-button soft-button--danger" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
