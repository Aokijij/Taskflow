const priorityOrder = {
  alta: 1,
  media: 2,
  baja: 3,
};

export const formatTaskRecord = (record) => ({
  id: record.id,
  userId: record.user_id,
  scope: record.scope || "personal",
  groupId: record.group_id,
  createdBy: record.created_by,
  updatedBy: record.updated_by,
  assignedTo: record.assigned_to,
  name: record.name,
  description: record.description,
  category: record.category,
  priority: record.priority,
  date: record.due_date,
  completed: Boolean(record.completed),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const formatGroupRecord = (record) => ({
  id: record.id,
  type: "group",
  ownerId: record.owner_id,
  name: record.name,
  code: record.code,
  color: record.color || "#2563eb",
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  members: (record.group_members || []).map((member) => ({
    id: member.id,
    userId: member.user_id,
    email: member.email,
    role: member.role,
    status: member.status,
    invitedBy: member.invited_by,
    createdAt: member.created_at,
  })),
});

export const formatInvitationRecord = (record) => ({
  id: record.id,
  groupId: record.group_id,
  email: record.email,
  role: record.role,
  status: record.status,
  invitedBy: record.invited_by,
  createdAt: record.created_at,
  group: record.task_groups
    ? {
        id: record.task_groups.id,
        type: "group",
        ownerId: record.task_groups.owner_id,
        name: record.task_groups.name,
        code: record.task_groups.code,
        color: record.task_groups.color || "#2563eb",
      }
    : null,
});

export const formatActivityRecord = (record) => ({
  id: record.id,
  taskId: record.task_id,
  groupId: record.group_id,
  actorId: record.actor_id,
  actorEmail: record.actor_email,
  action: record.action,
  details: record.details,
  createdAt: record.created_at,
});

export const formatCategoryRecord = (record) => ({
  id: record.id,
  userId: record.user_id,
  scope: record.scope || "personal",
  groupId: record.group_id,
  name: record.name,
  active: Boolean(record.active),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const sortTasksByPriority = (tasks) =>
  [...tasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority?.toLowerCase()] || 99;
    const bPriority = priorityOrder[b.priority?.toLowerCase()] || 99;
    return aPriority - bPriority;
  });

export const getTodayString = () => new Date().toISOString().split("T")[0];

export const daysBetween = (fromDate, toDate = new Date()) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((to - from) / (1000 * 60 * 60 * 24));
};

export const isRecentlyCompleted = (task, visibleDays = 7) => {
  if (!task.completed) {
    return false;
  }

  return daysBetween(task.updatedAt || task.createdAt || task.date) <= visibleDays;
};

export const getTaskCategories = (categories = []) =>
  [...categories]
    .map((category) => (typeof category === "string" ? category : category.name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

export const getTaskStatus = (task) => {
  if (task.completed) {
    return "Completada";
  }

  if (task.date < getTodayString()) {
    return "Atrasada";
  }

  return "Pendiente";
};

export const getTaskStatusFilterLabel = (task) => {
  const status = getTaskStatus(task);

  if (status === "Completada") {
    return "Completadas";
  }

  if (status === "Atrasada") {
    return "Atrasadas";
  }

  return "Pendientes";
};

export const getCategorySummary = (categories = [], tasks = []) =>
  [...categories].map((category) => ({
    id: category.id,
    name: category.name,
    active: Boolean(category.active),
    total: tasks.filter((task) => task.category === category.name).length,
    completed: tasks.filter((task) => task.category === category.name && task.completed).length,
  }));

export const getTomorrowString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

export const getTaskCode = (taskId = "") =>
  `TASK-${taskId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
