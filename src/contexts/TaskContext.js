import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { serviceFactory } from "../core/factory/serviceFactory";
import { TASK_EVENTS } from "../core/observer/taskObserver";
import { getTaskStatus, sortTasksByPriority } from "../utils/taskHelpers";
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
  const { user, isAuthenticated } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(personalWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      return nextTasks;
    } catch (loadError) {
      setError(getReadableError(loadError, "No se pudieron cargar las tareas."));
      setAllTasks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadGroups, loadInvitations]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks().catch((loadError) => {
        setError(getReadableError(loadError, "No se pudieron cargar las tareas."));
      });
      return;
    }

    setAllTasks([]);
    setGroups([]);
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

  const createTask = useCallback(
    async (task) =>
      taskService.createTask(
        user.id,
        {
          ...task,
          scope: activeWorkspace.type,
          groupId: activeWorkspace.type === "group" ? activeWorkspace.id : null,
        },
        user.email
      ),
    [activeWorkspace.id, activeWorkspace.type, user?.email, user?.id]
  );

  const updateTask = useCallback(
    async (taskId, updates) => taskService.updateTask(taskId, updates, user.id, user.email),
    [user?.email, user?.id]
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

  const removeTask = useCallback(async (taskId) => taskService.deleteTask(taskId), []);

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
    async (name) => {
      const group = await taskService.createGroup(user.id, user.email, name);
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
    async (groupId, name) => {
      const group = await taskService.updateGroup(groupId, name);
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
    },
    [loadGroups, loadTasks]
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

  const value = useMemo(
    () => ({
      tasks,
      allTasks,
      groups,
      invitations,
      activeWorkspace,
      loading,
      error,
      summary,
      groupedTasks,
      loadTasks,
      loadGroups,
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
      requestSync: () => taskService.requestSync(),
    }),
    [
      tasks,
      allTasks,
      groups,
      invitations,
      activeWorkspace,
      loading,
      error,
      summary,
      groupedTasks,
      loadTasks,
      loadGroups,
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
