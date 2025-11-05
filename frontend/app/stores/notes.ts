import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const useNotesStore = defineStore('notes', () => {
  // state
  const notes = ref<Note[]>([]);
  const currentNote = ref<Note | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const categoryFilter = ref<string | null>(null);

  // getters
  const filteredNotes = computed(() => {
    let filtered = notes.value;

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        note =>
          note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
      );
    }

    if (categoryFilter.value) {
      filtered = filtered.filter(note => note.category === categoryFilter.value);
    }

    return filtered;
  });

  const categories = computed(() => {
    const cats = new Set<string>();
    notes.value.forEach(note => {
      if (note.category) {
        cats.add(note.category);
      }
    });
    return Array.from(cats).sort();
  });

  // actions
  function setNotes(newNotes: Note[]) {
    notes.value = newNotes;
  }

  function setCurrentNote(note: Note | null) {
    currentNote.value = note;
  }

  function addNote(note: Note) {
    notes.value.unshift(note);
  }

  function updateNote(updatedNote: Note) {
    const index = notes.value.findIndex(n => n.id === updatedNote.id);
    if (index !== -1) {
      notes.value[index] = updatedNote;
    }
    if (currentNote.value?.id === updatedNote.id) {
      currentNote.value = updatedNote;
    }
  }

  function removeNote(noteId: string) {
    notes.value = notes.value.filter(n => n.id !== noteId);
    if (currentNote.value?.id === noteId) {
      currentNote.value = null;
    }
  }

  function setLoading(isLoading: boolean) {
    loading.value = isLoading;
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage;
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setCategoryFilter(category: string | null) {
    categoryFilter.value = category;
  }

  function clearFilters() {
    searchQuery.value = '';
    categoryFilter.value = null;
  }

  return {
    // state
    notes,
    currentNote,
    loading,
    error,
    searchQuery,
    categoryFilter,
    // getters
    filteredNotes,
    categories,
    // actions
    setNotes,
    setCurrentNote,
    addNote,
    updateNote,
    removeNote,
    setLoading,
    setError,
    setSearchQuery,
    setCategoryFilter,
    clearFilters,
  };
});
