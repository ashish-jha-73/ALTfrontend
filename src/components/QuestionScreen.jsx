import { useEffect, useMemo, useState } from 'react';

const confidenceLevels = ['low', 'medium', 'high'];

export default function QuestionScreen({
  payload,
  onSubmit,
  loading,
  initialAttempts,
  onBackToMap,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [confidence, setConfidence] = useState('medium');
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [revealedHints, setRevealedHints] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const question = payload?.question;

  useEffect(() => {
    setSelectedAnswer('');
    setAttemptsCount(initialAttempts || 1);
    setConfidence('medium');
    setRevealedHints(0);
    setSecondsElapsed(0);
  }, [question?.id, initialAttempts]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [question?.id]);

  const visibleHints = useMemo(() => {
    if (!question?.hints?.length) return [];
    return question.hints.slice(0, revealedHints);
  }, [question, revealedHints]);

  if (!question) {
    return (
      <section className="panel question-panel">
        <h2>Question Arena</h2>
        <p>Loading challenge...</p>
      </section>
    );
  }

  return (
    <section className="panel question-panel">
      <div className="question-header">
        <h2>Question Arena</h2>
        <button type="button" className="btn" onClick={onBackToMap}>View Map</button>
      </div>

      <div className="pill-row">
        <span className="pill">Concept: {question.concept}</span>
        <span className="pill">Level {question.level}</span>
        <span className="pill">Type: {question.question_type}</span>
        <span className="pill">Difficulty: {question.difficulty}</span>
      </div>

      <p className="timer">Timer: {secondsElapsed}s / Expected {question.time_expected}s</p>
      <p className="question-text">{question.question_text}</p>

      <div className="options">
        {question.options.map((option) => (
          <label key={option} className="option-card">
            <input
              type="radio"
              name="answer"
              value={option}
              checked={selectedAnswer === option}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>

      <div className="control-grid">
        <div>
          <p className="label">Attempts Used</p>
          <p><strong>{attemptsCount}</strong></p>
        </div>

        <div>
          <p className="label">Self Reported Confidence</p>
          <div className="button-group">
            {confidenceLevels.map((level) => (
              <button
                key={level}
                type="button"
                className={confidence === level ? 'btn active' : 'btn'}
                onClick={() => setConfidence(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hints-box">
        <p className="label">Hints</p>
        {!visibleHints.length && <p className="subtext">No hints used yet.</p>}
        {visibleHints.map((hint, idx) => (
          <p key={hint}>{idx + 1}. {hint}</p>
        ))}
        <button
          type="button"
          className="btn secondary"
          onClick={() => setRevealedHints((n) => Math.min(n + 1, question.hints.length))}
          disabled={revealedHints >= question.hints.length}
        >
          Unlock Hint
        </button>
      </div>

      <button
        type="button"
        className="btn submit"
        disabled={loading || !selectedAnswer}
        onClick={() =>
          onSubmit({
            selected_answer: selectedAnswer,
            confidence,
            attempts: attemptsCount,
            used_hints: revealedHints,
            time_taken: Math.max(1, secondsElapsed),
            skipped: false,
          })
        }
      >
        {loading ? 'Submitting...' : 'Submit Challenge'}
      </button>

      <button
        type="button"
        className="btn skip"
        disabled={loading}
        onClick={() =>
          onSubmit({
            selected_answer: '__SKIPPED__',
            confidence,
            attempts: attemptsCount,
            used_hints: revealedHints,
            time_taken: Math.max(1, secondsElapsed),
            skipped: true,
          })
        }
      >
        Skip This Question
      </button>
    </section>
  );
}
