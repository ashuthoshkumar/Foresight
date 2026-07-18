import type { DataSource } from '../scenario/types';

interface CredibilityBadgeProps {
  source: DataSource;
  compact?: boolean;
}

export default function CredibilityBadge({ source, compact = false }: CredibilityBadgeProps) {
  const isKG = source === 'knowledge_graph';

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: compact ? '2px 8px' : '4px 12px',
    borderRadius: '9999px',
    fontSize: compact ? '0.65rem' : '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    background: isKG ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
    color: isKG ? '#10b981' : '#f59e0b',
    border: `1px solid ${isKG ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style} title={isKG ? 'Calculated from real-world data' : 'AI-generated directional estimate'}>
      <span style={{ fontSize: compact ? '0.7rem' : '0.8rem' }}>
        {isKG ? '🟢' : '🟡'}
      </span>
      {isKG ? 'Data-Grounded' : 'AI Estimate'}
    </span>
  );
}
