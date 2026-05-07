import { TASK_EVENTS } from "../../core/observer/taskObserver";

export class TaskService {
  constructor(taskRepository, observer) {
    this.taskRepository = taskRepository;
    this.observer = observer;
  }

  async getTasks() {
    return this.taskRepository.getAll();
  }

  async getTaskById(taskId) {
    return this.taskRepository.getById(taskId);
  }

  async createTask(userId, task, actorEmail) {
    const createdTask = await this.taskRepository.create(userId, task, actorEmail);
    this.observer.notify(TASK_EVENTS.CREATED, createdTask);
    return createdTask;
  }

  async updateTask(taskId, updates, actorId, actorEmail) {
    const updatedTask = await this.taskRepository.update(taskId, updates, actorId, actorEmail);
    this.observer.notify(TASK_EVENTS.UPDATED, updatedTask);
    return updatedTask;
  }

  async completeTask(taskId, currentTask, actorId, actorEmail) {
    const completedTask = await this.taskRepository.update(taskId, {
      ...currentTask,
      completed: true,
    }, actorId, actorEmail, "completed");
    this.observer.notify(TASK_EVENTS.COMPLETED, completedTask);
    return completedTask;
  }

  async deleteTask(taskId) {
    await this.taskRepository.remove(taskId);
    this.observer.notify(TASK_EVENTS.DELETED, taskId);
    return taskId;
  }

  requestSync() {
    this.observer.notify(TASK_EVENTS.SYNC_REQUESTED);
  }

  async getGroups() {
    return this.taskRepository.getGroups();
  }

  async getCategories() {
    return this.taskRepository.getCategories();
  }

  async deleteCategory(categoryId) {
    return this.taskRepository.deleteCategory(categoryId);
  }

  async createGroup(userId, userEmail, name, color) {
    return this.taskRepository.createGroup(userId, userEmail, name, color);
  }

  async updateGroup(groupId, name, color) {
    return this.taskRepository.updateGroup(groupId, name, color);
  }

  async deleteGroup(groupId) {
    return this.taskRepository.deleteGroup(groupId);
  }

  async joinGroupByCode(userId, userEmail, code) {
    return this.taskRepository.joinGroupByCode(userId, userEmail, code);
  }

  async inviteMember(groupId, invitedBy, email) {
    return this.taskRepository.inviteMember(groupId, invitedBy, email);
  }

  async removeMember(memberId) {
    return this.taskRepository.removeMember(memberId);
  }

  async acceptJoinRequest(memberId) {
    return this.taskRepository.acceptJoinRequest(memberId);
  }

  async declineJoinRequest(memberId) {
    return this.taskRepository.declineJoinRequest(memberId);
  }

  async getInvitations() {
    return this.taskRepository.getInvitations();
  }

  async acceptInvitation(invitationId) {
    return this.taskRepository.acceptInvitation(invitationId);
  }

  async declineInvitation(invitationId) {
    return this.taskRepository.declineInvitation(invitationId);
  }

  async getTaskActivity(taskId) {
    return this.taskRepository.getTaskActivity(taskId);
  }
}
