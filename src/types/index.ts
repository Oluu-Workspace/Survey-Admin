/**
 * @deprecated Import from `@/domain` instead.
 */
export type { SurveyQuestion as Question } from '@/domain/question';
export type { SurveyResponse as Response } from '@/domain/response';
export type { Survey } from '@/domain/survey';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'agent' | 'manager';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
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
  user: User;
  access_token: string;
  token?: string;
  refresh_token?: string;
  expires_in?: number;
  message?: string;
}

export interface DashboardStats {
  total_agents: number;
  active_agents: number;
  total_surveys: number;
  active_surveys: number;
  total_responses: number;
  today_responses: number;
}
