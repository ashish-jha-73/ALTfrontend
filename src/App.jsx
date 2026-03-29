import { useCallback, useEffect, useState } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';
import DiagnosticScreen from './components/DiagnosticScreen';
import TeachingCard from './components/TeachingCard';
import VideoLinksBar from './components/VideoLinksBar';
import ConceptMapView from './components/ConceptMapView';
import QuestionScreen from './components/QuestionScreen';
import LessonScreen from './components/LessonScreen';
import FeedbackPanel from './components/FeedbackPanel';
import EndScreen from './components/EndScreen';
import MasteryPopup from './components/MasteryPopup';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import {
  completeLesson,
  fetchConceptMap,
  fetchDiagnostic,
  fetchNextQuestion,
  fetchProgress,
  fetchSessionSummary,
  fetchTeachingContent,
  loginUser,
  registerUser,
  setAuthToken,
  submitAttempt,
  submitDiagnostic,
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
  const [hintsUsedSession, setHintsUsedSession] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [xpToast, setXpToast] = useState({ visible: false, amount: 0, key: 0 });
  const [masteryPopup, setMasteryPopup] = useState({ show: false, concept: '' });
  const [diagnosticQuestions, setDiagnosticQuestions] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(false);
  const [learnerLevel, setLearnerLevel] = useState(0);
  const [teachingContext, setTeachingContext] = useState(null);
  const [showTeaching, setShowTeaching] = useState(false);
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
    }, 2000);
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
    const allowedQTypes = ['mcq', 'fill_in_the_blank', 'drag_and_drop'];
    let payload = await fetchNextQuestion({ userId: activeUserId, userName });

    if (!payload) {
      setQuestionPayload(null);
      setRetryEnabled(false);
      setPendingRetryAttempts(1);
      return;
    }

    // If this is a lesson, return immediately
    if (payload.activity_type === 'lesson') {
      setQuestionPayload(payload);
      setRetryEnabled(false);
      setPendingRetryAttempts(1);
      return;
    }

    // For question activity, inspect the backend question_type
    const q = payload.question || {};
    const qtype = (q.question_type || '').toLowerCase();

    if (allowedQTypes.includes(qtype)) {
      setQuestionPayload(payload);
      setRetryEnabled(false);
      setPendingRetryAttempts(1);
      return;
    }

    // Unsupported type: try to find an MCQ of same level first, then any MCQ
    const targetLevel = q.level || null;
    let attempts = 0;
    let found = null;
    // First search for MCQ with same level
    while (attempts < 10) {
      const next = await fetchNextQuestion({ userId: activeUserId, userName });
      attempts += 1;
      if (!next || next.activity_type !== 'question') continue;
      const nq = next.question || {};
      if ((nq.question_type || '').toLowerCase() === 'mcq' && (targetLevel === null || nq.level === targetLevel)) {
        found = next;
        break;
      }
    }

    // If not found, try again to find any MCQ
    if (!found) {
      attempts = 0;
      while (attempts < 10) {
        const next = await fetchNextQuestion({ userId: activeUserId, userName });
        attempts += 1;
        if (!next || next.activity_type !== 'question') continue;
        const nq = next.question || {};
        if ((nq.question_type || '').toLowerCase() === 'mcq') {
          found = next;
          break;
        }
      }
    }

    setQuestionPayload(found || payload);
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
        // heck is done
        // Check if diagnostic is needed
        try {
          const diagData = await fetchDiagnostic();
          if (diagData.diagnostic_completed) {
            setDiagnosticCompleted(true);
            setLearnerLevel(diagData.learner_level || 1);
          } else {
            setDiagnosticQuestions(diagData.questions);
            setDiagnosticCompleted(false);
            setScreen('diagnostic');
          }
        } catch {
          // If diagnostic endpoint fails, skip it
          setDiagnosticCompleted(true);
        }
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

  async function handleDiagnosticSubmit(answers) {
    try {
      setLoading(true);
      setError('');
      const result = await submitDiagnostic(answers);
      setDiagnosticResult(result);
      setDiagnosticCompleted(true);
      setLearnerLevel(result.learner_level);
      // Refresh progress after diagnostic
      await loadProgress(userId);
      await loadConceptMap(userId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDiagnosticContinue() {
    setScreen('map');
    setDiagnosticResult(null);
  }

  async function handleTeachingComplete() {
    setShowTeaching(false);
    setTeachingContext(null);
    // Proceed to question
    try {
      setLoading(true);
      await loadNextQuestion(userId);
      setScreen('question');
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
      setFeedback(null);

      // Fetch teaching context to decide if teaching card should show
      let teachCtx = null;
      try {
        teachCtx = await fetchTeachingContent({
          concept: progress?.progress?.current_concept || 'expressions_foundation',
        });
        setTeachingContext(teachCtx);
        setLearnerLevel(teachCtx.learner_level || learnerLevel || 1);
      } catch {
        // If teaching endpoint fails, skip teaching card
        setTeachingContext(null);
        teachCtx = null;
      }

      await loadNextQuestion(userId);

      // If teaching context was fetched, show teaching card first; otherwise go to question
      if (teachCtx) {
        setScreen('teaching');
      } else {
        setScreen('question');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(payload) {
    if (questionPayload?.activity_type !== 'question') return;

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
      setHintsUsedSession((prev) => prev + (payload.used_hints || 0));

      if ((result.xp_earned || 0) > 0) {
        setXpToast({ visible: true, amount: result.xp_earned, key: Date.now() });
      }

      const activeUserId = result.user_id || userId;
      const prevCompleted = progress?.progress?.completed_concepts || [];

      await loadProgress(activeUserId);
      await loadConceptMap(activeUserId);

      // Check for newly completed concepts
      const newCompleted = progress?.progress?.completed_concepts || [];
      const justMastered = newCompleted.find((c) => !prevCompleted.includes(c));
      if (justMastered) {
        setMasteryPopup({ show: true, concept: justMastered.replace(/_/g, ' ') });
      }

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
      await completeLesson({ user_id: userId, user_name: userName, lesson_key: lessonKey });
      await loadNextQuestion(userId);
      setScreen('question');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function continueAfterFeedback() {
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
    setHintsUsedSession(0);
    setSummary(null);
    setFeedback(null);
    setScreen('map');
    await loadConceptMap(userId);
  }

  const closeMasteryPopup = useCallback(() => {
    setMasteryPopup({ show: false, concept: '' });
  }, []);

  const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

  // Auth screen — full page, no sidebar
  if (!isAuthenticated) {
    return (
      <div className="app-shell app-shell--auth">
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>&times;</button>
          </div>
        )}
        <AuthScreen onLogin={handleAuth} loading={loading} />
      </div>
    );
  }

  // Main app layout with sidebar
  return (
    <div className="app-shell">
      <Sidebar
        userName={userName}
        progress={progress}
        conceptMap={conceptMap}
        attemptsInSession={attemptsInSession}
        hintsUsedSession={hintsUsedSession}
        timeSpentSession={timeSpent}
        currentScreen={screen}
        onNavigateMap={() => setScreen('map')}
        onLogout={clearAuth}
      />

      <div className="main-area">
        <Header
          progress={progress}
          conceptMap={conceptMap}
          attemptsInSession={attemptsInSession}
          sessionTarget={SESSION_TARGET_QUESTIONS}
          screen={screen}
          questionPayload={questionPayload}
        />

        <div className="content">
          {error && (
            <div className="error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}>&times;</button>
            </div>
          )}

          {/* Diagnostic Screen */}
          {screen === 'diagnostic' && !diagnosticCompleted && diagnosticQuestions && (
            <DiagnosticScreen
              questions={diagnosticQuestions}
              onSubmit={handleDiagnosticSubmit}
              loading={loading}
              result={null}
            />
          )}

          {screen === 'diagnostic' && diagnosticCompleted && diagnosticResult && (
            <DiagnosticScreen
              questions={diagnosticQuestions}
              onSubmit={handleDiagnosticSubmit}
              loading={loading}
              result={diagnosticResult}
            />
          )}

          {screen === 'diagnostic' && diagnosticCompleted && diagnosticResult && (
            <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
              <button type="button" className="btn-primary" onClick={handleDiagnosticContinue}>
                Start Learning
              </button>
            </div>
          )}

          {/* Teaching Card (shown before questions when appropriate) */}
          {screen === 'teaching' && teachingContext && (
            <TeachingCard
              concept={teachingContext.concept}
              learnerLevel={teachingContext.learner_level || learnerLevel}
              adaptiveHint={teachingContext.adaptive_hint}
              onComplete={handleTeachingComplete}
            />
          )}

          {screen === 'map' && (
            <ConceptMapView conceptMap={conceptMap} onStart={startMission} />
          )}

          {screen === 'question' && (
            questionPayload?.activity_type === 'lesson' ? (
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
                feedback={feedback}
                onBackToMap={() => setScreen('map')}
              />
            )
          )}

          {screen === 'feedback' && (
            <FeedbackPanel
              feedback={feedback}
              retryEnabled={retryEnabled}
              pendingRetryAttempts={pendingRetryAttempts}
              attemptsInSession={attemptsInSession}
              sessionTarget={SESSION_TARGET_QUESTIONS}
              onContinue={continueAfterFeedback}
              onRetry={continueAfterFeedback}
              onSkip={skipFromNeedReview}
              loading={loading}
            />
          )}

          {screen === 'end' && (
            <EndScreen summary={summary} onContinue={continueAfterEnd} />
          )}
        </div>
      </div>

      {/* Persistent video links bar for current concept */}
      <VideoLinksBar concept={teachingContext?.concept || progress?.progress?.current_concept} />

      {/* XP Toast */}
      {xpToast.visible && (
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

      {/* Mastery Popup */}
      <MasteryPopup
        conceptName={masteryPopup.concept}
        show={masteryPopup.show}
        onClose={closeMasteryPopup}
      />
    </div>
  );
}

export default App;
