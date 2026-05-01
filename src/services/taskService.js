import { serviceFactory } from "../core/factory/serviceFactory";

const taskService = serviceFactory.createTaskService();

export const fetchTasks = () => taskService.getTasks();
export const fetchTaskById = (taskId) => taskService.getTaskById(taskId);
export const createTask = (userId, task) => taskService.createTask(userId, task);
export const updateTask = (taskId, updates) => taskService.updateTask(taskId, updates);
export const deleteTask = (taskId) => taskService.deleteTask(taskId);
export const markTaskCompleted = (taskId, currentTask) =>
  taskService.completeTask(taskId, currentTask);
