import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(to => {
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  if (authStore.isInitializing) {
    return;
  }

  if (authStore.isAuthenticated && to.path !== '/') {
    return navigateTo('/');
  }
});
