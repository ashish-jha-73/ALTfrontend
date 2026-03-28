import { useEffect, useState } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';
import ConceptMapView from './components/ConceptMapView';
import QuestionScreen from './components/QuestionScreen';
import LessonScreen from './components/LessonScreen';
import FeedbackPanel from './components/FeedbackPanel';
import EndScreen from './components/EndScreen';
import {
  completeLesson,
  fetchConceptMap,
  fetchNextQuestion,
  fetchProgress,
  fetchSessionSummary,
  loginUser,
  registerUser,
  setAuthToken,
  submitAttempt,
} from './services/api';

const AUTH_STORAGE_KEY = 'als_auth';
const SESSION_TARGET_QUESTIONS = 10;

function App() {
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progress, setProgress] = useState(null);
  const [conceptMap, setConceptMap] = useState(null);
  const [questionPayload, setQuestionPayload] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(null);
  const [screen, setScreen] = useState('map');
  const [retryEnabled, setRetryEnabled] = useState(false);
  const [pendingRetryAttempts, setPendingRetryAttempts] = useState(1);
  const [attemptsInSession, setAttemptsInSession] = useState(0);
  const [xpToast, setXpToast] = useState({ visible: false, amount: 0, key: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function saveAuth(authData) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuthToken(authData.token);
    setUserId(authData.user.user_id);
    setUserName(authData.user.name || authData.user.username);
    setIsAuthenticated(true);
  }

  function clearAuth() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthToken('');
    setIsAuthenticated(false);
    setUserId('');
    setUserName('');
    setProgress(null);
    setConceptMap(null);
    setQuestionPayload(null);
    setSummary(null);
    setFeedback(null);
    setScreen('map');
    setRetryEnabled(false);
    setPendingRetryAttempts(1);
  }

  useEffect(() => {
    if (!xpToast.visible) return undefined;
    const timer = setTimeout(() => {
      setXpToast((prev) => ({ ...prev, visible: false }));
    }, 1400);
    return () => clearTimeout(timer);
  }, [xpToast]);

  async function loadProgress(activeUserId) {
    const data = await fetchProgress({ userId: activeUserId, userName });
    setUserId(data.user_id);
    setProgress(data);
    return data.user_id;
  }

  async function loadConceptMap(activeUserId) {
    const data = await fetchConceptMap({ userId: activeUserId, userName });
    setConceptMap(data);
  }

  async function loadNextQuestion(activeUserId) {
    const payload = await fetchNextQuestion({ userId: activeUserId, userName });
    setQuestionPayload(payload);
    setRetryEnabled(false);
    setPendingRetryAttempts(1);
  }

  async function loadSummary(activeUserId) {
    const data = await fetchSessionSummary({ userId: activeUserId, userName });
    setSummary(data);
  }

  useEffect(() => {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.token && parsed?.user?.user_id) {
          saveAuth(parsed);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    async function bootstrapAfterAuth() {
      if (!isAuthenticated || !userId) return;

      try {
        setLoading(true);
        setError('');
        const id = await loadProgress(userId);
        await loadConceptMap(id);
      } catch (err) {
        if ((err.message || '').includes('token')) {
          clearAuth();
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrapAfterAuth();
  }, [isAuthenticated, userId]);

  async function handleAuth({ mode, name, username, password }) {
    try {
      setLoading(true);
      setError('');

      const payload = mode === 'register'
        ? { name, username, password }
        : { username, password };

      const authData = mode === 'register'
        ? await registerUser(payload)
        : await loginUser(payload);

      saveAuth(authData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startMission() {
    try {
      setLoading(true);
      setError('');
      await loadNextQuestion(userId);
      setScreen('question');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(payload) {
    if (questionPayload?.activity_type !== 'question') {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await submitAttempt({
        user_id: userId,
        user_name: userName,
        question_id: questionPayload.question.id,
        selected_answer: payload.selected_answer,
        attempts: payload.attempts,
        time_taken: payload.time_taken,
        used_hints: payload.used_hints,
        confidence: payload.confidence,
        skipped: payload.skipped,
        action_taken: questionPayload?.adaptive_context?.selected_action,
      });

      setFeedback(result);
      if ((result.xp_earned || 0) > 0) {
        setXpToast({
          visible: true,
          amount: result.xp_earned,
          key: Date.now(),
        });
      }
      const activeUserId = result.user_id || userId;

      await loadProgress(activeUserId);
      await loadConceptMap(activeUserId);

      if (!result.correctness && !payload.skipped) {
        setRetryEnabled(true);
        setPendingRetryAttempts((payload.attempts || 1) + 1);
        setScreen('feedback');
        return;
      }

      setRetryEnabled(false);
      setPendingRetryAttempts(1);
      const nextCount = attemptsInSession + 1;
      setAttemptsInSession(nextCount);

      if (nextCount >= SESSION_TARGET_QUESTIONS) {
        await loadSummary(activeUserId);
        setScreen('end');
      } else {
        await loadNextQuestion(activeUserId);
        setScreen('feedback');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteLesson(lessonKey) {
    try {
      setLoading(true);
      setError('');

      await completeLesson({
        user_id: userId,
        user_name: userName,
        lesson_key: lessonKey,
      });

      await loadNextQuestion(userId);
      setScreen('question');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function continueAfterFeedback() {
    if (retryEnabled) {
      setScreen('question');
      return;
    }

    setScreen('question');
  }

  async function skipFromNeedReview() {
    await handleSubmit({
      selected_answer: '__SKIPPED__',
      confidence: feedback?.inferred_confidence?.label === 'overconfident' ? 'medium' : 'low',
      attempts: pendingRetryAttempts,
      used_hints: 0,
      time_taken: 1,
      skipped: true,
    });
  }

  async function continueAfterEnd() {
    setAttemptsInSession(0);
    setSummary(null);
    setScreen('map');
    await loadConceptMap(userId);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>Algebra Quest: Adaptive Tutor Game</h1>
        <p>Concept unlocks, level progression, RL-style adaptation, and personalized tutoring.</p>
        {isAuthenticated && (
          <div className="auth-chip-row">
            <span className="auth-chip">Signed in as {userName}</span>
            <button type="button" className="btn" onClick={clearAuth}>Logout</button>
          </div>
        )}
      </header>

      {error && <p className="error-banner">{error}</p>}

      {!isAuthenticated && (
        <div className="layout-grid">
          <AuthScreen onLogin={handleAuth} loading={loading} />
        </div>
      )}

      {isAuthenticated && xpToast.visible && (
        <div key={xpToast.key} className="xp-toast-wrap" aria-live="polite">
          <div className="xp-toast">+{xpToast.amount} XP</div>
          <div className="xp-burst" aria-hidden="true">
            <span className="spark s1" />
            <span className="spark s2" />
            <span className="spark s3" />
            <span className="spark s4" />
            <span className="spark s5" />
            <span className="spark s6" />
          </div>
        </div>
      )}

      {isAuthenticated && (
      <div className="layout-grid">
        {screen === 'map' && (
          <>
            <ConceptMapView conceptMap={conceptMap} onStart={startMission} />
            <FeedbackPanel feedback={feedback} />
          </>
        )}

        {screen === 'question' && (
          <>
            {questionPayload?.activity_type === 'lesson' ? (
              <LessonScreen
                payload={questionPayload}
                loading={loading}
                onComplete={handleCompleteLesson}
                onBackToMap={() => setScreen('map')}
              />
            ) : (
              <QuestionScreen
                payload={questionPayload}
                onSubmit={handleSubmit}
                loading={loading}
                initialAttempts={pendingRetryAttempts}
                onBackToMap={() => setScreen('map')}
              />
            )}
            <FeedbackPanel feedback={feedback} />
          </>
        )}

        {screen === 'feedback' && (
          <>
            <FeedbackPanel feedback={feedback} />
            <section className="panel continue-panel">
              <h2>{retryEnabled ? 'Need Review' : 'Next Move'}</h2>
              {retryEnabled ? (
                <>
                  <p>Your previous answer needs review. Retry controls are available here.</p>
                  <p>Next retry attempt number: {pendingRetryAttempts}</p>
                  <div className="action-row">
                    <button type="button" className="btn submit" onClick={continueAfterFeedback} disabled={loading}>
                      Retry This Question
                    </button>
                    <button type="button" className="btn skip" onClick={skipFromNeedReview} disabled={loading}>
                      Skip and Move On
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>Attempt {attemptsInSession} of {SESSION_TARGET_QUESTIONS} completed.</p>
                  <p>Concept map and learner model have been updated.</p>
                  <button type="button" className="btn submit" onClick={continueAfterFeedback}>Continue Challenge</button>
                </>
              )}
            </section>
          </>
        )}

        {screen === 'end' && (
          <EndScreen summary={summary} onContinue={continueAfterEnd} />
        )}

        <section className="panel stats-panel">
          <h2>Live Learner State</h2>
          <p><strong>Current concept:</strong> {progress?.progress?.current_concept || '-'}</p>
          <p><strong>Unlocked concepts:</strong> {(progress?.progress?.unlocked_concepts || []).join(', ') || '-'}</p>
          <p><strong>Completed concepts:</strong> {(progress?.progress?.completed_concepts || []).join(', ') || '-'}</p>
          <p><strong>Cognitive load:</strong> {Number(progress?.learner_model?.cognitive_state?.load_score || 0).toFixed(2)}</p>
          <p><strong>Fatigue level:</strong> {Number(progress?.learner_model?.cognitive_state?.fatigue_level || 0).toFixed(2)}</p>
          <p><strong>Total retries:</strong> {progress?.learner_model?.evaluation_matrix?.total_retries || 0}</p>
          <p><strong>Total skips:</strong> {progress?.learner_model?.evaluation_matrix?.total_skips || 0}</p>
          <p><strong>Retry success rate:</strong> {Math.round((progress?.learner_model?.evaluation_matrix?.retry_success_rate || 0) * 100)}%</p>
          <p><strong>Skip rate:</strong> {Math.round((progress?.learner_model?.evaluation_matrix?.skip_rate || 0) * 100)}%</p>
        </section>
      </div>
      )}
    </main>
  );
}

export default App;
