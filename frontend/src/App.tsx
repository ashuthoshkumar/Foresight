import { useState, useCallback } from 'react';
import AnimatedBackground from './features/shared/AnimatedBackground';
import Navbar from './features/shared/Navbar';
import LoadingState from './features/shared/LoadingState';
import ScenarioInput from './features/scenario/ScenarioInput';
import Dashboard from './features/dashboard/Dashboard';
import History from './features/history/History';
import { api } from './api/client';
import type { SimulationResult } from './features/scenario/types';

type View = 'home' | 'history' | 'dashboard' | 'loading';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = useCallback(async (query: string) => {
    setView('loading');
    setError(null);

    try {
      const response = await api.simulate({ query });
      if (response.success && response.result) {
        setCurrentResult(response.result);
        setHistory(prev => [response.result, ...prev]);
        setView('dashboard');
      } else {
        throw new Error(response.message || 'Simulation failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setView('home');
    }
  }, []);

  const handleBack = useCallback(() => {
    setView('home');
    setCurrentResult(null);
    setError(null);
  }, []);

  const handleSelectHistory = useCallback((result: SimulationResult) => {
    setCurrentResult(result);
    setView('dashboard');
  }, []);

  const handleViewChange = useCallback((v: 'home' | 'history') => {
    setView(v);
    if (v === 'home') {
      setCurrentResult(null);
      setError(null);
    }
  }, []);

  return (
    <>
      <AnimatedBackground />
      <Navbar
        currentView={view === 'history' ? 'history' : 'home'}
        onViewChange={handleViewChange}
        historyCount={history.length}
      />

      <main style={{ flex: 1 }}>
        {/* Error toast */}
        {error && (
          <div style={{
            maxWidth: '600px',
            margin: '1rem auto',
            padding: '12px 20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            color: '#ef4444',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {view === 'home' && (
          <ScenarioInput onSubmit={handleSimulate} isLoading={false} />
        )}

        {view === 'loading' && <LoadingState />}

        {view === 'dashboard' && currentResult && (
          <Dashboard result={currentResult} onBack={handleBack} />
        )}

        {view === 'history' && (
          <History scenarios={history} onSelect={handleSelectHistory} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        color: 'var(--text-tertiary)',
        fontSize: '0.78rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <span style={{ opacity: 0.6 }}>
          Foresight AI Decision Engine — Powered by Gemini + Knowledge Graph
        </span>
      </footer>
    </>
  );
}
