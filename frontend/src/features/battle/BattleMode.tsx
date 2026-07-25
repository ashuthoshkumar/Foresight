import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import type { SimulationResult, ImpactCategory } from '../scenario/types';
import { CATEGORY_META } from '../scenario/types';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import './BattleMode.css';

type BattlePhase = 'setup' | 'fighting' | 'result';

interface BattleModeProps {
  onBack: () => void;
}

export default function BattleMode({ onBack }: BattleModeProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<BattlePhase>('setup');
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  
  const [resultA, setResultA] = useState<SimulationResult | null>(null);
  const [resultB, setResultB] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fighting animation state
  const [fightStep, setFightStep] = useState(0);

  const voiceA = useVoiceInput((text) => setQueryA(prev => prev.trim() ? prev + ' ' + text : text));
  const voiceB = useVoiceInput((text) => setQueryB(prev => prev.trim() ? prev + ' ' + text : text));

  useEffect(() => {
    if (phase === 'fighting') {
      const steps = [
        { msg: 'Initializing Battle Arena...', time: 1000 },
        { msg: 'Simulating Scenario A Impacts...', time: 2000 },
        { msg: 'Simulating Scenario B Impacts...', time: 2000 },
        { msg: 'Calculating Score Differentials...', time: 1500 },
        { msg: 'Declaring Winner...', time: 1000 }
      ];
      
      let stepIdx = 0;
      const interval = setInterval(() => {
        stepIdx++;
        setFightStep(stepIdx);
        if (stepIdx >= steps.length) {
          clearInterval(interval);
        }
      }, 1500);
      
      return () => clearInterval(interval);
    }
  }, [phase]);

  const startBattle = async () => {
    if (!queryA.trim() || !queryB.trim()) return;
    
    setPhase('fighting');
    setFightStep(0);
    setError(null);

    try {
      const [resA, resB] = await Promise.all([
        api.simulate({ query: queryA, language: 'en' }), // Simplified for this context
        api.simulate({ query: queryB, language: 'en' })
      ]);

      if (resA.success && resA.result && resB.success && resB.result) {
        setResultA(resA.result);
        setResultB(resB.result);
        // Wait for animation to finish before showing result
        setTimeout(() => setPhase('result'), 6000); 
      } else {
        throw new Error(resA.message || resB.message || 'Battle failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Battle error');
      setPhase('setup');
    }
  };

  const getWinner = () => {
    if (!resultA || !resultB) return 'tie';
    if (resultA.overall_score > resultB.overall_score + 2) return 'A';
    if (resultB.overall_score > resultA.overall_score + 2) return 'B';
    return 'tie';
  };

  const renderSetup = () => (
    <div className="battle-setup container">
      <div className="battle-setup__header">
        <div className="battle-setup__badge">🔥 {t('battle.experimental', 'Experimental Mode')}</div>
        <h1 className="battle-setup__title">{t('battle.title', 'SCENARIO BATTLE')}</h1>
        <p className="battle-setup__subtitle">
          {t('battle.subtitle', 'Pit two competing scenarios against each other to see which one comes out on top across all impact axes.')}
        </p>
      </div>

      <div className="battle-setup__arena">
        <div className="battle-card battle-card--a">
          <div className="battle-card__label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('battle.fighterA', 'Fighter A')}</span>
            <button 
              type="button" 
              onClick={voiceA.toggleListening}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: voiceA.isListening ? 1 : 0.6, transition: '0.2s' }}
            >
              {voiceA.isListening ? '🛑' : '🎙️'}
            </button>
          </div>
          <textarea
            className="battle-card__textarea"
            placeholder={t('battle.placeholderA', 'e.g., What if we ban all private cars in the city center?')}
            value={queryA}
            onChange={e => setQueryA(e.target.value)}
          />
        </div>

        <div className="battle-setup__vs">
          <div className="battle-setup__vs-line" />
          <div className="battle-setup__vs-text">VS</div>
          <div className="battle-setup__vs-line" />
        </div>

        <div className="battle-card battle-card--b">
          <div className="battle-card__label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('battle.fighterB', 'Fighter B')}</span>
            <button 
              type="button" 
              onClick={voiceB.toggleListening}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: voiceB.isListening ? 1 : 0.6, transition: '0.2s' }}
            >
              {voiceB.isListening ? '🛑' : '🎙️'}
            </button>
          </div>
          <textarea
            className="battle-card__textarea"
            placeholder={t('battle.placeholderB', 'e.g., What if we make public transport entirely free?')}
            value={queryB}
            onChange={e => setQueryB(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="battle-setup__actions">
        <button className="battle-back-btn" onClick={onBack}>
          ← {t('battle.backToDashboard', 'Back to Dashboard')}
        </button>
        <button 
          className="battle-start-btn"
          onClick={startBattle}
          disabled={!queryA.trim() || !queryB.trim()}
        >
          {t('battle.fight', 'FIGHT! ⚔️')}
        </button>
      </div>
    </div>
  );

  const renderFighting = () => {
    const steps = [
      'Initializing Battle Arena...',
      'Simulating Scenario A...',
      'Simulating Scenario B...',
      'Calculating Score Differentials...',
      'Declaring Winner...'
    ];

    return (
      <div className="battle-loading">
        <div className="battle-loading__fighters">
          <div className="battle-loading__fighter battle-loading__fighter--a">
            <div className="battle-loading__fighter-orb">🛡️</div>
            <div className="battle-loading__fighter-name">{queryA.substring(0, 30)}...</div>
          </div>
          
          <div className="battle-loading__flash">⚔️</div>

          <div className="battle-loading__fighter battle-loading__fighter--b">
            <div className="battle-loading__fighter-orb">🔥</div>
            <div className="battle-loading__fighter-name">{queryB.substring(0, 30)}...</div>
          </div>
        </div>

        <div className="battle-loading__title">BATTLE IN PROGRESS</div>

        <div className="battle-loading__steps">
          {steps.map((step, idx) => (
            <div key={idx} className={`battle-loading__step ${
              fightStep > idx ? 'battle-loading__step--done' :
              fightStep === idx ? 'battle-loading__step--active' : ''
            }`}>
              <div className="battle-loading__step-dot" />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!resultA || !resultB) return null;
    const winner = getWinner();

    return (
      <div className="battle-result container">
        <div className="battle-result__top">
          <div className={`battle-winner-banner battle-winner-banner--${winner}`}>
            {winner !== 'tie' && <div className="battle-winner-banner__confetti" />}
            
            <div className="battle-winner-banner__crown">
              {winner === 'tie' ? '🤝' : '👑'}
            </div>
            
            <div className="battle-winner-banner__label">
              {winner === 'tie' ? 'IT IS A TIE!' : 'WINNER DECLARED'}
            </div>
            
            {winner !== 'tie' && (
              <div className="battle-winner-banner__name">
                {winner === 'A' ? 'FIGHTER A WINS' : 'FIGHTER B WINS'}
              </div>
            )}
            
            <div className="battle-winner-banner__margin">
              {winner !== 'tie' ? 
                `Won by ${Math.abs(Math.round(resultA.overall_score - resultB.overall_score))} points` : 
                'Scores are too close to call a clear winner'
              }
            </div>
          </div>
        </div>

        <div className="battle-scoreboard">
          <div className={`battle-score-panel battle-score-panel--a ${winner === 'A' ? 'battle-score-panel--winner' : ''}`}>
            <div className="battle-score-panel__label">Fighter A</div>
            <div className="battle-score-panel__query">"{resultA.query}"</div>
            <div className="battle-score-panel__score">{Math.round(resultA.overall_score)}</div>
            
            <div className="battle-score-panel__axes">
              {resultA.impacts.map(impact => (
                <div key={impact.category} className="battle-axis-row">
                  <span className="battle-axis-row__icon">{CATEGORY_META[impact.category].icon}</span>
                  <div className="battle-axis-row__bar-wrap">
                    <div 
                      className="battle-axis-row__bar" 
                      style={{ 
                        width: `${impact.score}%`,
                        background: CATEGORY_META[impact.category].gradient
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="battle-scoreboard__mid">
            <div className="battle-scoreboard__vs">VS</div>
          </div>

          <div className={`battle-score-panel battle-score-panel--b ${winner === 'B' ? 'battle-score-panel--winner' : ''}`}>
            <div className="battle-score-panel__label">Fighter B</div>
            <div className="battle-score-panel__query">"{resultB.query}"</div>
            <div className="battle-score-panel__score">{Math.round(resultB.overall_score)}</div>
            
            <div className="battle-score-panel__axes">
              {resultB.impacts.map(impact => (
                <div key={impact.category} className="battle-axis-row">
                  <span className="battle-axis-row__icon">{CATEGORY_META[impact.category].icon}</span>
                  <div className="battle-axis-row__bar-wrap">
                    <div 
                      className="battle-axis-row__bar" 
                      style={{ 
                        width: `${impact.score}%`,
                        background: CATEGORY_META[impact.category].gradient
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="battle-comparison">
          <div className="battle-comparison__header">
            <div className="battle-comparison__header-cell">Impact Axis</div>
            <div className="battle-comparison__header-cell battle-comparison__header-cell--a">A</div>
            <div className="battle-comparison__header-cell battle-comparison__header-cell--b">B</div>
          </div>
          
          {(['financial', 'environmental', 'human', 'risks', 'opportunities'] as ImpactCategory[]).map(cat => {
            const impA = resultA.impacts.find(i => i.category === cat)?.score || 0;
            const impB = resultB.impacts.find(i => i.category === cat)?.score || 0;
            const catWinner = impA > impB + 2 ? 'a' : impB > impA + 2 ? 'b' : 'tie';

            return (
              <div key={cat} className="battle-comparison__row">
                <div className="battle-comparison__category">
                  <div className="battle-comparison__category-icon" style={{ background: `${CATEGORY_META[cat].color}22` }}>
                    {CATEGORY_META[cat].icon}
                  </div>
                  <span className="battle-comparison__category-name">{CATEGORY_META[cat].label}</span>
                </div>
                
                <div className={`battle-comparison__score battle-comparison__score--a ${catWinner === 'a' ? 'battle-comparison__score--winner-a' : ''}`}>
                  {Math.round(impA)}
                  {catWinner === 'a' && <span className="battle-comparison__winner-dot battle-comparison__winner-dot--a" />}
                </div>
                
                <div className={`battle-comparison__score battle-comparison__score--b ${catWinner === 'b' ? 'battle-comparison__score--winner-b' : ''}`}>
                  {Math.round(impB)}
                  {catWinner === 'b' && <span className="battle-comparison__winner-dot battle-comparison__winner-dot--b" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="battle-result__actions">
          <button className="battle-back-btn" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <button className="battle-rematch-btn" onClick={() => setPhase('setup')}>
            🔄 Rematch
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="battle">
      {phase === 'setup' && renderSetup()}
      {phase === 'fighting' && renderFighting()}
      {phase === 'result' && renderResult()}
    </div>
  );
}
