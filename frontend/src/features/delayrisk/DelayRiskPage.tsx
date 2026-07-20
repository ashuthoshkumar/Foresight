import { useState } from 'react';
import { api } from '../../api/client';
import type { SimulationResult } from '../scenario/types';
import DelayRiskChart from '../dashboard/DelayRiskChart';
import './DelayRiskPage.css';

const EXAMPLE_QUERIES = [
  'What if Hyderabad bans all non-electric vehicles?',
  'What if all factories switch to renewable energy?',
  'What if free public transport is introduced?',
  'What if plastic bags are completely banned?',
];

export default function DelayRiskPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>([]);

  const handleSimulate = async (q?: string) => {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.simulate({ query: finalQuery.trim() });
      if (response.success && response.result) {
        setCurrentResult(response.result);
        setHistory(prev => {
          const next = [response.result, ...prev];
          return next.slice(0, 10); // keep last 10
        });
        setQuery('');
      } else {
        throw new Error(response.message || 'Simulation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 70 ? '#10b981' : s >= 50 ? '#06b6d4' : s >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="drp container">
      {/* Page Header */}
      <div className="drp__header">
        <div>
          <div className="drp__tag">Risk Analysis</div>
          <h1 className="drp__title">⏳ Policy Delay Risk</h1>
          <p className="drp__subtitle">
            Simulate any policy and see how delaying it costs impact over time
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="drp__input-section glass">
        <label className="drp__input-label">Enter your "What If" policy scenario</label>
        <div className="drp__input-row">
          <input
            className="drp__input"
            type="text"
            placeholder='e.g. "What if all buses become electric by 2026?"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSimulate()}
            disabled={isLoading}
          />
          <button
            className="drp__simulate-btn"
            onClick={() => handleSimulate()}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? (
              <><span className="drp__spinner" /> Simulating…</>
            ) : (
              '⚡ Analyse Risk'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="drp__error">⚠️ {error}</div>
        )}

        {/* Example chips */}
        <div className="drp__chips">
          <span className="drp__chips-label">Try:</span>
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              className="drp__chip"
              onClick={() => handleSimulate(q)}
              disabled={isLoading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Result */}
      {currentResult && (
        <div className="drp__result">
          <div className="drp__result-meta">
            <div className="drp__result-query">"{currentResult.query}"</div>
            <div className="drp__result-score" style={{ color: scoreColor(currentResult.overall_score) }}>
              Base Score: <strong>{Math.round(currentResult.overall_score)}/100</strong>
            </div>
          </div>
          <DelayRiskChart result={currentResult} />
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="drp__skeleton glass">
          <div className="drp__skeleton-bar drp__skeleton-bar--wide" />
          <div className="drp__skeleton-bar drp__skeleton-bar--medium" />
          <div className="drp__skeleton-bars">
            {[60, 80, 95, 75, 40].map((h, i) => (
              <div key={i} className="drp__skeleton-col" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Local History */}
      {history.length > 0 && (
        <div className="drp__history">
          <h3 className="drp__history-title">📋 Analysis History</h3>
          <div className="drp__history-list">
            {history.map((r, i) => (
              <button
                key={r.id ?? i}
                className={`drp__history-item ${currentResult?.id === r.id ? 'drp__history-item--active' : ''}`}
                onClick={() => setCurrentResult(r)}
              >
                <div className="drp__history-query">{r.query}</div>
                <div
                  className="drp__history-score"
                  style={{ color: scoreColor(r.overall_score) }}
                >
                  {Math.round(r.overall_score)}/100
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
