const tokenKey = 'asytest.accessToken';
const userKey = 'asytest.user';

const state = {
  token: localStorage.getItem(tokenKey),
  user: parseJson(localStorage.getItem(userKey)),
  authView: 'login',
  activeSection: 'dashboard',
  users: [],
  usersSearch: '',
  usersSort: 'name-asc',
  usersPage: 1,
  usersPerPage: 8,
};

const elements = {
  heroSection: document.getElementById('hero-section'),
  authPanel: document.getElementById('auth-panel'),
  authTitle: document.getElementById('auth-title'),
  authSwitchers: Array.from(document.querySelectorAll('[data-auth-view]')),
  authViews: Array.from(document.querySelectorAll('[data-auth-view-panel]')),
  dashboard: document.getElementById('dashboard'),
  sectionTabs: Array.from(document.querySelectorAll('[data-section]')),
  sectionViews: Array.from(document.querySelectorAll('[data-section-panel]')),
  dashboardNav: document.getElementById('dashboard-nav'),
  navUsers: document.getElementById('nav-users'),
  navSettings: document.getElementById('nav-settings'),
  loginForm: document.getElementById('login-form'),
  loginMessage: document.getElementById('login-message'),
  signupForm: document.getElementById('signup-form'),
  signupMessage: document.getElementById('signup-message'),
  verifyForm: document.getElementById('verify-form'),
  verifyMessage: document.getElementById('verify-message'),
  resendOtpButton: document.getElementById('resend-otp-button'),
  forgotForm: document.getElementById('forgot-form'),
  forgotMessage: document.getElementById('forgot-message'),
  resetForm: document.getElementById('reset-form'),
  resetMessage: document.getElementById('reset-message'),
  welcomeTitle: document.getElementById('welcome-title'),
  welcomeSubtitle: document.getElementById('welcome-subtitle'),
  stats: document.getElementById('stats'),
  jobsList: document.getElementById('jobs-list'),
  openJobModal: document.getElementById('open-job-modal'),
  closeJobModal: document.getElementById('close-job-modal'),
  jobModal: document.getElementById('job-modal'),
  jobModalBackdrop: document.getElementById('job-modal-backdrop'),
  usersList: document.getElementById('users-list'),
  usersSearch: document.getElementById('users-search'),
  usersSort: document.getElementById('users-sort'),
  usersPagination: document.getElementById('users-pagination'),
  usersPanel: document.getElementById('users-panel'),
  openUserModal: document.getElementById('open-user-modal'),
  closeUserModal: document.getElementById('close-user-modal'),
  userModal: document.getElementById('user-modal'),
  userModalBackdrop: document.getElementById('user-modal-backdrop'),
  userForm: document.getElementById('user-form'),
  userFormMode: document.getElementById('user-form-mode'),
  userFormUserId: document.getElementById('user-form-user-id'),
  saveUserButton: document.getElementById('save-user-button'),
  userPasswordInput: document.getElementById('user-password-input'),
  userModalTitle: document.getElementById('user-modal-title'),
  userMessage: document.getElementById('user-message'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmModalBackdrop: document.getElementById('confirm-modal-backdrop'),
  confirmModalMessage: document.getElementById('confirm-modal-message'),
  confirmCancelButton: document.getElementById('confirm-cancel-button'),
  confirmAcceptButton: document.getElementById('confirm-accept-button'),
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

  elements.heroSection.classList.add('hidden');
  elements.authPanel.classList.add('hidden');
  elements.dashboard.classList.remove('hidden');
  hydrateDashboard().catch(() => renderLoggedOut());
}

function bindEvents() {
  elements.authSwitchers.forEach((button) => {
    button.addEventListener('click', () => setAuthView(button.dataset.authView));
  });
  elements.sectionTabs.forEach((button) => {
    button.addEventListener('click', () => setSection(button.dataset.section));
  });
  elements.dashboardNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-section]');
    if (!button) {
      return;
    }

    setSection(button.dataset.section);
  });

  elements.loginForm.addEventListener('submit', handleLogin);
  elements.signupForm.addEventListener('submit', handleSignup);
  elements.verifyForm.addEventListener('submit', handleVerifyOtp);
  elements.resendOtpButton.addEventListener('click', handleResendOtp);
  elements.forgotForm.addEventListener('submit', handleForgotPassword);
  elements.resetForm.addEventListener('submit', handleResetPassword);
  elements.logoutButton.addEventListener('click', handleLogout);
  elements.refreshButton.addEventListener('click', () => hydrateDashboard());
  elements.jobForm.addEventListener('submit', handleCreateJob);
  elements.openJobModal.addEventListener('click', openJobModal);
  elements.closeJobModal.addEventListener('click', closeJobModal);
  elements.jobModalBackdrop.addEventListener('click', closeJobModal);
  elements.userForm.addEventListener('submit', handleCreateUser);
  elements.openUserModal.addEventListener('click', openUserModal);
  elements.closeUserModal.addEventListener('click', closeUserModal);
  elements.userModalBackdrop.addEventListener('click', closeUserModal);
  elements.confirmModalBackdrop.addEventListener('click', () => closeConfirmModal(false));
  elements.confirmCancelButton.addEventListener('click', () => closeConfirmModal(false));
  elements.usersSearch.addEventListener('input', handleUserSearch);
  elements.usersSort.addEventListener('change', handleUserSort);
  elements.usersList.addEventListener('click', handleUsersTableClick);
  elements.usersPagination.addEventListener('click', handleUsersTableClick);
  elements.smtpForm.addEventListener('submit', handleSaveSmtp);
  elements.smtpTestButton.addEventListener('click', handleTestSmtp);
  document.addEventListener('keydown', handleEscape);
}

function setAuthView(view) {
  state.authView = view;

  const titles = {
    login: 'Sign in to continue',
    signup: 'Create your account',
    verify: 'Verify your email OTP',
    forgot: 'Request a password reset',
    reset: 'Apply a new password',
  };

  elements.authTitle.textContent = titles[view] || titles.login;

  elements.authSwitchers.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.authView === view);
  });

  elements.authViews.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.authViewPanel !== view);
  });
}

function setSection(section) {
  state.activeSection = section;

  elements.sectionTabs.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.section === section);
  });

  elements.sectionViews.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.sectionPanel !== section);
  });
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
    elements.heroSection.classList.add('hidden');
    elements.authPanel.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    await hydrateDashboard();
  } catch (error) {
    setMessage(elements.loginMessage, error.message, 'error');
  }
}

async function handleSignup(event) {
  event.preventDefault();
  setMessage(elements.signupMessage, 'Creating account and generating OTP...');

  const formData = new FormData(elements.signupForm);
  const payload = {
    tenantName: String(formData.get('tenantName') || '').trim(),
    fullName: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
  };

  try {
    const response = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);

    setMessage(
      elements.signupMessage,
      buildOtpMessage(response.message, response.previewOtp),
      'success',
    );
    elements.verifyForm.email.value = payload.email;
    elements.loginForm.email.value = payload.email;
    setAuthView('verify');
  } catch (error) {
    setMessage(elements.signupMessage, error.message, 'error');
  }
}

async function handleVerifyOtp(event) {
  event.preventDefault();
  setMessage(elements.verifyMessage, 'Verifying OTP...');

  const formData = new FormData(elements.verifyForm);
  const payload = {
    email: String(formData.get('email') || '').trim(),
    otp: String(formData.get('otp') || '').trim(),
  };

  try {
    const response = await api('/auth/verify-signup-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);
    setMessage(elements.verifyMessage, response.message, 'success');
    elements.loginForm.email.value = payload.email;
    setAuthView('login');
  } catch (error) {
    setMessage(elements.verifyMessage, error.message, 'error');
  }
}

async function handleResendOtp() {
  setMessage(elements.verifyMessage, 'Generating a fresh OTP...');

  const email = String(elements.verifyForm.email.value || '').trim();
  if (!email) {
    setMessage(elements.verifyMessage, 'Enter your email first.', 'error');
    return;
  }

  try {
    const response = await api('/auth/resend-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
    setMessage(
      elements.verifyMessage,
      buildOtpMessage(response.message, response.previewOtp),
      'success',
    );
  } catch (error) {
    setMessage(elements.verifyMessage, error.message, 'error');
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();
  setMessage(elements.forgotMessage, 'Generating reset token...');

  const formData = new FormData(elements.forgotForm);
  const payload = {
    email: String(formData.get('email') || '').trim(),
  };

  try {
    const response = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);
    setMessage(
      elements.forgotMessage,
      response.previewToken
        ? `${response.message} Preview reset token: ${response.previewToken}`
        : response.message,
      'success',
    );
    elements.resetForm.token.value = response.previewToken || '';
    setAuthView('reset');
  } catch (error) {
    setMessage(elements.forgotMessage, error.message, 'error');
  }
}

async function handleResetPassword(event) {
  event.preventDefault();
  setMessage(elements.resetMessage, 'Updating password...');

  const formData = new FormData(elements.resetForm);
  const payload = {
    token: String(formData.get('token') || '').trim(),
    newPassword: String(formData.get('newPassword') || ''),
  };

  try {
    const response = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);
    setMessage(elements.resetMessage, response.message, 'success');
    elements.loginForm.password.value = '';
    setAuthView('login');
  } catch (error) {
    setMessage(elements.resetMessage, error.message, 'error');
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
    state.users = users;
    renderUsers();
    elements.usersPanel.classList.remove('hidden');
    elements.navUsers.classList.remove('hidden');
    elements.navSettings.classList.remove('hidden');
  } else {
    state.users = [];
    elements.usersPanel.classList.add('hidden');
    elements.navUsers.classList.add('hidden');
    elements.navSettings.classList.add('hidden');
    if (state.activeSection !== 'dashboard') {
      setSection('dashboard');
    }
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
    closeJobModal();
    await hydrateDashboard();
  } catch (error) {
    setMessage(elements.jobMessage, error.message, 'error');
  }
}

function openJobModal() {
  elements.jobModal.classList.remove('hidden');
  elements.jobModal.setAttribute('aria-hidden', 'false');
}

function closeJobModal() {
  elements.jobModal.classList.add('hidden');
  elements.jobModal.setAttribute('aria-hidden', 'true');
}

async function handleCreateUser(event) {
  event.preventDefault();
  const mode = elements.userFormMode.value;
  setMessage(
    elements.userMessage,
    mode === 'edit' ? 'Updating user...' : 'Creating user...',
  );

  const formData = new FormData(elements.userForm);
  const password = String(formData.get('password') || '');
  const isActive = String(formData.get('isActive') || 'true') === 'true';

  const payload = {
    fullName: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    role: String(formData.get('role') || 'user'),
    isActive,
  };

  if (password) {
    payload.password = password;
  }

  try {
    if (mode === 'edit') {
      const userId = String(formData.get('userId') || '');
      await api(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          password,
        }),
      });
    }

    elements.userForm.reset();
    setMessage(
      elements.userMessage,
      mode === 'edit' ? 'User updated.' : 'User created.',
      'success',
    );
    await refreshUsers();
    closeUserModal();
  } catch (error) {
    setMessage(elements.userMessage, error.message, 'error');
  }
}

function openUserModal() {
  setUserModalMode('create');
  elements.userModal.classList.remove('hidden');
  elements.userModal.setAttribute('aria-hidden', 'false');
}

function openEditUserModal(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    return;
  }

  setUserModalMode('edit', user);
  elements.userModal.classList.remove('hidden');
  elements.userModal.setAttribute('aria-hidden', 'false');
}

function setUserModalMode(mode, user) {
  elements.userFormMode.value = mode;
  elements.userFormUserId.value = user?.id || '';
  elements.userModalTitle.textContent = mode === 'edit' ? 'Edit User' : 'Add New User';
  elements.saveUserButton.textContent = mode === 'edit' ? 'Update User' : 'Save User';
  elements.userPasswordInput.required = mode !== 'edit';
  elements.userPasswordInput.placeholder =
    mode === 'edit' ? 'Leave blank to keep current password' : '';

  elements.userForm.fullName.value = user?.fullName || '';
  elements.userForm.email.value = user?.email || '';
  elements.userForm.role.value = user?.role || 'user';
  elements.userForm.isActive.value = String(user?.isActive ?? true);
  elements.userPasswordInput.value = '';
  setMessage(elements.userMessage, '');
}

function closeUserModal() {
  elements.userModal.classList.add('hidden');
  elements.userModal.setAttribute('aria-hidden', 'true');
  elements.userForm.reset();
  elements.userFormMode.value = 'create';
  elements.userFormUserId.value = '';
  elements.userPasswordInput.required = true;
  elements.userPasswordInput.placeholder = '';
  setMessage(elements.userMessage, '');
}

function handleEscape(event) {
  if (event.key === 'Escape' && !elements.jobModal.classList.contains('hidden')) {
    closeJobModal();
  }

  if (event.key === 'Escape' && !elements.userModal.classList.contains('hidden')) {
    closeUserModal();
  }

  if (event.key === 'Escape' && !elements.confirmModal.classList.contains('hidden')) {
    closeConfirmModal(false);
  }
}

async function refreshUsers() {
  const users = await api('/users');
  state.users = users;
  renderUsers();
}

function handleUserSearch(event) {
  state.usersSearch = String(event.target.value || '').trim().toLowerCase();
  state.usersPage = 1;
  renderUsers();
}

function handleUserSort(event) {
  state.usersSort = String(event.target.value || 'name-asc');
  state.usersPage = 1;
  renderUsers();
}

async function handleUsersTableClick(event) {
  const actionButton = event.target.closest('[data-user-action]');
  const pageButton = event.target.closest('[data-page]');

  if (pageButton) {
    const page = Number(pageButton.dataset.page);
    if (page > 0) {
      state.usersPage = page;
      renderUsers();
    }
    return;
  }

  if (!actionButton) {
    return;
  }

  const userId = actionButton.dataset.userId;
  const action = actionButton.dataset.userAction;
  if (!userId || !action) {
    return;
  }

  actionButton.disabled = true;

  try {
    if (action === 'toggle-status') {
      const isActive = actionButton.dataset.isActive === 'true';
      const label = isActive ? 'deactivate' : 'activate';
      if (!(await confirmAction(`Do you want to ${label} this user?`))) {
        return;
      }
      await api(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive }),
      });
    }

    if (action === 'toggle-role') {
      const role = actionButton.dataset.role === 'admin' ? 'user' : 'admin';
      if (!(await confirmAction(`Do you want to change this user role to ${role}?`))) {
        return;
      }
      await api(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    }

    if (action === 'delete-user') {
      if (!(await confirmAction('Do you want to permanently delete this user?'))) {
        return;
      }
      await api(`/users/${userId}`, {
        method: 'DELETE',
      });
    }

    if (action === 'edit-user') {
      openEditUserModal(userId);
      return;
    }

    await refreshUsers();
  } catch (error) {
    setMessage(elements.userMessage, error.message, 'error');
  } finally {
    actionButton.disabled = false;
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
  elements.heroSection.classList.remove('hidden');
  elements.authPanel.classList.remove('hidden');
  elements.dashboard.classList.add('hidden');
  elements.loginForm.email.value = state.user?.email || 'admin@admin.com';
  if (!elements.loginForm.password.value) {
    elements.loginForm.password.value = 'password';
  }
  clearMessages();
  setAuthView(state.authView || 'login');
  setSection('dashboard');
}

function renderLoggedIn(profile, summary, jobs, smtpConfig) {
  elements.heroSection.classList.add('hidden');
  elements.authPanel.classList.add('hidden');
  elements.dashboard.classList.remove('hidden');
  elements.welcomeTitle.textContent = `Welcome, ${profile.fullName}`;
  elements.welcomeSubtitle.textContent = `${profile.role.toUpperCase()} access for ${profile.tenantName}`;

  renderStats(summary);
  renderJobs(jobs);
  fillSmtpForm(smtpConfig);
  clearMessages();
  setSection(state.activeSection || 'dashboard');
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
    elements.jobsList.innerHTML = '<div class="empty">No test emails found.</div>';
    return;
  }

  elements.jobsList.innerHTML = jobs
    .slice(0, 12)
    .reduce(
      (html, job) =>
        html +
        `
          <tr>
            <td>${escapeHtml(job.toEmail)}</td>
            <td>${escapeHtml(job.subject)}</td>
            <td><span class="pill">${escapeHtml(job.status)}</span></td>
            <td>${escapeHtml(`${job.attemptsMade}/${job.maxAttempts}`)}</td>
            <td>${escapeHtml(formatDate(job.createdAt))}</td>
            <td>${escapeHtml(job.lastError || '-')}</td>
          </tr>
        `,
      `
        <table class="data-table data-table--jobs">
          <thead>
            <tr>
              <th>To Email</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Created At</th>
              <th>Last Error</th>
            </tr>
          </thead>
          <tbody>
      `,
    ) +
    `
          </tbody>
        </table>
    `;
}

function renderUsers() {
  const filteredUsers = state.users.filter((user) => {
    if (!state.usersSearch) {
      return true;
    }

    const target = `${user.fullName} ${user.email}`.toLowerCase();
    return target.includes(state.usersSearch);
  });

  const sortedUsers = [...filteredUsers].sort((left, right) => {
    switch (state.usersSort) {
      case 'name-desc':
        return right.fullName.localeCompare(left.fullName);
      case 'email-asc':
        return left.email.localeCompare(right.email);
      case 'email-desc':
        return right.email.localeCompare(left.email);
      case 'role-asc':
        return left.role.localeCompare(right.role) || left.fullName.localeCompare(right.fullName);
      case 'status-asc':
        return Number(left.isActive) - Number(right.isActive) || left.fullName.localeCompare(right.fullName);
      case 'status-desc':
        return Number(right.isActive) - Number(left.isActive) || left.fullName.localeCompare(right.fullName);
      case 'name-asc':
      default:
        return left.fullName.localeCompare(right.fullName);
    }
  });

  if (!sortedUsers.length) {
    elements.usersList.innerHTML = '<div class="empty">No users found.</div>';
    elements.usersPagination.innerHTML = '';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / state.usersPerPage));
  state.usersPage = Math.min(state.usersPage, totalPages);
  const start = (state.usersPage - 1) * state.usersPerPage;
  const pageUsers = sortedUsers.slice(start, start + state.usersPerPage);

  elements.usersList.innerHTML = pageUsers
    .reduce(
      (html, user) =>
        html +
        `
          <tr>
            <td>${escapeHtml(user.fullName)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="pill">${escapeHtml(user.role)}</span></td>
            <td>
              <span class="status-dot ${user.isActive ? 'is-active' : 'is-inactive'}">
                ${escapeHtml(user.isActive ? 'Active' : 'Inactive')}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button
                  class="button button--small button--ghost icon-action"
                  type="button"
                  data-user-action="edit-user"
                  data-user-id="${escapeHtml(user.id)}"
                  data-tooltip="Edit user"
                  aria-label="Edit user"
                >
                  &#9998;
                </button>
                <button
                  class="button button--small button--ghost icon-action"
                  type="button"
                  data-user-action="toggle-role"
                  data-user-id="${escapeHtml(user.id)}"
                  data-role="${escapeHtml(user.role)}"
                  data-tooltip="${escapeHtml(user.role === 'admin' ? 'Make user' : 'Make admin')}"
                  aria-label="${escapeHtml(user.role === 'admin' ? 'Make user' : 'Make admin')}"
                >
                  &#8646;
                </button>
                <button
                  class="button button--small ${user.isActive ? 'button--danger-soft' : 'button--ghost'} icon-action"
                  type="button"
                  data-user-action="toggle-status"
                  data-user-id="${escapeHtml(user.id)}"
                  data-is-active="${escapeHtml(String(user.isActive))}"
                  data-tooltip="${escapeHtml(user.isActive ? 'Deactivate user' : 'Activate user')}"
                  aria-label="${escapeHtml(user.isActive ? 'Deactivate user' : 'Activate user')}"
                >
                  ${user.isActive ? '&#9711;' : '&#10003;'}
                </button>
                <button
                  class="button button--small button--danger-soft icon-action"
                  type="button"
                  data-user-action="delete-user"
                  data-user-id="${escapeHtml(user.id)}"
                  data-tooltip="Delete user"
                  aria-label="Delete user"
                >
                  &#128465;
                </button>
              </div>
            </td>
          </tr>
        `,
      `
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
      `,
    ) +
    `
          </tbody>
        </table>
    `;

  elements.usersPagination.innerHTML = buildPagination(totalPages);
}

function buildPagination(totalPages) {
  if (totalPages <= 1) {
    return '';
  }

  let html = '';
  for (let page = 1; page <= totalPages; page += 1) {
    html += `
      <button
        class="page-button ${page === state.usersPage ? 'is-active' : ''}"
        type="button"
        data-page="${page}"
      >
        ${page}
      </button>
    `;
  }

  return html;
}

function confirmAction(message) {
  return new Promise((resolve) => {
    elements.confirmModalMessage.textContent = message;
    elements.confirmModal.classList.remove('hidden');
    elements.confirmModal.setAttribute('aria-hidden', 'false');

    elements.confirmAcceptButton.onclick = () => closeConfirmModal(true, resolve);
    elements.confirmCancelButton.onclick = () => closeConfirmModal(false, resolve);
    elements.confirmModalBackdrop.onclick = () => closeConfirmModal(false, resolve);
  });
}

function closeConfirmModal(result, resolver) {
  elements.confirmModal.classList.add('hidden');
  elements.confirmModal.setAttribute('aria-hidden', 'true');
  elements.confirmModalMessage.textContent = '';
  elements.confirmAcceptButton.onclick = null;
  elements.confirmCancelButton.onclick = null;
  elements.confirmModalBackdrop.onclick = null;

  if (typeof resolver === 'function') {
    resolver(result);
  }
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
    if (response.status === 401 && requireAuth) {
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

function buildOtpMessage(message, previewOtp) {
  return previewOtp ? `${message} Preview OTP: ${previewOtp}` : message;
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
    elements.signupMessage,
    elements.verifyMessage,
    elements.forgotMessage,
    elements.resetMessage,
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
