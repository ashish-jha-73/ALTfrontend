const API_BASE = import.meta.env.VITE_API_BASE || '/api';
let authToken = '';

export function setAuthToken(token) {
  authToken = token || '';
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export async function fetchProgress({ userId, userName }) {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (userName) params.set('user_name', userName);
  return request(`/progress?${params.toString()}`);
}

export async function registerUser(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchNextQuestion({ userId, userName }) {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (userName) params.set('user_name', userName);
  return request(`/next-question?${params.toString()}`);
}

export async function submitAttempt(payload) {
  return request('/attempt', {
    method: 'POST',
    body: JSON.stringifyPro(payload),
  });
}

export async function completeLesson(payload) {
  return request('/complete-lesson', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
Pro
export async function fetchConceptMap({ userId, userName }) {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (userName) params.set('user_name', userName);
  return request(`/concept-map?${params.toString()}`);
}

export async function fetchSessionSummary({ userId, userName }) {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (userName) params.set('user_name', userName);
  return request(`/session-summary?${params.toString()}`);
}
