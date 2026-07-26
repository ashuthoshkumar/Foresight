import React from 'react';
import type { StakeholderPersona } from '../scenario/types';
import './CitizenPulse.css';

interface CitizenPulseProps {
  stakeholders: StakeholderPersona[];
}

const IMPACT_COLORS: Record<string, string> = {
  positive: '#10b981',
  negative: '#ef4444',
  mixed: '#f59e0b',
};

const IMPACT_LABELS: Record<string, string> = {
  positive: 'Positively Impacted',
  negative: 'Negatively Impacted',
  mixed: 'Mixed Impact',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
];

export default function CitizenPulse({ stakeholders }: CitizenPulseProps) {
  if (!stakeholders || stakeholders.length === 0) return null;

  return (
    <div className="citizen-pulse">
      <div className="citizen-pulse__header">
        <h3 className="citizen-pulse__title">
          <span className="citizen-pulse__icon">👥</span>
          Citizen Pulse
        </h3>
        <p className="citizen-pulse__subtitle">
          How real people are impacted by this scenario
        </p>
      </div>

      <div className="citizen-pulse__grid">
        {stakeholders.map((persona, index) => {
          const impactColor = IMPACT_COLORS[persona.impact] || IMPACT_COLORS.mixed;
          const initials = persona.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={index}
              className="citizen-pulse__card"
              style={{
                animationDelay: `${index * 0.12}s`,
                '--impact-color': impactColor,
              } as React.CSSProperties}
            >
              {/* Impact indicator strip */}
              <div
                className="citizen-pulse__impact-strip"
                style={{ background: impactColor }}
              />

              <div className="citizen-pulse__card-content">
                {/* Avatar + Info */}
                <div className="citizen-pulse__persona-row">
                  <div
                    className="citizen-pulse__avatar"
                    style={{ background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] }}
                  >
                    {initials}
                  </div>
                  <div className="citizen-pulse__persona-info">
                    <div className="citizen-pulse__name">
                      {persona.emoji} {persona.name}
                    </div>
                    <div className="citizen-pulse__meta">
                      {persona.occupation} · Age {persona.age}
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="citizen-pulse__quote">
                  "{persona.quote}"
                </blockquote>

                {/* Impact badge */}
                <div
                  className="citizen-pulse__impact-badge"
                  style={{
                    color: impactColor,
                    borderColor: `${impactColor}33`,
                    background: `${impactColor}11`,
                  }}
                >
                  {persona.impact === 'positive' ? '↑' : persona.impact === 'negative' ? '↓' : '↔'}
                  {' '}
                  {IMPACT_LABELS[persona.impact] || 'Mixed Impact'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
