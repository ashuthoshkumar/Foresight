import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SimulationResult } from '../scenario/types';
import RadarChart from './RadarChart';
import ImpactCard from './ImpactCard';
import './Dashboard.css';

interface DashboardProps {
  result: SimulationResult;
  onBack: () => void;
}

export default function Dashboard({ result, onBack }: DashboardProps) {
  const { t } = useTranslation();
  const circumference = 2 * Math.PI * 42;
  const scoreOffset = circumference - (result.overall_score / 100) * circumference;

  const scoreColor = useMemo(() => {
    if (result.overall_score >= 75) return '#10b981';
    if (result.overall_score >= 50) return '#06b6d4';
    if (result.overall_score >= 25) return '#f59e0b';
    return '#ef4444';
  }, [result.overall_score]);

  const domainLabel = result.domain === 'hyderabad_ev_traffic'
    ? '🏙️ Hyderabad EV/Traffic'
    : `📋 ${result.domain}`;

  return (
    <div className="dashboard container">
      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__query-section">
          <button className="dashboard__back-btn" onClick={onBack}>
            {t('dashboard.newScenario')}
          </button>
          <div className="dashboard__query-label">{t('dashboard.scenarioAnalyzed')}</div>
          <h2 className="dashboard__query-text">{result.query}</h2>
          <div className="dashboard__meta">
            <span className="dashboard__meta-domain">{domainLabel}</span>
            {result.processing_time_ms && (
              <span className="dashboard__meta-item">
                ⚡ {(result.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            <span className="dashboard__meta-item">
              📅 {new Date(result.timestamp).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="dashboard__overall">
          <div className="dashboard__overall-score">
            <svg className="dashboard__overall-ring" viewBox="0 0 100 100">
              <circle
                className="dashboard__overall-ring-bg"
                cx="50" cy="50" r="42"
              />
              <circle
                className="dashboard__overall-ring-fill"
                cx="50" cy="50" r="42"
                stroke={scoreColor}
                strokeDasharray={circumference}
                strokeDashoffset={scoreOffset}
              />
            </svg>
            <span className="dashboard__overall-value" style={{ color: scoreColor }}>
              {Math.round(result.overall_score)}
            </span>
          </div>
          <div className="dashboard__overall-label">{t('dashboard.overallImpact')}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="dashboard__summary glass">
        <div className="dashboard__summary-text">{result.overall_summary}</div>
      </div>

      {/* Radar Chart */}
      <div className="dashboard__radar-section">
        <div className="dashboard__radar-card glass">
          <div className="dashboard__radar-title">{t('dashboard.multiDimensional')}</div>
          <RadarChart impacts={result.impacts} size={320} />
        </div>
      </div>

      {/* Impact Cards */}
      <div className="dashboard__impacts-title">
        {t('dashboard.detailedBreakdown')}
      </div>
      <div className="dashboard__impacts-grid stagger-children">
        {result.impacts.map((impact, i) => (
          <ImpactCard key={impact.category} impact={impact} index={i} />
        ))}
      </div>
    </div>
  );
}
