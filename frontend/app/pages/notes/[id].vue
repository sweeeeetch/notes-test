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
const isLoading = ref(true);
const loadError = ref<string | null>(null);

const showDeleteDialog = ref(false);
const isDeleting = ref(false);

onBeforeMount(async () => {
  try {
    isLoading.value = true;
    const result = await api.getNote(noteId);
    note.value = result as Note;
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

const formattedCreatedAt = computed(() => {
  if (!note.value) return '';
  const date = new Date(note.value.createdAt);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const formattedUpdatedAt = computed(() => {
  if (!note.value) return '';
  const date = new Date(note.value.updatedAt);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const handleDeleteConfirm = async () => {
  if (!note.value) return;

  isDeleting.value = true;

  try {
    await api.deleteNote(note.value.id);

    notesStore.removeNote(note.value.id);

    notification.success('Заметка успешно удалена!');

    await navigateTo('/');
  } catch (err: any) {
    console.error(err);
    showDeleteDialog.value = false;
    notification.error('Не удалось удалить заметку. Попробуйте снова.');
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <nav class="mb-6">
        <NuxtLink
          to="/"
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
          Назад к заметкам
        </NuxtLink>
      </nav>

      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>

      <div v-else-if="loadError" class="text-center py-12">
        <p class="text-red-600">{{ loadError }}</p>
      </div>

      <div v-else-if="note" class="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div v-if="note.category" class="mb-4">
          <span
            class="inline-block px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full"
          >
            {{ note.category }}
          </span>
        </div>

        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          {{ note.title }}
        </h1>

        <div class="flex flex-wrap gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
          <div class="flex items-center">
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Создано: {{ formattedCreatedAt }}</span>
          </div>
          <div class="flex items-center">
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Обновлено: {{ formattedUpdatedAt }}</span>
          </div>
        </div>

        <div class="prose max-w-none mb-8">
          <p class="text-gray-700 whitespace-pre-wrap">{{ note.content }}</p>
        </div>

        <div class="flex gap-3">
          <NuxtLink
            :to="`/notes/edit/${note.id}`"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Редактировать
          </NuxtLink>

          <button
            @click="showDeleteDialog = true"
            class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Удалить
          </button>
        </div>
      </div>

      <ConfirmDialog
        :is-open="showDeleteDialog"
        :is-processing="isDeleting"
        title="Удалить заметку"
        message="Вы уверены, что хотите удалить эту заметку? Это действие нельзя отменить."
        confirm-text="Удалить"
        cancel-text="Отмена"
        @confirm="handleDeleteConfirm"
        @cancel="showDeleteDialog = false"
      />
    </div>
  </div>
</template>
