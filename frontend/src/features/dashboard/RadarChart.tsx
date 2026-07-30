import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImpactAxis } from '../scenario/types';
import { CATEGORY_META } from '../scenario/types';

interface RadarChartProps {
  impacts: ImpactAxis[];
  impactsB?: ImpactAxis[];
  size?: number;
}

export default function RadarChart({ impacts, impactsB, size = 300 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size * 0.30;
    const categories: Array<keyof typeof CATEGORY_META> = [
      'financial', 'environmental', 'human', 'risks', 'opportunities',
    ];
    const n = categories.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw grid rings
    for (let ring = 1; ring <= 5; ring++) {
      const r = (maxRadius / 5) * ring;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = startAngle + angleStep * i;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${ring === 5 ? 0.08 : 0.04})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < n; i++) {
      const angle = startAngle + angleStep * i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(angle), cy + maxRadius * Math.sin(angle));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Map impacts to scores
    const scores = categories.map(cat => {
      const impact = impacts.find(i => i.category === cat);
      return impact ? impact.score / 100 : 0;
    });
    
    const scoresB = impactsB ? categories.map(cat => {
      const impact = impactsB.find(i => i.category === cat);
      return impact ? impact.score / 100 : 0;
    }) : null;

    // Animate fill
    const animateFrame = (progress: number) => {
      // Clear the data area only
      ctx.save();
      
      const drawSeries = (seriesScores: number[], isSecondary: boolean) => {
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const idx = i % n;
          const angle = startAngle + angleStep * idx;
          const r = maxRadius * seriesScores[idx] * progress;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Gradient fill
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
        if (isSecondary) {
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.25)'); // Amber
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
        } else {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)'); // Neon Green
          gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)'); // Neon Purple
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
        }
        ctx.fillStyle = gradient;
        ctx.fill();

        // Border
        ctx.strokeStyle = isSecondary ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Data points
        for (let i = 0; i < n; i++) {
          const angle = startAngle + angleStep * i;
          const r = maxRadius * seriesScores[i] * progress;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);

          // Glow
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = isSecondary ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)';
          ctx.fill();

          // Point
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          // Only show category color for the primary series to avoid confusion, or use specific colors
          ctx.fillStyle = isSecondary ? '#f59e0b' : CATEGORY_META[categories[i]].color;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      };

      // Draw series B first so series A overlays on top
      if (scoresB) {
        drawSeries(scoresB, true);
      }
      drawSeries(scores, false);

      // Labels
      for (let i = 0; i < n; i++) {
        const angle = startAngle + angleStep * i;
        const labelR = maxRadius + 32;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);

        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Icon
        ctx.font = '14px sans-serif';
        ctx.fillText(CATEGORY_META[categories[i]].icon, x, y - 9);

        // Label text
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(t(`categories.${categories[i]}`), x, y + 8);

        // Score (Only show primary score in labels to avoid clutter)
        ctx.font = '700 10px Inter, sans-serif';
        ctx.fillStyle = CATEGORY_META[categories[i]].color;
        const score = Math.round(scores[i] * 100 * progress);
        ctx.fillText(`${score}`, x, y + 21);
      }

      ctx.restore();
    };

    // Animation
    let start: number | null = null;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      ctx.clearRect(0, 0, size, size);

      // Redraw static grid
      for (let ring = 1; ring <= 5; ring++) {
        const r = (maxRadius / 5) * ring;
        ctx.beginPath();
        for (let j = 0; j <= n; j++) {
          const angle = startAngle + angleStep * j;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${ring === 5 ? 0.08 : 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let j = 0; j < n; j++) {
        const angle = startAngle + angleStep * j;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxRadius * Math.cos(angle), cy + maxRadius * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animateFrame(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [impacts, impactsB, size, t]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        aria-label="Impact radar chart showing scores across five dimensions"
      />
    </div>
  );
}
