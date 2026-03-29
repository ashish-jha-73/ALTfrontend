import { useEffect, useState } from 'react';
import MCQComponent from './questions/MCQComponent';
import FillBlankComponent from './questions/FillBlankComponent';
import DragDropComponent from './questions/DragDropComponent';
import DragSortComponent from './questions/DragSortComponent';
import MatchComponent from './questions/MatchComponent';
import StepScaffoldComponent from './questions/StepScaffoldComponent';
import HintPanel from './HintPanel';
import ConfidenceIndicator from './ConfidenceIndicator';

const confidenceLevels = ['low', 'medium', 'high'];

export default function QuestionScreen({
  payload,
  onSubmit,
  loading,
  initialAttempts,
  feedback,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [confidence, setConfidence] = useState('medium');
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [revealedHints, setRevealedHints] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [dragCorrect, setDragCorrect] = useState(null);

  const question = payload?.question;
  const adaptiveContext = payload?.adaptive_context;

  useEffect(() => {
    setSelectedAnswer('');
    setAttemptsCount(initialAttempts || 1);
    setConfidence('medium');
    setRevealedHints(0);
    setSecondsElapsed(0);
    setSubmitted(false);
  }, [question?.id, initialAttempts]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [question?.id]);

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit({
      selected_answer: selectedAnswer,
      confidence,
      attempts: attemptsCount,
      used_hints: revealedHints,
      time_taken: Math.max(1, secondsElapsed),
      skipped: false,
    });
  };

  const handleSkip = () => {
    setSubmitted(true);
    onSubmit({
      selected_answer: '__SKIPPED__',
      confidence,
      attempts: attemptsCount,
      used_hints: revealedHints,
      time_taken: Math.max(1, secondsElapsed),
      skipped: true,
    });
  };

  if (!question) {
    return (
      <div className="question-screen">
        <div className="question-screen__loading">
          <div className="spinner" />
          <p>Loading challenge...</p>
        </div>
      </div>
    );
  }

  const timePercent = question.time_expected > 0
    ? Math.min(100, (secondsElapsed / question.time_expected) * 100)
    : 0;
  const isOverTime = secondsElapsed > question.time_expected;

  const renderQuestionType = () => {
    switch (question.question_type) {
      case 'fill_blank':
      case 'fill_in_the_blank':
        return (
          <FillBlankComponent
            questionText={question.question_text}
            answer={selectedAnswer}
            onChange={(formatted) => {
              setSelectedAnswer(formatted);
              if (formatted === null || formatted === undefined || formatted === '') {
                setDragCorrect(null);
                return;
              }
              const toStr = (v) => (typeof v === 'string' ? v : (v == null ? '' : JSON.stringify(v)));
              const norm = (s) => toStr(s).replace(/\s+/g, '').toLowerCase();
              const expectedRaw = question.correct_answer || '';
              setDragCorrect(norm(formatted) === norm(expectedRaw));
            }}
            disabled={loading || submitted}
          />
        );
      case 'drag_sort':
        return (
          <>
            <DragSortComponent
              items={question.options || []}
              onChange={(formatted, arr) => {
                setSelectedAnswer(formatted);
                const expectedRaw = question.correct_answer || '';
                const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase();
                setDragCorrect(norm(formatted) === norm(expectedRaw));
              }}
              disabled={loading || submitted}
            />
            {dragCorrect === true && <div className="question-screen__inline-correct">Correct!</div>}
            {dragCorrect === false && <div className="question-screen__inline-incorrect">Not correct</div>}
          </>
        );
      case 'match':
        return (
          <MatchComponent
            leftItems={question.left_items || question.options?.slice(0, Math.ceil(question.options.length / 2)) || []}
            rightItems={question.right_items || question.options?.slice(Math.ceil(question.options.length / 2)) || []}
            onResult={(result) => setSelectedAnswer(JSON.stringify(result))}
            disabled={loading || submitted}
          />
        );
      case 'step':
        return (
          <StepScaffoldComponent
            steps={question.steps || question.hints?.map((h) => ({ instruction: h })) || []}
            onComplete={(answers) => setSelectedAnswer(JSON.stringify(answers))}
            disabled={loading || submitted}
          />
        );
      default:
        return (
          <MCQComponent
            options={question.options || []}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            disabled={loading || submitted}
          />
        );
    }
  };

  return (
    <div className="question-screen anim-fade-in">
      {/* Concept Intro Card */}
      <div className="question-screen__intro-card">
        <div className="question-screen__intro-left">
          <h2 className="question-screen__concept-title">
            {(question.concept || '').replace(/_/g, ' ')}
          </h2>
          <div className="question-screen__meta-pills">
            <span className="pill pill--level">Level {question.level}</span>
            <span className={`pill pill--difficulty pill--${question.difficulty}`}>
              {question.difficulty}
            </span>
            <span className="pill pill--type">{(question.question_type || 'mcq').replace(/_/g, ' ')}</span>
          </div>
        </div>
        <div className="question-screen__timer-wrap">
          <div className="question-screen__timer-ring">
            <svg viewBox="0 0 36 36" className="question-screen__timer-svg">
              <path
                className="question-screen__timer-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="question-screen__timer-fill"
                strokeDasharray={`${timePercent}, 100`}
                style={{ stroke: isOverTime ? 'var(--clr-error)' : 'var(--clr-primary)' }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={`question-screen__timer-text ${isOverTime ? 'question-screen__timer-text--over' : ''}`}>
              {secondsElapsed}s
            </span>
          </div>
        </div>
      </div>

      {/* Adaptive Guidance */}
      {adaptiveContext?.guidance && (
        <div className="question-screen__guidance">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--clr-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{adaptiveContext.guidance}</span>
        </div>
      )}

      {/* Remedial Banner */}
      {adaptiveContext?.remedial && (
        <div className="question-screen__remedial-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <div>
            <strong>Remedial Mode</strong>
            <span>Simplified questions to help you build confidence</span>
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="question-screen__question-card">
        <p className="question-screen__question-text">{question.question_text}</p>
      </div>

      {/* Question Type Component */}
      <div className="question-screen__answer-area">
        {renderQuestionType()}
      </div>

      {/* Confidence Selector */}
      <div className="question-screen__confidence-row">
        <span className="question-screen__confidence-label">How confident are you?</span>
        <div className="question-screen__confidence-btns">
          {confidenceLevels.map((level) => (
            <button
              key={level}
              type="button"
              className={`confidence-btn ${confidence === level ? `confidence-btn--${level}` : ''}`}
              onClick={() => setConfidence(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Hints */}
      <HintPanel
        hints={question.hints || []}
        revealedCount={revealedHints}
        onReveal={() => setRevealedHints((n) => Math.min(n + 1, (question.hints || []).length))}
      />

      {/* Inline Feedback (after submission) */}
      {feedback && submitted && (
        <div className={`question-screen__feedback anim-fade-in ${feedback.correctness ? 'question-screen__feedback--correct' : 'question-screen__feedback--incorrect'}`}>
          <div className="question-screen__feedback-header">
            {feedback.correctness ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--clr-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--clr-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            <h3>{feedback.correctness ? 'Correct!' : 'Not Quite Right'}</h3>
            {feedback.xp_earned > 0 && (
              <span className="question-screen__feedback-xp">+{feedback.xp_earned} XP</span>
            )}
          </div>

          {feedback.explanation && (
            <p className="question-screen__feedback-explanation">{feedback.explanation}</p>
          )}

          {feedback.detected_error_type && feedback.detected_error_type !== 'none' && (
            <p className="question-screen__feedback-error">
              Detected: {feedback.detected_error_type.replace(/_/g, ' ')}
            </p>
          )}

          {feedback.meta_feedback?.length > 0 && (
            <div className="question-screen__meta-feedback">
              <strong>Insights:</strong>
              <ul>
                {feedback.meta_feedback.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.confidence_calibration && (
            <p className="question-screen__feedback-calibration">{feedback.confidence_calibration}</p>
          )}

          <ConfidenceIndicator
            selfReported={feedback.inferred_confidence?.self_reported || confidence}
            inferred={feedback.inferred_confidence?.label || feedback.inferred_confidence}
            alignment={feedback.confidence_alignment}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="question-screen__actions">
        <button
          type="button"
          className="btn-primary"
          disabled={loading || !selectedAnswer || submitted}
          onClick={handleSubmit}
        >
          {loading ? <span className="spinner spinner--sm" /> : null}
          {loading ? 'Checking...' : 'Submit Answer'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          disabled={loading || submitted}
          onClick={handleSkip}
        >
          Skip Question
        </button>
      </div>
    </div>
  );
}
