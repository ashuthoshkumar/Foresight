import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { SimulationResult } from '../scenario/types';
import './Bookmarks.css';

interface BookmarksProps {
  onViewScenario: (result: SimulationResult) => void;
}

export default function Bookmarks({ onViewScenario }: BookmarksProps) {
  const [bookmarks, setBookmarks] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await api.getBookmarks();
        setBookmarks(res.scenarios || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (scenarioId: string) => {
    try {
      await api.toggleBookmark(scenarioId);
      setBookmarks(prev => prev.filter(b => b.id !== scenarioId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#06b6d4';
    if (score >= 25) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bookmarks-page container fade-in">
      <div className="bookmarks-header">
        <div className="bookmarks-header__icon">⭐</div>
        <h1 className="bookmarks-header__title">Saved Scenarios</h1>
        <p className="bookmarks-header__subtitle">
          Your bookmarked simulations — quickly revisit and compare past analyses.
        </p>
      </div>

      {loading ? (
        <div className="bookmarks-loading">
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <p>Loading your saved scenarios...</p>
        </div>
      ) : error ? (
        <div className="bookmarks-empty">
          <div className="bookmarks-empty__icon">⚠️</div>
          <p>{error}</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <div className="bookmarks-empty__icon">📭</div>
          <h3>No saved scenarios yet</h3>
          <p>Run a simulation and click the ⭐ button to save it here.</p>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((scenario, index) => (
            <div
              key={scenario.id}
              className="bookmarks-card glass"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="bookmarks-card__header">
                <div
                  className="bookmarks-card__score"
                  style={{
                    color: getScoreColor(scenario.overall_score),
                    borderColor: `${getScoreColor(scenario.overall_score)}33`,
                  }}
                >
                  {Math.round(scenario.overall_score)}
                </div>
                <button
                  className="bookmarks-card__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBookmark(scenario.id);
                  }}
                  title="Remove bookmark"
                >
                  ✕
                </button>
              </div>

              <h3 className="bookmarks-card__query">{scenario.query}</h3>

              <div className="bookmarks-card__meta">
                <span className="bookmarks-card__city">
                  📍 {scenario.city || 'Hyderabad'}
                </span>
                <span className="bookmarks-card__time">
                  {new Date(scenario.timestamp).toLocaleDateString()}
                </span>
              </div>

              <p className="bookmarks-card__summary">
                {scenario.overall_summary?.slice(0, 120)}
                {(scenario.overall_summary?.length || 0) > 120 ? '...' : ''}
              </p>

              <button
                className="bookmarks-card__view-btn"
                onClick={() => onViewScenario(scenario)}
              >
                📊 View Full Analysis
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
