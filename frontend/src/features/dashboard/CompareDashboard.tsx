import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SimulationResult } from '../scenario/types';
import RadarChart from './RadarChart';
import ImpactCard from './ImpactCard';
import { exportToPDF } from '../../utils/exportPDF';
import './Dashboard.css';

interface CompareDashboardProps {
  resultA: SimulationResult;
  resultB: SimulationResult;
  onBack: () => void;
}

export default function CompareDashboard({ resultA, resultB, onBack }: CompareDashboardProps) {
  const { t } = useTranslation();
  const [exportingA, setExportingA] = useState(false);
  const [exportingB, setExportingB] = useState(false);
  
  const circumference = 2 * Math.PI * 42;
  const getScoreOffset = (score: number) => circumference - (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#06b6d4';
    if (score >= 25) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="dashboard container">
      {/* Header */}
      <div className="dashboard__header" style={{ alignItems: 'flex-start' }}>
        <div className="dashboard__query-section" style={{ flex: 1 }}>
          <div className="dashboard__header-actions">
            <button className="dashboard__back-btn" onClick={onBack}>
              {t('dashboard.newScenario')}
            </button>
            <button
              className={`dashboard__export-btn ${exportingA ? 'dashboard__export-btn--loading' : ''}`}
              onClick={async () => { setExportingA(true); try { await exportToPDF(resultA); } finally { setExportingA(false); } }}
              disabled={exportingA || exportingB}
            >
              {exportingA ? '⏳...' : '📤 Export A'}
            </button>
            <button
              className={`dashboard__export-btn ${exportingB ? 'dashboard__export-btn--loading' : ''}`}
              style={{ background: 'linear-gradient(135deg, #d97706, #10b981)' }}
              onClick={async () => { setExportingB(true); try { await exportToPDF(resultB); } finally { setExportingB(false); } }}
              disabled={exportingA || exportingB}
            >
              {exportingB ? '⏳...' : '📤 Export B'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div className="dashboard__query-label" style={{ color: '#00d4ff' }}>Scenario A</div>
              <h2 className="dashboard__query-text" style={{ fontSize: '1.5rem' }}>{resultA.query}</h2>
            </div>
            
            <div style={{ flex: 1 }}>
              <div className="dashboard__query-label" style={{ color: '#f59e0b' }}>Scenario B</div>
              <h2 className="dashboard__query-text" style={{ fontSize: '1.5rem' }}>{resultB.query}</h2>
            </div>
          </div>
        </div>

        <div className="dashboard__overall" style={{ display: 'flex', gap: '1rem', flex: 'none' }}>
          {/* Score A */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="dashboard__overall-score">
              <svg className="dashboard__overall-ring" viewBox="0 0 100 100">
                <circle className="dashboard__overall-ring-bg" cx="50" cy="50" r="42" />
                <circle
                  className="dashboard__overall-ring-fill"
                  cx="50" cy="50" r="42"
                  stroke={getScoreColor(resultA.overall_score)}
                  strokeDasharray={circumference}
                  strokeDashoffset={getScoreOffset(resultA.overall_score)}
                />
              </svg>
              <span className="dashboard__overall-value" style={{ color: getScoreColor(resultA.overall_score) }}>
                {Math.round(resultA.overall_score)}
              </span>
            </div>
            <div className="dashboard__overall-label" style={{ color: '#00d4ff' }}>Score A</div>
          </div>
          
          {/* Score B */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="dashboard__overall-score">
              <svg className="dashboard__overall-ring" viewBox="0 0 100 100">
                <circle className="dashboard__overall-ring-bg" cx="50" cy="50" r="42" />
                <circle
                  className="dashboard__overall-ring-fill"
                  cx="50" cy="50" r="42"
                  stroke={getScoreColor(resultB.overall_score)}
                  strokeDasharray={circumference}
                  strokeDashoffset={getScoreOffset(resultB.overall_score)}
                />
              </svg>
              <span className="dashboard__overall-value" style={{ color: getScoreColor(resultB.overall_score) }}>
                {Math.round(resultB.overall_score)}
              </span>
            </div>
            <div className="dashboard__overall-label" style={{ color: '#f59e0b' }}>Score B</div>
          </div>
        </div>
      </div>

      {/* Radar Chart Overlay */}
      <div className="dashboard__radar-section">
        <div className="dashboard__radar-card glass">
          <div className="dashboard__radar-title">Impact Comparison</div>
          <RadarChart impacts={resultA.impacts} impactsB={resultB.impacts} size={380} />
          
          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Scenario A</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Scenario B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Side-by-Side Impacts */}
      <div className="dashboard__impacts-title">
        {t('dashboard.detailedBreakdown')} Comparison
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {resultA.impacts.map((impactA, i) => {
          const impactB = resultB.impacts.find(b => b.category === impactA.category);
          if (!impactB) return null;
          
          return (
            <div key={impactA.category} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '16px', fontSize: '0.75rem', color: '#00d4ff', fontWeight: 'bold', zIndex: 1, background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.2)' }}>Scenario A</div>
                <ImpactCard impact={impactA} index={i} />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '16px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold', zIndex: 1, background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Scenario B</div>
                <ImpactCard impact={impactB} index={i} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
