import ProgressBar from '../ProgressBar';
import CognitiveLoadIndicator from '../CognitiveLoadIndicator';

export default function Header({
  progress,
  conceptMap,
  attemptsInSession = 0,
  sessionTarget = 10,
  screen,
  questionPayload,
}) {
  const xp = progress?.progress?.xp || conceptMap?.xp || 0;
  const totalScore = progress?.progress?.total_score || conceptMap?.total_score || 0;
  const loadScore = progress?.learner_model?.cognitive_state?.load_score || 0;

  const currentConcept = questionPayload?.question?.concept ||
    questionPayload?.lesson?.concept ||
    progress?.progress?.current_concept || '';

  const screenTitles = {
    map: 'Concept Map',
    question: 'Challenge Mode',
    feedback: 'Review',
    end: 'Session Summary',
  };

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">{screenTitles[screen] || 'Learning'}</h1>
        {currentConcept && screen !== 'map' && screen !== 'end' && (
          <span className="header__concept-pill">{currentConcept.replace(/_/g, ' ')}</span>
        )}
      </div>

      <div className="header__center">
        {screen === 'question' || screen === 'feedback' ? (
          <ProgressBar
            current={attemptsInSession}
            total={sessionTarget}
            label="Session"
          />
        ) : null}
      </div>

      <div className="header__right">
        <CognitiveLoadIndicator loadScore={loadScore} />

        <div className="header__stat-badge header__stat-badge--xp">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--clr-primary)" stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{xp}</span>
        </div>

        <div className="header__stat-badge header__stat-badge--score">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--clr-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{totalScore}</span>
        </div>
      </div>
    </header>
  );
}
