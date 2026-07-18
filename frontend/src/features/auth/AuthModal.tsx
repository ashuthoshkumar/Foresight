import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { api } from '../../api/client';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { t } = useTranslation();
  const { login } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await api.register({ email, password, name });
        if (res.success) {
          setSuccessMsg(t('auth.registerSuccess'));
          login(res.token, res.user);
          setTimeout(() => onClose(), 1500);
        }
      } else {
        const res = await api.login({ email, password });
        if (res.success) {
          setSuccessMsg(t('auth.welcomeBack', { name: res.user.name }));
          login(res.token, res.user);
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal glass" onClick={e => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}>&times;</button>
        
        <div className="auth-modal__header">
          <div className="auth-modal__logo">🔮</div>
          <h2>{mode === 'login' ? t('auth.login') : t('auth.register')}</h2>
        </div>

        <div className="auth-modal__tabs">
          <button 
            className={`auth-modal__tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            {t('auth.login')}
          </button>
          <button 
            className={`auth-modal__tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            {t('auth.register')}
          </button>
        </div>

        {error && <div className="auth-modal__error animate-fade-in">{error}</div>}
        {successMsg && <div className="auth-modal__success animate-fade-in">{successMsg}</div>}

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-modal__field animate-fade-in">
              <label>{t('auth.name')}</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={isLoading || !!successMsg}
              />
            </div>
          )}
          
          <div className="auth-modal__field animate-fade-in">
            <label>{t('auth.email')}</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading || !!successMsg}
            />
          </div>

          <div className="auth-modal__field animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <label>{t('auth.password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading || !!successMsg}
            />
          </div>

          <button 
            type="submit" 
            className="auth-modal__submit animate-fade-in"
            style={{ animationDelay: '0.2s' }}
            disabled={isLoading || !!successMsg}
          >
            {isLoading 
              ? (mode === 'login' ? t('auth.signingIn') : t('auth.creatingAccount')) 
              : (mode === 'login' ? t('auth.signIn') : t('auth.register'))}
          </button>
        </form>

        <div className="auth-modal__footer">
          {mode === 'login' ? (
            <span>{t('auth.dontHaveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>{t('auth.register')} →</a></span>
          ) : (
            <span>{t('auth.alreadyHaveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>{t('auth.login')} →</a></span>
          )}
        </div>
      </div>
    </div>
  );
}
