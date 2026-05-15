/**
 * api.ts - API Client for CRM AI Backend
 * Handles all HTTP requests to FastAPI backend
 */
const BASE_URL = "http://127.0.0.1:8000";

const API_BASE = `${BASE_URL}/api`;
const AUTH_BASE = `${BASE_URL}/auth`;


interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

interface Call {
  call_id: number;
  agent_name: string;
  audio_path: string;
  sentiment: string;
  sentiment_score: number;
  score_percentage: number;
  performance: string;
  summary: string;
  keywords: string[];
  call_date: string;
}

interface Stats {
  total_calls: number;
  avg_score: number;
  sentiment_distribution: Record<string, number>;
  performance_distribution: Record<string, number>;
  role: string;
  agent_name?: string;
}

// ============================================================
// Token Management
// ============================================================

export const getToken = (): string | null => {
  return localStorage.getItem('crm_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('crm_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('crm_token');
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (path: string, options: any = {}) => {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

// ============================================================
// Auth API
// ============================================================

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
};

export const getMe = async (): Promise<LoginResponse['user']> => {
  const response = await fetch(`${AUTH_BASE}/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
};

export const createUser = async (userData: any): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/users/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create user');
  }

  return response.json();
};

export const deleteUser = async (userId: number): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete user');
  }

  return response.json();
};

export const updateUser = async (userId: number, userData: any): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update user');
  }

  return response.json();
};
export const forgotPassword = async (email: string): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send reset email');
  }

  return response.json();
};

export const resetPassword = async (token: string, new_password: string): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to reset password');
  }

  return response.json();
};

export const getAgents = async (): Promise<any[]> => {
  const response = await fetch(`${AUTH_BASE}/agents`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get agents');
  }

  return response.json();
};

export const getLeads = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/leads`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get leads');
  return response.json();
};

// ============================================================
// Calls API
// ============================================================

interface CallsResponse {
  calls: Call[];
  total: number;
  limit: number;
  offset: number;
  role: string;
}

export const getCalls = async (params?: {
  agent_name?: string;
  sentiment?: string;
  limit?: number;
  offset?: number;
}): Promise<CallsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.agent_name) queryParams.set('agent_name', params.agent_name);
  if (params?.sentiment) queryParams.set('sentiment', params.sentiment);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const response = await fetch(`${API_BASE}/calls?${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get calls');
  }

  return response.json();
};

export const getCallDetail = async (callId: number): Promise<Call> => {
  const response = await fetch(`${API_BASE}/calls/${callId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get call detail');
  }

  return response.json();
};

// ============================================================
// Stats API
// ============================================================

export const getStats = async (agent_name?: string): Promise<Stats> => {
  const queryParams = agent_name ? `?agent_name=${agent_name}` : '';
  const response = await fetch(`${API_BASE}/stats${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get stats');
  }

  return response.json();
};

export const getAgentsCallsSummary = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/agents/calls`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get agents summary');
  }

  return response.json();
};

// ============================================================
// Performance Comparison API
// ============================================================

interface PerformanceMetrics {
  total_calls: number;
  avg_score: number;
  conversions: number;
  refusal_rate: number;
  avg_duration: number;
}

interface PerformanceComparison {
  current_month: PerformanceMetrics;
  previous_month: PerformanceMetrics;
  evolution: {
    total_calls: number;
    avg_score: number;
    conversions: number;
    refusal_rate: number;
    avg_duration: number;
  };
  monthly_data: PerformanceMetrics[];
}

export const getPerformanceComparison = async (month?: string): Promise<PerformanceComparison> => {
  const queryParams = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/performance/comparison${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get performance comparison');
  }

  return response.json();
};

export const getAllAgentsPerformance = async (month?: string): Promise<any[]> => {
  const queryParams = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/performance/agents${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get agents performance');
  }

  return response.json();
};

// ============================================================
// Messages API
// ============================================================

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name: string;
  content: string;
  is_read: boolean;
  is_urgent: boolean;
  created_at: string;
  read_at?: string;
}

interface Conversation {
  user_id: number;
  user_name: string;
  user_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await fetch(`${API_BASE}/messages/conversations`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get conversations');
  }

  return response.json();
};

export const getMessages = async (userId: number): Promise<Message[]> => {
  const response = await fetch(`${API_BASE}/messages/${userId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get messages');
  }

  return response.json();
};

export const sendMessage = async (receiverId: number, content: string, isUrgent: boolean = false): Promise<Message> => {
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ receiver_id: receiverId, content, is_urgent: isUrgent }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

export const markMessageAsRead = async (messageId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark message as read');
  }
};

// ============================================================
// Save Call API (for direct calls from contact list)
// ============================================================
// Audio Analysis API
// ============================================================

interface AnalysisResult {
  agent_name: string;
  audio_path: string;
  transcription: string;
  labeled_transcript?: string;
  agent_text?: string;
  client_text?: string;
  sentiment: string;
  sentiment_score?: number;
  score_percentage: number;
  performance: string;
  summary: string;
  keywords: string[];
  score_ecoute: number;
  score_persuasion: number;
  score_empathie: number;
  score_argumentation: number;
  score_refus: number;
  score_vente: number;
  agent_talk_ratio?: number;
  client_talk_ratio?: number;
  agent_seconds?: number;
  client_seconds?: number;
  script_respected?: boolean;
  qualification_match?: boolean;
  refusal_reason?: string;
  inactivity_detected?: boolean;
  inactivity_duration?: number;
  next_steps?: string;
  appointment_detected?: boolean;
  appointment_date?: string;
}

export const analyzeCall = async (file: File, agentName: string): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agent_name', agentName);

  const response = await fetch(`${API_BASE}/analyze/call`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || 'Analysis failed');
  }

  return await response.json();
};

// ============================================================
// Chatbot API
// ============================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatMessage = async (
  message: string,
  role: string,
  agentName?: string
): Promise<{ response: string; sources?: string[] }> => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      message,
      role,
      agent_name: agentName,
    }),
  });

  if (!response.ok) {
    throw new Error('Chat failed');
  }

  return response.json();
};

// ============================================================
// Analytics API (connected to MySQL)
// ============================================================

export const getAnalyticsOverview = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/overview`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get analytics');
  return response.json();
};

export const getAgentsPerformance = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/agents-performance`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get agents performance');
  return response.json();
};

export const getSupervisionData = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/supervision`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get supervision data');
  return response.json();
};

export const getGeoAnalysis = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/geo`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get geo data');
  return response.json();
};

export const getFollowupsData = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/followups`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get followups');
  return response.json();
};

export const getCallsLog = async (limit: number = 200): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/calls-log?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get calls log');
  return response.json();
};

export const getPointageData = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/pointage`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get pointage data');
  return response.json();
};

export const getLiveAgents = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/live-agents`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get live agents');
  return response.json();
};

// ============================================================
// Save Call API (for direct calls from contact list)
// ============================================================

export interface SaveCallRequest {
  contact_id: number;
  contact_name: string;
  contact_company: string;
  phone: string;
  email: string;
  duration: number;
  besoin: string;
  budget: string;
  interet: string;
  notes: string;
  statut: 'Converti' | 'Rappel' | 'Refusé';
  call_date: string;
}

export const saveCall = async (callData: SaveCallRequest): Promise<any> => {
  const response = await fetch(`${API_BASE}/calls/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(callData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to save call');
  }

  return response.json();
};

// ============================================================
// Config & Maintenance API
// ============================================================

export const saveWeights = async (weights: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/config/weights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(weights),
  });
  if (!response.ok) throw new Error('Failed to save weights');
  return response.json();
};

export const saveConfig = async (config: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/config/system`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to save config');
  return response.json();
};



// ============================================================
// Export all
// ============================================================

const exportData = () => request('/api/maintenance/export');
const importData = (data: any) => request('/api/maintenance/import', { method: 'POST', body: JSON.stringify(data) });
const resetData = () => request('/api/maintenance/reset', { method: 'POST' });

export const api = {
  // Auth
  login,
  getMe,
  getAgents,
  getLeads,
  createUser,
  deleteUser,
  updateUser,
  forgotPassword,
  resetPassword,


  // Calls
  getCalls,
  getCallDetail,

  // Stats
  getStats,
  getAgentsCallsSummary,

  // Analysis
  analyzeCall,

  // Chat
  sendChatMessage,

  // Analytics (MySQL)
  getAnalyticsOverview,
  getAgentsPerformance,
  getSupervisionData,
  getGeoAnalysis,
  getFollowupsData,
  getCallsLog,
  getPointageData,
  getPerformanceComparison,
  getAllAgentsPerformance,
  getConversations,
  getMessages,
  getLiveAgents,
  sendMessage,
  markMessageAsRead,

  // Direct Call
  saveCall,

  // Config & Maintenance
  saveWeights,
  saveConfig,
  exportData,
  importData,
  resetData,

  // Token helpers
  getToken,
  setToken,
  removeToken,
};

export default api;