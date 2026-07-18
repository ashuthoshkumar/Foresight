import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../../api/client';
import LoadingState from '../shared/LoadingState';
import './KnowledgeGraph.css';

interface Node {
  id: string;
  type: string;
  [key: string]: any;
}

interface Link {
  source: string;
  target: string;
  relationship: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function KnowledgeGraph() {
  const { t } = useTranslation();
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await api.getKnowledgeGraph();
        if (res.success && res.graph) {
          setData(res.graph);
        } else {
          setError("Failed to load graph data");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
      }
    };
    
    fetchGraph();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial size after mount
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNodeColor = useCallback((node: Node) => {
    switch(node.type) {
      case 'city': return '#3b82f6';
      case 'dataset': return '#10b981';
      case 'vehicle_category': return '#f59e0b';
      case 'monitoring_station': return '#8b5cf6';
      default: return '#6b7280';
    }
  }, []);

  if (error) return <div className="error-message">{error}</div>;
  if (!data) return <LoadingState />;

  return (
    <div className="knowledge-graph-container" ref={containerRef}>
      <div className="knowledge-graph-header">
        <h2>{t('graph.title', 'Foresight Knowledge Graph')}</h2>
        <p>{t('graph.subtitle', 'Interactive visualization of the data grounding AI decisions.')}</p>
      </div>
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeLabel={(node: any) => `${node.id} (${node.type})`}
        nodeColor={getNodeColor}
        nodeRelSize={6}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => {
          console.log(node);
        }}
      />
    </div>
  );
}
