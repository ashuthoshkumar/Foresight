import { useState } from 'react';
import type { ImpactAxis } from '../scenario/types';
import { CATEGORY_META } from '../scenario/types';
import CredibilityBadge from './CredibilityBadge';
import './ImpactCard.css';

interface ImpactCardProps {
  impact: ImpactAxis;
  index: number;
}

export default function ImpactCard({ impact, index }: ImpactCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[impact.category];

  return (
    <div
      className={`impact-card ${expanded ? 'impact-card--expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
      style={{
        animationDelay: `${index * 0.1}s`,
        borderColor: expanded ? `${meta.color}33` : undefined,
      }}
    >
      <div className="impact-card__header">
        <div className="impact-card__header-left">
          <div className="impact-card__icon" style={{ background: `${meta.color}15` }}>
            {meta.icon}
          </div>
          <span className="impact-card__category" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <div className="impact-card__score-container">
          <div className="impact-card__score-bar">
            <div
              className="impact-card__score-fill"
              style={{
                width: `${impact.score}%`,
                background: meta.gradient,
              }}
            />
          </div>
          <span className="impact-card__score" style={{ color: meta.color }}>
            {Math.round(impact.score)}
          </span>
        </div>
      </div>

      <div className="impact-card__summary">
        <span>{impact.summary}</span>
        <CredibilityBadge source={impact.data_source} compact />
      </div>

      <div className="impact-card__details">
        <div className="impact-card__detail-list">
          {impact.details.map((detail, i) => (
            <div key={i} className="impact-card__detail">
              <div className="impact-card__detail-header">
                <span className="impact-card__detail-metric">{detail.metric}</span>
                <span className="impact-card__detail-value" style={{ color: meta.color }}>
                  {detail.value}
                </span>
              </div>
              <div className="impact-card__detail-explanation">{detail.explanation}</div>
              <div className="impact-card__detail-footer">
                <span className={`impact-card__confidence impact-card__confidence--${detail.confidence}`}>
                  {detail.confidence} confidence
                </span>
                <CredibilityBadge source={detail.source} compact />
              </div>
            </div>
          ))}
        </div>
      </div>

      {impact.details.length > 0 && (
        <div className="impact-card__expand-hint">
          {expanded ? '▲ Click to collapse' : `▼ ${impact.details.length} metrics — click to expand`}
        </div>
      )}
    </div>
  );
}
