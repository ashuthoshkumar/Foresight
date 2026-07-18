import { useEffect, useRef } from 'react';
import type { ImpactAxis } from '../scenario/types';
import { CATEGORY_META } from '../scenario/types';

interface RadarChartProps {
  impacts: ImpactAxis[];
  size?: number;
}

export default function RadarChart({ impacts, size = 300 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const maxRadius = size * 0.38;
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

    // Animate fill
    const animateFrame = (progress: number) => {
      // Clear the data area only
      ctx.save();

      // Draw filled area
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const angle = startAngle + angleStep * idx;
        const r = maxRadius * scores[idx] * progress;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Gradient fill
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.25)');
      gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Data points
      for (let i = 0; i < n; i++) {
        const angle = startAngle + angleStep * i;
        const r = maxRadius * scores[i] * progress;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        // Glow
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.fill();

        // Point
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = CATEGORY_META[categories[i]].color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Labels
      for (let i = 0; i < n; i++) {
        const angle = startAngle + angleStep * i;
        const labelR = maxRadius + 28;
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
        ctx.fillText(CATEGORY_META[categories[i]].label, x, y + 8);

        // Score
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
  }, [impacts, size]);

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
