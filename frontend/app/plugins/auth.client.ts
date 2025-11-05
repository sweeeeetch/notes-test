import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const api = useApi();

  authStore.initializeAuth();

  if (authStore.token) {
    // Don't block rendering, fetch user in background
    api
      .getMe()
      .then(user => {
        authStore.setUser(user);
      })
      .catch(() => {
        authStore.logout();
      })
      .finally(() => {
        authStore.setInitializing(false);
      });
  } else {
    authStore.setInitializing(false);
  }
});
