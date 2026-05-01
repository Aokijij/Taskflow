import { ObserverBus } from "./ObserverBus";

export const TASK_EVENTS = {
  CREATED: "task:created",
  UPDATED: "task:updated",
  DELETED: "task:deleted",
  COMPLETED: "task:completed",
  SYNC_REQUESTED: "task:sync-requested",
};

export const taskObserver = new ObserverBus();
