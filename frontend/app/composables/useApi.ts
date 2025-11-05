import { useAuthStore } from '~/stores/auth';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  category?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  category?: string;
}

export interface ListNotesParams {
  search?: string;
  category?: string;
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const apiFetch = $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      // jwt
      if (authStore.token) {
        const headers = options.headers || {};
        if (Array.isArray(headers)) {
          headers.push(['Authorization', `Bearer ${authStore.token}`]);
        } else if (headers instanceof Headers) {
          headers.set('Authorization', `Bearer ${authStore.token}`);
        } else {
          (headers as Record<string, string>).Authorization = `Bearer ${authStore.token}`;
        }
        options.headers = headers;
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.logout();
        // Only redirect if not already on login page
        if (import.meta.client) {
          const router = useRouter();
          const currentPath = router.currentRoute.value.path;
          if (currentPath !== '/login') {
            navigateTo('/login');
          }
        }
      }
    },
  });

  const handleError = (error: any): never => {
    const apiError: ApiError = {
      message: 'Произошла неизвестная ошибка',
      status: error.response?.status || error.statusCode,
    };

    if (error.data) {
      if (error.data.error) {
        apiError.message = error.data.error.message || error.data.error;
        apiError.code = error.data.error.code;
      } else if (error.data.message) {
        apiError.message = error.data.message;
      }
    } else if (error.message) {
      apiError.message = error.message;
    }

    throw apiError;
  };

  return {
    async login(data: LoginRequest): Promise<AuthResponse> {
      try {
        return await apiFetch<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: data,
        });
      } catch (error) {
        return handleError(error);
      }
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
      try {
        return await apiFetch<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: data,
        });
      } catch (error) {
        return handleError(error);
      }
    },

    async getMe(): Promise<{ id: string; email: string }> {
      try {
        return await apiFetch<{ id: string; email: string }>('/api/auth/me');
      } catch (error) {
        return handleError(error);
      }
    },

    // notes
    async listNotes(params?: ListNotesParams): Promise<any[]> {
      try {
        return await apiFetch<any[]>('/api/notes', {
          params,
        });
      } catch (error) {
        return handleError(error);
      }
    },

    async getNote(id: string): Promise<any> {
      try {
        return await apiFetch<any>(`/api/notes/${id}`);
      } catch (error) {
        return handleError(error);
      }
    },

    async createNote(data: CreateNoteRequest): Promise<any> {
      try {
        return await apiFetch<any>('/api/notes', {
          method: 'POST',
          body: data,
        });
      } catch (error) {
        return handleError(error);
      }
    },

    async updateNote(id: string, data: UpdateNoteRequest): Promise<any> {
      try {
        return await apiFetch<any>(`/api/notes/${id}`, {
          method: 'PATCH',
          body: data,
        });
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteNote(id: string): Promise<void> {
      try {
        await apiFetch<void>(`/api/notes/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        return handleError(error);
      }
    },

    async getCategories(): Promise<string[]> {
      try {
        return await apiFetch<string[]>('/api/categories');
      } catch (error) {
        return handleError(error);
      }
    },
  };
};
