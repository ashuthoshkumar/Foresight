import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import './ScenarioInput.css';

interface ScenarioInputProps {
  onSubmit: (query: string) => void;
  onCompare?: (queryA: string, queryB: string) => void;
  isLoading: boolean;
  initialCompareMode?: boolean;
}

export default function ScenarioInput({ onSubmit, onCompare, isLoading, initialCompareMode = false }: ScenarioInputProps) {
  const { t } = useTranslation();
  
  const EXAMPLES = useMemo(() => [
    t('home.examples.ex1'),
    t('home.examples.ex2'),
    t('home.examples.ex3'),
    t('home.examples.ex4'),
    t('home.examples.ex5'),
  ], [t]);

  const PLACEHOLDER_TEXTS = useMemo(() => [
    t('home.placeholders.p1'),
    t('home.placeholders.p2'),
    t('home.placeholders.p3'),
    t('home.placeholders.p4'),
  ], [t]);

  const [query, setQuery] = useState('');
  const [queryB, setQueryB] = useState('');
  const [isCompareMode, setIsCompareMode] = useState(initialCompareMode);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typewriter placeholder effect
  useEffect(() => {
    const targetText = PLACEHOLDER_TEXTS[placeholderIndex % PLACEHOLDER_TEXTS.length];
    let charIndex = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!isDeleting) {
        setDisplayedPlaceholder(targetText.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex === targetText.length) {
          timeout = setTimeout(() => { isDeleting = true; tick(); }, 2500);
          return;
        }
        timeout = setTimeout(tick, 40 + Math.random() * 30);
      } else {
        setDisplayedPlaceholder(targetText.slice(0, charIndex));
        charIndex--;
        if (charIndex < 0) {
          isDeleting = false;
          setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_TEXTS.length);
          return;
        }
        timeout = setTimeout(tick, 20);
      }
    };

    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, [placeholderIndex, PLACEHOLDER_TEXTS]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (isCompareMode && onCompare) {
      if (query.trim().length >= 10 && queryB.trim().length >= 10) {
        onCompare(query.trim(), queryB.trim());
      }
    } else {
      if (query.trim().length >= 10) {
        onSubmit(query.trim());
      }
    }
  };

  const handleExampleClick = (example: string) => {
    if (isCompareMode && query.trim().length > 0) {
      setQueryB(example);
    } else {
      setQuery(example);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const canSubmit = isCompareMode 
    ? query.trim().length >= 10 && queryB.trim().length >= 10
    : query.trim().length >= 10;

  return (
    <section className="scenario-input container">
      <div className="scenario-input__hero">
        <div className="scenario-input__badge">
          <span className="scenario-input__badge-dot" />
          {t('home.poweredBy')}
        </div>
        <h1 className="scenario-input__title">
          <Trans i18nKey="home.exploreFuture">
            Explore the <span className="gradient-text">Future</span> Before It Happens
          </Trans>
        </h1>
        <p className="scenario-input__subtitle">
          {t('home.subtitle')}
        </p>
      </div>



      <form className="scenario-input__form" onSubmit={handleSubmit}>
        <div className="scenario-input__input-wrapper" style={{ display: 'flex', flexDirection: isCompareMode ? 'row' : 'column', gap: '1rem', background: 'none', border: 'none', padding: 0 }}>
          <div className="scenario-input__textarea-container" style={{ flex: 1, position: 'relative', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden' }}>
            {isCompareMode && <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>Scenario A</div>}
            <textarea
              ref={textareaRef}
              id="scenario-query-input"
              className="scenario-input__textarea"
              style={{ border: 'none', background: 'transparent', paddingBottom: '1rem' }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isCompareMode ? "e.g., Offer 10% EV Subsidy" : displayedPlaceholder}
              maxLength={1000}
              disabled={isLoading}
            />
          </div>
          
          {isCompareMode && (
            <div className="scenario-input__textarea-container" style={{ flex: 1, position: 'relative', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>Scenario B</div>
              <textarea
                id="scenario-query-input-b"
                className="scenario-input__textarea"
                style={{ border: 'none', background: 'transparent', paddingBottom: '1rem' }}
                value={queryB}
                onChange={e => setQueryB(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Offer 30% EV Subsidy"
                maxLength={1000}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
        
        <div className="scenario-input__actions" style={{ marginTop: '1rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="scenario-input__char-count">
            {isCompareMode ? `${query.length} | ${queryB.length} / 1000` : `${query.length}/1000`}
          </span>
          <button
            type="submit"
            className="scenario-input__submit"
            disabled={!canSubmit || isLoading}
            id="simulate-button"
          >
            {isLoading ? (
              <>⏳ {t('home.simulating')}</>
            ) : isCompareMode ? (
              <>⚖️ Compare Scenarios</>
            ) : (
              <>🔮 {t('home.simulateFuture')}</>
            )}
          </button>
        </div>
      </form>

      <div className="scenario-input__examples">
        {EXAMPLES.map((example, i) => (
          <button
            key={i}
            className="scenario-input__example"
            onClick={() => handleExampleClick(example)}
            disabled={isLoading}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}
