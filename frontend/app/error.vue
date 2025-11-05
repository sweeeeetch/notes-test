<script setup lang="ts">
interface ErrorProps {
  error: {
    statusCode?: number;
    statusMessage?: string;
    message?: string;
    stack?: string;
  };
}

const props = defineProps<ErrorProps>();

const isDevelopment = import.meta.dev;

const errorTitle = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Страница не найдена';
  }
  if (props.error?.statusCode === 403) {
    return 'Доступ запрещен';
  }
  if (props.error?.statusCode === 401) {
    return 'Не авторизован';
  }
  return 'Что-то пошло не так';
});

const errorMessage = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Страница, которую вы ищете, не существует или была перемещена.';
  }
  if (props.error?.statusCode === 403) {
    return 'У вас нет прав доступа к этому ресурсу.';
  }
  if (props.error?.statusCode === 401) {
    return 'Пожалуйста, войдите, чтобы получить доступ к этой странице.';
  }
  return (
    props.error?.statusMessage ||
    props.error?.message ||
    'Произошла непредвиденная ошибка. Попробуйте позже.'
  );
});

const handleClearError = () => {
  clearError({ redirect: '/' });
};

if (isDevelopment) {
  console.error('Error:', props.error);
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 class="mt-4 text-3xl font-bold text-gray-900">
            {{ errorTitle }}
          </h1>

          <p class="mt-2 text-sm text-gray-600">
            {{ errorMessage }}
          </p>

          <div v-if="isDevelopment && error?.stack" class="mt-4">
            <details class="text-left">
              <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Детали ошибки
              </summary>
              <pre
                class="mt-2 text-xs text-gray-600 overflow-auto max-h-48 bg-gray-50 p-2 rounded"
                >{{ error.stack }}</pre
              >
            </details>
          </div>

          <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              @click="handleClearError"
              class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Назад
            </button>
            <NuxtLink
              to="/"
              class="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              На главную
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
