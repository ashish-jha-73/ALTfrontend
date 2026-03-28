import { useState } from 'react';

export default function AuthScreen({ onLogin, loading }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isRegister = mode === 'register';

  return (
    <section className="panel auth-panel">
      <h2>{isRegister ? 'Create Account' : 'Login'}</h2>
      <p className="subtext">Use your own account to save adaptive progress.</p>

      <div className="button-group auth-switch">
        <button
          type="button"
          className={mode === 'login' ? 'btn active' : 'btn'}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'btn active' : 'btn'}
          onClick={() => setMode('register')}
        >
          Create Account
        </button>
      </div>

      <div className="auth-form">
        {isRegister && (
          <label>
            Name
            <input
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </label>
        )}

        <label>
          Username
          <input
            className="text-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </label>

        <label>
          Password
          <input
            className="text-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="minimum 6 characters"
          />
        </label>
      </div>

      <button
        type="button"
        className="btn submit"
        disabled={loading}
        onClick={() =>
          onLogin({
            mode,
            name,
            username,
            password,
          })
        }
      >
        {loading ? 'Please wait...' : isRegister ? 'Create and Start' : 'Login and Start'}
      </button>
    </section>
  );
}
