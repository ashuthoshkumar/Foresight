import { useState, useMemo } from 'react';
import type { SimulationResult } from '../scenario/types';
import './DelayRiskChart.css';

interface DelayRiskChartProps {
  result: SimulationResult;
}

const DELAY_YEARS = [0, 1, 2, 3, 5];

// Simulate the cost of delay:
// Each year of delay erodes the score by a compounding factor
// based on the scenario's risk profile (low score = faster decay)
function getDelayedScore(baseScore: number, delayYears: number): number {
  if (delayYears === 0) return baseScore;
  // High-risk scenarios decay faster
  const decayRate = baseScore >= 60 ? 0.055 : baseScore >= 40 ? 0.08 : 0.12;
  const decayed = baseScore * Math.pow(1 - decayRate, delayYears);
  return Math.max(5, parseFloat(decayed.toFixed(1)));
}

function getOpportunityCost(base: number, delayed: number): string {
  const loss = base - delayed;
  if (loss <= 1) return 'No significant cost';
  if (loss <= 5) return `Minor loss of ${loss.toFixed(1)} points`;
  if (loss <= 15) return `Moderate impact loss of ${loss.toFixed(1)} points`;
  return `Critical impact loss of ${loss.toFixed(1)} points`;
}

function getDelayConsequence(delayYears: number, score: number): string {
  if (delayYears === 0) return 'Optimal implementation window';
  const projected = getDelayedScore(score, delayYears);
  if (projected >= 70) return `Still viable — score drops to ${projected}`;
  if (projected >= 50) return `Moderate risk — score drops to ${projected}`;
  if (projected >= 30) return `High risk — score drops to ${projected}`;
  return `Crisis zone — score collapses to ${projected}`;
}

export default function DelayRiskChart({ result }: DelayRiskChartProps) {
  const [selectedDelay, setSelectedDelay] = useState(0);

  const dataPoints = useMemo(() =>
    DELAY_YEARS.map(y => ({
      year: y,
      score: getDelayedScore(result.overall_score, y),
    })),
    [result.overall_score]
  );

  const maxScore = result.overall_score;
  const selectedScore = getDelayedScore(result.overall_score, selectedDelay);
  const totalLoss = maxScore - selectedScore;

  const scoreColor = (score: number) =>
    score >= 70 ? '#10b981' : score >= 50 ? '#06b6d4' : score >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="delay-risk">
      <div className="delay-risk__header">
        <div>
          <h3 className="delay-risk__title">⏳ Policy Delay Risk Analysis</h3>
          <p className="delay-risk__subtitle">See how delaying this policy costs impact over time</p>
        </div>
        {selectedDelay > 0 && (
          <div className="delay-risk__loss-badge" style={{ background: `rgba(239, 68, 68, 0.1)`, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <span className="delay-risk__loss-label">Cost of {selectedDelay}yr delay</span>
            <span className="delay-risk__loss-value" style={{ color: '#ef4444' }}>−{totalLoss.toFixed(1)} pts</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="delay-risk__chart">
        {dataPoints.map((pt, i) => {
          const barHeightPct = (pt.score / 100) * 100;
          const color = scoreColor(pt.score);
          const isSelected = pt.year === selectedDelay;
          return (
            <div
              key={pt.year}
              className={`delay-risk__bar-col ${isSelected ? 'delay-risk__bar-col--active' : ''}`}
              onClick={() => setSelectedDelay(pt.year)}
            >
              <div className="delay-risk__bar-label-top" style={{ color }}>
                {Math.round(pt.score)}
              </div>
              <div className="delay-risk__bar-track">
                <div
                  className="delay-risk__bar-fill"
                  style={{
                    height: `${barHeightPct}%`,
                    background: color,
                    boxShadow: isSelected ? `0 0 16px ${color}` : 'none',
                    opacity: isSelected ? 1 : 0.55,
                  }}
                />
                {/* Danger threshold line at y=40 */}
                <div className="delay-risk__threshold-line" style={{ bottom: '40%' }} title="Danger threshold (40)" />
              </div>
              <div className="delay-risk__bar-year">
                {pt.year === 0 ? 'Now' : `+${pt.year}yr`}
              </div>
            </div>
          );
        })}

        {/* Y-axis labels */}
        <div className="delay-risk__yaxis">
          {[100, 75, 50, 25, 0].map(v => (
            <span key={v} className="delay-risk__yaxis-label">{v}</span>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="delay-risk__slider-wrap">
        <span className="delay-risk__slider-label">Delay:</span>
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={selectedDelay}
          onChange={e => {
            const val = Number(e.target.value);
            // Snap to valid years only
            const closest = DELAY_YEARS.reduce((a, b) =>
              Math.abs(b - val) < Math.abs(a - val) ? b : a
            );
            setSelectedDelay(closest);
          }}
          className="delay-risk__slider"
          style={{ '--track-color': scoreColor(selectedScore) } as React.CSSProperties}
        />
        <span className="delay-risk__slider-value" style={{ color: scoreColor(selectedScore) }}>
          {selectedDelay === 0 ? 'Implement Now' : `${selectedDelay} Year${selectedDelay > 1 ? 's' : ''} Later`}
        </span>
      </div>

      {/* Selected detail card */}
      <div className="delay-risk__detail" style={{ borderColor: `${scoreColor(selectedScore)}40` }}>
        <div className="delay-risk__detail-score">
          <div className="delay-risk__detail-score-value" style={{ color: scoreColor(selectedScore) }}>
            {Math.round(selectedScore)}
          </div>
          <div className="delay-risk__detail-score-label">Projected Score</div>
        </div>
        <div className="delay-risk__detail-info">
          <div className="delay-risk__detail-consequence">
            {getDelayConsequence(selectedDelay, result.overall_score)}
          </div>
          <div className="delay-risk__detail-cost">
            {getOpportunityCost(maxScore, selectedScore)}
          </div>
          {selectedDelay > 0 && (
            <div className="delay-risk__detail-alert">
              ⚠️ Every year of delay allows compounding social, economic, and environmental costs to accumulate — reducing the net positive impact of this policy by approx. {(((maxScore - selectedScore) / maxScore) * 100).toFixed(0)}%.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
