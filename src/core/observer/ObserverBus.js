export class ObserverBus {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventName, listener) {
    const listeners = this.listeners.get(eventName) || new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);

    return () => {
      const currentListeners = this.listeners.get(eventName);
      if (!currentListeners) {
        return;
      }

      currentListeners.delete(listener);

      if (currentListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  notify(eventName, payload) {
    const listeners = this.listeners.get(eventName);

    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => listener(payload));
  }
}
