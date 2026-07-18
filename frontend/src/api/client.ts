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
  /** Run a simulation for a "What If" scenario */
  simulate: (data: ScenarioRequest) =>
    request<SimulationResponse>('/api/v1/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get past simulations */
  getHistory: (limit = 50) =>
    request<HistoryResponse>(`/api/v1/scenarios/history?limit=${limit}`),

  /** Get a specific scenario by ID */
  getScenario: (id: string) =>
    request<SimulationResponse>(`/api/v1/scenarios/${id}`),

  /** Health check */
  healthCheck: () =>
    request<Record<string, unknown>>('/api/v1/health'),

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
};
