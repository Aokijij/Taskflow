import React, { useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../contexts/TaskContext";

function Groups() {
  const { user } = useAuth();
  const {
    groups,
    invitations,
    activeWorkspace,
    setActiveWorkspace,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroupByCode,
    inviteMember,
    removeMember,
    acceptJoinRequest,
    declineJoinRequest,
    acceptInvitation,
    declineInvitation,
  } = useTasks();
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeWorkspace.id) || groups[0],
    [activeWorkspace.id, groups]
  );
  const isOwner = activeGroup?.ownerId === user?.id;
  const activeMembers = activeGroup?.members.filter((member) => member.status === "active") || [];
  const invitedMembers = activeGroup?.members.filter((member) => member.status === "invited") || [];
  const joinRequests = activeGroup?.members.filter((member) => member.status === "requested") || [];

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!groupName.trim()) return;

    try {
      setSaving(true);
      await createGroup(groupName.trim());
      setGroupName("");
      toast.success("Grupo creado correctamente.", {
        position: "top-right",
        autoClose: 2400,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo crear el grupo.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleJoinGroup = async (event) => {
    event.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setSaving(true);
      await joinGroupByCode(joinCode.trim());
      setJoinCode("");
      toast.success("Solicitud enviada. El propietario debe aprobar tu ingreso.", {
        position: "top-right",
        autoClose: 2400,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo usar ese codigo.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGroup = async (event) => {
    event.preventDefault();
    if (!activeGroup || !editingName.trim()) return;

    try {
      setSaving(true);
      await updateGroup(activeGroup.id, editingName.trim());
      setEditingName("");
      toast.success("Nombre del grupo actualizado.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar el grupo.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = () => {
    if (!activeGroup) return;

    Swal.fire({
      title: "Eliminar grupo",
      text: "Se eliminaran el grupo, sus miembros y sus tareas compartidas.",
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

      try {
        setSaving(true);
        await deleteGroup(activeGroup.id);
        toast.success("Grupo eliminado.", {
          position: "top-right",
          autoClose: 2200,
          className: "taskflow-toast",
        });
      } catch (error) {
        toast.error(error.message || "No se pudo eliminar el grupo.", {
          position: "top-right",
          autoClose: 3000,
          className: "taskflow-toast",
        });
      } finally {
        setSaving(false);
      }
    });
  };

  const handleRemoveMember = async (memberId) => {
    try {
      setSaving(true);
      await removeMember(memberId);
      toast.success("Persona quitada del grupo.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo quitar a esa persona.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleJoinRequest = async (memberId, action) => {
    try {
      setSaving(true);
      if (action === "accept") {
        await acceptJoinRequest(memberId);
        toast.success("Solicitud aceptada.", {
          position: "top-right",
          autoClose: 2200,
          className: "taskflow-toast",
        });
        return;
      }

      await declineJoinRequest(memberId);
      toast.info("Solicitud rechazada.", {
        position: "top-right",
        autoClose: 2200,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo responder la solicitud.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (event) => {
    event.preventDefault();
    if (!activeGroup || !inviteEmail.trim()) return;

    try {
      setSaving(true);
      await inviteMember(activeGroup.id, inviteEmail.trim());
      setInviteEmail("");
      toast.success("Invitacion enviada al correo.", {
        position: "top-right",
        autoClose: 2400,
        className: "taskflow-toast",
      });
    } catch (error) {
      toast.error(error.message || "No se pudo invitar a esa persona.", {
        position: "top-right",
        autoClose: 3000,
        className: "taskflow-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInvitation = async (invitationId, action) => {
    try {
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <ToastContainer />
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-topbar__title">Grupos</h1>
          <p className="dashboard-topbar__subtitle">
            Gestiona espacios compartidos, invitaciones y codigos de acceso.
          </p>
        </div>
      </div>

      <div className="groups-layout">
        <section className="surface-card">
          <div className="surface-card__body">
            <div className="section-title">
              <div>
                <h2>Espacios</h2>
                <p>Puedes estar en maximo 5 grupos.</p>
              </div>
              <span className="workspace-code">{groups.length}/5 grupos</span>
            </div>

            <div className="workspace-switcher">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`workspace-tab ${
                    activeWorkspace.id === group.id ? "workspace-tab--active" : ""
                  }`}
                  onClick={() => setActiveWorkspace(group)}
                >
                  <i className="bi bi-people"></i>
                  {group.name}
                  <small>{group.members.length}/10</small>
                </button>
              ))}
            </div>

            <div className="group-card-list">
              {groups.length === 0 ? (
                <div className="empty-state">Aun no perteneces a ningun grupo.</div>
              ) : (
                groups.map((group) => (
                  <article key={group.id} className="group-card">
                    <div>
                      <span className="workspace-eyebrow">Grupo</span>
                      <h3>{group.name}</h3>
                      <p>Codigo {group.code}</p>
                    </div>
                    <div className="group-card__actions">
                      <button type="button" className="soft-button" onClick={() => setActiveWorkspace(group)}>
                        Gestionar
                      </button>
                    </div>
                    <div className="member-strip">
                      {group.members.map((member) => (
                        <span key={member.id || member.email} className="member-pill">
                          <i className={member.status === "active" ? "bi bi-check-circle" : "bi bi-clock"}></i>
                          {member.email}
                          <small>{member.status === "active" ? "activo" : "invitado"}</small>
                        </span>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="groups-side">
          <section className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>Crear o unirse</h3>
                  <p>Abre un espacio nuevo o entra con codigo.</p>
                </div>
              </div>

              <div className="workspace-tools workspace-tools--stack">
                <form className="workspace-form" onSubmit={handleCreateGroup}>
                  <label>Crear grupo</label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nombre del espacio"
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                    />
                    <button type="submit" className="soft-button" disabled={saving}>
                      Crear
                    </button>
                  </div>
                </form>

                <form className="workspace-form" onSubmit={handleJoinGroup}>
                  <label>Unirse con codigo</label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: A1B2C3"
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    />
                    <button type="submit" className="soft-button soft-button--warning" disabled={saving}>
                      Unirme
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <section className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>Gestionar grupo</h3>
                  <p>{activeGroup ? activeGroup.name : "Selecciona un grupo para ver opciones."}</p>
                </div>
              </div>

              {activeGroup ? (
                <div className="group-management">
                  {isOwner && (
                    <>
                      <form className="workspace-form" onSubmit={handleUpdateGroup}>
                        <label>Cambiar nombre</label>
                        <div>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={activeGroup.name}
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                          <button type="submit" className="soft-button" disabled={saving}>
                            Guardar
                          </button>
                        </div>
                      </form>

                      <form className="workspace-form" onSubmit={handleInviteMember}>
                        <label>Invitar por correo</label>
                        <div>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="persona@correo.com"
                            value={inviteEmail}
                            onChange={(event) => setInviteEmail(event.target.value)}
                          />
                          <button type="submit" className="soft-button soft-button--success" disabled={saving}>
                            Invitar
                          </button>
                        </div>
                      </form>

                      <button type="button" className="soft-button soft-button--danger" onClick={handleDeleteGroup}>
                        Eliminar grupo
                      </button>
                    </>
                  )}

                  <div className="group-section-list">
                    <h4>Miembros activos</h4>
                    {activeMembers.map((member) => (
                      <div key={member.id || member.email} className="group-person-row">
                        <span>{member.email}</span>
                        <small>{member.role === "owner" ? "propietario" : "miembro"}</small>
                        {isOwner && member.role !== "owner" && (
                          <button type="button" onClick={() => handleRemoveMember(member.id)} disabled={saving}>
                            Quitar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isOwner && invitedMembers.length > 0 && (
                    <div className="group-section-list">
                      <h4>Invitados</h4>
                      {invitedMembers.map((member) => (
                        <div key={member.id || member.email} className="group-person-row">
                          <span>{member.email}</span>
                          <small>pendiente</small>
                          <button type="button" onClick={() => handleRemoveMember(member.id)} disabled={saving}>
                            Cancelar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isOwner && (
                    <div className="group-section-list">
                      <h4>Solicitudes por codigo</h4>
                      {joinRequests.length === 0 ? (
                        <div className="empty-state">No hay solicitudes pendientes.</div>
                      ) : (
                        joinRequests.map((member) => (
                          <div key={member.id || member.email} className="group-person-row">
                            <span>{member.email}</span>
                            <small>solicita entrar</small>
                            <div className="task-actions">
                              <button type="button" onClick={() => handleJoinRequest(member.id, "accept")} disabled={saving}>
                                Aceptar
                              </button>
                              <button type="button" onClick={() => handleJoinRequest(member.id, "decline")} disabled={saving}>
                                Rechazar
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">Selecciona un grupo para administrar.</div>
              )}
            </div>
          </section>

          <section className="surface-card">
            <div className="surface-card__body">
              <div className="section-title">
                <div>
                  <h3>Invitaciones</h3>
                  <p>Responde las invitaciones pendientes.</p>
                </div>
              </div>

              <div className="invitation-list">
                {invitations.length === 0 ? (
                  <div className="empty-state">No tienes invitaciones pendientes.</div>
                ) : (
                  invitations.map((invitation) => (
                    <article key={invitation.id} className="invitation-card">
                      <div>
                        <strong>{invitation.group?.name || "Grupo compartido"}</strong>
                        <span>Codigo {invitation.group?.code || "pendiente"}</span>
                      </div>
                      <div className="task-actions">
                        <button
                          type="button"
                          className="soft-button soft-button--success"
                          onClick={() => handleInvitation(invitation.id, "accept")}
                          disabled={saving}
                        >
                          Aceptar
                        </button>
                        <button
                          type="button"
                          className="soft-button soft-button--danger"
                          onClick={() => handleInvitation(invitation.id, "decline")}
                          disabled={saving}
                        >
                          Rechazar
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Groups;
