/* ── Types for the Foresight frontend ────────────────────────── */

export type DataSource = 'knowledge_graph' | 'llm_estimate';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ImpactCategory = 'financial' | 'environmental' | 'human' | 'risks' | 'opportunities';

export interface ImpactDetail {
  metric: string;
  value: string;
  explanation: string;
  confidence: ConfidenceLevel;
  source: DataSource;
}

export interface ImpactAxis {
  category: ImpactCategory;
  score: number;
  summary: string;
  details: ImpactDetail[];
  data_source: DataSource;
}

export interface SimulationResult {
  id: string;
  query: string;
  timestamp: string;
  impacts: ImpactAxis[];
  overall_summary: string;
  overall_score: number;
  parameters_used: Record<string, unknown>;
  domain: string;
  processing_time_ms: number | null;
}

export interface SimulationResponse {
  success: boolean;
  result: SimulationResult;
  message: string;
}

export interface HistoryResponse {
  success: boolean;
  scenarios: SimulationResult[];
  total: number;
}

export interface ScenarioRequest {
  query: string;
  parameters?: Record<string, unknown>;
  language?: string;
}

/* Category metadata for UI rendering */
export const CATEGORY_META: Record<ImpactCategory, {
  label: string;
  icon: string;
  color: string;
  gradient: string;
}> = {
  financial: {
    label: 'Financial',
    icon: '💰',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  environmental: {
    label: 'Environmental',
    icon: '🌍',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  human: {
    label: 'Human',
    icon: '👥',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  },
  risks: {
    label: 'Risks',
    icon: '⚠️',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
  },
  opportunities: {
    label: 'Opportunities',
    icon: '🚀',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  },
};
