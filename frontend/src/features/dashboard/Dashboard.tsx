import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import type { SimulationResult } from '../scenario/types';
import RadarChart from './RadarChart';
import ImpactCard from './ImpactCard';
import ImpactMap from './ImpactMap';
import TimelineProjection from './TimelineProjection';
import FollowUpChat from './FollowUpChat';
import ReportCard from './ReportCard';
import CitizenPulse from './CitizenPulse';
import { generateProjections } from '../../utils/projection';
import { exportToPDF } from '../../utils/exportPDF';
import { exportImage } from '../../utils/exportImage';
import { playSuccessChime, playWarningTone } from '../../utils/audio';
import { api } from '../../api/client';
import { FutureNewspaper } from '../newspaper/FutureNewspaper';
import AIMayor from './AIMayor';
import ShareButton from './ShareButton';
import SmartAlert from './SmartAlert';
import FutureVision from './FutureVision';
import CityVisualizer from './CityVisualizer';
import './Dashboard.css';

interface DashboardProps {
  result: SimulationResult;
  onBack: () => void;
}

export default function Dashboard({ result, onBack }: DashboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isLocked = !user?.is_admin && user?.tier === 'free';
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingNewspaper, setIsGeneratingNewspaper] = useState(false);
  const [newspaperData, setNewspaperData] = useState<any | null>(null);
  const [currentYear, setCurrentYear] = useState(2024);
  const [mapLayer, setMapLayer] = useState<'environmental' | 'financial' | 'human' | 'risks'>('environmental');
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'warning', message: string } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  // Trigger audio alert once on mount if score crosses thresholds
  useEffect(() => {
    if (result.overall_score >= 60) {
      setAlertConfig({ type: 'success', message: 'Scenario indicates high opportunity and positive impact.' });
      playSuccessChime();
    } else {
      setAlertConfig({ type: 'warning', message: 'Scenario indicates severe risks and negative compounding effects.' });
      playWarningTone();
    }
  }, [result.overall_score]);

  const projections = useMemo(() => generateProjections(result, 2024, 2035), [result]);
  
  const currentResult = useMemo(() => {
    const proj = projections.find(p => p.year === currentYear);
    if (!proj) return result;
    return {
      ...result,
      overall_score: proj.overall_score,
      impacts: proj.impacts
    };
  }, [projections, currentYear, result]);

  const circumference = 2 * Math.PI * 42;
  const scoreOffset = circumference - (currentResult.overall_score / 100) * circumference;

  const scoreColor = useMemo(() => {
    if (currentResult.overall_score >= 75) return '#10b981';
    if (currentResult.overall_score >= 50) return '#06b6d4';
    if (currentResult.overall_score >= 25) return '#f59e0b';
    return '#ef4444';
  }, [currentResult.overall_score]);

  const handleGenerateNewspaper = async () => {
    setIsGeneratingNewspaper(true);
    try {
      const response = await api.generateNewspaper({
        scenario_query: result.query,
        overall_score: result.overall_score
      });
      if (response.success) {
        setNewspaperData(response.data);
      }
    } catch (err) {
      console.error('Failed to generate newspaper', err);
    } finally {
      setIsGeneratingNewspaper(false);
    }
  };

  const domainLabel = result.domain?.includes('_ev_traffic')
    ? `🏙️ ${result.city || 'City'} EV/Traffic`
    : `📋 ${result.domain}`;

  // Check initial bookmark status
  useEffect(() => {
    api.getBookmarkStatus(result.id)
      .then(res => setIsBookmarked(res.bookmarked))
      .catch(() => {});
  }, [result.id]);

  const handleToggleBookmark = async () => {
    setIsTogglingBookmark(true);
    try {
      const res = await api.toggleBookmark(result.id);
      setIsBookmarked(res.bookmarked);
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  return (
    <div className="dashboard container">
      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__query-section">
          <div className="dashboard__header-actions">
            <button className="dashboard__back-btn" onClick={onBack}>
              {t('dashboard.newScenario')}
            </button>
            <button
              className={`dashboard__export-btn dashboard__export-btn--image ${isGeneratingImage ? 'dashboard__export-btn--loading' : ''}`}
              onClick={async () => {
                if (isLocked) {
                  window.dispatchEvent(new CustomEvent('open-paywall'));
                  return;
                }
                setIsGeneratingImage(true);
                try {
                  await exportImage('foresight-report-card', `foresight-scenario-${Date.now()}.png`);
                } finally {
                  setIsGeneratingImage(false);
                }
              }}
              disabled={isGeneratingImage || isExporting}
            >
              {isGeneratingImage ? '📸 Capturing...' : '📸 Share Card'} {isLocked && '🔒'}
            </button>
            <button 
              className={`dashboard__export-btn dashboard__export-btn--news ${isGeneratingNewspaper ? 'dashboard__export-btn--loading' : ''}`}
              onClick={handleGenerateNewspaper}
              disabled={isGeneratingNewspaper || isExporting || isGeneratingImage}
            >
              {isGeneratingNewspaper ? '📰 Writing...' : '📰 Read 2030 News'}
            </button>
            <ShareButton result={result} />
            <button
              className={`dashboard__export-btn dashboard__export-btn--bookmark ${isBookmarked ? 'dashboard__export-btn--bookmarked' : ''}`}
              onClick={handleToggleBookmark}
              disabled={isTogglingBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this scenario'}
            >
              {isTogglingBookmark ? '⏳' : isBookmarked ? '⭐' : '☆'} {isBookmarked ? 'Saved' : 'Save'}
            </button>
            <button
              className={`dashboard__export-btn dashboard__export-btn--rect ${isExporting ? 'dashboard__export-btn--loading' : ''}`}
              onClick={async () => {
                if (isLocked) {
                  window.dispatchEvent(new CustomEvent('open-paywall'));
                  return;
                }
                setIsExporting(true);
                try {
                  await exportToPDF(result);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting || isGeneratingImage}
            >
              {isExporting ? '⏳ Generating...' : '📤 Export PDF'} {isLocked && '🔒'}
            </button>
          </div>
          <div className="dashboard__query-label">{t('dashboard.scenarioAnalyzed')}</div>
          <h2 className="dashboard__query-text">{currentResult.query}</h2>
          <div className="dashboard__meta">
            <span className="dashboard__meta-domain">{domainLabel}</span>
            <span className="dashboard__meta-domain" style={{ background: 'rgba(253, 105, 37, 0.15)', borderColor: 'rgba(253, 105, 37, 0.3)', color: '#fd6925', fontWeight: 600 }} title="SDG 9: Industry, Innovation and Infrastructure">🎯 SDG 9</span>
            <span className="dashboard__meta-domain" style={{ background: 'rgba(249, 157, 37, 0.15)', borderColor: 'rgba(249, 157, 37, 0.3)', color: '#f99d25', fontWeight: 600 }} title="SDG 11: Sustainable Cities and Communities">🎯 SDG 11</span>
            {result.city && (
              <span className="dashboard__meta-item">📍 {result.city}</span>
            )}
            {currentResult.processing_time_ms && (
              <span className="dashboard__meta-item">
                ⚡ {(currentResult.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            <span className="dashboard__meta-item">
              📅 {currentYear === 2024 ? new Date(currentResult.timestamp).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              }) : `Proj. ${currentYear}`}
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
              {Math.round(currentResult.overall_score)}
            </span>
          </div>
          <div className="dashboard__overall-label">{currentYear === 2024 ? t('dashboard.overallImpact') : `Projected ${currentYear}`}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="dashboard__summary glass">
        <div className="dashboard__summary-text">{currentResult.overall_summary}</div>
      </div>

      {/* Visual Analytics Row: Radar Chart & City Visualizer side-by-side */}
      <div className="dashboard__visualization-grid">
        <div className="dashboard__radar-card glass" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="dashboard__radar-title">{t('dashboard.multiDimensional')} {currentYear !== 2024 && `(${currentYear})`}</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '1rem 0' }}>
            <RadarChart impacts={currentResult.impacts} size={320} />
          </div>
        </div>
        <div className="dashboard__visualizer-card" style={{ height: '100%' }}>
          <CityVisualizer result={currentResult} />
        </div>
      </div>

      {/* Future & SDG Alignment Row: SDG alignment card & Future Vision side-by-side */}
      <div className="dashboard__alignment-grid">
        <div className="dashboard__summary glass" style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Sustainable Development Goals (SDG) Target Alignment</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1, justifyContent: 'center' }}>
            <div className="sdg-alignment-item" style={{ borderLeft: '3px solid #fd6925', paddingLeft: '1rem' }}>
              <h4 style={{ color: '#fd6925', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', marginTop: 0 }}>SDG 9: Industry, Innovation & Infrastructure</h4>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', marginTop: 0 }}>
                Target 9.4: By 2030, upgrade infrastructure and retrofit industries to make them sustainable.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                <strong>Foresight Causal Check:</strong> Tripling EV charging station infrastructure scales power grid support structures, accelerating emission-free public transit and vehicle logistics.
              </p>
            </div>
            <div className="sdg-alignment-item" style={{ borderLeft: '3px solid #f99d25', paddingLeft: '1rem' }}>
              <h4 style={{ color: '#f99d25', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', marginTop: 0 }}>SDG 11: Sustainable Cities & Communities</h4>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', marginTop: 0 }}>
                Target 11.6: By 2030, reduce the adverse per capita environmental impact of cities, including air quality.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                <strong>Foresight Causal Check:</strong> Policies targeting EV transport and emission bans directly lower city PM2.5/PM10 pollutant volumes and enhance clean metropolitan environments.
              </p>
            </div>
          </div>
        </div>
        <div className="dashboard__vision-card" style={{ height: '100%' }}>
          <FutureVision scenarioSummary={currentResult.overall_summary} scenarioQuery={result.query} city={result.city || 'Hyderabad'} />
        </div>
      </div>

      {/* Interactive 3D Digital Twin City */}
      <div className="dashboard__map-section">
        <div className="dashboard__map-header">
          <div className="dashboard__impacts-title" style={{ marginBottom: 0 }}>🗺️ Live City Impact Map</div>
          <div className="dashboard__map-layers">
            {(['environmental', 'financial', 'human', 'risks'] as const).map(layer => (
              <button
                key={layer}
                className={`dashboard__map-layer-btn ${mapLayer === layer ? 'dashboard__map-layer-btn--active' : ''}`}
                onClick={() => setMapLayer(layer)}
              >
                {layer === 'environmental' && '🌿'}
                {layer === 'financial' && '💰'}
                {layer === 'human' && '👥'}
                {layer === 'risks' && '⚠️'}
                {' '}{layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ImpactMap result={currentResult} activeLayer={mapLayer} />
      </div>

      {/* Impact Cards */}
      <div className="dashboard__impacts-title">
        {t('dashboard.detailedBreakdown')} {currentYear !== 2024 && `for ${currentYear}`}
      </div>
      <div className="dashboard__impacts-grid stagger-children">
        {currentResult.impacts.map((impact, i) => (
          <ImpactCard key={impact.category} impact={impact} index={i} />
        ))}
      </div>

      {/* Citizen Pulse — Stakeholder Personas */}
      {currentResult.stakeholders && currentResult.stakeholders.length > 0 && (
        <CitizenPulse stakeholders={currentResult.stakeholders} />
      )}



      {/* Timeline Projection Component */}
      <TimelineProjection 
        projections={projections} 
        currentYear={currentYear} 
        onYearChange={setCurrentYear} 
      />

      {/* AI Mayor Voice Briefing */}
      <AIMayor
        scenarioQuery={result.query}
        overallScore={result.overall_score}
        overallSummary={result.overall_summary}
      />

      {/* AI Follow-up Chat */}
      <div className="dashboard__chat-section">
        <FollowUpChat scenarioQuery={result.query} />
      </div>

      {/* Hidden Report Card for Image Export */}
      <ReportCard result={currentResult} />

      {/* Audio-Visual Smart Alert */}
      {alertConfig && (
        <SmartAlert 
          type={alertConfig.type} 
          message={alertConfig.message} 
          duration={5000} 
          onClose={() => setAlertConfig(null)} 
        />
      )}

      {/* Future Newspaper Modal */}
      {newspaperData && (
        <FutureNewspaper 
          data={newspaperData} 
          onClose={() => setNewspaperData(null)} 
        />
      )}
    </div>
  );
}
