import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  currentView: 'home' | 'history' | 'compare' | 'compare_dashboard' | 'dashboard' | 'loading' | 'knowledge_graph' | 'battle' | 'leaderboard' | 'delay_risk' | 'bookmarks' | 'butterfly';
  onViewChange: (view: 'home' | 'history' | 'compare' | 'knowledge_graph' | 'battle' | 'leaderboard' | 'delay_risk' | 'bookmarks' | 'butterfly') => void;
  historyCount: number;
  isOpen?: boolean;
}

export default function Sidebar({ currentView, onViewChange, historyCount, isOpen = true }: SidebarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar glass ${!isOpen ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand" onClick={() => onViewChange('home')}>
        <div className="sidebar__logo">🔮</div>
        <div>
          <div className="sidebar__title gradient-text">{t('nav.foresight', 'Foresight')}</div>
          <div className="sidebar__subtitle">{t('nav.aiDecisionEngine', 'AI Decision Engine')}</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-title">{t('nav.menu', 'Menu')}</div>
        
        <button
          className={`sidebar__btn ${currentView === 'home' || currentView === 'loading' || currentView === 'dashboard' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('home')}
        >
          <span className="sidebar__btn-icon">⚡</span>
          <span>{t('nav.simulate', 'Simulate')}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'compare' || currentView === 'compare_dashboard' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('compare')}
        >
          <span className="sidebar__btn-icon">⚖️</span>
          <span>{t('nav.compare', 'Compare')}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'battle' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('battle')}
          style={currentView !== 'battle' ? { background: 'linear-gradient(90deg, rgba(239,68,68,0.05), transparent)' } : { background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(124,58,237,0.2))', borderColor: 'rgba(239,68,68,0.4)' }}
        >
          <span className="sidebar__btn-icon">⚔️</span>
          <span style={{ fontWeight: 700, color: '#f87171' }}>{t('nav.battle', 'Battle Mode')}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'leaderboard' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('leaderboard')}
        >
          <span className="sidebar__btn-icon">🏆</span>
          <span style={{ fontWeight: 500, color: '#fbbf24' }}>{t('nav.leaderboard', 'Leaderboard')}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'butterfly' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('butterfly')}
          style={currentView !== 'butterfly' ? { background: 'linear-gradient(90deg, rgba(124,58,237,0.05), transparent)' } : { background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))', borderColor: 'rgba(124,58,237,0.4)' }}
        >
          <span className="sidebar__btn-icon">🦋</span>
          <span style={{ fontWeight: 600, background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('nav.butterfly', 'Butterfly Effect')}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'delay_risk' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('delay_risk')}
        >
          <span className="sidebar__btn-icon">⏳</span>
          <span style={{ fontWeight: 500, color: '#a78bfa' }}>{t('nav.delayRisk', 'Delay Risk')}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'bookmarks' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('bookmarks')}
        >
          <span className="sidebar__btn-icon">⭐</span>
          <span style={{ fontWeight: 500, color: '#fbbf24' }}>{t('nav.saved', 'Saved')}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'history' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('history')}
        >
          <span className="sidebar__btn-icon">📋</span>
          <span>{t('nav.history', 'History')} {historyCount > 0 && <span className="sidebar__badge">{historyCount}</span>}</span>
        </button>

        <button
          className={`sidebar__btn ${currentView === 'knowledge_graph' ? 'sidebar__btn--active' : ''}`}
          onClick={() => onViewChange('knowledge_graph')}
        >
          <span className="sidebar__btn-icon">🕸️</span>
          <span>{t('nav.graph', 'Knowledge Graph')}</span>
        </button>
      </nav>
      
      <div className="sidebar__footer">
        <div className="sidebar__profile">
          <div className="sidebar__profile-info">
            <div className="sidebar__profile-icon">
              {user?.name?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div>
              <div className="sidebar__profile-name">{user?.name || 'User'}</div>
              <div className="sidebar__profile-email">{user?.email || ''}</div>
            </div>
          </div>
          <button className="sidebar__auth-btn sidebar__auth-btn--logout" onClick={logout}>
            {t('auth.signOut', 'Sign Out')}
          </button>
        </div>
        
        <div className="sidebar__status" style={{ marginTop: '1rem' }}>
          <span className="sidebar__status-dot" />
          {t('nav.aiReady', 'AI Ready')}
        </div>
      </div>
    </aside>
  );
}
