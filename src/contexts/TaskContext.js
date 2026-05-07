import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { serviceFactory } from "../core/factory/serviceFactory";
import { TASK_EVENTS } from "../core/observer/taskObserver";
import { getTaskStatus, getTomorrowString, sortTasksByPriority } from "../utils/taskHelpers";
import { useAuth } from "./AuthContext";

const TaskContext = createContext(null);

const taskService = serviceFactory.createTaskService();
const taskObserver = serviceFactory.createTaskObserver();

const personalWorkspace = {
  id: "personal",
  type: "personal",
  name: "Personal",
  code: null,
  members: [],
};

const getReadableError = (error, fallback) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || error.error_description || error.details || fallback;
};

export function TaskProvider({ children }) {
  const { user, profile, isAuthenticated } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(personalWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window
      ? window.Notification.permission
      : "unsupported"
  );
  const notificationMemory = useRef(new Set());

  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setGroups([]);
      setInvitations([]);
      setActiveWorkspace(personalWorkspace);
      return [];
    }

    let nextGroups = [];

    nextGroups = await taskService.getGroups();
    setGroups(nextGroups);

    setActiveWorkspace((current) => {
      if (current.type === "group" && nextGroups.some((group) => group.id === current.id)) {
        return nextGroups.find((group) => group.id === current.id);
      }

      return current.type === "group" ? personalWorkspace : current;
    });

    return nextGroups;
  }, [isAuthenticated]);

  const loadInvitations = useCallback(async () => {
    if (!isAuthenticated) {
      setInvitations([]);
      return [];
    }

    const nextInvitations = await taskService.getInvitations();
    setInvitations(nextInvitations);
    return nextInvitations;
  }, [isAuthenticated]);

  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) {
      setAllCategories([]);
      return [];
    }

    const nextCategories = await taskService.getCategories();
    setAllCategories(nextCategories);
    return nextCategories;
  }, [isAuthenticated]);

  const loadTasks = useCallback(async () => {
    if (!isAuthenticated) {
      setAllTasks([]);
      return [];
    }

    try {
      setLoading(true);
      setError("");
      const nextTasks = await taskService.getTasks();
      setAllTasks(nextTasks);

      loadGroups().catch(() => {
        setGroups([]);
      });

      loadInvitations().catch(() => {
        setInvitations([]);
      });

      loadCategories().catch(() => {
        setAllCategories([]);
      });

      return nextTasks;
    } catch (loadError) {
      setError(getReadableError(loadError, "No se pudieron cargar las tareas."));
      setAllTasks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadCategories, loadGroups, loadInvitations]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks().catch((loadError) => {
        setError(getReadableError(loadError, "No se pudieron cargar las tareas."));
      });
      return;
    }

    setAllTasks([]);
    setGroups([]);
    setAllCategories([]);
    setInvitations([]);
    setActiveWorkspace(personalWorkspace);
  }, [isAuthenticated, loadTasks, user?.id]);

  useEffect(() => {
    const unsubscribeCreated = taskObserver.subscribe(TASK_EVENTS.CREATED, (task) => {
      setAllTasks((current) => sortTasksByPriority([...current, task]));
    });

    const unsubscribeUpdated = taskObserver.subscribe(TASK_EVENTS.UPDATED, (task) => {
      setAllTasks((current) =>
        sortTasksByPriority(current.map((item) => (item.id === task.id ? task : item)))
      );
    });

    const unsubscribeCompleted = taskObserver.subscribe(TASK_EVENTS.COMPLETED, (task) => {
      setAllTasks((current) =>
        sortTasksByPriority(current.map((item) => (item.id === task.id ? task : item)))
      );
    });

    const unsubscribeDeleted = taskObserver.subscribe(TASK_EVENTS.DELETED, (taskId) => {
      setAllTasks((current) => current.filter((task) => task.id !== taskId));
    });

    const unsubscribeSync = taskObserver.subscribe(TASK_EVENTS.SYNC_REQUESTED, () => {
      loadTasks().catch((loadError) => {
        setError(getReadableError(loadError, "No se pudieron sincronizar las tareas."));
      });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeCompleted();
      unsubscribeDeleted();
      unsubscribeSync();
    };
  }, [loadTasks]);

  const tasks = useMemo(() => {
    if (activeWorkspace.type === "group") {
      return allTasks.filter((task) => task.scope === "group" && task.groupId === activeWorkspace.id);
    }

    return allTasks.filter((task) => task.scope !== "group");
  }, [activeWorkspace.id, activeWorkspace.type, allTasks]);

  const categories = useMemo(() => {
    if (activeWorkspace.type === "group") {
      return allCategories.filter(
        (category) => category.scope === "group" && category.groupId === activeWorkspace.id
      );
    }

    return allCategories.filter((category) => category.scope !== "group");
  }, [activeWorkspace.id, activeWorkspace.type, allCategories]);

  const createTask = useCallback(
    async (task) => {
      const createdTask = await taskService.createTask(
        user.id,
        {
          ...task,
          scope: activeWorkspace.type,
          groupId: activeWorkspace.type === "group" ? activeWorkspace.id : null,
        },
        user.email
      );
      await loadCategories();
      return createdTask;
    },
    [activeWorkspace.id, activeWorkspace.type, loadCategories, user?.email, user?.id]
  );

  const updateTask = useCallback(
    async (taskId, updates) => {
      const updatedTask = await taskService.updateTask(taskId, updates, user.id, user.email);
      await loadCategories();
      return updatedTask;
    },
    [loadCategories, user?.email, user?.id]
  );

  const completeTask = useCallback(
    async (taskId) => {
      const currentTask = allTasks.find((task) => task.id === taskId);

      if (!currentTask) {
        throw new Error("La tarea no existe en memoria.");
      }

      return taskService.completeTask(taskId, currentTask, user.id, user.email);
    },
    [allTasks, user?.email, user?.id]
  );

  const removeTask = useCallback(
    async (taskId) => {
      const removedTaskId = await taskService.deleteTask(taskId);
      await loadCategories();
      return removedTaskId;
    },
    [loadCategories]
  );

  const getTaskById = useCallback(
    async (taskId) => {
      const existingTask = allTasks.find((task) => task.id === taskId);
      if (existingTask) {
        return existingTask;
      }

      return taskService.getTaskById(taskId);
    },
    [allTasks]
  );

  const createGroup = useCallback(
    async (name, color) => {
      const group = await taskService.createGroup(user.id, user.email, name, color);
      const nextGroups = await loadGroups();
      setActiveWorkspace(nextGroups.find((item) => item.id === group.id) || group);
      return group;
    },
    [loadGroups, user?.email, user?.id]
  );

  const joinGroupByCode = useCallback(
    async (code) => {
      const groupId = await taskService.joinGroupByCode(user.id, user.email, code);
      await loadInvitations();
      return groupId;
    },
    [loadInvitations, user?.email, user?.id]
  );

  const inviteMember = useCallback(
    async (groupId, email) => {
      const group = await taskService.inviteMember(groupId, user.id, email);
      await loadGroups();
      return group;
    },
    [loadGroups, user?.id]
  );

  const updateGroup = useCallback(
    async (groupId, name, color) => {
      const group = await taskService.updateGroup(groupId, name, color);
      const nextGroups = await loadGroups();
      setActiveWorkspace(nextGroups.find((item) => item.id === group.id) || group);
      return group;
    },
    [loadGroups]
  );

  const deleteGroup = useCallback(
    async (groupId) => {
      await taskService.deleteGroup(groupId);
      setActiveWorkspace(personalWorkspace);
      await loadGroups();
      await loadTasks();
      await loadCategories();
    },
    [loadCategories, loadGroups, loadTasks]
  );

  const removeMember = useCallback(
    async (memberId) => {
      await taskService.removeMember(memberId);
      await loadGroups();
    },
    [loadGroups]
  );

  const acceptJoinRequest = useCallback(
    async (memberId) => {
      await taskService.acceptJoinRequest(memberId);
      await loadGroups();
    },
    [loadGroups]
  );

  const declineJoinRequest = useCallback(
    async (memberId) => {
      await taskService.declineJoinRequest(memberId);
      await loadGroups();
    },
    [loadGroups]
  );

  const acceptInvitation = useCallback(
    async (invitationId) => {
      await taskService.acceptInvitation(invitationId);
      const nextGroups = await loadGroups();
      await loadInvitations();
      await loadTasks();
      return nextGroups;
    },
    [loadGroups, loadInvitations, loadTasks]
  );

  const declineInvitation = useCallback(
    async (invitationId) => {
      await taskService.declineInvitation(invitationId);
      await loadInvitations();
    },
    [loadInvitations]
  );

  const getTaskActivity = useCallback(async (taskId) => taskService.getTaskActivity(taskId), []);

  const deleteCategory = useCallback(
    async (categoryId) => {
      await taskService.deleteCategory(categoryId);
      await loadCategories();
      await loadTasks();
    },
    [loadCategories, loadTasks]
  );

  const summary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const pending = tasks.filter((task) => !task.completed && task.date >= today).length;
    const overdue = tasks.filter((task) => !task.completed && task.date < today).length;
    const completed = tasks.filter((task) => task.completed).length;
    const highPriority = tasks.filter((task) => task.priority === "Alta").length;

    return {
      total: tasks.length,
      pending,
      overdue,
      completed,
      highPriority,
    };
  }, [tasks]);

  const groupedTasks = useMemo(
    () => ({
      upcoming: tasks.filter((task) => !task.completed && getTaskStatus(task) === "Pendiente"),
      overdue: tasks.filter((task) => !task.completed && getTaskStatus(task) === "Atrasada"),
      completed: tasks.filter((task) => task.completed),
    }),
    [tasks]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (window.Notification.permission !== "granted" || !profile?.browserNotificationsEnabled) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = getTomorrowString();
    const workspaceName = activeWorkspace.type === "group" ? activeWorkspace.name : "Mis tareas";

    tasks.forEach((task) => {
      if (task.completed) {
        return;
      }

      const dueTomorrow = task.date === tomorrow;
      const overdue = task.date < today;

      if (!dueTomorrow && !overdue) {
        return;
      }

      const type = dueTomorrow ? "due-tomorrow" : "overdue";
      const notificationKey = `${activeWorkspace.id}-${task.id}-${type}`;

      if (notificationMemory.current.has(notificationKey)) {
        return;
      }

      notificationMemory.current.add(notificationKey);

      const title = dueTomorrow
        ? `${task.name} vence manana`
        : `${task.name} esta atrasada`;
      const body = dueTomorrow
        ? `${workspaceName}: esta tarea vence al dia siguiente.`
        : `${workspaceName}: revisa esta tarea cuanto antes.`;

      window.setTimeout(() => {
        new window.Notification(title, {
          body,
          tag: notificationKey,
        });
      }, 400);
    });
  }, [
    activeWorkspace.id,
    activeWorkspace.name,
    activeWorkspace.type,
    profile?.browserNotificationsEnabled,
    tasks,
  ]);

  const enableBrowserNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      throw new Error("Tu navegador no soporta notificaciones.");
    }

    if (window.Notification.permission === "granted") {
      setBrowserNotificationPermission("granted");
      return "granted";
    }

    const permission = await window.Notification.requestPermission();
    setBrowserNotificationPermission(permission);

    if (permission !== "granted") {
      throw new Error("No se activaron las alertas del navegador.");
    }

    return permission;
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      allTasks,
      categories,
      groups,
      invitations,
      activeWorkspace,
      loading,
      error,
      summary,
      groupedTasks,
      loadTasks,
      loadGroups,
      loadCategories,
      loadInvitations,
      setActiveWorkspace,
      createTask,
      updateTask,
      completeTask,
      removeTask,
      getTaskById,
      createGroup,
      joinGroupByCode,
      inviteMember,
      updateGroup,
      deleteGroup,
      removeMember,
      acceptJoinRequest,
      declineJoinRequest,
      acceptInvitation,
      declineInvitation,
      getTaskActivity,
      deleteCategory,
      enableBrowserNotifications,
      browserNotificationPermission,
      requestSync: () => taskService.requestSync(),
    }),
    [
      tasks,
      allTasks,
      categories,
      groups,
      invitations,
      activeWorkspace,
      loading,
      error,
      summary,
      groupedTasks,
      loadTasks,
      loadGroups,
      loadCategories,
      loadInvitations,
      createTask,
      updateTask,
      completeTask,
      removeTask,
      getTaskById,
      createGroup,
      joinGroupByCode,
      inviteMember,
      updateGroup,
      deleteGroup,
      removeMember,
      acceptJoinRequest,
      declineJoinRequest,
      acceptInvitation,
      declineInvitation,
      getTaskActivity,
      deleteCategory,
      enableBrowserNotifications,
      browserNotificationPermission,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }

  return context;
}
