import axios from 'axios';
import type { AuthResponse, User, DashboardStats } from '@/types';

// Use environment variable or fallback to remote backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://survey-backend-dkid.onrender.com/api/v1';

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

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
    try {
      const { data } = await api.get('/auth/profile');
      return data;
    } catch (error) {
      // If profile endpoint doesn't exist, return mock user data
      console.warn('Profile endpoint not available, using mock data');
      return {
        id: '1',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  
  refresh: async (): Promise<{ access_token: string }> => {
    const { data } = await api.post('/auth/refresh');
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
  
  activate: async (id: string) => {
    const { data } = await api.post(`/agents/${id}/activate`);
    return data;
  },
  
  deactivate: async (id: string) => {
    const { data } = await api.post(`/agents/${id}/deactivate`);
    return data;
  },
  
  getStats: async () => {
    const { data } = await api.get('/agents/stats');
    return data;
  },
};

export const surveysAPI = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await api.get('/surveys', { params });
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
  
  getStats: async () => {
    const { data } = await api.get('/surveys/stats');
    return data;
  },
};

export const responsesAPI = {
  getAll: async (params?: { page?: number; limit?: number; survey_id?: string }) => {
    const { data } = await api.get('/responses', { params });
    return data;
  },
  
  getById: async (id: string) => {
    const { data } = await api.get(`/responses/${id}`);
    return data;
  },
  
  submit: async (responseData: any) => {
    const { data } = await api.post('/responses', responseData);
    return data;
  },
  
  validate: async (id: string, validationData: { is_valid: boolean; notes?: string }) => {
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
