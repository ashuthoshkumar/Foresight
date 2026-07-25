/* ── API Client for Foresight Backend ─────────────────────────── */

import type { ScenarioRequest, SimulationResponse, HistoryResponse } from '../features/scenario/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('foresight_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    headers: {
      ...headers,
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status}`;
    try {
      const error = await res.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export const api = {
  /** Get dynamic AI scenario suggestions */
  getSuggestions: (city?: string) =>
    request<{ suggestions: string[] }>(`/api/v1/scenarios/suggestions${city ? `?city=${city}` : ''}`),

  /** Get top scenarios from the community */
  getLeaderboard: () =>
    request<{ leaderboard: any[] }>('/api/v1/scenarios/leaderboard'),
    
  /** Run a simulation for a "What If" scenario */
  simulate: (data: ScenarioRequest) =>
    request<SimulationResponse>('/api/v1/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get past simulations */
  getHistory: (limit = 50) =>
    request<HistoryResponse>(`/api/v1/scenarios/history?limit=${limit}`),

  /** Generate a newspaper based on a scenario */
  generateNewspaper: (data: { scenario_query: string; overall_score: number }) =>
    request<{ success: boolean; data: any }>('/api/v1/scenarios/newspaper', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get a specific scenario by ID */
  getScenario: (id: string) =>
    request<SimulationResponse>(`/api/v1/scenarios/${id}`),

  /** Health check */
  healthCheck: () =>
    request<Record<string, unknown>>('/api/v1/health'),

  /** Backcast from a goal */
  goalSeek: (data: { goal: string; city: string; timeline: string }) =>
    request<{ roadmap: any }>('/api/v1/scenarios/goal-seek', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Generate future vision image */
  generateVision: (scenario_summary: string, city: string, scenario_query?: string) =>
    request<{ image_url: string; description?: string }>('/api/v1/scenarios/vision', {
      method: 'POST',
      body: JSON.stringify({ scenario_summary, city, scenario_query }),
    }),

  /** Auth Register */
  register: (data: Record<string, string>) => 
    request<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Auth Login */
  login: (data: Record<string, string>) => 
    request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  /** Auth Get Profile */
  getProfile: () => request<any>('/api/v1/auth/me'),

  /** Get Knowledge Graph */
  getKnowledgeGraph: () => request<any>('/api/v1/graph'),

  /** Chat with AI about a scenario */
  chat: (data: { scenario_query: string; message: string; history: any[] }) =>
    request<any>('/api/v1/scenarios/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Create a short share link for a simulation result */
  createShare: (result: any) =>
    request<{ success: boolean; id: string }>('/api/v1/share', {
      method: 'POST',
      body: JSON.stringify({ result }),
    }),

  /** Retrieve a shared simulation result by short ID */
  getShare: (id: string) =>
    request<{ success: boolean; result: any }>(`/api/v1/share/${id}`),

  /** Toggle bookmark on a scenario */
  toggleBookmark: (scenarioId: string) =>
    request<{ success: boolean; bookmarked: boolean }>(`/api/v1/scenarios/${scenarioId}/bookmark`, {
      method: 'POST',
    }),

  /** Get all bookmarked scenarios */
  getBookmarks: () =>
    request<{ success: boolean; scenarios: any[]; total: number }>('/api/v1/scenarios/bookmarks'),

  /** Check bookmark status */
  getBookmarkStatus: (scenarioId: string) =>
    request<{ bookmarked: boolean }>(`/api/v1/scenarios/${scenarioId}/bookmark/status`),

  /** Generate butterfly effect causal chain */
  generateButterfly: (data: { scenario_query: string; overall_score: number; city?: string }) =>
    request<{ success: boolean; data: { nodes: any[]; links: any[] } }>('/api/v1/scenarios/butterfly', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
