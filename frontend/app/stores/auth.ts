import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface User {
  id: string;
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  // state
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);
  const isInitializing = ref(true);

  // getters
  const isAuthenticated = computed(() => !!token.value);

  // actions
  function setToken(newToken: string | null) {
    token.value = newToken;

    if (import.meta.client) {
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  function setUser(newUser: User | null) {
    user.value = newUser;
  }

  function login(authToken: string, authUser: User) {
    setToken(authToken);
    setUser(authUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function initializeAuth() {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        token.value = storedToken;
      }
    }
  }

  function setInitializing(value: boolean) {
    isInitializing.value = value;
  }

  return {
    // state
    token,
    user,
    isInitializing,
    // getters
    isAuthenticated,
    // actions
    setToken,
    setUser,
    login,
    logout,
    initializeAuth,
    setInitializing,
  };
});
