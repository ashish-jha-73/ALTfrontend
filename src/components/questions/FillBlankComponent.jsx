import { useState } from 'react';

export default function FillBlankComponent({ questionText = '', answer, onChange, disabled }) {
  const parts = questionText.split(/___+/);
  const blankCount = parts.length - 1;
  const [values, setValues] = useState(Array(Math.max(blankCount, 1)).fill(''));

  const handleChange = (idx, val) => {
    const next = [...values];
    next[idx] = val;
    setValues(next);
    onChange(next.length === 1 ? next[0] : next.join(' | '));
  };

  if (blankCount === 0) {
    return (
      <div className="fill-blank">
        <p className="fill-blank__text">{questionText}</p>
        <input
          type="text"
          className="fill-blank__input"
          placeholder="Type your answer..."
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="fill-blank">
      <div className="fill-blank__inline">
        {parts.map((part, idx) => (
          <span key={idx}>
            <span className="fill-blank__text-part">{part}</span>
            {idx < blankCount && (
              <input
                type="text"
                className="fill-blank__input fill-blank__input--inline"
                placeholder="?"
                value={values[idx]}
                onChange={(e) => handleChange(idx, e.target.value)}
                disabled={disabled}
                autoFocus={idx === 0}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
