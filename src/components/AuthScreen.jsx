import { useState } from 'react';

export default function AuthScreen({ onLogin, loading }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isRegister = mode === 'register';

  return (
    <div className="auth-screen">
      <div className="auth-card anim-fade-in">
        <div className="auth-card__header">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
          </svg>
          <h1 className="auth-card__title">Algebra Quest</h1>
          <p className="auth-card__subtitle">Adaptive Learning Tutor</p>
        </div>

        <div className="auth-card__toggle">
          <button
            type="button"
            className={`auth-card__toggle-btn ${mode === 'login' ? 'auth-card__toggle-btn--active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-card__toggle-btn ${mode === 'register' ? 'auth-card__toggle-btn--active' : ''}`}
            onClick={() => setMode('register')}
          >
            Create Account
          </button>
        </div>

        <div className="auth-card__form">
          {isRegister && (
            <div className="auth-card__field">
              <label className="auth-card__label">Full Name</label>
              <input
                type="text"
                className="auth-card__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          )}

          <div className="auth-card__field">
            <label className="auth-card__label">Username</label>
            <input
              type="text"
              className="auth-card__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label">Password</label>
            <input
              type="password"
              className="auth-card__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
        </div>

        <button
          type="button"
          className="auth-card__submit"
          disabled={loading}
          onClick={() => onLogin({ mode, name, username, password })}
        >
          {loading ? (
            <span className="spinner spinner--sm" />
          ) : (
            isRegister ? 'Create Account & Start' : 'Sign In & Start'
          )}
        </button>
      </div>
    </div>
  );
}
