/**
 * Unified API client for Survey Research Platform
 * This file provides a clean interface for both admin dashboard and agent mobile app
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://survey-backend-dkid.onrender.com/api/v1';

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'agent';
  status: 'active' | 'pending' | 'suspended';
  county?: string;
  subcounty?: string;
  ward?: string;
  village?: string;
  phone?: string;
  surveys_completed?: number;
  is_online?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  county?: string;
  subcounty?: string;
  ward?: string;
  village?: string;
  invite_token?: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  target_submissions: number;
  assigned_regions: string[];
  questions: SurveyQuestion[];
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  type: 'text' | 'number' | 'dropdown' | 'multiple-choice' | 'date' | 'boolean';
  question: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface Response {
  id: string;
  survey_id: string;
  agent_id: string;
  answers: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'submitted' | 'validated' | 'rejected';
  validation_notes?: string;
  is_offline: boolean;
  submitted_at: string;
  created_at: string;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setStoredToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    this.token = token;
  }

  private clearStoredToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.setStoredToken(response.access_token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.setStoredToken(response.access_token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignore logout errors
    } finally {
      this.clearStoredToken();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
    
    this.setStoredToken(response.access_token);
    return response;
  }

  // User methods
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Survey methods
  async getSurveys(): Promise<{surveys: Survey[], pagination: any}> {
    return this.request<{surveys: Survey[], pagination: any}>('/surveys');
  }

  async getSurvey(id: string): Promise<{survey: Survey}> {
    return this.request<{survey: Survey}>(`/surveys/${id}`);
  }

  async createSurvey(survey: Partial<Survey>): Promise<{survey: Survey}> {
    return this.request<{survey: Survey}>('/surveys', {
      method: 'POST',
      body: JSON.stringify(survey),
    });
  }

  async updateSurvey(id: string, survey: Partial<Survey>): Promise<{survey: Survey}> {
    return this.request<{survey: Survey}>(`/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(survey),
    });
  }

  async deleteSurvey(id: string): Promise<void> {
    return this.request<void>(`/surveys/${id}`, {
      method: 'DELETE',
    });
  }

  async assignSurveyToAgents(surveyId: string, agentIds: string[]): Promise<{survey: Survey}> {
    return this.request<{survey: Survey}>(`/surveys/${surveyId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agent_ids: agentIds }),
    });
  }

  // Response methods
  async getResponses(surveyId?: string): Promise<{responses: Response[], pagination: any}> {
    const endpoint = surveyId ? `/responses?survey_id=${surveyId}` : '/responses';
    return this.request<{responses: Response[], pagination: any}>(endpoint);
  }

  async getResponse(id: string): Promise<{response: Response}> {
    return this.request<{response: Response}>(`/responses/${id}`);
  }

  async submitResponse(response: Partial<Response>): Promise<{response: Response}> {
    return this.request<{response: Response}>('/responses', {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }

  async updateResponse(id: string, response: Partial<Response>): Promise<{response: Response}> {
    return this.request<{response: Response}>(`/responses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(response),
    });
  }

  async validateResponse(id: string, status: string, notes?: string): Promise<{response: Response}> {
    return this.request<{response: Response}>(`/responses/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ status, validation_notes: notes }),
    });
  }

  // Agent methods (Admin only)
  async getAgents(): Promise<{agents: User[], pagination: any}> {
    return this.request<{agents: User[], pagination: any}>('/agents');
  }

  async getAgent(id: string): Promise<{agent: User}> {
    return this.request<{agent: User}>(`/agents/${id}`);
  }

  async createAgent(agent: Partial<User>): Promise<{agent: User}> {
    return this.request<{agent: User}>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: Partial<User>): Promise<{agent: User}> {
    return this.request<{agent: User}>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  async activateAgent(id: string): Promise<{agent: User}> {
    return this.request<{agent: User}>(`/agents/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateAgent(id: string): Promise<{agent: User}> {
    return this.request<{agent: User}>(`/agents/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // Analytics methods
  async getDashboardData(): Promise<any> {
    return this.request<any>('/analytics/dashboard');
  }

  async getAgentActivity(): Promise<any> {
    return this.request<any>('/analytics/agent-activity');
  }

  async getSurveyCompletion(): Promise<any> {
    return this.request<any>('/analytics/survey-completion');
  }

  // Export methods
  async getExportJobs(): Promise<{jobs: any[], pagination: any}> {
    return this.request<{jobs: any[], pagination: any}>('/export/jobs');
  }

  async createExportJob(job: any): Promise<{job: any}> {
    return this.request<{job: any}>('/export/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  }

  async getExportJob(id: string): Promise<{job: any}> {
    return this.request<{job: any}>(`/export/jobs/${id}`);
  }

  async downloadExport(id: string): Promise<{download_url: string, filename: string, file_size: string}> {
    return this.request<{download_url: string, filename: string, file_size: string}>(`/export/jobs/${id}/download`);
  }

  // Audit log methods
  async getAuditLogs(): Promise<{logs: any[], pagination: any}> {
    return this.request<{logs: any[], pagination: any}>('/audit-logs');
  }

  async createAuditLog(log: any): Promise<{log: any}> {
    return this.request<{log: any}>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; database: string }> {
    return this.request<{ status: string; message: string; database: string }>('/health');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export types and client
export default apiClient;