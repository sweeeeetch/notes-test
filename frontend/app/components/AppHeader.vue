<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();

  navigateTo('/login');
};
</script>

<template>
  <header class="bg-white shadow sticky top-0 z-50">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="shrink-0 flex items-center">
            <NuxtLink to="/" class="text-xl font-bold text-indigo-600">Заметки</NuxtLink>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <NuxtLink
              to="/"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900"
            >
              Мои заметки
            </NuxtLink>
          </div>
        </div>
        <div class="flex items-center">
          <ClientOnly>
            <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4">
              <span class="text-sm text-gray-700">{{ authStore.user?.email }}</span>
              <button
                @click="handleLogout"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Выход
              </button>
            </div>
          </ClientOnly>
        </div>
      </div>
    </nav>
  </header>
</template>
