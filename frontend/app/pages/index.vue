<script setup lang="ts">
import { useNotesStore } from '~/stores/notes';

definePageMeta({
  middleware: 'auth',
  layout: 'default',
});

const api = useApi();
const notesStore = useNotesStore();

const {
  data: notes,
  pending,
  error,
  refresh,
} = await useAsyncData(
  'notes',
  async () => {
    try {
      const result = await api.listNotes();
      return result;
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      throw err;
    }
  },
  {
    server: false,
  }
);

watch(
  notes,
  newNotes => {
    if (newNotes) {
      notesStore.setNotes(newNotes);
    }
  },
  { immediate: true }
);

const searchQuery = ref('');
const debouncedSearch = ref('');

let searchTimeout: NodeJS.Timeout;
watch(searchQuery, newQuery => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newQuery;
    notesStore.setSearchQuery(newQuery);
  }, 300);
});

const categoryFilter = ref<string | null>(null);
watch(categoryFilter, newCategory => {
  notesStore.setCategoryFilter(newCategory);
});

const filteredNotes = computed(() => notesStore.filteredNotes);

const categories = computed(() => notesStore.categories);

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Мои заметки</h1>
        <p class="text-gray-600">Управляйте своими заметками и идеями</p>
      </div>

      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск заметок..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div class="sm:w-64">
          <select
            v-model="categoryFilter"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="null">Все категории</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>

      <ClientOnly>
        <div v-if="pending" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="error" class="text-center py-12">
          <p class="text-red-600">Не удалось загрузить заметки. Попробуйте снова.</p>
        </div>

        <div v-else-if="!filteredNotes || filteredNotes.length === 0" class="text-center py-12">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Заметки не найдены</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{
              searchQuery || categoryFilter
                ? 'Попробуйте изменить фильтры'
                : 'Начните с создания новой заметки'
            }}
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NoteCard v-for="note in filteredNotes" :key="note.id" :note="note" />
        </div>

        <template #fallback>
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </template>
      </ClientOnly>

      <NuxtLink
        to="/notes/create"
        class="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200 flex items-center justify-center"
        aria-label="Создать новую заметку"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>
