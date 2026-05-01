import { supabase } from "../../lib/supabaseClient";
import {
  formatActivityRecord,
  formatGroupRecord,
  formatInvitationRecord,
  formatTaskRecord,
  sortTasksByPriority,
} from "../../utils/taskHelpers";

const taskSelect = `
  id,
  user_id,
  scope,
  group_id,
  created_by,
  updated_by,
  assigned_to,
  name,
  description,
  category,
  priority,
  due_date,
  completed,
  created_at,
  updated_at
`;

const legacyTaskSelect = `
  id,
  user_id,
  name,
  description,
  category,
  priority,
  due_date,
  completed,
  created_at,
  updated_at
`;

const groupSelect = `
  id,
  owner_id,
  name,
  code,
  created_at,
  updated_at,
  group_members (
    id,
    user_id,
    email,
    role,
    status,
    invited_by,
    created_at
  )
`;

const activitySelect = `
  id,
  task_id,
  group_id,
  actor_id,
  actor_email,
  action,
  details,
  created_at
`;

const invitationSelect = `
  id,
  group_id,
  email,
  role,
  status,
  invited_by,
  created_at,
  task_groups (
    id,
    owner_id,
    name,
    code
  )
`;

const createGroupCode = () =>
  Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(2, 8).toUpperCase();

const getErrorMessage = (error, fallback = "No se pudo completar la accion.") =>
  error?.message || error?.details || error?.hint || fallback;

const isMissingSchemaError = (error) => {
  const message = getErrorMessage(error, "").toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find the") ||
    message.includes("relationship")
  );
};

const throwReadableError = (error, fallback) => {
  throw new Error(getErrorMessage(error, fallback));
};

export class SupabaseTaskRepository {
  async getAll() {
    const response = await supabase
      .from("tasks")
      .select(taskSelect)
      .order("due_date", { ascending: true });

    if (response.error && isMissingSchemaError(response.error)) {
      const legacyResponse = await supabase
        .from("tasks")
        .select(legacyTaskSelect)
        .order("due_date", { ascending: true });

      if (legacyResponse.error) {
        throwReadableError(legacyResponse.error, "No se pudieron cargar las tareas.");
      }

      return sortTasksByPriority((legacyResponse.data || []).map(formatTaskRecord));
    }

    if (response.error) {
      throwReadableError(response.error, "No se pudieron cargar las tareas.");
    }

    return sortTasksByPriority((response.data || []).map(formatTaskRecord));
  }

  async getById(taskId) {
    const response = await supabase
      .from("tasks")
      .select(taskSelect)
      .eq("id", taskId)
      .single();

    if (response.error && isMissingSchemaError(response.error)) {
      const legacyResponse = await supabase
        .from("tasks")
        .select(legacyTaskSelect)
        .eq("id", taskId)
        .single();

      if (legacyResponse.error) {
        throwReadableError(legacyResponse.error, "No se encontro la tarea.");
      }

      return formatTaskRecord(legacyResponse.data);
    }

    if (response.error) {
      throwReadableError(response.error, "No se encontro la tarea.");
    }

    return formatTaskRecord(response.data);
  }

  async create(userId, task, actorEmail = "") {
    const isGroupTask = task.scope === "group" && task.groupId;
    const payload = {
      user_id: userId,
      scope: isGroupTask ? "group" : "personal",
      group_id: isGroupTask ? task.groupId : null,
      created_by: userId,
      updated_by: userId,
      assigned_to: task.assignedTo || null,
      name: task.name,
      description: task.description,
      category: task.category,
      priority: task.priority,
      due_date: task.date,
      completed: false,
    };

    const response = await supabase
      .from("tasks")
      .insert(payload)
      .select(taskSelect)
      .single();

    if (response.error && isMissingSchemaError(response.error)) {
      if (isGroupTask) {
        throw new Error("Para crear tareas grupales primero aplica el SQL nuevo en Supabase.");
      }

      const legacyResponse = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          name: task.name,
          description: task.description,
          category: task.category,
          priority: task.priority,
          due_date: task.date,
          completed: false,
        })
        .select(legacyTaskSelect)
        .single();

      if (legacyResponse.error) {
        throwReadableError(legacyResponse.error, "No se pudo crear la tarea.");
      }

      return formatTaskRecord(legacyResponse.data);
    }

    if (response.error) {
      throwReadableError(response.error, "No se pudo crear la tarea.");
    }

    const data = response.data;

    await this.addActivity({
      taskId: data.id,
      groupId: data.group_id,
      actorId: userId,
      actorEmail,
      action: "created",
      details: "Creo la tarea",
    });

    return formatTaskRecord(data);
  }

  async update(taskId, updates, actorId, actorEmail = "", action = "updated") {
    const payload = {
      name: updates.name,
      description: updates.description,
      category: updates.category,
      priority: updates.priority,
      due_date: updates.date,
      completed: Boolean(updates.completed),
      updated_by: actorId,
      assigned_to: updates.assignedTo || null,
    };

    const response = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId)
      .select(taskSelect)
      .single();

    if (response.error && isMissingSchemaError(response.error)) {
      const legacyResponse = await supabase
        .from("tasks")
        .update({
          name: updates.name,
          description: updates.description,
          category: updates.category,
          priority: updates.priority,
          due_date: updates.date,
          completed: Boolean(updates.completed),
        })
        .eq("id", taskId)
        .select(legacyTaskSelect)
        .single();

      if (legacyResponse.error) {
        throwReadableError(legacyResponse.error, "No se pudo actualizar la tarea.");
      }

      return formatTaskRecord(legacyResponse.data);
    }

    if (response.error) {
      throwReadableError(response.error, "No se pudo actualizar la tarea.");
    }

    const data = response.data;

    await this.addActivity({
      taskId,
      groupId: data.group_id,
      actorId,
      actorEmail,
      action,
      details: action === "completed" ? "Marco la tarea como completada" : "Actualizo la tarea",
    });

    return formatTaskRecord(data);
  }

  async remove(taskId) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      throwReadableError(error, "No se pudo eliminar la tarea.");
    }

    return taskId;
  }

  async getGroups() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("task_groups")
      .select(groupSelect)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingSchemaError(error)) {
        return [];
      }

      throwReadableError(error, "No se pudieron cargar los grupos.");
    }

    return (data || [])
      .map(formatGroupRecord)
      .filter((group) =>
        group.members.some((member) => member.userId === user?.id && member.status === "active")
      );
  }

  async createGroup(userId, userEmail, name) {
    const currentGroups = await this.getGroups();
    if (currentGroups.length >= 5) {
      throw new Error("Solo puedes estar en maximo 5 grupos.");
    }

    const code = createGroupCode();
    const { data, error } = await supabase
      .from("task_groups")
      .insert({
        owner_id: userId,
        name,
        code,
      })
      .select(groupSelect)
      .single();

    if (error) {
      if (isMissingSchemaError(error)) {
        throw new Error("Para crear grupos primero aplica el SQL nuevo en Supabase.");
      }

      throwReadableError(error, "No se pudo crear el grupo.");
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: userId,
      email: userEmail,
      role: "owner",
      status: "active",
      invited_by: userId,
    });

    if (memberError) {
      throwReadableError(memberError, "No se pudo agregar tu usuario al grupo.");
    }

    return this.getGroupById(data.id);
  }

  async updateGroup(groupId, name) {
    const { data, error } = await supabase
      .from("task_groups")
      .update({ name })
      .eq("id", groupId)
      .select(groupSelect)
      .single();

    if (error) {
      throwReadableError(error, "No se pudo actualizar el grupo.");
    }

    return formatGroupRecord(data);
  }

  async deleteGroup(groupId) {
    const { error } = await supabase.from("task_groups").delete().eq("id", groupId);

    if (error) {
      throwReadableError(error, "No se pudo eliminar el grupo.");
    }

    return groupId;
  }

  async getGroupById(groupId) {
    const { data, error } = await supabase
      .from("task_groups")
      .select(groupSelect)
      .eq("id", groupId)
      .single();

    if (error) {
      throwReadableError(error, "No se encontro el grupo.");
    }

    return formatGroupRecord(data);
  }

  async joinGroupByCode(userId, userEmail, code) {
    const currentGroups = await this.getGroups();
    if (currentGroups.length >= 5) {
      throw new Error("Solo puedes estar en maximo 5 grupos.");
    }

    const { data: groupId, error: groupError } = await supabase.rpc("join_group_by_code", {
      invite_code: code.trim().toUpperCase(),
    });

    if (groupError) {
      if (isMissingSchemaError(groupError)) {
        throw new Error("Para unirte a grupos primero aplica el SQL nuevo en Supabase.");
      }

      throwReadableError(groupError, "No se pudo usar ese codigo.");
    }

    return groupId;
  }

  async inviteMember(groupId, invitedBy, email) {
    const group = await this.getGroupById(groupId);

    if (group.members.length >= 10) {
      throw new Error("El grupo ya tiene el limite de 10 miembros.");
    }

    const { error } = await supabase.from("group_members").upsert(
      {
        group_id: groupId,
        email: email.trim().toLowerCase(),
        role: "member",
        status: "invited",
        invited_by: invitedBy,
      },
      { onConflict: "group_id,email" }
    );

    if (error) {
      throwReadableError(error, "No se pudo invitar a esa persona.");
    }

    return this.getGroupById(groupId);
  }

  async removeMember(memberId) {
    const { error } = await supabase.from("group_members").delete().eq("id", memberId);

    if (error) {
      throwReadableError(error, "No se pudo quitar a esa persona.");
    }

    return memberId;
  }

  async acceptJoinRequest(memberId) {
    const { error } = await supabase.rpc("accept_group_request", {
      member_id: memberId,
    });

    if (error) {
      throwReadableError(error, "No se pudo aceptar la solicitud.");
    }
  }

  async declineJoinRequest(memberId) {
    const { error } = await supabase.rpc("decline_group_request", {
      member_id: memberId,
    });

    if (error) {
      throwReadableError(error, "No se pudo rechazar la solicitud.");
    }
  }

  async getInvitations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return [];
    }

    const { data, error } = await supabase
      .from("group_members")
      .select(invitationSelect)
      .ilike("email", user.email)
      .eq("status", "invited")
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingSchemaError(error)) {
        return [];
      }

      throwReadableError(error, "No se pudieron cargar las invitaciones.");
    }

    return (data || []).map(formatInvitationRecord);
  }

  async acceptInvitation(invitationId) {
    const { error } = await supabase.rpc("accept_group_invitation", {
      invitation_id: invitationId,
    });

    if (error) {
      if (isMissingSchemaError(error)) {
        throw new Error("Para aceptar invitaciones primero aplica el SQL nuevo en Supabase.");
      }

      throwReadableError(error, "No se pudo aceptar la invitacion.");
    }
  }

  async declineInvitation(invitationId) {
    const { error } = await supabase.rpc("decline_group_invitation", {
      invitation_id: invitationId,
    });

    if (error) {
      if (isMissingSchemaError(error)) {
        throw new Error("Para responder invitaciones primero aplica el SQL nuevo en Supabase.");
      }

      throwReadableError(error, "No se pudo rechazar la invitacion.");
    }
  }

  async getTaskActivity(taskId) {
    const { data, error } = await supabase
      .from("task_activity")
      .select(activitySelect)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingSchemaError(error)) {
        return [];
      }

      throwReadableError(error, "No se pudo cargar el historial.");
    }

    return (data || []).map(formatActivityRecord);
  }

  async addActivity({ taskId, groupId, actorId, actorEmail, action, details }) {
    const { error } = await supabase.from("task_activity").insert({
      task_id: taskId,
      group_id: groupId,
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      details,
    });

    if (error) {
      if (isMissingSchemaError(error)) {
        return;
      }

      throwReadableError(error, "No se pudo guardar el historial.");
    }
  }
}
