export default function FeedbackPanel({ feedback }) {
  return (
    <section className="panel feedback-panel">
      <h2>Feedback</h2>

      {!feedback && <p>No attempt submitted yet.</p>}

      {feedback && (
        <>
          <div className={feedback.correctness ? 'status good' : 'status bad'}>
            {feedback.correctness ? 'Correct' : 'Needs Review'}
          </div>

          <p><strong>Detected error:</strong> {feedback.detected_error_type}</p>
          <p><strong>Cognitive load:</strong> {feedback.cognitive_load}</p>
          <p><strong>Inferred confidence:</strong> {feedback.inferred_confidence?.label || feedback.inferred_confidence}</p>
          <p><strong>Confidence alignment:</strong> {feedback.confidence_alignment}</p>
          <p><strong>Reward score:</strong> {feedback.reward_score}</p>
          <p><strong>XP earned:</strong> {feedback.xp_earned}</p>
          <p><strong>Confidence calibration:</strong> {feedback.confidence_calibration}</p>

          <div className="feedback-block">
            <p><strong>Explanation:</strong></p>
            <p>{feedback.explanation || 'No explanation needed for this attempt.'}</p>
          </div>

          <div className="feedback-block">
            <p><strong>Meta feedback:</strong></p>
            <ul>
              {feedback.meta_feedback?.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>

          <div className="feedback-block">
            <p><strong>Next step:</strong> {feedback.next_step?.action}</p>
            {feedback.next_step?.explanation && (
              <p>{feedback.next_step.explanation}</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
