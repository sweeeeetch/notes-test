<script setup lang="ts">
import type { Note } from '~/stores/notes';
import { useNotesStore } from '~/stores/notes';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const api = useApi();
const notesStore = useNotesStore();
const notification = useNotification();
const noteId = route.params.id as string;

const note = ref<Note | null>(null);
const categories = ref<string[]>([]);
const isLoading = ref(true);
const loadError = ref<string | null>(null);

const newCategoryName = ref('');
const errors = reactive({
  title: '',
  content: '',
});
const submitError = ref('');
const isSubmitting = ref(false);

const formData = reactive({
  title: '',
  content: '',
  category: null as string | null,
});

onBeforeMount(async () => {
  try {
    isLoading.value = true;

    const [noteResult, categoriesResult] = await Promise.all([
      api.getNote(noteId),
      api.getCategories().catch(() => []),
    ]);

    note.value = noteResult as Note;
    categories.value = categoriesResult;

    formData.title = note.value.title;
    formData.content = note.value.content;
    formData.category = note.value.category || null;
  } catch (err: any) {
    console.error(err);

    if (err.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Заметка не найдена',
        fatal: true,
      });
    }

    loadError.value = err.message || 'Не удалось загрузить заметку';
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось загрузить заметку',
      fatal: true,
    });
  } finally {
    isLoading.value = false;
  }
});

const validateForm = (): boolean => {
  errors.title = '';
  errors.content = '';
  submitError.value = '';

  let isValid = true;

  if (!formData.title.trim()) {
    errors.title = 'Заголовок обязателен';
    isValid = false;
  } else if (formData.title.length > 200) {
    errors.title = 'Заголовок должен быть не более 200 символов';
    isValid = false;
  }

  if (formData.content.length > 10000) {
    errors.content = 'Содержимое должно быть не более 10000 символов';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  submitError.value = '';

  try {
    let categoryValue = formData.category;
    if (categoryValue === '__new__' && newCategoryName.value.trim()) {
      categoryValue = newCategoryName.value.trim();
    } else if (categoryValue === '__new__') {
      categoryValue = null;
    }

    const noteData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: categoryValue || undefined,
    };

    const updatedNote = await api.updateNote(noteId, noteData);

    notesStore.updateNote(updatedNote);

    notification.success('Заметка успешно обновлена!');

    await navigateTo(`/notes/${noteId}`);
  } catch (err: any) {
    console.error('Failed to update note:', err);
    submitError.value = err.message || 'Не удалось обновить заметку. Попробуйте снова.';
    notification.error(submitError.value);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <nav class="mb-6">
        <NuxtLink
          :to="`/notes/${noteId}`"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад к заметке
        </NuxtLink>
      </nav>

      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900">Редактировать заметку</h1>
        <p class="text-gray-600 mt-2">Обновите свою заметку</p>
      </div>

      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>

      <div v-else-if="loadError" class="text-center py-12">
        <p class="text-red-600">{{ loadError }}</p>
      </div>

      <div v-else-if="note" class="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <form @submit.prevent="handleSubmit">
          <div class="mb-6">
            <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
              Заголовок <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              required
              maxlength="200"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.title }"
              placeholder="Введите заголовок заметки"
            />
            <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
            <p class="mt-1 text-sm text-gray-500">{{ formData.title.length }}/200 символов</p>
          </div>

          <div class="mb-6">
            <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <select
              id="category"
              v-model="formData.category"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option :value="null">Без категории</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
              <option value="__new__">+ Добавить новую категорию</option>
            </select>
          </div>

          <div v-if="formData.category === '__new__'" class="mb-6">
            <label for="newCategory" class="block text-sm font-medium text-gray-700 mb-2">
              Название новой категории
            </label>
            <input
              id="newCategory"
              v-model="newCategoryName"
              type="text"
              maxlength="50"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите название категории"
            />
            <p class="mt-1 text-sm text-gray-500">{{ newCategoryName.length }}/50 символов</p>
          </div>

          <div class="mb-6">
            <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
              Содержимое
            </label>
            <textarea
              id="content"
              v-model="formData.content"
              rows="12"
              maxlength="10000"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              :class="{ 'border-red-500': errors.content }"
              placeholder="Напишите содержимое заметки здесь..."
            ></textarea>
            <p v-if="errors.content" class="mt-1 text-sm text-red-600">{{ errors.content }}</p>
            <p class="mt-1 text-sm text-gray-500">{{ formData.content.length }}/10000 символов</p>
          </div>

          <div v-if="submitError" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ submitError }}</p>
          </div>

          <div class="flex gap-3">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="isSubmitting"
                class="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>

            <NuxtLink
              :to="`/notes/${noteId}`"
              class="inline-flex items-center px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors duration-200"
            >
              Отмена
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
