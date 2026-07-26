import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import './ButterflyEffect.css';

interface ButterflyNode {
  id: string;
  label: string;
  order: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  size: number;
  // Physics
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  opacity: number;
}

interface ButterflyLink {
  source: string;
  target: string;
  label: string;
  opacity: number;
}

interface ButterflyEffectProps {
  scenarioQuery: string;
  overallScore: number;
  city?: string;
  defaultExpanded?: boolean;
  hideTrigger?: boolean;
}

const SENTIMENT_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#06b6d4',
};

const ORDER_COLORS = [
  '#06b6d4', // root
  '#f59e0b', // 1st order
  '#a855f7', // 2nd order
  '#ec4899', // 3rd order
];

export default function ButterflyEffect({ scenarioQuery, overallScore, city, defaultExpanded = false, hideTrigger = false }: ButterflyEffectProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(false);
  const [nodes, setNodes] = useState<ButterflyNode[]>([]);
  const [links, setLinks] = useState<ButterflyLink[]>([]);
  const [rawGraphData, setRawGraphData] = useState<{nodes: any[], links: any[]} | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ButterflyNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<ButterflyNode[]>([]);
  const linksRef = useRef<ButterflyLink[]>([]);
  const timeRef = useRef(0);

  const handleGenerate = useCallback(async () => {
    if (nodes.length > 0) {
      if (!hideTrigger) setIsExpanded(!isExpanded);
      return;
    }
    setIsExpanded(true);
    setIsLoading(true);
    try {
      const res = await api.generateButterfly({
        scenario_query: scenarioQuery,
        overall_score: overallScore,
        city: city || 'Hyderabad',
      });
      if (res.success && res.data) {
        setRawGraphData(res.data);
      }
    } catch (err) {
      console.error('Butterfly effect failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [nodes.length, isExpanded, hideTrigger, scenarioQuery, overallScore, city]);

  useEffect(() => {
    if (defaultExpanded && nodes.length === 0 && !isLoading && !rawGraphData) {
      handleGenerate();
    }
  }, [defaultExpanded, nodes.length, isLoading, rawGraphData, handleGenerate]);



  const initializeGraph = useCallback((rawNodes: any[], rawLinks: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const cx = W / 2;
    const cy = H / 2;

    // Position nodes in concentric rings by order
    const positioned: ButterflyNode[] = rawNodes.map((n: any, i: number) => {
      const order = n.order || 0;
      const sameOrder = rawNodes.filter((nn: any) => nn.order === order);
      const indexInOrder = sameOrder.indexOf(n);
      const totalInOrder = sameOrder.length;

      let radius: number;
      let angle: number;
      if (order === 0) {
        radius = 0;
        angle = 0;
      } else {
        radius = order * Math.min(W, H) * 0.17;
        angle = (indexInOrder / totalInOrder) * Math.PI * 2 - Math.PI / 2;
      }

      const targetX = cx + Math.cos(angle) * radius;
      const targetY = cy + Math.sin(angle) * radius;

      return {
        ...n,
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        targetX,
        targetY,
        opacity: 0,
        size: n.size || (order === 0 ? 28 : order === 1 ? 20 : order === 2 ? 16 : 12),
      };
    });

    const positionedLinks: ButterflyLink[] = rawLinks.map((l: any) => ({
      ...l,
      opacity: 0,
    }));

    nodesRef.current = positioned;
    linksRef.current = positionedLinks;
    setNodes(positioned);
    setLinks(positionedLinks);
    timeRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isLoading && isExpanded && rawGraphData && nodes.length === 0) {
      // Wait a tick for the canvas to be mounted in the DOM
      const timer = setTimeout(() => {
        initializeGraph(rawGraphData.nodes, rawGraphData.links);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isExpanded, rawGraphData, nodes.length, initializeGraph]);

  // Animation loop
  useEffect(() => {
    if (!isExpanded || nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    const W = rect?.width || 800;
    const H = rect?.height || 500;

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      ctx.clearRect(0, 0, W, H);

      const currentNodes = nodesRef.current;
      const currentLinks = linksRef.current;

      // Stagger reveal by order
      currentNodes.forEach(node => {
        const revealAt = node.order * 0.6;
        if (t > revealAt) {
          node.opacity = Math.min(1, node.opacity + 0.03);
          // Spring physics to target
          const dx = node.targetX - node.x;
          const dy = node.targetY - node.y;
          node.vx += dx * 0.04;
          node.vy += dy * 0.04;
          node.vx *= 0.88;
          node.vy *= 0.88;
          node.x += node.vx;
          node.y += node.vy;
        }
      });

      currentLinks.forEach(link => {
        const srcNode = currentNodes.find(n => n.id === link.source);
        const tgtNode = currentNodes.find(n => n.id === link.target);
        if (!srcNode || !tgtNode) return;
        link.opacity = Math.min(srcNode.opacity, tgtNode.opacity) * 0.7;
      });

      // Draw links
      currentLinks.forEach(link => {
        if (link.opacity <= 0) return;
        const src = currentNodes.find(n => n.id === link.source);
        const tgt = currentNodes.find(n => n.id === link.target);
        if (!src || !tgt) return;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(100, 150, 200, ${link.opacity * 0.4})`;
        ctx.lineWidth = 1.5;

        // Curved line
        const midX = (src.x + tgt.x) / 2 + (tgt.y - src.y) * 0.15;
        const midY = (src.y + tgt.y) / 2 - (tgt.x - src.x) * 0.15;
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(midX, midY, tgt.x, tgt.y);
        ctx.stroke();

        // Arrow
        const angle = Math.atan2(tgt.y - midY, tgt.x - midX);
        const arrowLen = 8;
        const ax = tgt.x - Math.cos(angle) * (tgt.size / 2 + 4);
        const ay = tgt.y - Math.sin(angle) * (tgt.size / 2 + 4);
        ctx.beginPath();
        ctx.fillStyle = `rgba(100, 150, 200, ${link.opacity * 0.6})`;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - arrowLen * Math.cos(angle - 0.4), ay - arrowLen * Math.sin(angle - 0.4));
        ctx.lineTo(ax - arrowLen * Math.cos(angle + 0.4), ay - arrowLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();

        // Edge label
        if (link.opacity > 0.3) {
          ctx.font = '9px Inter, sans-serif';
          ctx.fillStyle = `rgba(160, 170, 190, ${link.opacity * 0.8})`;
          ctx.textAlign = 'center';
          ctx.fillText(link.label, midX, midY - 4);
        }
      });

      // Draw nodes
      currentNodes.forEach(node => {
        if (node.opacity <= 0) return;

        const color = SENTIMENT_COLORS[node.sentiment] || SENTIMENT_COLORS.neutral;
        const ringColor = ORDER_COLORS[node.order] || ORDER_COLORS[3];
        const r = node.size / 2;
        const pulse = 1 + Math.sin(t * 2 + node.order) * 0.04;

        // Glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5 * pulse);
        gradient.addColorStop(0, `${color}${Math.round(node.opacity * 30).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 2.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15, 23, 42, ${node.opacity * 0.9})`;
        ctx.fill();
        ctx.strokeStyle = `${ringColor}${Math.round(node.opacity * 200).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sentiment indicator dot
        ctx.beginPath();
        ctx.arc(node.x + r * 0.6, node.y - r * 0.6, 3, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.round(node.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Label
        if (node.opacity > 0.3) {
          ctx.font = `${node.order === 0 ? 'bold 11px' : node.order === 1 ? '10px' : '9px'} Inter, sans-serif`;
          ctx.fillStyle = `rgba(226, 232, 240, ${node.opacity})`;
          ctx.textAlign = 'center';

          // Word wrap
          const maxWidth = node.order === 0 ? 120 : 90;
          const words = node.label.split(' ');
          let line = '';
          let lineY = node.y + r + 12;

          words.forEach(word => {
            const test = line + (line ? ' ' : '') + word;
            if (ctx.measureText(test).width > maxWidth && line) {
              ctx.fillText(line, node.x, lineY);
              line = word;
              lineY += 12;
            } else {
              line = test;
            }
          });
          if (line) ctx.fillText(line, node.x, lineY);
        }
      });

      // Order ring labels
      [1, 2, 3].forEach(order => {
        const radius = order * Math.min(W, H) * 0.17;
        const firstNode = currentNodes.find(n => n.order === order);
        if (!firstNode || firstNode.opacity < 0.3) return;

        ctx.beginPath();
        ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 116, 139, ${firstNode.opacity * 0.12})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        const labels = ['', '1st Order', '2nd Order', '3rd Order'];
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = `rgba(100, 116, 139, ${firstNode.opacity * 0.5})`;
        ctx.textAlign = 'left';
        ctx.fillText(labels[order], W / 2 + radius + 8, H / 2 - 4);
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isExpanded, nodes]);

  // Mouse hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const found = nodesRef.current.find(n => {
      const dx = n.x - mx;
      const dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) < n.size;
    });
    setHoveredNode(found || null);
  }, []);

  return (
    <div className="butterfly">
      {!hideTrigger && (
        <button
          className={`butterfly__trigger ${isExpanded ? 'butterfly__trigger--active' : ''}`}
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <span className="butterfly__trigger-icon">🦋</span>
          <div className="butterfly__trigger-text">
            <span className="butterfly__trigger-title">
              {isLoading ? 'Tracing consequences...' : 'Butterfly Effect'}
            </span>
            <span className="butterfly__trigger-desc">
              See unintended 2nd & 3rd order consequences
            </span>
          </div>
          <span className="butterfly__trigger-arrow">{isExpanded ? '▼' : '▶'}</span>
        </button>
      )}

      {isExpanded && (
        <div className="butterfly__canvas-container">
          {isLoading ? (
            <div className="butterfly__loading">
              <div className="butterfly__loading-ripple">
                <div /><div /><div />
              </div>
              <p>Tracing domino effects across financial, social, and environmental dimensions...</p>
            </div>
          ) : (
            <>
              <div className="butterfly__legend">
                <span className="butterfly__legend-item">
                  <span className="butterfly__legend-dot" style={{ background: '#10b981' }} /> Positive
                </span>
                <span className="butterfly__legend-item">
                  <span className="butterfly__legend-dot" style={{ background: '#ef4444' }} /> Negative
                </span>
                <span className="butterfly__legend-item">
                  <span className="butterfly__legend-dot" style={{ background: ORDER_COLORS[1] }} /> 1st Order
                </span>
                <span className="butterfly__legend-item">
                  <span className="butterfly__legend-dot" style={{ background: ORDER_COLORS[2] }} /> 2nd Order
                </span>
                <span className="butterfly__legend-item">
                  <span className="butterfly__legend-dot" style={{ background: ORDER_COLORS[3] }} /> 3rd Order
                </span>
              </div>
              <canvas
                ref={canvasRef}
                className="butterfly__canvas"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredNode(null)}
              />
              {hoveredNode && (
                <div
                  className="butterfly__tooltip"
                  style={{
                    left: hoveredNode.x,
                    top: hoveredNode.y - hoveredNode.size - 10,
                    borderColor: SENTIMENT_COLORS[hoveredNode.sentiment],
                  }}
                >
                  <div className="butterfly__tooltip-label">{hoveredNode.label}</div>
                  <div className="butterfly__tooltip-meta">
                    {hoveredNode.order === 0 ? 'Root scenario' : `Order ${hoveredNode.order} consequence`}
                    {' · '}
                    <span style={{ color: SENTIMENT_COLORS[hoveredNode.sentiment] }}>
                      {hoveredNode.sentiment}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
