import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import './Leaderboard.css';

interface LeaderboardItem {
  id: string;
  query: string;
  domain: string;
  score: number;
  popularity_count: number;
}

interface LeaderboardProps {
  onRun: (query: string) => void;
}

export default function Leaderboard({ onRun }: LeaderboardProps) {
  const { t } = useTranslation();
  const [scenarios, setScenarios] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await api.getLeaderboard();
        setScenarios(res.leaderboard);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const handleRun = (query: string) => {
    onRun(query);
  };

  return (
    <div className="leaderboard-page container fade-in">
      <div className="leaderboard-header">
        <div className="leaderboard-header__icon">🏆</div>
        <h1 className="leaderboard-header__title">{t('leaderboard.title', 'Community Leaderboard')}</h1>
        <p className="leaderboard-header__subtitle">{t('leaderboard.subtitle', 'Discover and simulate the most impactful scenarios explored by the community.')}</p>
      </div>

      <div className="leaderboard-table-container glass">
        {loading ? (
          <div className="leaderboard-loading">Loading top scenarios...</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>{t('leaderboard.rank', 'Rank')}</th>
                <th>{t('leaderboard.scenario', 'Scenario')}</th>
                <th>{t('leaderboard.domain', 'Domain')}</th>
                <th>{t('leaderboard.impactScore', 'Impact Score')}</th>
                <th>{t('leaderboard.runs', 'Runs')}</th>
                <th style={{ width: '100px', textAlign: 'right' }}>{t('leaderboard.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((item, index) => {
                const getRankStyle = (rank: number) => {
                  if (rank === 0) return { color: '#fbbf24', textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }; // Gold
                  if (rank === 1) return { color: '#94a3b8', textShadow: '0 0 10px rgba(148, 163, 184, 0.5)' }; // Silver
                  if (rank === 2) return { color: '#b45309', textShadow: '0 0 10px rgba(180, 83, 9, 0.5)' }; // Bronze
                  return { color: 'var(--text-secondary)' };
                };

                return (
                  <tr key={item.id} className="leaderboard-row" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td className="leaderboard-cell--rank" style={getRankStyle(index)}>
                      #{index + 1}
                    </td>
                    <td className="leaderboard-cell--query">{item.query}</td>
                    <td className="leaderboard-cell--domain">
                      <span className="leaderboard-domain-badge">{item.domain}</span>
                    </td>
                    <td className="leaderboard-cell--score">
                      <div className="leaderboard-score-pill" style={{
                        color: item.score >= 80 ? '#10b981' : item.score >= 50 ? '#06b6d4' : '#f59e0b',
                        borderColor: item.score >= 80 ? 'rgba(16, 185, 129, 0.2)' : item.score >= 50 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)'
                      }}>
                        {item.score}
                      </div>
                    </td>
                    <td className="leaderboard-cell--count">{item.popularity_count.toLocaleString()}</td>
                    <td className="leaderboard-cell--action">
                      <button className="leaderboard-run-btn" onClick={() => handleRun(item.query)}>
                        ▶ {t('leaderboard.run', 'Run')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
