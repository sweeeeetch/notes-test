import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export const useNotificationStore = defineStore('notification', () => {
  // state
  const notifications = ref<Notification[]>([]);

  // actions
  function add(message: string, type: NotificationType = 'info') {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      message,
      type,
    };

    notifications.value.push(notification);

    setTimeout(() => {
      remove(id);
    }, 3000);

    return id;
  }

  function remove(id: string) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  function success(message: string) {
    return add(message, 'success');
  }

  function error(message: string) {
    return add(message, 'error');
  }

  function info(message: string) {
    return add(message, 'info');
  }

  return {
    // state
    notifications,
    // actions
    add,
    remove,
    success,
    error,
    info,
  };
});
