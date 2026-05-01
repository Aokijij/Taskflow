import { AuthService } from "../../application/services/AuthService";
import { ProfileService } from "../../application/services/ProfileService";
import { TaskService } from "../../application/services/TaskService";
import { taskObserver } from "../observer/taskObserver";
import { SupabaseProfileRepository } from "../../infrastructure/repositories/SupabaseProfileRepository";
import { SupabaseTaskRepository } from "../../infrastructure/repositories/SupabaseTaskRepository";

class ServiceFactory {
  constructor() {
    this.profileRepository = new SupabaseProfileRepository();
    this.taskRepository = new SupabaseTaskRepository();
    this.profileService = new ProfileService(this.profileRepository);
    this.taskService = new TaskService(this.taskRepository, taskObserver);
    this.authService = new AuthService(this.profileService);
  }

  createAuthService() {
    return this.authService;
  }

  createProfileService() {
    return this.profileService;
  }

  createTaskService() {
    return this.taskService;
  }

  createTaskObserver() {
    return taskObserver;
  }
}

export const serviceFactory = new ServiceFactory();
