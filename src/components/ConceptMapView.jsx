function formatPercent(value) {
  return Math.round((value || 0) * 100);
}

export default function ConceptMapView({ conceptMap, onStart }) {
  const nodes = conceptMap?.nodes || [];
  const connectors = nodes.slice(0, -1);

  return (
    <section className="panel map-panel">
      <div className="map-header">
        <h2>Concept Map</h2>
        <button type="button" className="btn start-btn" onClick={onStart}>Start Adaptive Mission</button>
      </div>

      <p className="subtext">Unlock path: Expressions to Simplification to Equations to Word Problems</p>

      <div className="map-graph">
        {connectors.length > 0 && (
          <svg className="map-connectors" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true">
            {connectors.map((node, idx) => {
              const segmentWidth = 1000 / nodes.length;
              const x1 = segmentWidth * idx + segmentWidth * 0.65;
              const x2 = segmentWidth * (idx + 1) + segmentWidth * 0.35;
              const y = 40;
              const color = node.status === 'completed' ? '#2b9b57' : '#5fa7ca';

              return (
                <g key={`${node.id}-edge`}>
                  <path
                    d={`M ${x1} ${y} C ${x1 + 28} ${y - 12}, ${x2 - 28} ${y + 12}, ${x2} ${y}`}
                    stroke={color}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <circle cx={x2} cy={y} r="3.5" fill={color} />
                </g>
              );
            })}
          </svg>
        )}

        <div className="node-row">
        {nodes.map((node) => (
          <div key={node.id} className={`concept-node ${node.status}`}>
            <h3>{node.label}</h3>
            <p>Status: {node.status}</p>
            <p>Level: {node.current_level}</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${formatPercent(node.mastery)}%` }} />
            </div>
            <small>Mastery {formatPercent(node.mastery)}%</small>
          </div>
        ))}
        </div>
      </div>

      <div className="score-strip">
        <div>
          <p>XP</p>
          <strong>{conceptMap?.xp || 0}</strong>
        </div>
        <div>
          <p>Total Score</p>
          <strong>{conceptMap?.total_score || 0}</strong>
        </div>
      </div>
    </section>
  );
}
