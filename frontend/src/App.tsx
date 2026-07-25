import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedBackground from './features/shared/AnimatedBackground';
import Navbar from './features/shared/Navbar';
import Sidebar from './features/shared/Sidebar';
import LoadingState from './features/shared/LoadingState';
import ScenarioInput from './features/scenario/ScenarioInput';
import Dashboard from './features/dashboard/Dashboard';
import CompareDashboard from './features/dashboard/CompareDashboard';
import History from './features/history/History';
import { api } from './api/client';
import type { SimulationResult } from './features/scenario/types';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import AuthModal from './features/auth/AuthModal';
import LandingPage from './features/landing/LandingPage';
import KnowledgeGraph from './features/graph/KnowledgeGraph';
import BattleMode from './features/battle/BattleMode';
import Leaderboard from './features/community/Leaderboard';
import DelayRiskPage from './features/delayrisk/DelayRiskPage';
import Bookmarks from './features/bookmarks/Bookmarks';
import ButterflyEffect from './features/dashboard/ButterflyEffect';
import GoalRoadmap from './features/scenario/GoalRoadmap';
import { useVoiceInput } from './hooks/useVoiceInput';

type View = 'home' | 'history' | 'dashboard' | 'loading' | 'compare_dashboard' | 'compare' | 'knowledge_graph' | 'battle' | 'leaderboard' | 'delay_risk' | 'bookmarks' | 'butterfly' | 'goal_roadmap';

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<[SimulationResult, SimulationResult] | null>(null);
  const [goalRoadmapData, setGoalRoadmapData] = useState<any>(null);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [butterflyStandaloneQuery, setButterflyStandaloneQuery] = useState('');
  const [butterflyStandaloneCity, setButterflyStandaloneCity] = useState('Hyderabad');
  const [butterflyStandaloneSubmit, setButterflyStandaloneSubmit] = useState(false);
  const { i18n } = useTranslation();

  const voiceButterfly = useVoiceInput((text) => setButterflyStandaloneQuery(prev => prev.trim() ? prev + ' ' + text : text));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.getHistory();
        if (response.scenarios) {
          setHistory(response.scenarios);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      }
    };
    fetchHistory();
  }, []);

  // Parse shared result from URL query param (?s=<shortId>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('s');
    if (shareId) {
      api.getShare(shareId)
        .then(response => {
          if (response.success && response.result) {
            setCurrentResult(response.result);
            setView('dashboard');
            setIsSidebarOpen(false);
            // Clean the URL without reloading
            window.history.replaceState(null, '', window.location.pathname);
          }
        })
        .catch(err => console.warn('Could not load shared result:', err));
    }
  }, []);

  const handleSimulate = useCallback(async (query: string) => {
    setView('loading');
    setError(null);
    setIsSidebarOpen(false);

    try {
      const response = await api.simulate({ query, language: i18n.language });
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
      setIsSidebarOpen(true);
    }
  }, [i18n.language]);

  const handleGoalSeek = useCallback(async (goal: string, city: string, timeline: string) => {
    setView('loading');
    setError(null);
    setIsSidebarOpen(false);

    try {
      const response = await api.goalSeek({ goal, city, timeline });
      if (response && response.roadmap) {
        setGoalRoadmapData(response.roadmap);
        setView('goal_roadmap');
      } else {
        throw new Error('Goal seek failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setView('home');
      setIsSidebarOpen(true);
    }
  }, []);

  const handleCompare = useCallback(async (queryA: string, queryB: string) => {
    setView('loading');
    setError(null);
    setIsSidebarOpen(false);

    try {
      const [resA, resB] = await Promise.all([
        api.simulate({ query: queryA, language: i18n.language }),
        api.simulate({ query: queryB, language: i18n.language })
      ]);

      if (resA.success && resA.result && resB.success && resB.result) {
        setComparisonResults([resA.result, resB.result]);
        setHistory(prev => [resB.result, resA.result, ...prev]);
        setView('compare_dashboard');
      } else {
        throw new Error(resA.message || resB.message || 'Comparison simulation failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during comparison';
      setError(message);
      setView('home');
      setIsSidebarOpen(true);
    }
  }, [i18n.language]);

  const handleBack = useCallback(() => {
    setView('home');
    setCurrentResult(null);
    setComparisonResults(null);
    setError(null);
    setIsSidebarOpen(true);
  }, []);

  const handleSelectHistory = useCallback((result: SimulationResult) => {
    setCurrentResult(result);
    setView('dashboard');
    setIsSidebarOpen(false);
  }, []);

  const handleViewChange = useCallback((v: View) => {
    setView(v);
    if (v === 'home' || v === 'compare' || v === 'battle') {
      setCurrentResult(null);
      setComparisonResults(null);
      setError(null);
    }
    // Only close if it's not home, compare, battle, knowledge_graph, or leaderboard
    if (v !== 'home' && v !== 'history' && v !== 'compare' && v !== 'knowledge_graph' && v !== 'battle' && v !== 'leaderboard' && v !== 'delay_risk' && v !== 'bookmarks') {
        setIsSidebarOpen(false);
    } else {
        setIsSidebarOpen(true);
    }
  }, []);

  return (
    <>
      <Sidebar 
        currentView={view} 
        onViewChange={handleViewChange} 
        historyCount={history.length} 
        isOpen={isSidebarOpen}
      />

      <div className="app-content">
        <Navbar 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        <main style={{ flex: 1, position: 'relative', zIndex: 1, padding: '2rem 0' }}>
          {error && (
            <div style={{
              maxWidth: '600px',
              margin: '0 auto 1rem',
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

          {(view === 'home' || view === 'compare') && (
            <ScenarioInput key={view} onSubmit={handleSimulate} onCompare={handleCompare} onGoalSeek={handleGoalSeek} isLoading={false} initialCompareMode={view === 'compare'} />
          )}

          {view === 'loading' && <LoadingState />}

          {view === 'goal_roadmap' && goalRoadmapData && (
            <GoalRoadmap roadmap={goalRoadmapData} onBack={handleBack} />
          )}

          {view === 'dashboard' && currentResult && (
            <Dashboard result={currentResult} onBack={handleBack} />
          )}

          {view === 'compare_dashboard' && comparisonResults && (
            <CompareDashboard resultA={comparisonResults[0]} resultB={comparisonResults[1]} onBack={handleBack} />
          )}

          {view === 'history' && (
            <History scenarios={history} onSelect={handleSelectHistory} />
          )}

          {view === 'knowledge_graph' && (
            <KnowledgeGraph />
          )}

          {view === 'battle' && (
            <BattleMode onBack={handleBack} />
          )}

          {view === 'leaderboard' && (
            <Leaderboard onRun={handleSimulate} />
          )}

          {view === 'delay_risk' && (
            <DelayRiskPage />
          )}

          {view === 'bookmarks' && (
            <Bookmarks onViewScenario={(result) => {
              setCurrentResult(result);
              setView('dashboard');
              setIsSidebarOpen(false);
            }} />
          )}

          {view === 'butterfly' && (
            <div className="container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🦋 Butterfly Effect</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Trace the unintended 2nd and 3rd order consequences of your simulated scenarios across financial, social, and environmental dimensions.
                </p>
              </div>
              
              {!butterflyStandaloneSubmit && !currentResult ? (
                <div className="glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Generate a Causal Chain</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        style={{ width: '100%', padding: '1rem', paddingRight: '3rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                        placeholder="e.g. What if petrol bikes are banned by 2030?" 
                        value={butterflyStandaloneQuery}
                        onChange={(e) => setButterflyStandaloneQuery(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={voiceButterfly.toggleListening}
                        style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: voiceButterfly.isListening ? 1 : 0.6, transition: '0.2s' }}
                      >
                        {voiceButterfly.isListening ? '🛑' : '🎙️'}
                      </button>
                    </div>
                    <select 
                      style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minWidth: '150px', outline: 'none' }}
                      value={butterflyStandaloneCity}
                      onChange={(e) => setButterflyStandaloneCity(e.target.value)}
                    >
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Mumbai">Mumbai</option>
                    </select>
                  </div>
                  <button 
                    style={{
                      padding: '1rem 2rem',
                      borderRadius: '12px',
                      background: !butterflyStandaloneQuery.trim() ? 'rgba(255,255,255,0.05)' : 'var(--accent-primary)',
                      color: !butterflyStandaloneQuery.trim() ? 'rgba(255,255,255,0.3)' : 'white',
                      fontWeight: 600,
                      border: 'none',
                      cursor: !butterflyStandaloneQuery.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: !butterflyStandaloneQuery.trim() ? 'none' : '0 4px 15px rgba(6, 182, 212, 0.3)'
                    }}
                    disabled={!butterflyStandaloneQuery.trim()}
                    onClick={() => setButterflyStandaloneSubmit(true)}
                  >
                    Simulate Feature
                  </button>
                </div>
              ) : null}
              
              {(currentResult || butterflyStandaloneSubmit) && (
                <div className="glass" style={{ padding: '2rem', borderRadius: '16px', position: 'relative', marginTop: currentResult ? '0' : '2rem' }}>
                  {butterflyStandaloneSubmit && !currentResult && (
                    <button 
                      onClick={() => { setButterflyStandaloneSubmit(false); setButterflyStandaloneQuery(''); }} 
                      style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', zIndex: 10 }}
                    >
                      ✕ Reset
                    </button>
                  )}
                  <ButterflyEffect
                    scenarioQuery={currentResult ? currentResult.query : butterflyStandaloneQuery}
                    overallScore={currentResult ? currentResult.overall_score : 50}
                    city={currentResult ? currentResult.city : butterflyStandaloneCity}
                    defaultExpanded={true}
                    hideTrigger={true}
                  />
                </div>
              )}
            </div>
          )}
        </main>

        <footer style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: 'var(--text-tertiary)',
          fontSize: '0.78rem',
          borderTop: '1px solid var(--border-subtle)',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ opacity: 0.6 }}>
            Foresight AI Decision Engine — Powered by Gemini + Knowledge Graph
          </span>
        </footer>
      </div>
    </>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authModalState, setAuthModalState] = useState<{isOpen: boolean; mode: 'login' | 'register'}>({
    isOpen: false,
    mode: 'login'
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <AnimatedBackground />
      {!isAuthenticated ? (
        <LandingPage onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })} />
      ) : (
        <AppContent />
      )}
      
      <AuthModal 
        isOpen={authModalState.isOpen} 
        onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))} 
        initialMode={authModalState.mode}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
