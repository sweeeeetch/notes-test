<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

import { useApi } from '~/composables/useApi';

const api = useApi();
const authStore = useAuthStore();
const notification = useNotification();

definePageMeta({
  middleware: 'guest',
  layout: 'auth',
});

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');

const emailError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

const validateEmail = () => {
  emailError.value = '';
  if (!email.value) {
    emailError.value = 'Email обязателен';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Введите корректный email адрес';
    return false;
  }
  return true;
};

const validatePassword = () => {
  passwordError.value = '';
  if (!password.value) {
    passwordError.value = 'Пароль обязателен';
    return false;
  }
  if (!isLogin.value && password.value.length < 6) {
    passwordError.value = 'Пароль должен содержать минимум 6 символов';
    return false;
  }
  return true;
};

const validateConfirmPassword = () => {
  confirmPasswordError.value = '';
  if (!isLogin.value) {
    if (!confirmPassword.value) {
      confirmPasswordError.value = 'Подтвердите пароль';
      return false;
    }
    if (password.value !== confirmPassword.value) {
      confirmPasswordError.value = 'Пароли не совпадают';
      return false;
    }
  }
  return true;
};

watch(isLogin, () => {
  errorMessage.value = '';
  emailError.value = '';
  passwordError.value = '';
  confirmPasswordError.value = '';
});

const handleSubmit = async () => {
  errorMessage.value = '';

  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = isLogin.value ? true : validateConfirmPassword();

  if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
    return;
  }

  loading.value = true;

  try {
    if (isLogin.value) {
      const response = await api.login({
        email: email.value,
        password: password.value,
      });

      authStore.login(response.token, response.user);

      notification.success('Вы успешно вошли!');

      await navigateTo('/');
    } else {
      const response = await api.register({
        email: email.value,
        password: password.value,
      });

      authStore.login(response.token, response.user);

      notification.success('Аккаунт успешно создан!');

      await navigateTo('/');
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Произошла ошибка. Попробуйте снова.';
    notification.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isLogin ? 'Войти в аккаунт' : 'Создать новый аккаунт' }}
        </h2>
      </div>

      <div class="mt-8 space-y-6">
        <div class="flex justify-center space-x-4">
          <button
            @click="isLogin = true"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md',
              isLogin
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
            ]"
          >
            Вход
          </button>
          <button
            @click="isLogin = false"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md',
              !isLogin
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
            ]"
          >
            Регистрация
          </button>
        </div>

        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">{{ errorMessage }}</h3>
            </div>
          </div>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">Email адрес</label>
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :class="{ 'border-red-500': emailError }"
                placeholder="Email адрес"
                @blur="validateEmail"
              />
              <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</p>
            </div>
            <div>
              <label for="password" class="sr-only">Пароль</label>
              <input
                id="password"
                v-model="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                :class="[
                  'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
                  !isLogin ? '' : 'rounded-b-md',
                  passwordError ? 'border-red-500' : '',
                ]"
                placeholder="Пароль"
                @blur="validatePassword"
              />
              <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
            </div>
            <div v-if="!isLogin">
              <label for="confirmPassword" class="sr-only">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :class="{ 'border-red-500': confirmPasswordError }"
                placeholder="Подтвердите пароль"
                @blur="validateConfirmPassword"
              />
              <p v-if="confirmPasswordError" class="mt-1 text-sm text-red-600">
                {{ confirmPasswordError }}
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Обработка...</span>
              <span v-else>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
