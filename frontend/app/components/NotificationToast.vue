<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification';

const notificationStore = useNotificationStore();
const notifications = computed(() => notificationStore.notifications);

const removeNotification = (id: string) => {
  notificationStore.remove(id);
};

const notificationClasses = {
  success: 'bg-green-50 border border-green-200',
  error: 'bg-red-50 border border-red-200',
  info: 'bg-blue-50 border border-blue-200',
};

const textClasses = {
  success: 'text-green-800',
  error: 'text-red-800',
  info: 'text-blue-800',
};

const buttonClasses = {
  success: 'text-green-400 hover:text-green-500 focus:ring-green-500',
  error: 'text-red-400 hover:text-red-500 focus:ring-red-500',
  info: 'text-blue-400 hover:text-blue-500 focus:ring-blue-500',
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <TransitionGroup name="toast">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'min-w-md w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden',
            notificationClasses[notification.type],
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="shrink-0">
                <svg
                  v-if="notification.type === 'success'"
                  class="h-6 w-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else-if="notification.type === 'error'"
                  class="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else
                  class="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium" :class="textClasses[notification.type]">
                  {{ notification.message }}
                </p>
              </div>
              <div class="ml-4 shrink-0 flex">
                <button
                  @click="removeNotification(notification.id)"
                  :class="[
                    'inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                    buttonClasses[notification.type],
                  ]"
                >
                  <span class="sr-only">Закрыть</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
