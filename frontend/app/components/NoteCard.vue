<script setup lang="ts">
import type { Note } from '~/stores/notes';

interface Props {
  note: Note;
}

const props = defineProps<Props>();

const formattedDate = computed(() => {
  return useFormatDate(props.note.createdAt);
});
</script>

<template>
  <NuxtLink
    :to="`/notes/${note.id}`"
    class="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 hover:border-blue-300"
  >
    <div v-if="note.category" class="mb-3">
      <span
        class="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full"
      >
        {{ note.category }}
      </span>
    </div>

    <h3 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
      {{ note.title }}
    </h3>

    <p class="text-gray-600 text-sm mb-4 line-clamp-3">
      {{ note.content }}
    </p>

    <div class="flex items-center text-xs text-gray-500">
      <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <time :datetime="note.createdAt">{{ formattedDate }}</time>
    </div>
  </NuxtLink>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
