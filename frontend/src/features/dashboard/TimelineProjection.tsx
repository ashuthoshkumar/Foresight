import { useState, useEffect, useRef } from 'react';
import type { ProjectedResult } from '../../utils/projection';
import './TimelineProjection.css';

interface TimelineProjectionProps {
  projections: ProjectedResult[];
  currentYear: number;
  onYearChange: (year: number) => void;
}

export default function TimelineProjection({ projections, currentYear, onYearChange }: TimelineProjectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const startYear = projections[0]?.year || 2024;
  const endYear = projections[projections.length - 1]?.year || 2035;
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        onYearChange(prev => {
          if (prev >= endYear) {
            setIsPlaying(false);
            return endYear;
          }
          return prev + 1;
        });
      }, 800); // 800ms per year jump
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, endYear, onYearChange]);

  const togglePlay = () => {
    if (!isPlaying && currentYear >= endYear) {
      onYearChange(startYear); // Restart if at the end
    }
    setIsPlaying(!isPlaying);
  };

  // SVG Chart rendering logic
  const minScore = 0;
  const maxScore = 100;
  const width = 800; // SVG internal coordinate width
  const height = 180; // SVG internal coordinate height
  const paddingX = 40;
  const paddingY = 20;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const getX = (year: number) => {
    return paddingX + ((year - startYear) / (endYear - startYear)) * chartW;
  };

  const getY = (score: number) => {
    return paddingY + chartH - ((score - minScore) / (maxScore - minScore)) * chartH;
  };

  const dPath = projections.map((p, i) => {
    const x = getX(p.year);
    const y = getY(p.overall_score);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Area under the curve
  const areaPath = `${dPath} L ${getX(endYear)} ${paddingY + chartH} L ${getX(startYear)} ${paddingY + chartH} Z`;

  return (
    <div className="timeline-projection">
      <div className="timeline-header">
        <div className="timeline-title-group">
          <div className="timeline-icon">📊</div>
          <div>
            <div className="timeline-title">Year-by-Year Timeline Projection</div>
            <div className="timeline-subtitle">Simulated impact trajectory from {startYear} to {endYear}</div>
          </div>
        </div>

        <div className="timeline-controls">
          <button className="timeline-play-btn" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="timeline-slider-wrapper">
            <input 
              type="range" 
              className="timeline-slider"
              min={startYear} 
              max={endYear} 
              value={currentYear}
              onChange={e => {
                setIsPlaying(false);
                onYearChange(parseInt(e.target.value, 10));
              }}
            />
            <div className="timeline-labels">
              <span>{startYear}</span>
              <span>{endYear}</span>
            </div>
          </div>
        </div>

        <div className="timeline-current-year">
          {currentYear}
        </div>
      </div>

      <div className="timeline-chart-area">
        <svg viewBox={`0 0 ${width} ${height}`} className="timeline-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="timeline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0)" />
            </linearGradient>
          </defs>

          {/* Grid lines (25, 50, 75, 100) */}
          {[25, 50, 75, 100].map(val => (
            <g key={val}>
              <line 
                x1={paddingX} y1={getY(val)} 
                x2={width - paddingX} y2={getY(val)} 
                className="timeline-grid-line" 
              />
              <text x={paddingX - 10} y={getY(val) + 4} className="timeline-grid-text" textAnchor="end">
                {val}
              </text>
            </g>
          ))}

          {/* Paths */}
          <path d={areaPath} className="timeline-line-area" />
          <path d={dPath} className="timeline-line" />

          {/* Data points */}
          {projections.map(p => {
            const isActive = p.year === currentYear;
            return (
              <circle
                key={p.year}
                cx={getX(p.year)}
                cy={getY(p.overall_score)}
                r={isActive ? 6 : 3}
                className={`timeline-point ${isActive ? 'timeline-point--active' : ''}`}
                onClick={() => {
                  setIsPlaying(false);
                  onYearChange(p.year);
                }}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
