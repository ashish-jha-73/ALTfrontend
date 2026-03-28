export default function LessonScreen({ payload, onComplete, loading, onBackToMap }) {
  const lesson = payload?.lesson;

  if (!lesson) {
    return (
      <section className="panel question-panel">
        <h2>Teach Mode</h2>
        <p>Loading lesson...</p>
      </section>
    );
  }

  return (
    <section className="panel question-panel">
      <div className="question-header">
        <h2>Teach Mode</h2>
        <button type="button" className="btn" onClick={onBackToMap}>View Map</button>
      </div>

      <div className="pill-row">
        <span className="pill">Concept: {lesson.concept}</span>
        <span className="pill">Level {lesson.level}</span>
        <span className="pill">Lesson First</span>
      </div>

      <h3>{lesson.title}</h3>
      <p><strong>Objective:</strong> {lesson.objective}</p>

      <div className="lesson-steps">
        <p className="label">Teaching Steps</p>
        <ol>
          {lesson.steps?.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="hints-box">
        <p><strong>Worked Example:</strong> {lesson.worked_example}</p>
        <p><strong>Checkpoint:</strong> {lesson.checkpoint}</p>
      </div>

      <button type="button" className="btn submit" disabled={loading} onClick={() => onComplete(lesson.key)}>
        {loading ? 'Unlocking...' : 'I Learned This, Start Challenge'}
      </button>
    </section>
  );
}
