// ===== VTU SUPER LEARNING PLATFORM - Complete App JS =====
'use strict';

const API = '';
let currentUser = null;
let currentPage = 'dashboard';
let quizTimer = null;
let quizState = {};
let deferredInstallPrompt = null;
let quizQuestionCount = 0;

// ===== API HELPER =====
async function api(path, opts = {}) {
  const token = localStorage.getItem('vtu_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  try {
    const res = await fetch(API + path, { ...opts, headers: { ...headers, ...opts.headers } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (e) { throw e; }
}

// ===== TOAST =====
function toast(msg, type = 'info') {
  const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle', warning: 'exclamation-triangle' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ===== THEME =====
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('theme-icon').className = isDark ? 'fas fa-sun w-5' : 'fas fa-moon w-5';
  localStorage.setItem('vtu_theme', isDark ? 'light' : 'dark');
}

// ===== PAGE ROUTING =====
function showPage(pageId) {
  document.querySelectorAll('#auth-container .page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
}

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll(`.nav-item[onclick="navigate('${page}')"]`).forEach(n => n.classList.add('active'));
  closeSidebar();
  loadPage(page);
}

async function loadPage(page) {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;
  try {
    switch (page) {
      case 'dashboard': await renderDashboard(); break;
      case 'subjects': await renderSubjects(); break;
      case 'resources': await renderResources(); break;
      case 'ai-chat': await renderAIChat(); break;
      case 'quiz': await renderQuizList(); break;
      case 'placement': await renderPlacement(); break;
      case 'planner': await renderPlanner(); break;
      case 'challenge': await renderDailyChallenge(); break;
      case 'progress': await renderProgress(); break;
      case 'leaderboard': await renderLeaderboard(); break;
      case 'badges': await renderBadges(); break;
      case 'bookmarks': await renderBookmarks(); break;
      case 'exams': await renderExams(); break;
      case 'announcements': await renderAnnouncements(); break;
      case 'profile': await renderProfile(); break;
      case 'notifications': await renderNotifications(); break;
      // Admin pages
      case 'admin-dashboard': await renderAdminDashboard(); break;
      case 'admin-resources': await renderAdminResources(); break;
      case 'admin-quizzes': await renderAdminQuizzes(); break;
      case 'admin-users': await renderAdminUsers(); break;
      case 'admin-announcements': await renderAdminAnnouncements(); break;
      case 'admin-exams': await renderAdminExams(); break;
      case 'admin-placement': await renderAdminPlacement(); break;
      default: content.innerHTML = `<div class="empty-state"><div class="empty-icon">🚧</div><h3>Page not found</h3></div>`;
    }
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3 style="color:#ef4444">Error loading page</h3><p style="color:#64748b;margin-top:8px">${e.message}</p><button onclick="loadPage('${page}')" class="btn-primary mt-4">Retry</button></div>`;
  }
}

// ===== AUTH =====
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...'; btn.disabled = true;
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }) });
    localStorage.setItem('vtu_token', data.token);
    currentUser = data.user;
    toast('Welcome back, ' + data.user.name + '! 🎓', 'success');
    initApp();
  } catch (e) { toast(e.message, 'error'); }
  finally { btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In'; btn.disabled = false; }
}

async function handleRegister(e) {
  e.preventDefault();
  const pw = document.getElementById('reg-password').value;
  const conf = document.getElementById('reg-confirm').value;
  if (pw !== conf) { toast('Passwords do not match', 'error'); return; }
  const btn = document.getElementById('reg-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...'; btn.disabled = true;
  try {
    const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({
      name: document.getElementById('reg-name').value, email: document.getElementById('reg-email').value,
      password: pw, branch: document.getElementById('reg-branch').value, semester: document.getElementById('reg-semester').value
    })});
    localStorage.setItem('vtu_token', data.token);
    currentUser = data.user;
    toast('Account created! Welcome to VTU Platform! 🎉', 'success');
    initApp();
  } catch (e) { toast(e.message, 'error'); }
  finally { btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Create Account'; btn.disabled = false; }
}

async function quickDemo(role) {
  try {
    const data = await api('/api/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) });
    localStorage.setItem('vtu_token', data.token);
    currentUser = data.user;
    toast(`Demo ${role} account loaded! 🚀`, 'success');
    initApp();
  } catch (e) { toast('Demo login failed: ' + e.message + '. Make sure DB is seeded.', 'error'); }
}

function handleLogout() {
  localStorage.removeItem('vtu_token');
  currentUser = null;
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('app').style.display = 'block';
  document.getElementById('ai-fab').style.display = 'none';
  showPage('landing-page');
  toast('Logged out successfully', 'info');
}

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ===== SIDEBAR =====
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  document.getElementById('sidebar-close').style.display = sidebar.classList.contains('open') ? 'block' : 'none';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  document.getElementById('sidebar-close').style.display = 'none';
}

// ===== MODAL =====
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }

// ===== INIT APP =====
async function initApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  document.getElementById('ai-fab').style.display = 'flex';
  updateSidebarUser();
  if (currentUser?.role === 'admin') {
    document.getElementById('nav-student').style.display = 'none';
    document.getElementById('nav-admin').style.display = 'block';
    navigate('admin-dashboard');
  } else {
    navigate('dashboard');
  }
  loadNotificationCount();
  // Check badges in background
  setTimeout(() => api('/api/gamification/check-badges', { method: 'POST' }).then(d => {
    if (d.newly_earned?.length) d.newly_earned.forEach(b => toast(`🏆 Badge Unlocked: ${b.name}!`, 'success'));
  }).catch(() => {}), 2000);
}

function updateSidebarUser() {
  if (!currentUser) return;
  const initials = currentUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('topbar-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent = currentUser.name || 'User';
  document.getElementById('topbar-name').textContent = currentUser.name?.split(' ')[0] || 'User';
  document.getElementById('sidebar-branch').textContent = currentUser.branch ? `${currentUser.branch} | Sem ${currentUser.semester}` : currentUser.role;
  document.getElementById('user-role-badge').textContent = currentUser.role === 'admin' ? '🛡️ Admin' : '🎓 Student';
  document.getElementById('sidebar-level').textContent = `Lv.${currentUser.level || 1}`;
  document.getElementById('sidebar-streak').textContent = `🔥 ${currentUser.streak || 0}`;
  document.getElementById('sidebar-points').textContent = `⭐ ${currentUser.points || 0}`;
}

async function loadNotificationCount() {
  try {
    const data = await api('/api/notifications');
    const count = data.unread_count || 0;
    const dot = document.getElementById('notif-count');
    if (count > 0) { dot.textContent = count > 9 ? '9+' : count; dot.style.display = 'flex'; }
    else { dot.style.display = 'none'; }
  } catch {}
}

// ===== SEARCH =====
let searchTimeout;
async function handleGlobalSearch(q) {
  clearTimeout(searchTimeout);
  const dropdown = document.getElementById('search-dropdown');
  if (!q.trim()) { dropdown.style.display = 'none'; return; }
  searchTimeout = setTimeout(async () => {
    try {
      const [resources, subjects] = await Promise.all([
        api(`/api/resources?search=${encodeURIComponent(q)}&limit=5`),
        api(`/api/subjects?search=${encodeURIComponent(q)}`)
      ]);
      const results = document.getElementById('search-results');
      let html = '';
      if (subjects.subjects?.length) {
        html += `<div style="font-size:11px;font-weight:700;color:#64748b;padding:4px 8px;letter-spacing:1px">SUBJECTS</div>`;
        subjects.subjects.slice(0, 3).forEach(s => { html += `<div onclick="navigate('subjects')" class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-indigo-500/10"><i class="fas fa-book text-indigo-400 text-sm"></i><span style="font-size:13px;color:#e2e8f0">${s.name}</span><span class="badge badge-primary" style="font-size:10px">${s.branch_code} Sem${s.semester}</span></div>`; });
      }
      if (resources.resources?.length) {
        html += `<div style="font-size:11px;font-weight:700;color:#64748b;padding:4px 8px;letter-spacing:1px;margin-top:8px">RESOURCES</div>`;
        resources.resources.slice(0, 4).forEach(r => { html += `<div onclick="openResourceModal(${r.id})" class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-indigo-500/10"><i class="fas fa-file-pdf text-purple-400 text-sm"></i><span style="font-size:13px;color:#e2e8f0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</span><span class="badge badge-purple" style="font-size:10px">${r.type}</span></div>`; });
      }
      if (!html) html = `<div style="text-align:center;color:#64748b;padding:16px;font-size:13px">No results for "${q}"</div>`;
      results.innerHTML = html;
      dropdown.style.display = 'block';
    } catch {}
  }, 300);
}
document.addEventListener('click', e => {
  if (!e.target.closest('#global-search') && !e.target.closest('#search-dropdown')) {
    document.getElementById('search-dropdown').style.display = 'none';
  }
});

// ===== DASHBOARD =====
async function renderDashboard() {
  const data = await api('/api/users/dashboard');
  const { profile, quizStats, progress, recentQuizzes, notifications, bookmarks, todayChallenge, exams, announcements } = data;
  currentUser = { ...currentUser, ...profile };
  updateSidebarUser();
  const levelProgress = Math.min(100, Math.round(((profile.points - (profile.level - 1) * 500) / 500) * 100));
  document.getElementById('page-content').innerHTML = `
    <div>
      <!-- Welcome banner -->
      <div class="card p-6 mb-6" style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-color:#4338ca">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div style="color:#a5b4fc;font-size:13px;margin-bottom:4px">Good ${getGreeting()},</div>
            <h1 class="text-2xl font-black" style="color:#e2e8f0">Welcome back, ${profile.name?.split(' ')[0]} 👋</h1>
            <div style="color:#94a3b8;margin-top:4px;font-size:14px">${profile.branch || 'Engineering'} • Semester ${profile.semester} • Keep learning!</div>
            <div class="flex items-center gap-3 mt-4">
              <div class="flex items-center gap-2">
                <span style="font-size:13px;color:#a5b4fc">Level ${profile.level}</span>
                <div style="width:120px;height:6px;background:rgba(255,255,255,0.1);border-radius:999px;overflow:hidden">
                  <div style="width:${levelProgress}%;height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:999px"></div>
                </div>
                <span style="font-size:11px;color:#818cf8">${levelProgress}%</span>
              </div>
              <span class="streak-badge">🔥 ${profile.streak} day streak</span>
              <span class="level-badge">⭐ ${profile.points} pts</span>
            </div>
          </div>
          <div class="text-right">
            <div style="font-size:48px">${profile.branch === 'CSE' ? '💻' : profile.branch === 'ECE' ? '📡' : profile.branch === 'ME' ? '⚙️' : '🎓'}</div>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Quizzes Done</div>
              <div class="text-3xl font-black mt-1" style="color:#6366f1">${quizStats?.total || 0}</div>
            </div>
            <div style="width:44px;height:44px;background:rgba(99,102,241,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">🧪</div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Avg Score</div>
              <div class="text-3xl font-black mt-1" style="color:#10b981">${quizStats?.avg_score || 0}%</div>
            </div>
            <div style="width:44px;height:44px;background:rgba(16,185,129,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">📈</div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Subjects</div>
              <div class="text-3xl font-black mt-1" style="color:#f59e0b">${progress?.length || 0}</div>
            </div>
            <div style="width:44px;height:44px;background:rgba(245,158,11,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">📚</div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Points</div>
              <div class="text-3xl font-black mt-1" style="color:#8b5cf6">${profile.points}</div>
            </div>
            <div style="width:44px;height:44px;background:rgba(139,92,246,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">⭐</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Left column (2/3) -->
        <div class="col-span-2 space-y-6">
          <!-- Today's Challenge -->
          ${todayChallenge ? renderChallengeCard(todayChallenge) : ''}

          <!-- Exam Countdown -->
          ${exams?.length ? `<div class="card p-5">
            <h3 class="font-bold mb-4 flex items-center gap-2" style="color:#e2e8f0"><i class="fas fa-clock text-red-400"></i> Upcoming Exams</h3>
            <div class="space-y-3">
              ${exams.map(ex => `<div class="flex items-center justify-between p-3 rounded-xl" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)">
                <div><div class="font-semibold text-sm" style="color:#e2e8f0">${ex.title}</div><div style="color:#64748b;font-size:12px">${ex.description || ''}</div></div>
                <div class="text-right">
                  <div class="text-xl font-black" style="color:${ex.days_left <= 7 ? '#ef4444' : ex.days_left <= 30 ? '#f59e0b' : '#10b981'}">${ex.days_left}d</div>
                  <div style="font-size:11px;color:#64748b">days left</div>
                </div>
              </div>`).join('')}
            </div>
          </div>` : ''}

          <!-- Subject Progress -->
          ${progress?.length ? `<div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold" style="color:#e2e8f0"><i class="fas fa-chart-line text-blue-400 mr-2"></i>Study Progress</h3>
              <button onclick="navigate('progress')" style="font-size:12px;color:#818cf8;background:none;border:none;cursor:pointer">View all →</button>
            </div>
            <div class="space-y-3">
              ${progress.map(p => `<div>
                <div class="flex justify-between items-center mb-1">
                  <span style="font-size:13px;color:#e2e8f0">${p.subject_name}</span>
                  <span style="font-size:12px;color:#64748b">${Math.round(p.completion_percentage)}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${p.completion_percentage}%"></div></div>
              </div>`).join('')}
            </div>
          </div>` : ''}

          <!-- Recent Quizzes -->
          ${recentQuizzes?.length ? `<div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold" style="color:#e2e8f0"><i class="fas fa-history text-purple-400 mr-2"></i>Recent Quizzes</h3>
              <button onclick="navigate('quiz')" style="font-size:12px;color:#818cf8;background:none;border:none;cursor:pointer">Take more →</button>
            </div>
            <div class="space-y-2">
              ${recentQuizzes.map(q => `<div class="flex items-center justify-between p-3 rounded-xl" style="background:rgba(255,255,255,0.03)">
                <div>
                  <div class="font-medium text-sm" style="color:#e2e8f0">${q.title}</div>
                  <div style="font-size:11px;color:#64748b">${q.difficulty} • ${new Date(q.completed_at).toLocaleDateString()}</div>
                </div>
                <div class="badge ${q.percentage >= 70 ? 'badge-success' : q.percentage >= 50 ? 'badge-warning' : 'badge-danger'}">${q.percentage}%</div>
              </div>`).join('')}
            </div>
          </div>` : `<div class="card p-5"><div class="empty-state" style="padding:24px"><div class="empty-icon">🧪</div><p style="color:#64748b">No quizzes taken yet</p><button onclick="navigate('quiz')" class="btn-primary mt-3" style="padding:8px 20px">Start a Quiz</button></div></div>`}
        </div>

        <!-- Right column (1/3) -->
        <div class="space-y-4">
          <!-- Announcements -->
          ${announcements?.length ? `<div class="card p-4">
            <h3 class="font-bold mb-3 text-sm" style="color:#e2e8f0"><i class="fas fa-bullhorn text-yellow-400 mr-2"></i>Announcements</h3>
            ${announcements.map(a => `<div class="p-3 mb-2 rounded-lg" style="background:rgba(245,158,11,0.08);border-left:3px solid #f59e0b">
              <div class="font-medium text-sm" style="color:#e2e8f0">${a.title}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px">${a.content.slice(0, 80)}...</div>
            </div>`).join('')}
          </div>` : ''}

          <!-- Quick Actions -->
          <div class="card p-4">
            <h3 class="font-bold mb-3 text-sm" style="color:#e2e8f0">Quick Actions</h3>
            <div class="space-y-2">
              <button onclick="navigate('quiz')" class="w-full text-left p-3 rounded-xl hover:bg-indigo-500/10 transition-all flex items-center gap-3" style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2)">
                <span style="font-size:18px">🧪</span><span style="font-size:13px;color:#a5b4fc;font-weight:600">Take a Quiz</span>
              </button>
              <button onclick="navigate('ai-chat')" class="w-full text-left p-3 rounded-xl hover:bg-purple-500/10 transition-all flex items-center gap-3" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2)">
                <span style="font-size:18px">🤖</span><span style="font-size:13px;color:#c4b5fd;font-weight:600">Ask AI Assistant</span>
              </button>
              <button onclick="navigate('resources')" class="w-full text-left p-3 rounded-xl hover:bg-green-500/10 transition-all flex items-center gap-3" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)">
                <span style="font-size:18px">📚</span><span style="font-size:13px;color:#6ee7b7;font-weight:600">Browse Resources</span>
              </button>
              <button onclick="navigate('placement')" class="w-full text-left p-3 rounded-xl hover:bg-yellow-500/10 transition-all flex items-center gap-3" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2)">
                <span style="font-size:18px">💼</span><span style="font-size:13px;color:#fcd34d;font-weight:600">Placement Prep</span>
              </button>
            </div>
          </div>

          <!-- Bookmarks -->
          ${bookmarks?.length ? `<div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-sm" style="color:#e2e8f0"><i class="fas fa-bookmark text-indigo-400 mr-2"></i>Bookmarks</h3>
              <button onclick="navigate('bookmarks')" style="font-size:11px;color:#818cf8;background:none;border:none;cursor:pointer">All →</button>
            </div>
            ${bookmarks.map(b => `<div class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-indigo-500/10" onclick="openResourceModal(${b.id})">
              <i class="fas fa-file-alt" style="color:#818cf8;font-size:12px"></i>
              <span style="font-size:12px;color:#94a3b8;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.title}</span>
              <span class="badge badge-primary" style="font-size:10px">${b.type}</span>
            </div>`).join('')}
          </div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderChallengeCard(challenge) {
  const content = typeof challenge.content === 'string' ? JSON.parse(challenge.content) : challenge.content;
  if (challenge.completed) {
    return `<div class="card p-5" style="background:linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05));border-color:rgba(16,185,129,0.3)">
      <div class="flex items-center gap-3">
        <span style="font-size:28px">✅</span>
        <div><h3 class="font-bold" style="color:#10b981">Daily Challenge Completed!</h3>
        <p style="color:#64748b;font-size:13px">Come back tomorrow for a new challenge. Keep your streak going! 🔥</p></div>
      </div>
    </div>`;
  }
  return `<div class="card p-5" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05));border-color:rgba(99,102,241,0.3)">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold flex items-center gap-2" style="color:#e2e8f0"><i class="fas fa-fire text-orange-400"></i> Daily Challenge</h3>
      <span class="badge badge-warning">+${challenge.points_reward} pts</span>
    </div>
    <p class="font-medium mb-4" style="color:#c7d2fe;font-size:15px">${content.question}</p>
    <div id="challenge-options" class="space-y-2">
      ${content.options.map((opt, i) => `<button onclick="submitChallenge(${challenge.id}, ${i}, '${escHtml(content.explanation)}')" class="quiz-option w-full text-left text-sm" id="ch-opt-${i}">${String.fromCharCode(65+i)}. ${opt}</button>`).join('')}
    </div>
  </div>`;
}

function escHtml(str) { return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

async function submitChallenge(challengeId, answer, explanation) {
  const btns = document.querySelectorAll('[id^="ch-opt-"]');
  btns.forEach(b => b.disabled = true);
  try {
    const data = await api('/api/challenge/complete', { method: 'POST', body: JSON.stringify({ challenge_id: challengeId, answer }) });
    const color = data.is_correct ? '#10b981' : '#ef4444';
    const msg = data.is_correct ? `✅ Correct! +${data.points_earned} points` : `❌ Wrong! +${data.points_earned} points for trying`;
    toast(msg, data.is_correct ? 'success' : 'warning');
    document.getElementById('challenge-options').innerHTML += `<div style="margin-top:12px;padding:12px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2)"><p style="color:#a5b4fc;font-size:13px"><strong>Explanation:</strong> ${explanation}</p></div>`;
    currentUser.points = (currentUser.points || 0) + data.points_earned;
    updateSidebarUser();
  } catch (e) { toast(e.message, 'error'); btns.forEach(b => b.disabled = false); }
}

// ===== SUBJECTS =====
async function renderSubjects() {
  const { branches: allBranches, grouped } = await api('/api/branches');
  const branches = allBranches;
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Browse Subjects</h2><p style="color:#64748b;margin-top:4px">All VTU branches and semesters</p></div>
      </div>
      <!-- Branch filter tabs -->
      <div class="flex gap-2 mb-6 flex-wrap" id="branch-tabs">
        <button class="tab active" onclick="filterBranch(null, this)">All Branches</button>
        ${Object.keys(grouped).map(cat => `<button class="tab" onclick="filterBranch('${cat}', this)">${cat}</button>`).join('')}
      </div>
      <!-- Branches grid -->
      <div class="grid grid-cols-3 gap-4" id="branches-grid">
        ${branches.map(b => `
          <div class="card p-5 cursor-pointer hover:border-indigo-500 transition-all" onclick="loadBranchDetail('${b.code}')">
            <div class="flex items-center gap-3 mb-3">
              <span style="font-size:28px">${b.icon}</span>
              <div>
                <div class="font-bold" style="color:#e2e8f0">${b.code}</div>
                <div style="font-size:12px;color:#64748b">${b.category}</div>
              </div>
            </div>
            <div class="font-medium text-sm mb-2" style="color:#c7d2fe">${b.name}</div>
            <div style="font-size:12px;color:#64748b;line-height:1.5">${b.description}</div>
            <div class="flex items-center justify-between mt-4 pt-3" style="border-top:1px solid rgba(255,255,255,0.05)">
              <span style="font-size:12px;color:#64748b">${b.total_semesters} Semesters</span>
              <button class="badge badge-primary" style="cursor:pointer">Explore →</button>
            </div>
          </div>
        `).join('')}
      </div>
      <!-- Branch Detail -->
      <div id="branch-detail" style="display:none;margin-top:24px"></div>
    </div>
  `;
}

function filterBranch(category, btn) {
  document.querySelectorAll('#branch-tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const cards = document.querySelectorAll('#branches-grid > div');
  cards.forEach(card => {
    const catEl = card.querySelector('div[style*="color:#64748b"]');
    if (!category || catEl?.textContent === category) card.style.display = 'block';
    else card.style.display = 'none';
  });
}

async function loadBranchDetail(code) {
  const detail = document.getElementById('branch-detail');
  detail.style.display = 'block';
  detail.innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div></div>`;
  detail.scrollIntoView({ behavior: 'smooth' });
  const data = await api(`/api/branches/${code}`);
  const { branch, bySemester } = data;
  detail.innerHTML = `
    <div class="card p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <span style="font-size:36px">${branch.icon}</span>
          <div>
            <h3 class="text-xl font-black" style="color:#e2e8f0">${branch.name}</h3>
            <div style="color:#64748b;font-size:13px">${branch.description}</div>
          </div>
        </div>
        <button onclick="document.getElementById('branch-detail').style.display='none'" style="background:none;border:none;cursor:pointer;color:#64748b;font-size:20px"><i class="fas fa-times"></i></button>
      </div>
      <div id="sem-tabs" class="flex gap-2 mb-6 flex-wrap">
        ${Object.keys(bySemester).map((sem, i) => `<button class="tab ${i===0?'active':''}" onclick="filterSem(${sem}, this)">Sem ${sem}</button>`).join('')}
      </div>
      ${Object.entries(bySemester).map(([sem, subjects], idx) => `
        <div class="sem-block ${idx===0?'':'hidden'}" data-sem="${sem}">
          <div class="grid grid-cols-2 gap-3">
            ${subjects.map(s => `<div class="p-4 rounded-xl cursor-pointer hover:border-indigo-500 transition-all" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)" onclick="loadSubjectDetail(${s.id}, '${escHtml(s.name)}')">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-semibold text-sm" style="color:#e2e8f0">${s.name}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px">${s.code} • ${s.credits} Credits</div>
                </div>
                <span class="badge badge-primary" style="font-size:10px">Sem ${s.semester}</span>
              </div>
              ${s.description ? `<div style="font-size:11px;color:#94a3b8;margin-top:8px;line-height:1.5">${s.description}</div>` : ''}
              <button class="mt-3 text-xs" style="color:#818cf8;background:none;border:none;cursor:pointer">View Resources →</button>
            </div>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    <div id="subject-detail" style="margin-top:16px"></div>
  `;
}

function filterSem(sem, btn) {
  document.querySelectorAll('#sem-tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.sem-block').forEach(b => {
    b.classList.toggle('hidden', b.dataset.sem !== String(sem));
  });
}

async function loadSubjectDetail(id, name) {
  const detail = document.getElementById('subject-detail');
  if (!detail) return;
  detail.innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div></div>`;
  detail.scrollIntoView({ behavior: 'smooth' });
  const { subject, resources, quizzes } = await api(`/api/subjects/${id}`);
  const typeIcons = { notes: '📝', textbook: '📖', question_paper: '📋', lab_manual: '🔬', syllabus: '📄', video: '🎬' };
  detail.innerHTML = `
    <div class="card p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-bold" style="color:#e2e8f0">${subject.name}</h3>
          <div style="color:#64748b;font-size:13px">${subject.code} • ${subject.credits} Credits • ${subject.branch_name}</div>
        </div>
        <button onclick="document.getElementById('subject-detail').innerHTML=''" style="background:none;border:none;cursor:pointer;color:#64748b"><i class="fas fa-times"></i></button>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold mb-3 text-sm" style="color:#a5b4fc">📚 Resources (${resources.length})</h4>
          ${resources.length ? resources.map(r => `<div class="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer hover:bg-indigo-500/10 resource-type-${r.type}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)" onclick="openResourceModal(${r.id})">
            <span style="font-size:18px">${typeIcons[r.type] || '📄'}</span>
            <div style="flex:1;min-width:0">
              <div class="font-medium text-sm" style="color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</div>
              <div style="font-size:11px;color:#64748b">${r.type} • ${r.download_count} downloads</div>
            </div>
            ${r.is_important ? '<span class="badge badge-warning" style="font-size:10px">⭐ Important</span>' : ''}
          </div>`).join('') : `<div style="color:#64748b;font-size:13px;padding:16px;text-align:center">No resources yet</div>`}
        </div>
        <div>
          <h4 class="font-semibold mb-3 text-sm" style="color:#a5b4fc">🧪 Quizzes (${quizzes.length})</h4>
          ${quizzes.length ? quizzes.map(q => `<div class="p-3 rounded-xl mb-2 cursor-pointer hover:bg-indigo-500/10" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)" onclick="startQuiz(${q.id}, '${escHtml(q.title)}')">
            <div class="font-medium text-sm" style="color:#e2e8f0">${q.title}</div>
            <div class="flex items-center gap-2 mt-1">
              <span style="font-size:11px;color:#64748b">${q.question_count} questions • ${q.duration_minutes} min</span>
              <span class="badge ${q.difficulty==='easy'?'badge-success':q.difficulty==='hard'?'badge-danger':'badge-warning'}" style="font-size:10px">${q.difficulty}</span>
            </div>
          </div>`).join('') : `<div style="color:#64748b;font-size:13px;padding:16px;text-align:center">No quizzes yet</div>`}
          <button onclick="navigate('ai-chat')" class="btn-secondary w-full mt-3" style="padding:10px;font-size:13px"><i class="fas fa-robot mr-2"></i>Ask AI about ${subject.name}</button>
        </div>
      </div>
    </div>
  `;
}

// ===== RESOURCES =====
async function renderResources(branch = '', semester = '', type = '') {
  const branchParam = branch || currentUser?.branch || '';
  const semParam = semester || currentUser?.semester || '';
  const data = await api(`/api/resources?branch=${branchParam}&semester=${semParam}&type=${type}&limit=30`);
  const resources = data.resources || [];
  const typeIcons = { notes: '📝', textbook: '📖', question_paper: '📋', lab_manual: '🔬', syllabus: '📄', video: '🎬', link: '🔗' };
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Study Resources</h2><p style="color:#64748b;margin-top:4px">${data.total || resources.length} resources available</p></div>
      </div>
      <!-- Filters -->
      <div class="card p-4 mb-6">
        <div class="flex gap-3 flex-wrap">
          <select class="input-field" style="flex:1;min-width:140px" id="filter-branch" onchange="applyResourceFilters()">
            <option value="">All Branches</option>
            <option value="CSE" ${branchParam==='CSE'?'selected':''}>CSE</option>
            <option value="ISE" ${branchParam==='ISE'?'selected':''}>ISE</option>
            <option value="AIML" ${branchParam==='AIML'?'selected':''}>AI & ML</option>
            <option value="ECE" ${branchParam==='ECE'?'selected':''}>ECE</option>
            <option value="ME" ${branchParam==='ME'?'selected':''}>Mechanical</option>
            <option value="CV" ${branchParam==='CV'?'selected':''}>Civil</option>
          </select>
          <select class="input-field" style="flex:1;min-width:120px" id="filter-sem" onchange="applyResourceFilters()">
            <option value="">All Semesters</option>
            ${[1,2,3,4,5,6,7,8].map(s => `<option value="${s}" ${semParam==s?'selected':''}>Semester ${s}</option>`).join('')}
          </select>
          <select class="input-field" style="flex:1;min-width:140px" id="filter-type" onchange="applyResourceFilters()">
            <option value="">All Types</option>
            <option value="notes">📝 Notes</option>
            <option value="textbook">📖 Textbooks</option>
            <option value="question_paper">📋 Question Papers</option>
            <option value="lab_manual">🔬 Lab Manuals</option>
            <option value="syllabus">📄 Syllabus</option>
            <option value="video">🎬 Videos</option>
          </select>
          <input type="text" class="input-field" style="flex:2;min-width:200px" id="filter-search" placeholder="Search resources..." oninput="applyResourceFilters()">
        </div>
      </div>
      <!-- Resource Type Tabs -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button class="tab active" onclick="filterResourceType('', this)">All</button>
        ${Object.entries(typeIcons).map(([t, ic]) => `<button class="tab" onclick="filterResourceType('${t}', this)">${ic} ${t.replace('_',' ')}</button>`).join('')}
      </div>
      <!-- Resources Grid -->
      <div class="grid grid-cols-3 gap-4" id="resources-grid">
        ${resources.length ? resources.map(r => renderResourceCard(r, typeIcons)).join('') : `<div class="col-span-3 empty-state"><div class="empty-icon">📂</div><h3 style="color:#e2e8f0">No resources found</h3><p style="color:#64748b">Try changing filters or check back later</p></div>`}
      </div>
    </div>
  `;
}

function renderResourceCard(r, typeIcons = {notes:'📝',textbook:'📖',question_paper:'📋',lab_manual:'🔬',syllabus:'📄',video:'🎬'}) {
  return `<div class="card p-4 cursor-pointer resource-type-${r.type}" onclick="openResourceModal(${r.id})">
    <div class="flex items-start justify-between mb-3">
      <span style="font-size:24px">${typeIcons[r.type] || '📄'}</span>
      <div class="flex gap-1">
        ${r.is_important ? '<span class="badge badge-warning" style="font-size:10px">⭐</span>' : ''}
        <span class="badge badge-primary" style="font-size:10px">${r.type}</span>
      </div>
    </div>
    <h4 class="font-semibold text-sm mb-1" style="color:#e2e8f0;line-height:1.4">${r.title}</h4>
    ${r.subject_name ? `<div style="font-size:11px;color:#818cf8;margin-bottom:4px">${r.subject_name}</div>` : ''}
    ${r.description ? `<div style="font-size:11px;color:#64748b;margin-top:4px;line-height:1.4">${r.description.slice(0, 60)}${r.description.length > 60 ? '...' : ''}</div>` : ''}
    <div class="flex items-center justify-between mt-4 pt-3" style="border-top:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;color:#475569">
        <i class="fas fa-download mr-1"></i>${r.download_count} <i class="fas fa-eye ml-2 mr-1"></i>${r.view_count}
      </div>
      <div class="flex gap-2">
        <button onclick="event.stopPropagation();toggleBookmark(${r.id})" style="background:none;border:none;cursor:pointer;color:#64748b;font-size:14px" title="Bookmark"><i class="fas fa-bookmark"></i></button>
        <button onclick="event.stopPropagation();downloadResource(${r.id})" style="background:none;border:none;cursor:pointer;color:#818cf8;font-size:14px" title="Download"><i class="fas fa-download"></i></button>
      </div>
    </div>
  </div>`;
}

async function applyResourceFilters() {
  const branch = document.getElementById('filter-branch')?.value || '';
  const sem = document.getElementById('filter-sem')?.value || '';
  const type = document.getElementById('filter-type')?.value || '';
  const search = document.getElementById('filter-search')?.value || '';
  const data = await api(`/api/resources?branch=${branch}&semester=${sem}&type=${type}&search=${encodeURIComponent(search)}&limit=30`);
  const typeIcons = { notes: '📝', textbook: '📖', question_paper: '📋', lab_manual: '🔬', syllabus: '📄', video: '🎬', link: '🔗' };
  const grid = document.getElementById('resources-grid');
  if (grid) grid.innerHTML = data.resources?.length ? data.resources.map(r => renderResourceCard(r, typeIcons)).join('') : `<div class="col-span-3 empty-state"><div class="empty-icon">📂</div><p style="color:#64748b">No resources found</p></div>`;
}

function filterResourceType(type, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('filter-type').value = type;
  applyResourceFilters();
}

async function openResourceModal(id) {
  openModal('resource-modal');
  document.getElementById('resource-modal-content').innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div></div>`;
  try {
    const { resource } = await api(`/api/resources/${id}`);
    const typeIcons = { notes: '📝', textbook: '📖', question_paper: '📋', lab_manual: '🔬', syllabus: '📄', video: '🎬' };
    document.getElementById('resource-modal-title').textContent = resource.title;
    document.getElementById('resource-modal-content').innerHTML = `
      <div class="flex items-start gap-4 mb-6">
        <span style="font-size:48px">${typeIcons[resource.type] || '📄'}</span>
        <div>
          <div class="flex gap-2 mb-2">
            <span class="badge badge-primary">${resource.type}</span>
            ${resource.is_important ? '<span class="badge badge-warning">⭐ Important</span>' : ''}
            ${resource.branch_code ? `<span class="badge badge-purple">${resource.branch_code}</span>` : ''}
          </div>
          <div style="color:#94a3b8;font-size:13px">${resource.subject_name || 'General Resource'} • ${resource.branch_code || ''} ${resource.semester ? 'Sem '+resource.semester : ''}</div>
          ${resource.description ? `<p style="color:#94a3b8;font-size:14px;margin-top:8px;line-height:1.6">${resource.description}</p>` : ''}
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="text-center p-3 rounded-xl" style="background:rgba(99,102,241,0.1)">
          <div class="text-xl font-bold" style="color:#818cf8">${resource.download_count}</div>
          <div style="font-size:11px;color:#64748b">Downloads</div>
        </div>
        <div class="text-center p-3 rounded-xl" style="background:rgba(16,185,129,0.1)">
          <div class="text-xl font-bold" style="color:#10b981">${resource.view_count}</div>
          <div style="font-size:11px;color:#64748b">Views</div>
        </div>
        <div class="text-center p-3 rounded-xl" style="background:rgba(245,158,11,0.1)">
          <div class="text-xl font-bold" style="color:#f59e0b">${resource.uploader_name || 'Admin'}</div>
          <div style="font-size:11px;color:#64748b">Uploaded by</div>
        </div>
      </div>
      ${resource.type === 'video' ? `
        <div class="mb-4">
          <iframe src="${resource.file_url?.includes('youtube') ? resource.file_url.replace('watch?v=','embed/') : resource.file_url}" width="100%" height="300" frameborder="0" allowfullscreen style="border-radius:12px"></iframe>
        </div>` : `
        <div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-size:13px;color:#a5b4fc;margin-bottom:8px"><i class="fas fa-file-pdf mr-2"></i>PDF Preview</div>
          <p style="color:#64748b;font-size:13px">Click "Open PDF" to view in browser or "Download" to save.</p>
        </div>`}
      <div class="flex gap-3">
        <a href="${resource.file_url}" target="_blank" class="btn-primary flex-1 text-center" style="text-decoration:none;padding:12px" onclick="downloadResource(${resource.id})">
          <i class="fas fa-external-link-alt mr-2"></i>Open PDF
        </a>
        <button onclick="downloadResource(${resource.id})" class="btn-secondary flex-1" style="padding:12px">
          <i class="fas fa-download mr-2"></i>Download (+5 pts)
        </button>
        <button onclick="toggleBookmark(${resource.id})" style="padding:12px 16px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fcd34d;border-radius:10px;cursor:pointer;font-weight:600">
          <i class="fas fa-bookmark mr-1"></i>Bookmark
        </button>
      </div>
    `;
  } catch(e) { document.getElementById('resource-modal-content').innerHTML = `<div style="color:#ef4444;padding:20px">${e.message}</div>`; }
}

async function downloadResource(id) {
  try {
    const data = await api(`/api/resources/${id}/download`, { method: 'POST' });
    toast('+5 points earned for download! 📥', 'success');
    if (data.file_url) window.open(data.file_url, '_blank');
    currentUser.points = (currentUser.points || 0) + 5;
    updateSidebarUser();
  } catch(e) { toast(e.message, 'error'); }
}

async function toggleBookmark(id) {
  try {
    const data = await api(`/api/resources/${id}/bookmark`, { method: 'POST' });
    toast(data.bookmarked ? '🔖 Bookmarked!' : 'Bookmark removed', data.bookmarked ? 'success' : 'info');
  } catch(e) { toast(e.message, 'error'); }
}

// ===== AI CHAT =====
let currentSessionId = null;
let aiSessions = [];

async function renderAIChat() {
  const sessions = await api('/api/ai/sessions');
  aiSessions = sessions.sessions || [];
  document.getElementById('page-content').innerHTML = `
    <div class="flex gap-4" style="height:calc(100vh - 120px)">
      <!-- Sessions sidebar -->
      <div class="card p-4" style="width:240px;flex-shrink:0;overflow-y:auto">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-sm" style="color:#e2e8f0">💬 Chats</h3>
          <button onclick="startNewChat()" class="badge badge-primary" style="cursor:pointer;font-size:11px">+ New</button>
        </div>
        <div id="sessions-list">
          ${aiSessions.map(s => `<div onclick="loadSession(${s.id})" class="p-2 rounded-lg cursor-pointer hover:bg-indigo-500/10 mb-1" style="background:rgba(255,255,255,0.03)">
            <div style="font-size:12px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</div>
            <div style="font-size:10px;color:#64748b">${new Date(s.updated_at).toLocaleDateString()}</div>
          </div>`).join('') || `<div style="color:#64748b;font-size:12px;text-align:center;padding:16px">No chats yet</div>`}
        </div>
      </div>
      <!-- Chat area -->
      <div class="card flex flex-col" style="flex:1;overflow:hidden">
        <!-- Chat header -->
        <div class="flex items-center justify-between p-4" style="border-bottom:1px solid rgba(255,255,255,0.05)">
          <div class="flex items-center gap-3">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px">🤖</div>
            <div>
              <div class="font-bold text-sm" style="color:#e2e8f0">VTU AI Study Assistant</div>
              <div style="font-size:11px;color:#10b981">● Online • Subject-aware AI</div>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="generateQuestions()" class="badge badge-purple" style="cursor:pointer;padding:6px 12px">📝 Gen Questions</button>
            <button onclick="startNewChat()" class="badge badge-primary" style="cursor:pointer;padding:6px 12px">+ New Chat</button>
          </div>
        </div>
        <!-- Messages -->
        <div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px">
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:16px">🤖</div>
            <h3 class="font-bold gradient-text text-lg">VTU AI Study Assistant</h3>
            <p style="color:#64748b;font-size:14px;margin-top:8px;max-width:400px;margin-left:auto;margin-right:auto">Ask me anything about VTU subjects, exam preparation, placement tips, or get concept explanations with examples.</p>
            <div class="grid grid-cols-2 gap-2 mt-6 max-w-md mx-auto">
              ${['Explain Binary Trees with examples','Important questions for DBMS exam','How to prepare for TCS placement?','Study tips for VTU exams'].map(q => `<button onclick="sendSuggestion('${q}')" class="p-3 rounded-xl text-left text-sm hover:bg-indigo-500/20 transition-all" style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);color:#a5b4fc">${q}</button>`).join('')}
            </div>
          </div>
        </div>
        <!-- Input -->
        <div class="p-4" style="border-top:1px solid rgba(255,255,255,0.05)">
          <div class="flex gap-3 items-end">
            <div style="flex:1">
              <textarea id="chat-input" class="input-field" rows="2" placeholder="Ask about any VTU subject, exam tips, placement prep..." style="resize:none" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage()}" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
            </div>
            <div class="flex flex-col gap-2">
              <button onclick="sendMessage()" class="btn-primary" style="padding:10px 18px">
                <i class="fas fa-paper-plane"></i>
              </button>
              <button onclick="startVoiceInput()" id="voice-btn" style="padding:10px 18px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:10px;cursor:pointer;color:#c4b5fd" title="Voice input">
                <i class="fas fa-microphone"></i>
              </button>
            </div>
          </div>
          <div style="font-size:11px;color:#475569;margin-top:6px">Press Enter to send • Shift+Enter for new line • +3 pts per message</div>
        </div>
      </div>
    </div>
  `;
}

function sendSuggestion(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  input.style.height = 'auto';
  appendMessage('user', msg);
  const typing = appendTyping();
  try {
    const data = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message: msg, session_id: currentSessionId }) });
    typing.remove();
    appendMessage('assistant', data.response);
    currentSessionId = data.session_id;
    currentUser.points = (currentUser.points || 0) + 3;
    updateSidebarUser();
  } catch(e) { typing.remove(); appendMessage('assistant', '❌ Error: ' + e.message); }
}

function appendMessage(role, content) {
  const container = document.getElementById('chat-messages');
  const isUser = role === 'user';
  const div = document.createElement('div');
  div.style.cssText = `display:flex;gap:10px;${isUser ? 'flex-direction:row-reverse' : ''}`;
  div.innerHTML = `
    <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;${isUser ? 'background:linear-gradient(135deg,#6366f1,#8b5cf6)' : 'background:linear-gradient(135deg,#1e1b4b,#312e81);border:1px solid #4338ca'};display:flex;align-items:center;justify-content:center;font-size:14px">${isUser ? '👤' : '🤖'}</div>
    <div style="max-width:75%;${isUser ? 'background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3)' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)'};border-radius:${isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};padding:12px 16px">
      ${isUser ? `<p style="color:#e2e8f0;font-size:14px;line-height:1.6">${content}</p>` : `<div class="markdown" style="font-size:14px;line-height:1.7;color:#c7d2fe">${marked.parse(content)}</div>`}
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function appendTyping() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:10px';
  div.innerHTML = `
    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1e1b4b,#312e81);border:1px solid #4338ca;display:flex;align-items:center;justify-content:center;font-size:14px">🤖</div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:4px 16px 16px 16px;padding:14px 18px">
      <div style="display:flex;gap:4px;align-items:center">
        <span style="width:8px;height:8px;background:#6366f1;border-radius:50%;animation:pulse 1s infinite"></span>
        <span style="width:8px;height:8px;background:#8b5cf6;border-radius:50%;animation:pulse 1s infinite 0.2s"></span>
        <span style="width:8px;height:8px;background:#a78bfa;border-radius:50%;animation:pulse 1s infinite 0.4s"></span>
      </div>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

async function loadSession(id) {
  const data = await api(`/api/ai/sessions/${id}`);
  currentSessionId = id;
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  (data.session.messages || []).forEach(m => appendMessage(m.role, m.content));
}

function startNewChat() {
  currentSessionId = null;
  const container = document.getElementById('chat-messages');
  container.innerHTML = `<div style="text-align:center;padding:40px 20px">
    <div style="font-size:48px;margin-bottom:16px">🤖</div>
    <h3 class="font-bold gradient-text text-lg">New Chat Started</h3>
    <p style="color:#64748b;font-size:14px;margin-top:8px">What would you like to learn today?</p>
  </div>`;
}

async function generateQuestions() {
  const subject = prompt('Enter subject name (e.g., Data Structures):');
  const topic = prompt('Enter specific topic (e.g., Binary Trees):');
  if (!subject || !topic) return;
  appendMessage('user', `Generate important questions for ${subject} - Topic: ${topic}`);
  const typing = appendTyping();
  try {
    const data = await api('/api/ai/generate-questions', { method: 'POST', body: JSON.stringify({ subject, topic, difficulty: 'medium', count: 8 }) });
    typing.remove();
    const response = `## 📝 Important Questions: ${subject} - ${topic}\n\n${data.questions.map((q, i) => `**${i+1}.** ${q}`).join('\n\n')}`;
    appendMessage('assistant', response);
  } catch(e) { typing.remove(); appendMessage('assistant', '❌ ' + e.message); }
}

function startVoiceInput() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    toast('Voice input not supported in this browser. Try Chrome.', 'warning'); return;
  }
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRec();
  recognition.lang = 'en-IN';
  recognition.onstart = () => { document.getElementById('voice-btn').style.color = '#ef4444'; toast('🎙️ Listening...', 'info'); };
  recognition.onresult = e => { document.getElementById('chat-input').value = e.results[0][0].transcript; };
  recognition.onend = () => { document.getElementById('voice-btn').style.color = '#c4b5fd'; };
  recognition.start();
}

// ===== QUIZ =====
async function renderQuizList() {
  const data = await api(`/api/quiz?branch=${currentUser?.branch || ''}`);
  const quizzes = data.quizzes || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Practice Quizzes</h2><p style="color:#64748b;margin-top:4px">${quizzes.length} quizzes available</p></div>
      </div>
      <!-- Filters -->
      <div class="flex gap-3 mb-6 flex-wrap">
        <select class="input-field" style="width:160px" id="q-difficulty" onchange="filterQuizzes()">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
        <select class="input-field" style="width:160px" id="q-branch" onchange="filterQuizzes()">
          <option value="">All Branches</option>
          <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="ME">Mechanical</option>
        </select>
      </div>
      <div class="grid grid-cols-3 gap-4" id="quiz-grid">
        ${quizzes.map(q => `
          <div class="card p-5 cursor-pointer" onclick="startQuiz(${q.id}, '${escHtml(q.title)}')">
            <div class="flex items-center justify-between mb-3">
              <span class="badge ${q.difficulty==='easy'?'badge-success':q.difficulty==='hard'?'badge-danger':'badge-warning'}">${q.difficulty.toUpperCase()}</span>
              <span style="font-size:11px;color:#64748b">${q.question_count} questions</span>
            </div>
            <h3 class="font-bold mb-2" style="color:#e2e8f0;font-size:15px">${q.title}</h3>
            ${q.description ? `<p style="color:#64748b;font-size:12px;margin-bottom:12px">${q.description}</p>` : ''}
            <div class="flex items-center gap-2 flex-wrap">
              ${q.branch_code ? `<span class="badge badge-primary" style="font-size:10px">${q.branch_code}</span>` : ''}
              ${q.semester ? `<span class="badge badge-purple" style="font-size:10px">Sem ${q.semester}</span>` : ''}
              ${q.subject_name ? `<span class="badge badge-primary" style="font-size:10px">${q.subject_name}</span>` : ''}
            </div>
            <div class="flex items-center justify-between mt-4 pt-3" style="border-top:1px solid rgba(255,255,255,0.05)">
              <span style="font-size:12px;color:#64748b"><i class="fas fa-clock mr-1"></i>${q.duration_minutes} min</span>
              <span style="font-size:12px;color:#64748b">Pass: ${q.passing_score}%</span>
              <button class="badge badge-primary" style="cursor:pointer">Start →</button>
            </div>
          </div>
        `).join('') || `<div class="col-span-3 empty-state"><div class="empty-icon">🧪</div><h3 style="color:#e2e8f0">No quizzes yet</h3></div>`}
      </div>
      <!-- Recent attempts -->
      <div class="mt-8">
        <h3 class="font-bold mb-4 text-lg" style="color:#e2e8f0">Recent Attempts</h3>
        <div id="quiz-attempts-list"></div>
      </div>
    </div>
  `;
  // Load attempts
  api('/api/quiz/attempts/my').then(d => {
    const list = document.getElementById('quiz-attempts-list');
    if (!list) return;
    if (!d.attempts?.length) { list.innerHTML = `<div style="color:#64748b;font-size:13px">No attempts yet</div>`; return; }
    list.innerHTML = `<div class="grid grid-cols-2 gap-3">
      ${d.attempts.map(a => `<div class="card p-4">
        <div class="flex items-center justify-between">
          <div><div class="font-medium text-sm" style="color:#e2e8f0">${a.quiz_title}</div>
          <div style="font-size:11px;color:#64748b">${new Date(a.completed_at).toLocaleDateString()} • ${a.difficulty}</div></div>
          <div class="badge ${a.percentage >= 70 ? 'badge-success' : a.percentage >= 50 ? 'badge-warning' : 'badge-danger'}">${a.percentage}%</div>
        </div>
      </div>`).join('')}
    </div>`;
  }).catch(() => {});
}

async function filterQuizzes() {
  const diff = document.getElementById('q-difficulty')?.value || '';
  const branch = document.getElementById('q-branch')?.value || '';
  const data = await api(`/api/quiz?difficulty=${diff}&branch=${branch}`);
  const grid = document.getElementById('quiz-grid');
  if (grid) grid.innerHTML = data.quizzes?.length ? data.quizzes.map(q => `<div class="card p-5 cursor-pointer" onclick="startQuiz(${q.id},'${escHtml(q.title)}')">
    <div class="flex items-center justify-between mb-3"><span class="badge ${q.difficulty==='easy'?'badge-success':q.difficulty==='hard'?'badge-danger':'badge-warning'}">${q.difficulty}</span><span style="font-size:11px;color:#64748b">${q.question_count} questions</span></div>
    <h3 class="font-bold mb-2" style="color:#e2e8f0">${q.title}</h3>
    <div class="flex items-center justify-between mt-3 pt-3" style="border-top:1px solid rgba(255,255,255,0.05)"><span style="font-size:12px;color:#64748b"><i class="fas fa-clock mr-1"></i>${q.duration_minutes} min</span><button class="badge badge-primary" style="cursor:pointer">Start →</button></div>
  </div>`).join('') : `<div class="col-span-3 empty-state"><div class="empty-icon">🧪</div><p style="color:#64748b">No quizzes found</p></div>`;
}

async function startQuiz(id, title) {
  const data = await api(`/api/quiz/${id}`);
  const { quiz, questions } = data;
  if (!questions.length) { toast('No questions in this quiz', 'warning'); return; }
  quizState = { id, questions, answers: {}, startTime: Date.now(), current: 0, duration: quiz.duration_minutes * 60 };
  renderQuizPage(quiz, questions);
}

function renderQuizPage(quiz, questions) {
  document.getElementById('page-content').innerHTML = `
    <div class="max-w-3xl mx-auto">
      <!-- Quiz header -->
      <div class="card p-5 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold" style="color:#e2e8f0">${quiz.title}</h2>
            <div style="color:#64748b;font-size:13px">${quiz.total_questions} questions • Pass at ${quiz.passing_score}%</div>
          </div>
          <div class="text-center">
            <div id="quiz-timer" class="text-2xl font-mono font-black" style="color:#f59e0b">${formatTime(quizState.duration)}</div>
            <div style="font-size:11px;color:#64748b">remaining</div>
          </div>
        </div>
        <!-- Progress -->
        <div class="mt-4">
          <div class="flex justify-between text-xs mb-1" style="color:#64748b">
            <span>Question <span id="q-current">1</span> of ${questions.length}</span>
            <span id="q-answered">0</span> answered
          </div>
          <div class="progress-bar"><div class="progress-fill" id="q-progress" style="width:${(1/questions.length)*100}%"></div></div>
        </div>
      </div>
      <!-- Question -->
      <div class="card p-6 mb-6" id="question-card">
        ${renderQuestion(questions[0], 0)}
      </div>
      <!-- Navigation -->
      <div class="flex items-center justify-between">
        <button onclick="prevQuestion()" id="prev-btn" class="btn-secondary" disabled><i class="fas fa-arrow-left mr-2"></i>Previous</button>
        <div class="flex gap-2 flex-wrap justify-center" id="q-nav">
          ${questions.map((_, i) => `<button onclick="goToQuestion(${i})" id="qnav-${i}" class="w-8 h-8 rounded-lg font-bold text-sm transition-all" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8">${i+1}</button>`).join('')}
        </div>
        <button onclick="nextQuestion()" id="next-btn" class="btn-primary">${quizState.current === questions.length - 1 ? 'Submit Quiz' : 'Next <i class="fas fa-arrow-right ml-2"></i>'}</button>
      </div>
    </div>
  `;
  startQuizTimer();
}

function renderQuestion(q, idx) {
  return `
    <div class="font-bold mb-6" style="color:#c7d2fe;font-size:16px;line-height:1.6">
      <span class="badge badge-primary mr-2" style="font-size:12px">Q${idx+1}</span>${q.question}
    </div>
    <div class="space-y-3">
      ${['a','b','c','d'].map(opt => `
        <div class="quiz-option ${quizState.answers[q.id] === opt ? 'selected' : ''}" id="opt-${q.id}-${opt}" onclick="selectAnswer(${q.id}, '${opt}', ${idx})">
          <span class="font-bold mr-3" style="color:#818cf8">${opt.toUpperCase()}.</span>${q['option_'+opt]}
        </div>
      `).join('')}
    </div>
  `;
}

function selectAnswer(questionId, option, qIdx) {
  quizState.answers[questionId] = option;
  document.querySelectorAll(`[id^="opt-${questionId}-"]`).forEach(el => el.classList.remove('selected'));
  document.getElementById(`opt-${questionId}-${option}`).classList.add('selected');
  // Update nav button
  const navBtn = document.getElementById(`qnav-${qIdx}`);
  if (navBtn) { navBtn.style.background = 'rgba(99,102,241,0.3)'; navBtn.style.borderColor = '#6366f1'; navBtn.style.color = '#818cf8'; }
  document.getElementById('q-answered').textContent = Object.keys(quizState.answers).length;
}

function nextQuestion() {
  if (quizState.current === quizState.questions.length - 1) { submitQuiz(); return; }
  quizState.current++;
  updateQuestionDisplay();
}
function prevQuestion() {
  if (quizState.current > 0) { quizState.current--; updateQuestionDisplay(); }
}
function goToQuestion(idx) {
  quizState.current = idx;
  updateQuestionDisplay();
}
function updateQuestionDisplay() {
  const idx = quizState.current;
  const q = quizState.questions[idx];
  document.getElementById('question-card').innerHTML = renderQuestion(q, idx);
  document.getElementById('q-current').textContent = idx + 1;
  document.getElementById('q-progress').style.width = `${((idx+1)/quizState.questions.length)*100}%`;
  document.getElementById('prev-btn').disabled = idx === 0;
  const nextBtn = document.getElementById('next-btn');
  nextBtn.innerHTML = idx === quizState.questions.length - 1 ? '<i class="fas fa-check mr-2"></i>Submit Quiz' : 'Next <i class="fas fa-arrow-right ml-2"></i>';
  // Highlight current nav
  document.querySelectorAll('#q-nav button').forEach((b, i) => { b.style.outline = i === idx ? '2px solid #6366f1' : 'none'; });
}

function startQuizTimer() {
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    quizState.duration--;
    const timerEl = document.getElementById('quiz-timer');
    if (!timerEl) { clearInterval(quizTimer); return; }
    timerEl.textContent = formatTime(quizState.duration);
    if (quizState.duration <= 60) timerEl.className = 'text-2xl font-mono font-black timer-critical';
    if (quizState.duration <= 0) { clearInterval(quizTimer); submitQuiz(); }
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

async function submitQuiz() {
  if (quizTimer) clearInterval(quizTimer);
  const timeTaken = Math.round((Date.now() - quizState.startTime) / 1000);
  document.getElementById('page-content').innerHTML = `<div class="flex justify-center py-20"><div class="spinner"></div><p style="color:#64748b;margin-left:16px">Submitting quiz...</p></div>`;
  try {
    const data = await api(`/api/quiz/${quizState.id}/submit`, { method: 'POST', body: JSON.stringify({ answers: quizState.answers, time_taken: timeTaken }) });
    renderQuizResults(data);
    toast(`Quiz submitted! You earned ${data.points_earned} points! 🎉`, 'success');
    currentUser.points = (currentUser.points || 0) + data.points_earned;
    updateSidebarUser();
  } catch(e) { toast(e.message, 'error'); navigate('quiz'); }
}

function renderQuizResults(data) {
  const { score, totalMarks, percentage, points_earned, answers, questions } = data;
  const passed = percentage >= 60;
  document.getElementById('page-content').innerHTML = `
    <div class="max-w-3xl mx-auto">
      <div class="card p-8 text-center mb-6" style="background:linear-gradient(135deg,${passed ? 'rgba(16,185,129,0.1),rgba(5,150,105,0.05)' : 'rgba(239,68,68,0.1),rgba(220,38,38,0.05)'});border-color:${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}">
        <div style="font-size:64px;margin-bottom:16px">${passed ? '🏆' : '📚'}</div>
        <h2 class="text-3xl font-black mb-2" style="color:${passed ? '#10b981' : '#ef4444'}">${percentage}%</h2>
        <div style="color:#94a3b8;font-size:16px">${score}/${totalMarks} correct • ${passed ? 'PASSED! 🎉' : 'Keep practicing!'}</div>
        <div class="flex justify-center gap-4 mt-6">
          <div class="text-center"><div class="text-2xl font-black" style="color:#f59e0b">+${points_earned}</div><div style="color:#64748b;font-size:12px">Points Earned</div></div>
          <div class="text-center"><div class="text-2xl font-black" style="color:#8b5cf6">${formatTime(Math.round((Date.now() - quizState.startTime) / 1000))}</div><div style="color:#64748b;font-size:12px">Time Taken</div></div>
        </div>
        <div class="flex gap-3 justify-center mt-6">
          <button onclick="navigate('quiz')" class="btn-primary" style="padding:12px 28px">Take Another Quiz</button>
          <button onclick="showQuizReview(${JSON.stringify(answers).replace(/'/g,"\\'")})" class="btn-secondary" style="padding:12px 28px">Review Answers</button>
        </div>
      </div>
      <!-- Quick review -->
      <div class="card p-5">
        <h3 class="font-bold mb-4" style="color:#e2e8f0">Answer Summary</h3>
        <div class="space-y-3">
          ${(questions || []).map((q, i) => {
            const userAns = answers.find(a => a.question_id === q.id);
            return `<div class="p-3 rounded-xl flex items-center gap-3" style="background:${userAns?.is_correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}">
              <span style="font-size:16px">${userAns?.is_correct ? '✅' : '❌'}</span>
              <div style="flex:1"><div style="font-size:13px;color:#e2e8f0;font-weight:500">Q${i+1}: ${q.question.slice(0, 60)}...</div>
              <div style="font-size:11px;color:#64748b">Your: ${userAns?.user_answer?.toUpperCase() || 'Skipped'} • Correct: ${q.correct_answer.toUpperCase()}</div></div>
            </div>`;
          }).join('')}
        </div>
        ${answers[0]?.explanation ? '' : ''}
      </div>
    </div>
  `;
}

// ===== PLACEMENT =====
async function renderPlacement() {
  const categories = ['aptitude', 'coding', 'technical', 'hr'];
  const catIcons = { aptitude: '🧮', coding: '💻', technical: '⚙️', hr: '🤝' };
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Placement Preparation</h2><p style="color:#64748b;margin-top:4px">Comprehensive placement prep for VTU students</p></div>
      </div>
      <!-- Category tabs -->
      <div class="flex gap-2 mb-6">
        <button class="tab active" onclick="loadPlacementCategory('all', this)">🎯 All Questions</button>
        ${categories.map(c => `<button class="tab" onclick="loadPlacementCategory('${c}', this)">${catIcons[c]} ${c.charAt(0).toUpperCase()+c.slice(1)}</button>`).join('')}
        <button class="tab" onclick="loadCompanies(this)">🏢 Companies</button>
        <button class="tab" onclick="loadRoadmap(this)">🗺️ Roadmap</button>
      </div>
      <div id="placement-content">
        <div class="flex justify-center py-8"><div class="spinner"></div></div>
      </div>
    </div>
  `;
  loadPlacementCategory('all', document.querySelector('.tab.active'));
}

async function loadPlacementCategory(category, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn?.classList.add('active');
  const container = document.getElementById('placement-content');
  container.innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div></div>`;
  const data = await api(`/api/placement/questions?category=${category === 'all' ? '' : category}&limit=20`);
  const questions = data.questions || [];
  const diffColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };
  container.innerHTML = `
    <div class="mb-4 flex gap-2">
      <input type="text" class="input-field" style="flex:1" placeholder="Search questions..." id="placement-search" oninput="searchPlacement(this.value, '${category}')">
    </div>
    <div class="space-y-4" id="placement-questions-list">
      ${questions.map((q, i) => `
        <div class="card p-5">
          <div class="flex items-start justify-between gap-3 mb-3">
            <h4 class="font-semibold" style="color:#e2e8f0;font-size:15px;line-height:1.5">${i+1}. ${q.question}</h4>
            <div class="flex gap-2 flex-shrink-0">
              <span class="badge" style="background:rgba(${diffColor[q.difficulty]},0.15);color:${diffColor[q.difficulty]};font-size:10px">${q.difficulty}</span>
              <span class="badge badge-primary" style="font-size:10px">${q.category}</span>
              ${q.company ? `<span class="badge badge-purple" style="font-size:10px">${q.company}</span>` : ''}
            </div>
          </div>
          ${q.answer ? `<details>
            <summary style="cursor:pointer;color:#818cf8;font-size:13px;font-weight:600">View Answer ▼</summary>
            <div class="mt-3 p-3 rounded-xl" style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2)">
              <div class="markdown" style="font-size:13px;line-height:1.7;color:#c7d2fe">${marked.parse(q.answer)}</div>
            </div>
          </details>` : ''}
        </div>
      `).join('') || `<div class="empty-state"><div class="empty-icon">💼</div><p style="color:#64748b">No questions in this category</p></div>`}
    </div>
  `;
}

async function searchPlacement(q, category) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const data = await api(`/api/placement/questions?search=${encodeURIComponent(q)}&category=${category === 'all' ? '' : category}`);
    const list = document.getElementById('placement-questions-list');
    if (list) list.innerHTML = data.questions?.map((q, i) => `<div class="card p-5"><h4 class="font-semibold" style="color:#e2e8f0">${i+1}. ${q.question}</h4>${q.answer ? `<details><summary style="cursor:pointer;color:#818cf8;font-size:13px;margin-top:8px">View Answer</summary><div class="p-3 mt-2 rounded-xl" style="background:rgba(99,102,241,0.08)"><p style="color:#c7d2fe;font-size:13px">${q.answer}</p></div></details>` : ''}</div>`).join('') || `<div class="empty-state"><div class="empty-icon">🔍</div><p style="color:#64748b">No results</p></div>`;
  }, 300);
}

async function loadCompanies(btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn?.classList.add('active');
  const data = await api('/api/placement/companies');
  const container = document.getElementById('placement-content');
  const typeColor = { Service: '#10b981', Product: '#6366f1', 'Service': '#10b981' };
  container.innerHTML = `<div class="grid grid-cols-2 gap-4">
    ${data.companies?.map(c => `<div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-black" style="color:#e2e8f0">${c.name}</h3>
        <span class="badge ${c.type === 'Product' ? 'badge-primary' : 'badge-success'}">${c.type}</span>
      </div>
      <div class="flex items-center gap-2 mb-3">
        <span class="badge badge-warning">${c.difficulty}</span>
        <span style="font-size:13px;color:#10b981;font-weight:600">${c.package}</span>
      </div>
      <div class="mb-3">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px">Process:</div>
        <div class="flex gap-1 flex-wrap">${c.process.map(p => `<span class="badge" style="background:rgba(255,255,255,0.05);color:#94a3b8;font-size:10px">${p}</span>`).join('')}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#64748b;margin-bottom:4px">Focus Areas:</div>
        <div class="flex gap-1 flex-wrap">${c.focus.map(f => `<span class="badge badge-purple" style="font-size:10px">${f}</span>`).join('')}</div>
      </div>
    </div>`).join('')}
  </div>`;
}

async function loadRoadmap(btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn?.classList.add('active');
  const data = await api(`/api/placement/roadmap?branch=${currentUser?.branch || 'CSE'}`);
  const container = document.getElementById('placement-content');
  const roadmap = data.roadmap;
  container.innerHTML = `<div>
    <h3 class="text-xl font-bold mb-6" style="color:#e2e8f0">${roadmap?.title || 'Placement Roadmap'}</h3>
    <div class="space-y-6">
      ${roadmap?.phases?.map(p => `<div class="card p-5" style="border-left:4px solid #6366f1">
        <div class="flex items-center gap-3 mb-4">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;color:white">${p.phase}</div>
          <div><div class="font-bold" style="color:#e2e8f0">${p.title}</div><div style="font-size:12px;color:#64748b">${p.duration}</div></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><div style="font-size:12px;color:#a5b4fc;font-weight:600;margin-bottom:6px">Topics</div>${p.topics.map(t => `<div style="font-size:12px;color:#94a3b8;padding:2px 0">• ${t}</div>`).join('')}</div>
          <div><div style="font-size:12px;color:#a5b4fc;font-weight:600;margin-bottom:6px">Resources</div>${p.resources.map(r => `<div style="font-size:12px;color:#94a3b8;padding:2px 0">• ${r}</div>`).join('')}</div>
        </div>
      </div>`).join('') || '<div style="color:#64748b">No roadmap available</div>'}
    </div>
  </div>`;
}

// ===== STUDY PLANNER =====
async function renderPlanner() {
  const today = new Date().toISOString().split('T')[0];
  const [plansData, summaryData, subjectsData] = await Promise.all([
    api('/api/planner'),
    api('/api/planner/summary'),
    api(`/api/subjects?branch=${currentUser?.branch || ''}&semester=${currentUser?.semester || ''}`)
  ]);
  const plans = plansData.plans || [];
  const summary = summaryData.summary || {};
  const subjects = subjectsData.subjects || [];
  const statusColors = { pending: '#f59e0b', completed: '#10b981', skipped: '#64748b' };
  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#64748b' };
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Study Planner</h2><p style="color:#64748b">Plan and track your study sessions</p></div>
        <button onclick="showAddPlanModal('${JSON.stringify(subjects).replace(/'/g,"&#39;")}') " class="btn-primary"><i class="fas fa-plus mr-2"></i>Add Session</button>
      </div>
      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#6366f1">${summary.total || 0}</div><div style="font-size:12px;color:#64748b">Total Plans</div></div>
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#10b981">${summary.completed || 0}</div><div style="font-size:12px;color:#64748b">Completed</div></div>
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#ef4444">${summary.overdue || 0}</div><div style="font-size:12px;color:#64748b">Overdue</div></div>
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#f59e0b">${Math.round((summary.total_minutes_planned || 0) / 60)}h</div><div style="font-size:12px;color:#64748b">Hours Planned</div></div>
      </div>
      <!-- Date filter -->
      <div class="flex gap-3 mb-4">
        <input type="date" class="input-field" style="width:180px" id="plan-date" value="${today}">
        <select class="input-field" style="width:160px" id="plan-status" onchange="filterPlans()">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
        <button onclick="filterPlans()" class="btn-primary" style="padding:10px 18px">Filter</button>
      </div>
      <!-- Plans -->
      <div class="space-y-3" id="plans-list">
        ${plans.length ? plans.map(p => `
          <div class="card p-4 flex items-center gap-4">
            <div style="width:4px;height:60px;border-radius:2px;background:${priorityColors[p.priority] || '#64748b'}"></div>
            <div style="flex:1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold" style="color:#e2e8f0">${p.title}</span>
                <span class="badge" style="font-size:10px;background:${p.status==='completed'?'rgba(16,185,129,0.15)':p.status==='skipped'?'rgba(100,116,139,0.15)':'rgba(245,158,11,0.15)'};color:${statusColors[p.status]}">${p.status}</span>
              </div>
              <div style="font-size:12px;color:#64748b">${p.subject_name || 'General'} • ${p.scheduled_date} • ${p.duration_minutes} min</div>
              ${p.description ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">${p.description}</div>` : ''}
            </div>
            <div class="flex gap-2">
              ${p.status === 'pending' ? `<button onclick="completePlan(${p.id})" class="btn-success" style="padding:6px 12px;font-size:12px">✓ Done</button>` : ''}
              <button onclick="deletePlan(${p.id})" class="btn-danger" style="padding:6px 12px;font-size:12px"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `).join('') : `<div class="empty-state"><div class="empty-icon">📅</div><h3 style="color:#e2e8f0">No study plans yet</h3><p style="color:#64748b">Add your first study session!</p></div>`}
      </div>
    </div>
  `;
}

function showAddPlanModal(subjectsJson) {
  const subjects = JSON.parse(subjectsJson.replace(/&#39;/g, "'"));
  const form = `
    <div class="card p-6" style="margin-top:16px">
      <h3 class="font-bold mb-4" style="color:#e2e8f0">Add Study Session</h3>
      <form onsubmit="addPlan(event)">
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="col-span-2"><label class="block text-sm mb-1" style="color:#94a3b8">Title</label><input type="text" id="plan-title" class="input-field" placeholder="e.g., Study Data Structures - Module 3" required></div>
          <div><label class="block text-sm mb-1" style="color:#94a3b8">Subject</label>
            <select id="plan-subject" class="input-field"><option value="">Select subject</option>
            ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
          </div>
          <div><label class="block text-sm mb-1" style="color:#94a3b8">Date</label><input type="date" id="plan-date-input" class="input-field" value="${new Date().toISOString().split('T')[0]}" required></div>
          <div><label class="block text-sm mb-1" style="color:#94a3b8">Duration (min)</label><input type="number" id="plan-duration" class="input-field" value="60" min="15"></div>
          <div><label class="block text-sm mb-1" style="color:#94a3b8">Priority</label>
            <select id="plan-priority" class="input-field"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
          </div>
          <div class="col-span-2"><label class="block text-sm mb-1" style="color:#94a3b8">Notes</label><textarea id="plan-notes" class="input-field" rows="2" placeholder="What will you cover?"></textarea></div>
        </div>
        <div class="flex gap-3">
          <button type="submit" class="btn-primary flex-1">Add Session +20 pts</button>
          <button type="button" onclick="this.closest('div.card').remove()" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>`;
  document.getElementById('plans-list').insertAdjacentHTML('beforebegin', form);
}

async function addPlan(e) {
  e.preventDefault();
  const body = { title: document.getElementById('plan-title').value, subject_id: document.getElementById('plan-subject').value || null, scheduled_date: document.getElementById('plan-date-input').value, duration_minutes: parseInt(document.getElementById('plan-duration').value), priority: document.getElementById('plan-priority').value, description: document.getElementById('plan-notes').value };
  try { await api('/api/planner', { method: 'POST', body: JSON.stringify(body) }); toast('Study session added! +20 pts on completion!', 'success'); navigate('planner'); }
  catch(e) { toast(e.message, 'error'); }
}

async function completePlan(id) {
  try { await api(`/api/planner/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) }); toast('Session completed! +20 pts! 🎉', 'success'); navigate('planner'); }
  catch(e) { toast(e.message, 'error'); }
}

async function deletePlan(id) {
  if (!confirm('Delete this plan?')) return;
  try { await api(`/api/planner/${id}`, { method: 'DELETE' }); toast('Plan deleted', 'info'); navigate('planner'); }
  catch(e) { toast(e.message, 'error'); }
}

async function filterPlans() {
  const date = document.getElementById('plan-date')?.value || '';
  const status = document.getElementById('plan-status')?.value || '';
  const data = await api(`/api/planner?${date ? 'date='+date : ''}${status ? '&status='+status : ''}`);
  const list = document.getElementById('plans-list');
  if (!list) return;
  const plans = data.plans || [];
  const statusColors = { pending: '#f59e0b', completed: '#10b981', skipped: '#64748b' };
  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#64748b' };
  list.innerHTML = plans.length ? plans.map(p => `<div class="card p-4 flex items-center gap-4">
    <div style="width:4px;height:60px;border-radius:2px;background:${priorityColors[p.priority]}"></div>
    <div style="flex:1"><div class="font-semibold" style="color:#e2e8f0">${p.title}</div>
    <div style="font-size:12px;color:#64748b">${p.scheduled_date} • ${p.duration_minutes} min</div></div>
    <div class="flex gap-2">
      ${p.status === 'pending' ? `<button onclick="completePlan(${p.id})" class="btn-success" style="padding:6px 12px;font-size:12px">✓</button>` : `<span class="badge" style="color:${statusColors[p.status]}">${p.status}</span>`}
      <button onclick="deletePlan(${p.id})" class="btn-danger" style="padding:6px 12px;font-size:12px"><i class="fas fa-trash"></i></button>
    </div>
  </div>`).join('') : `<div class="empty-state"><div class="empty-icon">📅</div><p style="color:#64748b">No plans found</p></div>`;
}

// ===== DAILY CHALLENGE =====
async function renderDailyChallenge() {
  const [challengeData, historyData] = await Promise.all([
    api('/api/challenge/today'),
    api('/api/challenge/history')
  ]);
  const challenge = challengeData.challenge;
  const history = historyData.history || [];
  const content = challenge?.content ? (typeof challenge.content === 'string' ? JSON.parse(challenge.content) : challenge.content) : null;
  document.getElementById('page-content').innerHTML = `
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-8">
        <div style="font-size:48px;margin-bottom:8px">🔥</div>
        <h2 class="text-3xl font-black gradient-text">Daily Challenge</h2>
        <p style="color:#64748b;margin-top:8px">Complete the daily challenge to maintain your streak and earn bonus points!</p>
      </div>
      ${challenge && content ? `
      <div class="card p-6 mb-6" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05));border-color:rgba(99,102,241,0.3)">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg" style="color:#e2e8f0">${challenge.title}</h3>
          <div class="flex gap-2">
            <span class="badge badge-warning">🔥 +${challenge.points_reward} pts</span>
            <span class="badge badge-primary">${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' })}</span>
          </div>
        </div>
        ${challenge.completed ? `
          <div class="text-center py-6">
            <div style="font-size:48px">✅</div>
            <h3 class="text-xl font-bold mt-3" style="color:#10b981">Challenge Completed!</h3>
            <p style="color:#64748b;margin-top:8px">Great job! Come back tomorrow for a new challenge. 🚀</p>
          </div>
        ` : `
          <p class="text-lg font-medium mb-6" style="color:#c7d2fe;line-height:1.6">${content.question}</p>
          <div class="space-y-3" id="challenge-opts">
            ${content.options.map((opt, i) => `
              <button class="quiz-option w-full text-left" id="copt-${i}" onclick="submitDailyChallenge(${challenge.id}, ${i}, '${escHtml(content.explanation)}', ${content.correct})">
                <span class="font-bold mr-3" style="color:#818cf8">${String.fromCharCode(65+i)}.</span>${opt}
              </button>
            `).join('')}
          </div>
        `}
      </div>` : '<div class="card p-8 text-center"><div class="empty-icon">🔥</div><p style="color:#64748b">No challenge today yet</p></div>'}
      <!-- History -->
      <div class="card p-5">
        <h3 class="font-bold mb-4" style="color:#e2e8f0">Challenge History</h3>
        ${history.length ? `<div class="space-y-2">
          ${history.map(h => `<div class="flex items-center justify-between p-3 rounded-xl" style="background:rgba(255,255,255,0.03)">
            <span style="font-size:13px;color:#e2e8f0">${h.title}</span>
            <div class="flex gap-2">
              <span class="badge badge-success">+${h.points_earned} pts</span>
              <span style="font-size:11px;color:#64748b">${new Date(h.completed_at).toLocaleDateString()}</span>
            </div>
          </div>`).join('')}
        </div>` : `<div style="color:#64748b;font-size:13px">No history yet. Complete today's challenge!</div>`}
      </div>
    </div>
  `;
}

async function submitDailyChallenge(id, answer, explanation, correct) {
  document.querySelectorAll('[id^="copt-"]').forEach(b => b.disabled = true);
  const data = await api('/api/challenge/complete', { method: 'POST', body: JSON.stringify({ challenge_id: id, answer }) });
  const isCorrect = answer === correct;
  document.querySelectorAll('[id^="copt-"]').forEach((b, i) => {
    if (i === correct) b.classList.add('correct');
    else if (i === answer && !isCorrect) b.classList.add('wrong');
  });
  document.getElementById('challenge-opts').insertAdjacentHTML('afterend', `
    <div class="mt-4 p-4 rounded-xl" style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2)">
      <div class="font-bold mb-2" style="color:${isCorrect ? '#10b981' : '#ef4444'}">${isCorrect ? '✅ Correct!' : '❌ Wrong!'} +${data.points_earned} points</div>
      <p style="color:#a5b4fc;font-size:13px"><strong>Explanation:</strong> ${explanation}</p>
    </div>`);
  toast(isCorrect ? `✅ Correct! +${data.points_earned} pts!` : `Not quite! +${data.points_earned} pts for trying`, isCorrect ? 'success' : 'warning');
  currentUser.points = (currentUser.points || 0) + data.points_earned;
  updateSidebarUser();
}

// ===== PROGRESS =====
async function renderProgress() {
  const [progressData, analyticsData] = await Promise.all([
    api('/api/users/progress'),
    api('/api/analytics/student')
  ]);
  const progress = progressData.progress || [];
  const analytics = analyticsData;
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">My Progress</h2><p style="color:#64748b">Track your learning journey</p></div>
      </div>
      <!-- Weekly stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#6366f1">${analytics.weeklyProgress?.today_quizzes || 0}</div><div style="font-size:12px;color:#64748b">Today's Quizzes</div></div>
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#10b981">${analytics.weeklyProgress?.week_quizzes || 0}</div><div style="font-size:12px;color:#64748b">This Week</div></div>
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#f59e0b">${analytics.weeklyProgress?.month_avg || 0}%</div><div style="font-size:12px;color:#64748b">30-Day Avg</div></div>
      </div>
      <!-- Subject performance -->
      ${analytics.subjectPerformance?.length ? `<div class="card p-5 mb-6">
        <h3 class="font-bold mb-4" style="color:#e2e8f0"><i class="fas fa-chart-bar text-blue-400 mr-2"></i>Subject Performance</h3>
        <div class="space-y-3">
          ${analytics.subjectPerformance.map(s => `
            <div>
              <div class="flex justify-between items-center mb-1">
                <span style="font-size:13px;color:#e2e8f0">${s.subject_name || 'Unknown'} <span style="color:#64748b;font-size:11px">(${s.attempts} attempts)</span></span>
                <span class="badge ${s.avg_score >= 70 ? 'badge-success' : s.avg_score >= 50 ? 'badge-warning' : 'badge-danger'}" style="font-size:11px">${s.avg_score}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${s.avg_score}%;background:${s.avg_score >= 70 ? 'linear-gradient(90deg,#10b981,#059669)' : s.avg_score >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)'}"></div></div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      <!-- Study progress -->
      <div class="card p-5">
        <h3 class="font-bold mb-4" style="color:#e2e8f0"><i class="fas fa-book text-green-400 mr-2"></i>Subject Study Progress</h3>
        ${progress.length ? `<div class="space-y-3">
          ${progress.map(p => `<div>
            <div class="flex justify-between items-center mb-1">
              <div>
                <span style="font-size:13px;color:#e2e8f0;font-weight:500">${p.subject_name}</span>
                <span class="badge badge-primary ml-2" style="font-size:10px">Sem ${p.semester}</span>
              </div>
              <div class="flex items-center gap-3">
                <span style="font-size:11px;color:#64748b">${Math.round(p.total_time_minutes/60)}h studied</span>
                <span style="font-size:13px;color:#94a3b8;font-weight:600">${Math.round(p.completion_percentage)}%</span>
              </div>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${p.completion_percentage}%"></div></div>
          </div>`).join('')}
        </div>` : `<div class="empty-state" style="padding:24px"><div class="empty-icon">📊</div><p style="color:#64748b">No progress tracked yet</p><button onclick="navigate('subjects')" class="btn-primary mt-3" style="padding:8px 20px">Explore Subjects</button></div>`}
      </div>
    </div>
  `;
}

// ===== LEADERBOARD =====
async function renderLeaderboard() {
  const data = await api('/api/gamification/leaderboard');
  const leaderboard = data.leaderboard || [];
  const myRank = leaderboard.findIndex(u => u.id === currentUser?.id) + 1;
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="text-center mb-8">
        <div style="font-size:48px;margin-bottom:8px">🏆</div>
        <h2 class="text-3xl font-black gradient-text">Global Leaderboard</h2>
        <p style="color:#64748b;margin-top:8px">Top performing VTU students</p>
        ${myRank > 0 ? `<div class="badge badge-primary mt-3" style="font-size:14px;padding:8px 20px">Your Rank: #${myRank}</div>` : ''}
      </div>
      <!-- Top 3 -->
      ${leaderboard.length >= 3 ? `<div class="flex items-end justify-center gap-6 mb-8">
        <!-- 2nd place -->
        <div class="text-center rank-2 p-4 rounded-2xl" style="margin-bottom:0;flex:1;max-width:180px">
          <div style="font-size:32px;margin-bottom:8px">🥈</div>
          <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:white;margin:0 auto 8px">${(leaderboard[1]?.name||'?')[0]}</div>
          <div class="font-bold text-sm" style="color:#e2e8f0">${leaderboard[1]?.name?.split(' ')[0]}</div>
          <div style="font-size:12px;color:#64748b">${leaderboard[1]?.branch}</div>
          <div class="font-black" style="color:#94a3b8;margin-top:4px">⭐ ${leaderboard[1]?.points}</div>
        </div>
        <!-- 1st place -->
        <div class="text-center rank-1 p-5 rounded-2xl" style="flex:1;max-width:200px">
          <div style="font-size:40px;margin-bottom:8px">👑</div>
          <div style="width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;margin:0 auto 8px">${(leaderboard[0]?.name||'?')[0]}</div>
          <div class="font-bold" style="color:#e2e8f0">${leaderboard[0]?.name?.split(' ')[0]}</div>
          <div style="font-size:12px;color:#64748b">${leaderboard[0]?.branch}</div>
          <div class="font-black" style="color:#fbbf24;margin-top:4px">⭐ ${leaderboard[0]?.points}</div>
        </div>
        <!-- 3rd place -->
        <div class="text-center rank-3 p-4 rounded-2xl" style="margin-bottom:0;flex:1;max-width:180px">
          <div style="font-size:32px;margin-bottom:8px">🥉</div>
          <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:white;margin:0 auto 8px">${(leaderboard[2]?.name||'?')[0]}</div>
          <div class="font-bold text-sm" style="color:#e2e8f0">${leaderboard[2]?.name?.split(' ')[0]}</div>
          <div style="font-size:12px;color:#64748b">${leaderboard[2]?.branch}</div>
          <div class="font-black" style="color:#b45309;margin-top:4px">⭐ ${leaderboard[2]?.points}</div>
        </div>
      </div>` : ''}
      <!-- Full list -->
      <div class="card p-4">
        <div class="space-y-2">
          ${leaderboard.map((u, i) => `
            <div class="flex items-center gap-4 p-3 rounded-xl transition-all ${u.id === currentUser?.id ? 'border border-indigo-500 bg-indigo-500/10' : ''}" style="background:${u.id === currentUser?.id ? '' : 'rgba(255,255,255,0.02)'}">
              <div class="w-8 text-center font-black" style="color:${i===0?'#fbbf24':i===1?'#94a3b8':i===2?'#b45309':'#64748b'};font-size:${i<3?'18px':'14px'}">${i<3?['🥇','🥈','🥉'][i]:'#'+(i+1)}</div>
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:white;flex-shrink:0">${(u.name||'?')[0]}</div>
              <div style="flex:1">
                <div class="font-semibold text-sm" style="color:#e2e8f0">${u.name} ${u.id === currentUser?.id ? '<span class="badge badge-primary" style="font-size:10px">You</span>' : ''}</div>
                <div style="font-size:11px;color:#64748b">${u.branch} • ${u.total_quizzes || 0} quizzes • ${u.avg_score || 0}% avg</div>
              </div>
              <div class="text-right">
                <div class="font-bold" style="color:#f59e0b">⭐ ${u.points}</div>
                <div style="font-size:11px;color:#64748b">Lv.${u.level} 🔥${u.streak}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ===== BADGES =====
async function renderBadges() {
  const data = await api('/api/gamification/my-badges');
  const { earned, locked } = data;
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="text-center mb-8">
        <div style="font-size:48px;margin-bottom:8px">🏅</div>
        <h2 class="text-3xl font-black gradient-text">Achievement Badges</h2>
        <p style="color:#64748b;margin-top:8px">${data.earned_count}/${data.total} badges earned</p>
      </div>
      <h3 class="font-bold mb-4 text-lg" style="color:#e2e8f0">Earned Badges 🎉</h3>
      <div class="grid grid-cols-4 gap-4 mb-8">
        ${earned.length ? earned.map(b => `<div class="card p-4 text-center" style="border-color:rgba(245,158,11,0.3);background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.05))">
          <div style="font-size:40px;margin-bottom:8px">${b.icon || '🏅'}</div>
          <div class="font-bold text-sm" style="color:#fbbf24">${b.name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${b.description}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:6px">Earned ${new Date(b.earned_at).toLocaleDateString()}</div>
        </div>`).join('') : `<div class="col-span-4 empty-state"><div class="empty-icon">🏅</div><p style="color:#64748b">No badges yet. Start quizzing!</p></div>`}
      </div>
      <h3 class="font-bold mb-4 text-lg" style="color:#e2e8f0">Locked Badges 🔒</h3>
      <div class="grid grid-cols-4 gap-4">
        ${locked.map(b => `<div class="card p-4 text-center" style="opacity:0.5">
          <div style="font-size:40px;margin-bottom:8px;filter:grayscale(1)">🔒</div>
          <div class="font-bold text-sm" style="color:#94a3b8">${b.name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${b.description}</div>
          <div style="font-size:10px;color:#64748b;margin-top:6px">Requires: ${b.condition_value} ${b.condition_type}</div>
        </div>`).join('')}
      </div>
    </div>
  `;
}

// ===== BOOKMARKS =====
async function renderBookmarks() {
  const data = await api('/api/resources/bookmarks/my');
  const bookmarks = data.bookmarks || [];
  const typeIcons = { notes: '📝', textbook: '📖', question_paper: '📋', lab_manual: '🔬', syllabus: '📄', video: '🎬' };
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">My Bookmarks</h2><p style="color:#64748b">${bookmarks.length} saved resources</p></div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        ${bookmarks.length ? bookmarks.map(b => `<div class="card p-4 cursor-pointer resource-type-${b.type}" onclick="openResourceModal(${b.id})">
          <div class="flex items-start justify-between mb-3">
            <span style="font-size:24px">${typeIcons[b.type] || '📄'}</span>
            <button onclick="event.stopPropagation();toggleBookmark(${b.id})" style="background:none;border:none;cursor:pointer;color:#f59e0b" title="Remove bookmark"><i class="fas fa-bookmark"></i></button>
          </div>
          <h4 class="font-semibold text-sm mb-1" style="color:#e2e8f0;line-height:1.4">${b.title}</h4>
          <div class="flex items-center gap-2 mt-2">
            <span class="badge badge-primary" style="font-size:10px">${b.type}</span>
            <span style="font-size:11px;color:#64748b">Saved ${new Date(b.bookmarked_at).toLocaleDateString()}</span>
          </div>
        </div>`).join('') : `<div class="col-span-3 empty-state"><div class="empty-icon">🔖</div><h3 style="color:#e2e8f0">No bookmarks yet</h3><p style="color:#64748b">Bookmark resources to find them easily later</p><button onclick="navigate('resources')" class="btn-primary mt-4" style="padding:10px 24px">Browse Resources</button></div>`}
      </div>
    </div>
  `;
}

// ===== EXAMS =====
async function renderExams() {
  const data = await api(`/api/exams?branch=${currentUser?.branch || ''}`);
  const exams = data.exams || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="text-center mb-8">
        <div style="font-size:48px;margin-bottom:8px">⏰</div>
        <h2 class="text-3xl font-black gradient-text">Exam Countdown</h2>
        <p style="color:#64748b;margin-top:8px">Stay ahead of your upcoming exams</p>
      </div>
      <div class="grid grid-cols-2 gap-6">
        ${exams.length ? exams.map(ex => {
          const days = ex.days_left;
          const urgency = days <= 7 ? { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '🔴' } : days <= 30 ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🟡' } : { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '🟢' };
          return `<div class="card p-6" style="border-color:${urgency.color};background:${urgency.bg}">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg" style="color:#e2e8f0">${ex.title}</h3>
              <span style="font-size:20px">${urgency.icon}</span>
            </div>
            <div class="text-5xl font-black text-center py-4" style="color:${urgency.color}">${days}</div>
            <div class="text-center" style="color:#64748b;font-size:14px;margin-bottom:12px">days remaining</div>
            <div style="font-size:13px;color:#94a3b8;text-align:center">${new Date(ex.exam_date).toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
            ${ex.description ? `<div style="font-size:12px;color:#64748b;margin-top:8px;text-align:center">${ex.description}</div>` : ''}
            <div class="flex gap-2 justify-center mt-4">
              <button onclick="navigate('resources')" class="btn-primary" style="padding:8px 16px;font-size:12px">Study Now</button>
              <button onclick="navigate('planner')" class="btn-secondary" style="padding:8px 16px;font-size:12px">Plan</button>
            </div>
          </div>`;
        }).join('') : `<div class="col-span-2 empty-state"><div class="empty-icon">📅</div><h3 style="color:#e2e8f0">No upcoming exams</h3><p style="color:#64748b">No exams scheduled currently</p></div>`}
      </div>
    </div>
  `;
}

// ===== ANNOUNCEMENTS =====
async function renderAnnouncements() {
  const data = await api('/api/announcements');
  const announcements = data.announcements || [];
  const typeColors = { general: '#6366f1', exam: '#ef4444', placement: '#10b981', resource: '#f59e0b' };
  const typeIcons = { general: '📢', exam: '📝', placement: '💼', resource: '📚' };
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Announcements</h2><p style="color:#64748b">${announcements.length} announcements</p></div>
      </div>
      <div class="space-y-4">
        ${announcements.length ? announcements.map(a => `<div class="card p-5" style="border-left:4px solid ${typeColors[a.type] || '#6366f1'}">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span style="font-size:18px">${typeIcons[a.type] || '📢'}</span>
                <h3 class="font-bold" style="color:#e2e8f0">${a.title}</h3>
                <span class="badge" style="background:rgba(${typeColors[a.type]},0.15);color:${typeColors[a.type]};font-size:10px">${a.type}</span>
              </div>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7">${a.content}</p>
              <div style="font-size:12px;color:#64748b;margin-top:8px">${a.author_name ? 'By '+a.author_name+' • ' : ''}${new Date(a.created_at).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</div>
            </div>
          </div>
        </div>`).join('') : `<div class="empty-state"><div class="empty-icon">📢</div><h3 style="color:#e2e8f0">No announcements yet</h3></div>`}
      </div>
    </div>
  `;
}

// ===== PROFILE =====
async function renderProfile() {
  const { profile, badges, quizStats, recentActivity } = await api('/api/users/profile');
  document.getElementById('page-content').innerHTML = `
    <div class="max-w-4xl mx-auto">
      <!-- Profile header -->
      <div class="card p-6 mb-6" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05))">
        <div class="flex items-center gap-6">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;color:white;flex-shrink:0">${profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div style="flex:1">
            <h2 class="text-2xl font-black" style="color:#e2e8f0">${profile.name}</h2>
            <div style="color:#818cf8;margin-top:2px">${profile.email}</div>
            <div style="color:#64748b;font-size:13px;margin-top:4px">${profile.branch || 'Engineering'} • Semester ${profile.semester}</div>
            ${profile.bio ? `<p style="color:#94a3b8;font-size:14px;margin-top:8px">${profile.bio}</p>` : ''}
            <div class="flex items-center gap-3 mt-3">
              <span class="level-badge">Level ${profile.level}</span>
              <span class="streak-badge">🔥 ${profile.streak} day streak</span>
              <span class="badge badge-primary">⭐ ${profile.points} points</span>
              <span class="badge badge-success">🏅 ${badges?.length || 0} badges</span>
            </div>
          </div>
          <button onclick="showEditProfile()" class="btn-secondary" style="padding:10px 20px"><i class="fas fa-edit mr-2"></i>Edit Profile</button>
        </div>
      </div>
      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#6366f1">${quizStats?.total_quizzes || 0}</div><div style="font-size:12px;color:#64748b">Quizzes Taken</div></div>
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#10b981">${quizStats?.avg_score || 0}%</div><div style="font-size:12px;color:#64748b">Average Score</div></div>
        <div class="card p-4 text-center"><div class="text-2xl font-black" style="color:#f59e0b">${quizStats?.best_score || 0}%</div><div style="font-size:12px;color:#64748b">Best Score</div></div>
      </div>
      <!-- Recent badges -->
      ${badges?.length ? `<div class="card p-5 mb-6">
        <h3 class="font-bold mb-3" style="color:#e2e8f0">Recent Badges</h3>
        <div class="flex gap-3 flex-wrap">
          ${badges.slice(0,6).map(b => `<div class="text-center p-3 rounded-xl" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2)">
            <div style="font-size:24px">${b.icon || '🏅'}</div>
            <div style="font-size:11px;color:#fbbf24;font-weight:600;margin-top:4px">${b.name}</div>
          </div>`).join('')}
        </div>
      </div>` : ''}
      <!-- Edit form (hidden) -->
      <div id="edit-profile-form" style="display:none" class="card p-5 mb-6">
        <h3 class="font-bold mb-4" style="color:#e2e8f0">Edit Profile</h3>
        <form onsubmit="saveProfile(event)">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div><label class="block text-sm mb-1" style="color:#94a3b8">Full Name</label><input type="text" id="edit-name" class="input-field" value="${profile.name || ''}"></div>
            <div><label class="block text-sm mb-1" style="color:#94a3b8">Branch</label>
              <select id="edit-branch" class="input-field">
                ${['CSE','ISE','AIML','ECE','EEE','ME','CV','CH','BT'].map(b => `<option value="${b}" ${profile.branch===b?'selected':''}>${b}</option>`).join('')}
              </select>
            </div>
            <div><label class="block text-sm mb-1" style="color:#94a3b8">Semester</label>
              <select id="edit-semester" class="input-field">
                ${[1,2,3,4,5,6,7,8].map(s => `<option value="${s}" ${profile.semester==s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="col-span-2"><label class="block text-sm mb-1" style="color:#94a3b8">Bio</label><textarea id="edit-bio" class="input-field" rows="2">${profile.bio || ''}</textarea></div>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="btn-primary flex-1">Save Changes</button>
            <button type="button" onclick="document.getElementById('edit-profile-form').style.display='none'" class="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
        <!-- Change password -->
        <div class="mt-4 pt-4" style="border-top:1px solid rgba(255,255,255,0.05)">
          <h4 class="font-semibold mb-3 text-sm" style="color:#e2e8f0">Change Password</h4>
          <form onsubmit="changePassword(event)">
            <div class="grid grid-cols-3 gap-3">
              <input type="password" id="curr-pw" class="input-field" placeholder="Current password">
              <input type="password" id="new-pw" class="input-field" placeholder="New password">
              <button type="submit" class="btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function showEditProfile() {
  document.getElementById('edit-profile-form').style.display = 'block';
  document.getElementById('edit-profile-form').scrollIntoView({ behavior: 'smooth' });
}

async function saveProfile(e) {
  e.preventDefault();
  try {
    const data = await api('/api/users/profile', { method: 'PUT', body: JSON.stringify({
      name: document.getElementById('edit-name').value,
      branch: document.getElementById('edit-branch').value,
      semester: parseInt(document.getElementById('edit-semester').value),
      bio: document.getElementById('edit-bio').value
    })});
    currentUser = { ...currentUser, ...data.user };
    updateSidebarUser();
    toast('Profile updated successfully! ✅', 'success');
    document.getElementById('edit-profile-form').style.display = 'none';
  } catch(e) { toast(e.message, 'error'); }
}

async function changePassword(e) {
  e.preventDefault();
  const curr = document.getElementById('curr-pw').value;
  const newPw = document.getElementById('new-pw').value;
  if (!curr || !newPw) { toast('Both passwords required', 'error'); return; }
  try {
    await api('/api/users/password', { method: 'PUT', body: JSON.stringify({ current_password: curr, new_password: newPw }) });
    toast('Password changed successfully! 🔒', 'success');
    document.getElementById('curr-pw').value = '';
    document.getElementById('new-pw').value = '';
  } catch(e) { toast(e.message, 'error'); }
}

// ===== NOTIFICATIONS =====
async function renderNotifications() {
  navigate('notifications');
}

async function showNotifications() {
  openModal('notifications-panel');
  const data = await api('/api/notifications');
  const list = document.getElementById('notifications-list');
  const notifs = data.notifications || [];
  const typeIcons = { info: '💡', success: '✅', warning: '⚠️', resource: '📚', quiz: '🧪' };
  list.innerHTML = notifs.length ? notifs.map(n => `
    <div class="p-3 mb-2 rounded-xl cursor-pointer ${n.is_read ? 'opacity-60' : ''}" style="background:${n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)'};border:1px solid ${n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)'}" onclick="markRead(${n.id},this)">
      <div class="flex items-start gap-3">
        <span style="font-size:18px">${typeIcons[n.type] || '📢'}</span>
        <div>
          <div class="font-semibold text-sm" style="color:#e2e8f0">${n.title}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px">${n.message}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${new Date(n.created_at).toLocaleDateString()}</div>
        </div>
        ${!n.is_read ? '<div style="width:8px;height:8px;border-radius:50%;background:#6366f1;flex-shrink:0;margin-top:4px"></div>' : ''}
      </div>
    </div>
  `).join('') : `<div class="empty-state"><div class="empty-icon">🔔</div><p style="color:#64748b">No notifications</p></div>`;
}

async function markRead(id, el) {
  await api(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  el.style.opacity = '0.6';
  el.style.background = 'rgba(255,255,255,0.02)';
  el.style.borderColor = 'rgba(255,255,255,0.05)';
  el.querySelector('[style*="border-radius:50%"]')?.remove();
  loadNotificationCount();
}

async function markAllRead() {
  await api('/api/notifications/read-all', { method: 'POST' });
  document.querySelectorAll('#notifications-list [style*="border-radius:50%"]').forEach(el => el.remove());
  toast('All notifications marked as read', 'success');
  loadNotificationCount();
}

// ===== ADMIN DASHBOARD =====
async function renderAdminDashboard() {
  const data = await api('/api/analytics/admin');
  const { stats, topResources, topStudents, branchStats, recentActivity } = data;
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Admin Dashboard</h2><p style="color:#64748b">Platform overview and analytics</p></div>
        <div style="font-size:12px;color:#64748b">${new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
      </div>
      <!-- Main Stats -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="card p-4"><div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Total Students</div><div class="text-3xl font-black mt-1" style="color:#6366f1">${stats?.total_students || 0}</div><div style="font-size:11px;color:#10b981;margin-top:4px">+${stats?.new_students_today || 0} today</div></div>
        <div class="card p-4"><div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Resources</div><div class="text-3xl font-black mt-1" style="color:#8b5cf6">${stats?.total_resources || 0}</div><div style="font-size:11px;color:#64748b;margin-top:4px">${stats?.total_downloads || 0} downloads</div></div>
        <div class="card p-4"><div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Quizzes</div><div class="text-3xl font-black mt-1" style="color:#10b981">${stats?.total_quizzes || 0}</div><div style="font-size:11px;color:#64748b;margin-top:4px">${stats?.total_attempts || 0} attempts</div></div>
        <div class="card p-4"><div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">AI Sessions</div><div class="text-3xl font-black mt-1" style="color:#f59e0b">${stats?.total_ai_sessions || 0}</div><div style="font-size:11px;color:#64748b;margin-top:4px">${stats?.avg_quiz_score || 0}% avg score</div></div>
      </div>
      <div class="grid grid-cols-3 gap-6">
        <!-- Top Resources -->
        <div class="col-span-2 card p-5">
          <h3 class="font-bold mb-4" style="color:#e2e8f0">📥 Most Downloaded Resources</h3>
          <div class="space-y-2">
            ${(topResources || []).slice(0,6).map((r, i) => `<div class="flex items-center gap-3 p-3 rounded-xl" style="background:rgba(255,255,255,0.02)">
              <div style="width:24px;text-align:center;font-weight:bold;color:#64748b">${i+1}</div>
              <div style="flex:1;min-width:0"><div class="font-medium text-sm" style="color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</div><div style="font-size:11px;color:#64748b">${r.type} ${r.subject_name ? '• '+r.subject_name : ''}</div></div>
              <div class="text-right"><div style="font-size:13px;font-weight:bold;color:#818cf8">${r.download_count} <i class="fas fa-download" style="font-size:10px"></i></div></div>
            </div>`).join('')}
          </div>
        </div>
        <!-- Branch Stats -->
        <div class="card p-5">
          <h3 class="font-bold mb-4" style="color:#e2e8f0">🎓 Students by Branch</h3>
          <div class="space-y-2">
            ${(branchStats || []).slice(0,8).map(b => `<div>
              <div class="flex justify-between text-sm mb-1"><span style="color:#94a3b8">${b.branch}</span><span style="color:#818cf8;font-weight:600">${b.count}</span></div>
              <div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:${Math.min(100,(b.count/(branchStats[0]?.count||1))*100)}%"></div></div>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <!-- Recent Activity -->
      <div class="card p-5 mt-6">
        <h3 class="font-bold mb-4" style="color:#e2e8f0">⚡ Recent Quiz Activity</h3>
        <div class="space-y-2">
          ${(recentActivity || []).map(a => `<div class="flex items-center gap-4 p-3 rounded-xl" style="background:rgba(255,255,255,0.02)">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:white">${(a.name||'?')[0]}</div>
            <div style="flex:1"><div style="font-size:13px;color:#e2e8f0">${a.name} completed <span style="color:#818cf8">${a.quiz_title}</span></div>
            <div style="font-size:11px;color:#64748b">${new Date(a.completed_at).toLocaleString()}</div></div>
            <div class="badge ${a.percentage >= 70 ? 'badge-success' : a.percentage >= 50 ? 'badge-warning' : 'badge-danger'}">${a.percentage}%</div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// ===== ADMIN RESOURCES =====
async function renderAdminResources() {
  const data = await api('/api/resources?limit=50');
  const resources = data.resources || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Manage Resources</h2><p style="color:#64748b">${resources.length} resources</p></div>
        <button onclick="openModal('add-resource-modal')" class="btn-primary"><i class="fas fa-upload mr-2"></i>Upload Resource</button>
      </div>
      <div class="card p-1">
        <table class="w-full">
          <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
            <th class="text-left p-3" style="color:#64748b;font-size:12px;font-weight:600">TITLE</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px;font-weight:600">TYPE</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px;font-weight:600">BRANCH</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px;font-weight:600">STATS</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px;font-weight:600">ACTIONS</th>
          </tr></thead>
          <tbody id="resources-table">
            ${resources.map(r => `<tr style="border-bottom:1px solid rgba(255,255,255,0.03)" id="res-row-${r.id}">
              <td class="p-3"><div style="font-size:13px;color:#e2e8f0;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</div><div style="font-size:11px;color:#64748b">${r.subject_name || 'General'}</div></td>
              <td class="p-3"><span class="badge badge-primary" style="font-size:10px">${r.type}</span></td>
              <td class="p-3" style="font-size:12px;color:#94a3b8">${r.branch_code || '-'} ${r.semester ? 'Sem'+r.semester : ''}</td>
              <td class="p-3" style="font-size:12px;color:#64748b">📥 ${r.download_count} • 👁 ${r.view_count}</td>
              <td class="p-3">
                <div class="flex gap-2">
                  <a href="${r.file_url}" target="_blank" style="color:#818cf8;background:none;border:none;cursor:pointer;font-size:12px" title="View"><i class="fas fa-external-link-alt"></i></a>
                  <button onclick="deleteResource(${r.id})" style="color:#ef4444;background:none;border:none;cursor:pointer;font-size:12px" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function handleAddResource(e) {
  e.preventDefault();
  const body = {
    title: document.getElementById('res-title').value,
    type: document.getElementById('res-type').value,
    branch_code: document.getElementById('res-branch').value,
    semester: document.getElementById('res-semester').value,
    subject_id: document.getElementById('res-subject').value || null,
    file_url: document.getElementById('res-url').value,
    description: document.getElementById('res-desc').value,
    is_important: document.getElementById('res-important').checked
  };
  try {
    await api('/api/resources', { method: 'POST', body: JSON.stringify(body) });
    toast('Resource uploaded successfully! 📤', 'success');
    closeModal('add-resource-modal');
    navigate('admin-resources');
    document.getElementById('add-resource-form').reset();
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  try { await api(`/api/resources/${id}`, { method: 'DELETE' }); toast('Resource deleted', 'info'); document.getElementById(`res-row-${id}`)?.remove(); }
  catch(e) { toast(e.message, 'error'); }
}

async function loadSubjectsForAdmin(branch) {
  const select = document.getElementById('res-subject');
  if (!select) return;
  const semester = document.getElementById('res-semester')?.value || '';
  select.innerHTML = '<option value="">Loading...</option>';
  try {
    const data = await api(`/api/subjects?branch=${branch}&semester=${semester}`);
    select.innerHTML = `<option value="">Select Subject</option>${data.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}`;
  } catch { select.innerHTML = '<option value="">No subjects</option>'; }
}

// ===== ADMIN QUIZZES =====
async function renderAdminQuizzes() {
  const data = await api('/api/quiz');
  const quizzes = data.quizzes || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Manage Quizzes</h2><p style="color:#64748b">${quizzes.length} quizzes</p></div>
        <button onclick="openQuizCreator()" class="btn-primary"><i class="fas fa-plus mr-2"></i>Create Quiz</button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        ${quizzes.map(q => `<div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="badge ${q.difficulty==='easy'?'badge-success':q.difficulty==='hard'?'badge-danger':'badge-warning'}">${q.difficulty}</span>
            <button onclick="deleteQuiz(${q.id})" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:12px"><i class="fas fa-trash"></i></button>
          </div>
          <h3 class="font-bold mb-2 text-sm" style="color:#e2e8f0">${q.title}</h3>
          <div style="font-size:12px;color:#64748b">${q.question_count} questions • ${q.duration_minutes} min</div>
          ${q.branch_code ? `<span class="badge badge-primary mt-2" style="font-size:10px">${q.branch_code}</span>` : ''}
        </div>`).join('')}
      </div>
    </div>
  `;
}

function openQuizCreator() {
  quizQuestionCount = 0;
  document.getElementById('questions-list').innerHTML = '';
  openModal('create-quiz-modal');
  addQuizQuestion();
}

function addQuizQuestion() {
  quizQuestionCount++;
  const qId = quizQuestionCount;
  const div = document.createElement('div');
  div.id = `question-${qId}`;
  div.className = 'card p-4 mb-3';
  div.style.background = 'rgba(255,255,255,0.03)';
  div.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <span class="badge badge-primary">Q${qId}</span>
      <button type="button" onclick="document.getElementById('question-${qId}').remove()" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:12px"><i class="fas fa-times"></i></button>
    </div>
    <textarea class="input-field mb-3" name="question" rows="2" placeholder="Enter question..." required></textarea>
    <div class="grid grid-cols-2 gap-2 mb-2">
      <input type="text" class="input-field" name="option_a" placeholder="Option A" required>
      <input type="text" class="input-field" name="option_b" placeholder="Option B" required>
      <input type="text" class="input-field" name="option_c" placeholder="Option C" required>
      <input type="text" class="input-field" name="option_d" placeholder="Option D" required>
    </div>
    <div class="flex gap-2">
      <select class="input-field" name="correct_answer" style="flex:1">
        <option value="a">Correct: A</option><option value="b">Correct: B</option><option value="c">Correct: C</option><option value="d">Correct: D</option>
      </select>
      <input type="text" class="input-field" name="explanation" placeholder="Explanation (optional)" style="flex:2">
    </div>
  `;
  document.getElementById('questions-list').appendChild(div);
}

async function handleCreateQuiz(e) {
  e.preventDefault();
  const questions = [];
  document.querySelectorAll('#questions-list .card').forEach(qCard => {
    questions.push({
      question: qCard.querySelector('[name="question"]').value,
      option_a: qCard.querySelector('[name="option_a"]').value,
      option_b: qCard.querySelector('[name="option_b"]').value,
      option_c: qCard.querySelector('[name="option_c"]').value,
      option_d: qCard.querySelector('[name="option_d"]').value,
      correct_answer: qCard.querySelector('[name="correct_answer"]').value,
      explanation: qCard.querySelector('[name="explanation"]').value,
      marks: 1
    });
  });
  if (questions.length === 0) { toast('Add at least one question', 'error'); return; }
  const body = {
    title: document.getElementById('quiz-title').value,
    branch_code: document.getElementById('quiz-branch').value,
    difficulty: document.getElementById('quiz-difficulty').value,
    duration_minutes: parseInt(document.getElementById('quiz-duration').value),
    passing_score: parseInt(document.getElementById('quiz-passing').value),
    questions
  };
  try {
    await api('/api/quiz', { method: 'POST', body: JSON.stringify(body) });
    toast('Quiz created successfully! 🧪', 'success');
    closeModal('create-quiz-modal');
    navigate('admin-quizzes');
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteQuiz(id) {
  if (!confirm('Delete this quiz?')) return;
  try { await api(`/api/quiz/${id}`, { method: 'DELETE' }); toast('Quiz deleted', 'info'); navigate('admin-quizzes'); }
  catch(e) { toast(e.message, 'error'); }
}

// ===== ADMIN USERS =====
async function renderAdminUsers() {
  const data = await api('/api/users?role=student&limit=50');
  const users = data.users || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Manage Students</h2><p style="color:#64748b">${data.total || users.length} students</p></div>
        <input type="text" class="input-field" style="width:280px" placeholder="Search students..." id="user-search" oninput="searchUsers(this.value)">
      </div>
      <div class="card p-1">
        <table class="w-full" id="users-table">
          <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
            <th class="text-left p-3" style="color:#64748b;font-size:12px">STUDENT</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px">BRANCH</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px">POINTS</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px">LEVEL</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px">STATUS</th>
            <th class="text-left p-3" style="color:#64748b;font-size:12px">ACTIONS</th>
          </tr></thead>
          <tbody>
            ${users.map(u => `<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
              <td class="p-3"><div style="font-size:13px;color:#e2e8f0">${u.name}</div><div style="font-size:11px;color:#64748b">${u.email}</div></td>
              <td class="p-3" style="font-size:12px;color:#94a3b8">${u.branch || '-'} Sem${u.semester}</td>
              <td class="p-3" style="font-size:13px;color:#f59e0b;font-weight:bold">⭐ ${u.points}</td>
              <td class="p-3"><span class="level-badge" style="font-size:11px">Lv.${u.level}</span></td>
              <td class="p-3"><span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td class="p-3">
                <button onclick="toggleUser(${u.id}, ${u.is_active}, this)" class="badge ${u.is_active ? 'badge-danger' : 'badge-success'}" style="cursor:pointer">${u.is_active ? 'Deactivate' : 'Activate'}</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function searchUsers(q) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const data = await api(`/api/users?role=student&search=${encodeURIComponent(q)}`);
    const body = document.querySelector('#users-table tbody');
    if (!body) return;
    body.innerHTML = (data.users || []).map(u => `<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
      <td class="p-3"><div style="font-size:13px;color:#e2e8f0">${u.name}</div><div style="font-size:11px;color:#64748b">${u.email}</div></td>
      <td class="p-3" style="font-size:12px;color:#94a3b8">${u.branch} Sem${u.semester}</td>
      <td class="p-3" style="font-size:13px;color:#f59e0b">⭐ ${u.points}</td>
      <td class="p-3"><span class="level-badge" style="font-size:11px">Lv.${u.level}</span></td>
      <td class="p-3"><span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
      <td class="p-3"><button onclick="toggleUser(${u.id},${u.is_active},this)" class="badge ${u.is_active ? 'badge-danger' : 'badge-success'}" style="cursor:pointer">${u.is_active ? 'Deactivate' : 'Activate'}</button></td>
    </tr>`).join('');
  }, 300);
}

async function toggleUser(id, isActive, btn) {
  try {
    const data = await api(`/api/users/${id}/toggle`, { method: 'PATCH' });
    btn.textContent = data.is_active ? 'Deactivate' : 'Activate';
    btn.className = `badge ${data.is_active ? 'badge-danger' : 'badge-success'} cursor-pointer`;
    toast(`User ${data.is_active ? 'activated' : 'deactivated'}`, 'success');
  } catch(e) { toast(e.message, 'error'); }
}

// ===== ADMIN ANNOUNCEMENTS =====
async function renderAdminAnnouncements() {
  const data = await api('/api/announcements');
  const announcements = data.announcements || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Announcements</h2></div>
        <button onclick="document.getElementById('add-announcement').style.display='block'" class="btn-primary"><i class="fas fa-plus mr-2"></i>Add Announcement</button>
      </div>
      <div id="add-announcement" style="display:none" class="card p-5 mb-6">
        <h3 class="font-bold mb-4" style="color:#e2e8f0">Create Announcement</h3>
        <form onsubmit="createAnnouncement(event)">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="col-span-2"><label class="block text-sm mb-1" style="color:#94a3b8">Title</label><input type="text" id="ann-title" class="input-field" required></div>
            <div><label class="block text-sm mb-1" style="color:#94a3b8">Type</label>
              <select id="ann-type" class="input-field"><option value="general">General</option><option value="exam">Exam</option><option value="placement">Placement</option><option value="resource">Resource</option></select>
            </div>
            <div><label class="block text-sm mb-1" style="color:#94a3b8">Branch (optional)</label><select id="ann-branch" class="input-field"><option value="">All Branches</option><option value="CSE">CSE</option><option value="ECE">ECE</option></select></div>
            <div class="col-span-2"><label class="block text-sm mb-1" style="color:#94a3b8">Content</label><textarea id="ann-content" class="input-field" rows="3" required></textarea></div>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="btn-primary flex-1">Publish</button>
            <button type="button" onclick="document.getElementById('add-announcement').style.display='none'" class="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
      <div class="space-y-3">
        ${announcements.map(a => `<div class="card p-4 flex items-start justify-between gap-4">
          <div>
            <div class="font-semibold" style="color:#e2e8f0">${a.title}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px">${a.type} • ${new Date(a.created_at).toLocaleDateString()}</div>
            <p style="color:#94a3b8;font-size:13px;margin-top:6px">${a.content.slice(0, 100)}...</p>
          </div>
          <button onclick="deleteAnnouncement(${a.id})" style="background:none;border:none;cursor:pointer;color:#ef4444"><i class="fas fa-trash"></i></button>
        </div>`).join('')}
      </div>
    </div>
  `;
}

async function createAnnouncement(e) {
  e.preventDefault();
  try {
    await api('/api/announcements', { method: 'POST', body: JSON.stringify({ title: document.getElementById('ann-title').value, content: document.getElementById('ann-content').value, type: document.getElementById('ann-type').value, branch_code: document.getElementById('ann-branch').value || null }) });
    toast('Announcement published! 📢', 'success');
    navigate('admin-announcements');
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete announcement?')) return;
  try { await api(`/api/announcements/${id}`, { method: 'DELETE' }); toast('Deleted', 'info'); navigate('admin-announcements'); }
  catch(e) { toast(e.message, 'error'); }
}

// ===== ADMIN EXAMS =====
async function renderAdminExams() {
  const data = await api('/api/exams');
  const exams = data.exams || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Exam Countdowns</h2></div>
        <button onclick="document.getElementById('add-exam').style.display='block'" class="btn-primary"><i class="fas fa-plus mr-2"></i>Add Exam</button>
      </div>
      <div id="add-exam" style="display:none" class="card p-5 mb-6">
        <form onsubmit="createExam(event)">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="col-span-2"><input type="text" id="exam-title" class="input-field" placeholder="Exam title" required></div>
            <div><input type="date" id="exam-date" class="input-field" required></div>
            <div><select id="exam-branch" class="input-field"><option value="">All Branches</option><option value="CSE">CSE</option><option value="ECE">ECE</option></select></div>
            <div class="col-span-2"><textarea id="exam-desc" class="input-field" rows="2" placeholder="Description"></textarea></div>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="btn-primary flex-1">Create</button>
            <button type="button" onclick="document.getElementById('add-exam').style.display='none'" class="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
      <div class="space-y-3">
        ${exams.map(ex => `<div class="card p-4 flex items-center justify-between">
          <div><div class="font-semibold" style="color:#e2e8f0">${ex.title}</div><div style="font-size:12px;color:#64748b">${ex.exam_date} • ${ex.days_left} days left</div></div>
          <button onclick="deleteExam(${ex.id})" style="background:none;border:none;cursor:pointer;color:#ef4444"><i class="fas fa-trash"></i></button>
        </div>`).join('')}
      </div>
    </div>
  `;
}

async function createExam(e) {
  e.preventDefault();
  try {
    await api('/api/exams', { method: 'POST', body: JSON.stringify({ title: document.getElementById('exam-title').value, exam_date: document.getElementById('exam-date').value, branch_code: document.getElementById('exam-branch').value || null, description: document.getElementById('exam-desc').value }) });
    toast('Exam countdown created! ⏰', 'success');
    navigate('admin-exams');
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteExam(id) {
  if (!confirm('Delete?')) return;
  try { await api(`/api/exams/${id}`, { method: 'DELETE' }); navigate('admin-exams'); }
  catch(e) { toast(e.message, 'error'); }
}

// ===== ADMIN PLACEMENT =====
async function renderAdminPlacement() {
  const data = await api('/api/placement/questions?limit=30');
  const questions = data.questions || [];
  document.getElementById('page-content').innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div><h2 class="text-2xl font-black gradient-text">Placement Questions</h2><p style="color:#64748b">${questions.length} questions</p></div>
        <button onclick="document.getElementById('add-pq').style.display='block'" class="btn-primary"><i class="fas fa-plus mr-2"></i>Add Question</button>
      </div>
      <div id="add-pq" style="display:none" class="card p-5 mb-6">
        <form onsubmit="addPlacementQ(event)">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="col-span-2"><textarea id="pq-question" class="input-field" rows="2" placeholder="Question" required></textarea></div>
            <div class="col-span-2"><textarea id="pq-answer" class="input-field" rows="2" placeholder="Answer"></textarea></div>
            <div><select id="pq-category" class="input-field"><option value="aptitude">Aptitude</option><option value="coding">Coding</option><option value="technical">Technical</option><option value="hr">HR</option></select></div>
            <div><input type="text" id="pq-company" class="input-field" placeholder="Company (optional)"></div>
            <div><select id="pq-difficulty" class="input-field"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
          </div>
          <div class="flex gap-3"><button type="submit" class="btn-primary flex-1">Add</button><button type="button" onclick="document.getElementById('add-pq').style.display='none'" class="btn-secondary flex-1">Cancel</button></div>
        </form>
      </div>
      <div class="space-y-3">
        ${questions.map(q => `<div class="card p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div style="font-size:13px;color:#e2e8f0;margin-bottom:4px">${q.question}</div>
              <div class="flex gap-2"><span class="badge badge-primary" style="font-size:10px">${q.category}</span>${q.company?`<span class="badge badge-purple" style="font-size:10px">${q.company}</span>`:''}<span class="badge" style="font-size:10px;color:#64748b">${q.difficulty}</span></div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  `;
}

async function addPlacementQ(e) {
  e.preventDefault();
  try {
    await api('/api/placement/questions', { method: 'POST', body: JSON.stringify({ question: document.getElementById('pq-question').value, answer: document.getElementById('pq-answer').value, category: document.getElementById('pq-category').value, company: document.getElementById('pq-company').value || null, difficulty: document.getElementById('pq-difficulty').value }) });
    toast('Question added!', 'success');
    navigate('admin-placement');
  } catch(e) { toast(e.message, 'error'); }
}

// ===== HELPERS =====
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

// ===== NOTIFICATION TOGGLE =====
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[onclick="navigate(\'notifications\')"]');
  if (btn) {
    e.preventDefault();
    showNotifications();
  }
});

// ===== PWA =====
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.getElementById('install-prompt').style.display = 'block';
  document.getElementById('install-btn').addEventListener('click', () => {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(() => { document.getElementById('install-prompt').style.display = 'none'; });
  });
});

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', async () => {
  // Apply saved theme
  const savedTheme = localStorage.getItem('vtu_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('theme-icon').className = savedTheme === 'dark' ? 'fas fa-moon w-5' : 'fas fa-sun w-5';

  // Branch tags on landing
  const tags = document.getElementById('branch-tags');
  if (tags) {
    const branches = ['💻 CSE','🖥️ ISE','🤖 AI & ML','📊 Data Science','🔒 Cyber Security','📡 ECE','⚡ EEE','🔬 EIE','⚙️ Mechanical','🏗️ Civil','🧪 Chemical','📈 IEM','✈️ Aeronautical','🚀 Aerospace','🚗 Automobile','🧬 Biotechnology','🏥 Biomedical','🌿 Environmental','🦾 Robotics','🏛️ B.Arch'];
    tags.innerHTML = branches.map(b => `<span class="badge badge-primary" style="font-size:12px;padding:6px 14px">${b}</span>`).join('');
  }

  // Check for saved token
  const token = localStorage.getItem('vtu_token');
  if (token) {
    try {
      const data = await api('/api/auth/me');
      currentUser = data.user;
      document.getElementById('app').style.display = 'block';
      initApp();
      return;
    } catch {
      localStorage.removeItem('vtu_token');
    }
  }
  document.getElementById('app').style.display = 'block';
  showPage('landing-page');
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
