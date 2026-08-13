import axios from 'axios';
import type { AuthResponse, User, DashboardStats } from '@/types';
import { mapResponseFromApi } from '@/domain/response';

// Use environment variable or fallback to remote backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://survey-backend.project360.space/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 on a protected call = session expired. Do not treat public settings 401/404 as logout.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || '');
    const isPublicSettings = url.includes('/settings/collection-hours');
    if (status === 401 && !isPublicSettings) {
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  
  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    invite_token?: string;
  }): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },
  
  me: async (): Promise<User> => {
    const { data } = await api.get('/auth/profile');
    return data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  
  refresh: async (): Promise<{ access_token: string }> => {
    const { data } = await api.post('/auth/refresh');
    return data;
  },
};

export const projectsAPI = {
  getAll: async (params?: { status?: string }) => {
    const { data } = await api.get('/projects', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },
  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/projects', payload);
    return data;
  },
  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/projects/${id}`, payload);
    return data;
  },
};

export const agentsAPI = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await api.get('/agents', { params });
    return data;
  },
  
  getById: async (id: string) => {
    const { data } = await api.get(`/agents/${id}`);
    return data;
  },
  
  create: async (agentData: any) => {
    const { data } = await api.post('/agents', agentData);
    return data;
  },
  
  update: async (id: string, agentData: any) => {
    const { data } = await api.put(`/agents/${id}`, agentData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/agents/${id}`);
    return data;
  },
  
  activate: async (id: string) => {
    const { data } = await api.post(`/agents/${id}/activate`);
    return data;
  },
  
  deactivate: async (id: string) => {
    const { data } = await api.post(`/agents/${id}/deactivate`);
    return data;
  },

  getSurveyAssignments: async (id: string) => {
    const { data } = await api.get(`/agents/${id}/surveys`);
    return data;
  },

  setSurveyAssignments: async (id: string, survey_ids: string[]) => {
    const { data } = await api.put(`/agents/${id}/surveys`, { survey_ids });
    return data;
  },
  
  getStats: async () => {
    const { data } = await api.get('/agents/stats');
    return data;
  },
};

export const usersAPI = {
  getAll: async (params?: { role?: string }) => {
    const { data } = await api.get('/users', { params });
    return data;
  },
  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/users', payload);
    return data;
  },
};

export const surveysAPI = {
  getAll: async (params?: { page?: number; limit?: number; per_page?: number; status?: string }) => {
    const { data } = await api.get('/surveys', {
      params: {
        ...params,
        per_page: params?.per_page ?? params?.limit,
      },
    });
    return data;
  },
  
  getById: async (id: string) => {
    const { data } = await api.get(`/surveys/${id}`);
    return data;
  },
  
  create: async (surveyData: any) => {
    const { data } = await api.post('/surveys', surveyData);
    return data;
  },
  
  update: async (id: string, surveyData: any) => {
    const { data } = await api.put(`/surveys/${id}`, surveyData);
    return data;
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/surveys/${id}`);
    return data;
  },
  
  assign: async (id: string, agentIds: string[]) => {
    const { data } = await api.post(`/surveys/${id}/assign`, { agent_ids: agentIds });
    return data;
  },

  getAnalytics: async (
    id: string,
    params?: {
      agent_id?: string;
      compare_by?: string;
      county?: string;
      ward?: string;
      status?: string;
      lifecycle_stage?: string;
      answer_question_id?: string;
      answer_value?: string;
    },
  ) => {
    const { data } = await api.get(`/surveys/${id}/analytics`, { params });
    return data;
  },

  getResponseFacets: async (id: string) => {
    const { data } = await api.get(`/surveys/${id}/responses/facets`);
    return data as {
      counties: string[];
      wards: string[];
      statuses: string[];
      lifecycle_stages: string[];
      filterable_questions: Array<{ id: string; label: string; options: string[] }>;
    };
  },
  
  getInsights: async (id: string, params?: { agent_id?: string }) => {
    const { data } = await api.get(`/surveys/${id}/insights`, { params });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/surveys/stats');
    return data;
  },
};

export const responsesAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    per_page?: number;
    survey_id?: string;
    agent_id?: string;
    status?: string;
    lifecycle_stage?: string;
    county?: string;
    ward?: string;
    search?: string;
    q?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    answer_question_id?: string;
    answer_value?: string;
  }) => {
    const { data } = await api.get('/responses', {
      params: {
        ...params,
        per_page: params?.per_page ?? params?.limit,
      },
    });
    const responses = (data.responses || []).map((r: Record<string, unknown>) =>
      mapResponseFromApi(r),
    );
    return { ...data, responses };
  },
  
  getById: async (id: string) => {
    const { data } = await api.get(`/responses/${id}`);
    const raw = data.response || data;
    return { ...data, response: mapResponseFromApi(raw) };
  },
  
  submit: async (responseData: any) => {
    const { data } = await api.post('/responses', responseData);
    return data;
  },
  
  validate: async (
    id: string,
    validationData: {
      is_valid?: boolean;
      status?: string;
      flag?: boolean;
      notes?: string;
      validation_notes?: string;
    },
  ) => {
    const { data } = await api.post(`/responses/${id}/validate`, validationData);
    return data;
  },
  
  getStats: async () => {
    const { data } = await api.get('/responses/stats');
    return data;
  },
};

export const analyticsAPI = {
  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },
  
  getSubmissionTrends: async (params?: { days?: number }) => {
    const { data } = await api.get('/analytics/submissions-trend', { params });
    return data;
  },
  
  getAgentActivity: async () => {
    const { data } = await api.get('/analytics/agent-activity');
    return data;
  },
  
  getSurveyCompletion: async () => {
    const { data } = await api.get('/analytics/survey-completion');
    return data;
  },
};

export const operationsAPI = {
  getDashboard: async () => {
    const { data } = await api.get('/analytics/operations');
    if (data.recent_activity) {
      data.recent_activity = data.recent_activity.map((r: Record<string, unknown>) =>
        mapResponseFromApi(r),
      );
    }
    if (data.last_hour_activity) {
      data.last_hour_activity = data.last_hour_activity.map((r: Record<string, unknown>) =>
        mapResponseFromApi(r),
      );
    }
    if (data.quality_alerts) {
      data.quality_alerts = data.quality_alerts.map((r: Record<string, unknown>) =>
        mapResponseFromApi(r),
      );
    }
    return data;
  },
};

export type CollectionHoursSettings = {
  timezone: string;
  start: string;
  end: string;
  after_hours_open: boolean;
  after_hours_until?: string | null;
  effective_open?: boolean;
  updated_at?: string | null;
  updated_by?: string | null;
};

export const settingsAPI = {
  getCollectionHours: async (): Promise<CollectionHoursSettings> => {
    const { data } = await api.get('/settings/collection-hours');
    return data.collection_hours;
  },
  updateCollectionHours: async (payload: {
    after_hours_open?: boolean;
    after_hours_until?: string | null;
    clear_until?: boolean;
  }): Promise<CollectionHoursSettings> => {
    const { data } = await api.put('/settings/collection-hours', payload);
    return data.collection_hours;
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },
};

// Health check endpoint
export const healthAPI = {
  check: async () => {
    const { data } = await api.get('/health');
    return data;
  },
};

export default api;
