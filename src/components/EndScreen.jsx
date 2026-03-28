function renderList(items = []) {
  if (!items.length) return 'N/A';
  return items.join(', ');
}

function formatPercent(value) {
  return Math.round((value || 0) * 100);
}

export default function EndScreen({ summary, onContinue }) {
  const mastery = summary?.mastery || {};

  return (
    <section className="panel end-panel">
      <h2>Topic Summary</h2>

      <div className="score-strip">
        <div>
          <p>Total XP</p>
          <strong>{summary?.xp || 0}</strong>
        </div>
        <div>
          <p>Total Score</p>
          <strong>{summary?.total_score || 0}</strong>
        </div>
      </div>

      <div className="feedback-block">
        <p><strong>Strengths:</strong> {renderList(summary?.strengths)}</p>
        <p><strong>Weaknesses:</strong> {renderList(summary?.weaknesses)}</p>
      </div>

      <div className="bars">
        {Object.keys(mastery).map((concept) => (
          <div key={concept} className="bar-row">
            <span>{concept}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${formatPercent(mastery[concept])}%` }} />
            </div>
            <strong>{formatPercent(mastery[concept])}%</strong>
          </div>
        ))}
      </div>

      <div className="feedback-block">
        <p><strong>Behavioral Profile</strong></p>
        <p>Guessing tendency: {Number(summary?.behavioral_insights?.guessing_tendency || 0).toFixed(2)}</p>
        <p>Persistence: {Number(summary?.behavioral_insights?.persistence || 0).toFixed(2)}</p>
        <p>Hint dependency: {Number(summary?.behavioral_insights?.hint_dependency || 0).toFixed(2)}</p>
      </div>

      <button type="button" className="btn start-btn" onClick={onContinue}>Continue Learning</button>
    </section>
  );
}
