import { useState, useEffect, useRef } from 'react';
import './ScenarioInput.css';

const EXAMPLES = [
  'What if Hyderabad banned petrol bikes by 2030?',
  'What if all auto-rickshaws in Hyderabad became electric?',
  'What if Hyderabad doubled its metro network by 2028?',
  'What if EV charging stations tripled in Hyderabad next year?',
  'What if Hyderabad imposed congestion pricing in the city center?',
];

const PLACEHOLDER_TEXTS = [
  'What if Hyderabad banned petrol bikes by 2030?',
  'What if every school switched to electric buses?',
  'What if the city doubled its metro coverage?',
  'Describe any scenario and explore its impact…',
];

interface ScenarioInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export default function ScenarioInput({ onSubmit, isLoading }: ScenarioInputProps) {
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typewriter placeholder effect
  useEffect(() => {
    const targetText = PLACEHOLDER_TEXTS[placeholderIndex];
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
  }, [placeholderIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 10 && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className="scenario-input container">
      <div className="scenario-input__hero">
        <div className="scenario-input__badge">
          <span className="scenario-input__badge-dot" />
          Powered by AI + Real Data
        </div>
        <h1 className="scenario-input__title">
          Explore the <span className="gradient-text">Future</span> Before It Happens
        </h1>
        <p className="scenario-input__subtitle">
          Describe any "what if" scenario and our AI will simulate its impact across
          financial, environmental, human, risk, and opportunity dimensions.
        </p>
      </div>

      <form className="scenario-input__form" onSubmit={handleSubmit}>
        <div className="scenario-input__input-wrapper">
          <textarea
            ref={textareaRef}
            id="scenario-query-input"
            className="scenario-input__textarea"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayedPlaceholder}
            maxLength={1000}
            disabled={isLoading}
          />
          <div className="scenario-input__actions">
            <span className="scenario-input__char-count">
              {query.length}/1000
            </span>
            <button
              type="submit"
              className="scenario-input__submit"
              disabled={query.trim().length < 10 || isLoading}
              id="simulate-button"
            >
              {isLoading ? (
                <>⏳ Simulating…</>
              ) : (
                <>🔮 Simulate Future</>
              )}
            </button>
          </div>
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
