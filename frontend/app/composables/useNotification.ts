import { useNotificationStore } from '~/stores/notification';
import type { NotificationType } from '~/stores/notification';

export const useNotification = () => {
  const notificationStore = useNotificationStore();

  const show = (message: string, type: NotificationType = 'info') => {
    return notificationStore.add(message, type);
  };

  const success = (message: string) => {
    return notificationStore.success(message);
  };

  const error = (message: string) => {
    return notificationStore.error(message);
  };

  const info = (message: string) => {
    return notificationStore.info(message);
  };

  return {
    show,
    success,
    error,
    info,
  };
};
