export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'agent' | 'manager';
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
  user: User;
  access_token: string;
  token?: string; // Fallback for compatibility
  refresh_token?: string;
  expires_in?: number;
  message?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  assigned_agents: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'location' | 'date';
  question: string;
  options?: string[];
  required: boolean;
  order: number;
}

export interface Response {
  id: string;
  survey_id: string;
  agent_id: string;
  answers: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'submitted' | 'validated' | 'flagged';
  submitted_at: string;
}

export interface DashboardStats {
  total_agents: number;
  active_agents: number;
  total_surveys: number;
  active_surveys: number;
  total_responses: number;
  today_responses: number;
}
