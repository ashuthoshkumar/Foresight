import type { SimulationResult } from '../scenario/types';
import { CATEGORY_META } from '../scenario/types';
import { timeAgo } from '../../utils/formatters';
import './History.css';

interface HistoryProps {
  scenarios: SimulationResult[];
  onSelect: (result: SimulationResult) => void;
}

export default function History({ scenarios, onSelect }: HistoryProps) {
  if (scenarios.length === 0) {
    return (
      <div className="history container">
        <div className="history__header">
          <h2 className="history__title">📋 Scenario History</h2>
        </div>
        <div className="history__empty">
          <div className="history__empty-icon">🔮</div>
          <div className="history__empty-text">No scenarios yet</div>
          <div className="history__empty-hint">
            Run your first simulation to see it here!
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#06b6d4';
    if (score >= 25) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="history container">
      <div className="history__header">
        <h2 className="history__title">📋 Scenario History</h2>
        <span className="history__count">{scenarios.length} scenarios</span>
      </div>

      <div className="history__list stagger-children">
        {scenarios.map(scenario => {
          const scoreColor = getScoreColor(scenario.overall_score);
          const domainLabel = scenario.domain === 'hyderabad_ev_traffic'
            ? 'Hyderabad EV/Traffic'
            : scenario.domain;

          return (
            <div
              key={scenario.id}
              className="history-card"
              onClick={() => onSelect(scenario)}
            >
              <div className="history-card__top">
                <div className="history-card__query">{scenario.query}</div>
                <div
                  className="history-card__score"
                  style={{ color: scoreColor, borderColor: `${scoreColor}40` }}
                >
                  {Math.round(scenario.overall_score)}
                </div>
              </div>

              <div className="history-card__meta">
                <span className="history-card__domain">{domainLabel}</span>
                <span className="history-card__meta-item">
                  🕐 {timeAgo(scenario.timestamp)}
                </span>
                {scenario.processing_time_ms && (
                  <span className="history-card__meta-item">
                    ⚡ {(scenario.processing_time_ms / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              <div className="history-card__impacts">
                {scenario.impacts.map(impact => {
                  const meta = CATEGORY_META[impact.category];
                  return (
                    <span
                      key={impact.category}
                      className="history-card__impact-pill"
                      style={{ color: meta.color, borderColor: `${meta.color}25` }}
                    >
                      {meta.icon} {Math.round(impact.score)}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
