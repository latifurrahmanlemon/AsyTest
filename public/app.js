const tokenKey = 'asytest.accessToken';
const userKey = 'asytest.user';

const state = {
  token: localStorage.getItem(tokenKey),
  user: parseJson(localStorage.getItem(userKey)),
};

const elements = {
  authPanel: document.getElementById('auth-panel'),
  dashboard: document.getElementById('dashboard'),
  loginForm: document.getElementById('login-form'),
  loginMessage: document.getElementById('login-message'),
  welcomeTitle: document.getElementById('welcome-title'),
  welcomeSubtitle: document.getElementById('welcome-subtitle'),
  stats: document.getElementById('stats'),
  jobsList: document.getElementById('jobs-list'),
  usersList: document.getElementById('users-list'),
  usersPanel: document.getElementById('users-panel'),
  userForm: document.getElementById('user-form'),
  userMessage: document.getElementById('user-message'),
  jobForm: document.getElementById('job-form'),
  jobMessage: document.getElementById('job-message'),
  smtpForm: document.getElementById('smtp-form'),
  smtpMessage: document.getElementById('smtp-message'),
  smtpTestButton: document.getElementById('smtp-test-button'),
  refreshButton: document.getElementById('refresh-button'),
  logoutButton: document.getElementById('logout-button'),
};

boot();

function boot() {
  bindEvents();

  if (!state.token) {
    renderLoggedOut();
    return;
  }

  hydrateDashboard().catch(() => renderLoggedOut());
}

function bindEvents() {
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.logoutButton.addEventListener('click', handleLogout);
  elements.refreshButton.addEventListener('click', () => hydrateDashboard());
  elements.jobForm.addEventListener('submit', handleCreateJob);
  elements.userForm.addEventListener('submit', handleCreateUser);
  elements.smtpForm.addEventListener('submit', handleSaveSmtp);
  elements.smtpTestButton.addEventListener('click', handleTestSmtp);
}

async function handleLogin(event) {
  event.preventDefault();
  setMessage(elements.loginMessage, 'Signing in...');

  const formData = new FormData(elements.loginForm);
  const payload = {
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
  };

  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);

    state.token = response.accessToken;
    state.user = response.user;
    localStorage.setItem(tokenKey, response.accessToken);
    localStorage.setItem(userKey, JSON.stringify(response.user));
    setMessage(elements.loginMessage, 'Login successful.', 'success');
    elements.loginForm.reset();
    await hydrateDashboard();
  } catch (error) {
    setMessage(elements.loginMessage, error.message, 'error');
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  renderLoggedOut();
}

async function hydrateDashboard() {
  const [profile, summary, jobs, smtpConfig] = await Promise.all([
    api('/auth/me'),
    api('/jobs/summary'),
    api('/jobs'),
    api('/smtp-config'),
  ]);

  state.user = profile;
  localStorage.setItem(userKey, JSON.stringify(profile));

  renderLoggedIn(profile, summary, jobs, smtpConfig);

  if (profile.role === 'admin') {
    const users = await api('/users');
    renderUsers(users);
    elements.usersPanel.classList.remove('hidden');
  } else {
    elements.usersPanel.classList.add('hidden');
  }
}

async function handleCreateJob(event) {
  event.preventDefault();
  setMessage(elements.jobMessage, 'Queueing email...');

  const formData = new FormData(elements.jobForm);
  const payload = {
    to: String(formData.get('to') || '').trim(),
    subject: String(formData.get('subject') || '').trim(),
    body: String(formData.get('body') || '').trim(),
  };

  try {
    await api('/jobs/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    elements.jobForm.reset();
    setMessage(elements.jobMessage, 'Email job queued.', 'success');
    await hydrateDashboard();
  } catch (error) {
    setMessage(elements.jobMessage, error.message, 'error');
  }
}

async function handleCreateUser(event) {
  event.preventDefault();
  setMessage(elements.userMessage, 'Creating user...');

  const formData = new FormData(elements.userForm);
  const payload = {
    fullName: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
    role: String(formData.get('role') || 'user'),
  };

  try {
    await api('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    elements.userForm.reset();
    setMessage(elements.userMessage, 'User created.', 'success');
    const users = await api('/users');
    renderUsers(users);
  } catch (error) {
    setMessage(elements.userMessage, error.message, 'error');
  }
}

async function handleSaveSmtp(event) {
  event.preventDefault();
  setMessage(elements.smtpMessage, 'Saving SMTP configuration...');

  const formData = new FormData(elements.smtpForm);
  const payload = {
    host: String(formData.get('host') || '').trim(),
    port: Number(formData.get('port')),
    secure: formData.get('secure') === 'on',
    username: String(formData.get('username') || '').trim() || undefined,
    password: String(formData.get('password') || '') || undefined,
    fromEmail: String(formData.get('fromEmail') || '').trim(),
    fromName: String(formData.get('fromName') || '').trim() || undefined,
  };

  try {
    const config = await api('/smtp-config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    fillSmtpForm(config);
    elements.smtpForm.password.value = '';
    setMessage(elements.smtpMessage, 'SMTP configuration saved.', 'success');
  } catch (error) {
    setMessage(elements.smtpMessage, error.message, 'error');
  }
}

async function handleTestSmtp() {
  setMessage(elements.smtpMessage, 'Verifying SMTP connection...');

  try {
    await api('/smtp-config/test', {
      method: 'POST',
    });
    setMessage(elements.smtpMessage, 'SMTP connection verified.', 'success');
  } catch (error) {
    setMessage(elements.smtpMessage, error.message, 'error');
  }
}

function renderLoggedOut() {
  elements.authPanel.classList.remove('hidden');
  elements.dashboard.classList.add('hidden');
  elements.loginForm.email.value = state.user?.email || 'admin@admin.com';
  elements.loginForm.password.value = 'password';
  clearMessages();
}

function renderLoggedIn(profile, summary, jobs, smtpConfig) {
  elements.authPanel.classList.add('hidden');
  elements.dashboard.classList.remove('hidden');
  elements.welcomeTitle.textContent = `Welcome, ${profile.fullName}`;
  elements.welcomeSubtitle.textContent = `${profile.role.toUpperCase()} access for ${profile.tenantName}`;

  renderStats(summary);
  renderJobs(jobs);
  fillSmtpForm(smtpConfig);
  clearMessages();
}

function renderStats(summary) {
  const items = [
    ['Total', summary.total],
    ['Queued', summary.queued],
    ['Processing', summary.processing],
    ['Retry', summary.retryScheduled],
    ['Succeeded', summary.succeeded],
    ['Failed', summary.failed],
  ];

  elements.stats.innerHTML = items
    .map(
      ([label, value]) => `
        <article class="stat">
          <span class="eyebrow">${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value))}</strong>
        </article>
      `,
    )
    .join('');
}

function renderJobs(jobs) {
  if (!jobs.length) {
    elements.jobsList.innerHTML = '<div class="empty">No email jobs yet.</div>';
    return;
  }

  elements.jobsList.innerHTML = jobs
    .slice(0, 12)
    .map(
      (job) => `
        <article class="card">
          <div class="card__top">
            <div>
              <p class="card__title">${escapeHtml(job.subject)}</p>
              <p class="card__meta">
                To: ${escapeHtml(job.toEmail)}<br />
                Created: ${escapeHtml(formatDate(job.createdAt))}
              </p>
            </div>
            <span class="pill">${escapeHtml(job.status)}</span>
          </div>
        </article>
      `,
    )
    .join('');
}

function renderUsers(users) {
  if (!users.length) {
    elements.usersList.innerHTML = '<div class="empty">No users found.</div>';
    return;
  }

  elements.usersList.innerHTML = users
    .map(
      (user) => `
        <article class="card">
          <div class="card__top">
            <div>
              <p class="card__title">${escapeHtml(user.fullName)}</p>
              <p class="card__meta">
                ${escapeHtml(user.email)}<br />
                Role: ${escapeHtml(user.role)}<br />
                Status: ${escapeHtml(user.isActive ? 'active' : 'inactive')}
              </p>
            </div>
            <span class="pill">${escapeHtml(user.role)}</span>
          </div>
        </article>
      `,
    )
    .join('');
}

function fillSmtpForm(config) {
  elements.smtpForm.host.value = config.host || '';
  elements.smtpForm.port.value = config.port || '';
  elements.smtpForm.secure.checked = Boolean(config.secure);
  elements.smtpForm.username.value = config.username || '';
  elements.smtpForm.fromEmail.value = config.fromEmail || '';
  elements.smtpForm.fromName.value = config.fromName || '';
}

async function api(path, options = {}, requireAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (requireAuth && state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      handleLogout();
    }

    const message = typeof data?.message === 'string'
      ? data.message
      : Array.isArray(data?.message)
        ? data.message.join(', ')
        : 'Request failed';
    throw new Error(message);
  }

  return data;
}

async function parseResponse(response) {
  const text = await response.text();
  return text ? parseJson(text) : null;
}

function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function setMessage(element, message, type) {
  element.textContent = message || '';
  element.className = 'message';

  if (type === 'error') {
    element.classList.add('is-error');
  }

  if (type === 'success') {
    element.classList.add('is-success');
  }
}

function clearMessages() {
  [
    elements.loginMessage,
    elements.jobMessage,
    elements.userMessage,
    elements.smtpMessage,
  ].forEach((element) => setMessage(element, ''));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
