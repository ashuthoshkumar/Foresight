/* ── API Client for Foresight Backend ─────────────────────────── */

import type { ScenarioRequest, SimulationResponse, HistoryResponse } from '../features/scenario/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.message || `Request failed: ${res.status}`);
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
};
