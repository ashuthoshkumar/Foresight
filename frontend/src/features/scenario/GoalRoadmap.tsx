import React from 'react';
import './GoalRoadmap.css';

interface Milestone {
  year: string;
  title: string;
  description: string;
  key_policy: string;
  infrastructure_change: string;
}

interface GoalRoadmapProps {
  roadmap: {
    goal_summary: string;
    total_estimated_budget: string;
    feasibility_score: number;
    milestones: Milestone[];
    major_risks: string[];
  };
  onBack: () => void;
}

export default function GoalRoadmap({ roadmap, onBack }: GoalRoadmapProps) {
  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        ← Back
      </button>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: `${roadmap.feasibility_score}%`, height: '4px', background: 'linear-gradient(90deg, #10b981, #3b82f6)' }} />
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Goal Roadmap</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {roadmap.goal_summary}
        </p>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>Est. Budget</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{roadmap.total_estimated_budget}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>Feasibility</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: roadmap.feasibility_score > 60 ? '#10b981' : '#f59e0b' }}>{roadmap.feasibility_score}/100</div>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Timeline</h3>
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
        
        {roadmap.milestones.map((ms, idx) => (
          <div key={idx} style={{ position: 'relative', marginBottom: '2.5rem' }}>
            <div style={{ position: 'absolute', left: '-33px', top: '5px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-primary)', border: '4px solid var(--bg-primary)' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>{ms.title}</h4>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '1.1rem' }}>{ms.year}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{ms.description}</p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '2px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Key Policy</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{ms.key_policy}</div>
              </div>
              <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '2px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Infrastructure</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{ms.infrastructure_change}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <h4 style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span> Major Risks
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
          {roadmap.major_risks.map((risk, idx) => (
            <li key={idx} style={{ marginBottom: '0.5rem' }}>{risk}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
