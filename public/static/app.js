// ============================================================
// VTU SUPER LEARNING PLATFORM — Complete Frontend v2.0
// ============================================================
const API = '/api';
let currentUser = null;
let currentPage = 'dashboard';
let authToken = localStorage.getItem('vtu_token');
let allBranches = [];
let allSubjects = [];
let allResources = [];
let currentQuiz = null;
let quizTimer = null;
let quizAnswers = {};
let currentQuestionIndex = 0;
let chatHistory = [];
let searchTimeout = null;
let searchDropdown = null;

// Apply saved theme immediately
const savedTheme = localStorage.getItem('vtu_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (authToken) {
    try {
      const res = await apiFetch('/auth/me');
      if (res.user) { currentUser = res.user; showApp(); return; }
    } catch (e) { localStorage.removeItem('vtu_token'); }
  }
  showLanding();
});

// ── Screen Management ─────────────────────────────────────────
function showLanding() {
  document.getElementById('landing-screen').style.display = 'block';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'none';
}
function showAuth(tab) {
  document.getElementById('landing-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'block';
  document.getElementById('app-screen').style.display = 'none';
  switchAuthTab(tab || 'login');
}
function showApp() {
  document.getElementById('landing-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  initApp();
}
function switchAuthTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('#auth-screen .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
}

// ── API Helper ────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  if (opts.headers) Object.assign(headers, opts.headers);
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showToast('Enter email and password', 'error');
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Logging in…'; }
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    authToken = data.token; currentUser = data.user;
    localStorage.setItem('vtu_token', authToken);
    showToast('Welcome back, ' + currentUser.name + '! 🎉', 'success');
    showApp();
  } catch (e) {
    showToast(e.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Login'; }
  }
}
async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const branch = document.getElementById('reg-branch').value;
  const semester = document.getElementById('reg-semester').value;
  if (!name || !email || !password) return showToast('Fill all required fields', 'error');
  if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');
  try {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, branch, semester: parseInt(semester) }) });
    authToken = data.token; currentUser = data.user;
    localStorage.setItem('vtu_token', authToken);
    showToast('Account created! Welcome ' + currentUser.name + ' 🎓', 'success');
    showApp();
  } catch (e) { showToast(e.message, 'error'); }
}
function doLogout() {
  authToken = null; currentUser = null; chatHistory = [];
  localStorage.removeItem('vtu_token');
  showLanding();
  showToast('Logged out successfully', 'info');
}
function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// ── App Init ──────────────────────────────────────────────────
function initApp() {
  buildSidebar();
  updateSidebarUser();
  showPage('dashboard');
  loadNotificationCount();
  loadSubjectsForAI();
  setupSearchDropdown();
}

function buildSidebar() {
  const isAdmin = currentUser?.role === 'admin';
  const badge = document.getElementById('sidebar-role-badge');
  badge.textContent = isAdmin ? '👑 Admin' : '🎓 Student';
  badge.className = 'badge-pill text-xs mt-1 ' + (isAdmin ? 'badge-yellow' : 'badge-purple');

  const studentNav = [
    { icon: 'fa-home', label: 'Dashboard', page: 'dashboard' },
    { icon: 'fa-code-branch', label: 'Branches', page: 'branches' },
    { icon: 'fa-book', label: 'Subjects', page: 'subjects' },
    { icon: 'fa-file-pdf', label: 'Resources', page: 'resources' },
    { icon: 'fa-bookmark', label: 'Bookmarks', page: 'bookmarks' },
    { icon: 'fa-question-circle', label: 'Quizzes', page: 'quiz' },
    { icon: 'fa-robot', label: 'AI Assistant', page: 'ai' },
    { icon: 'fa-briefcase', label: 'Placement Prep', page: 'placement' },
    { icon: 'fa-calendar-alt', label: 'Study Planner', page: 'planner' },
    { icon: 'fa-fire', label: 'Daily Challenge', page: 'challenge' },
    { icon: 'fa-trophy', label: 'Achievements', page: 'gamification' },
    { icon: 'fa-chart-bar', label: 'Analytics', page: 'analytics' },
    { icon: 'fa-clock', label: 'Exam Countdown', page: 'exams' },
    { icon: 'fa-bullhorn', label: 'Announcements', page: 'announcements' },
    { icon: 'fa-bell', label: 'Notifications', page: 'notifications' },
    { icon: 'fa-user', label: 'My Profile', page: 'profile' },
  ];
  const adminNav = [
    { icon: 'fa-tachometer-alt', label: 'Admin Dashboard', page: 'dashboard' },
    { icon: 'fa-users', label: 'Manage Users', page: 'admin-users' },
    { icon: 'fa-file-pdf', label: 'Resources', page: 'resources' },
    { icon: 'fa-question-circle', label: 'Quizzes', page: 'quiz' },
    { icon: 'fa-cog', label: 'Quiz Manager', page: 'quiz-manager' },
    { icon: 'fa-bullhorn', label: 'Announcements', page: 'announcements' },
    { icon: 'fa-chart-bar', label: 'Analytics', page: 'analytics' },
    { icon: 'fa-clock', label: 'Exam Countdown', page: 'exams' },
    { icon: 'fa-bell', label: 'Notifications', page: 'notifications' },
    { icon: 'fa-code-branch', label: 'Branches', page: 'branches' },
    { icon: 'fa-book', label: 'Subjects', page: 'subjects' },
    { icon: 'fa-user', label: 'My Profile', page: 'profile' },
  ];
  const navItems = isAdmin ? adminNav : studentNav;
  const nav = document.getElementById('nav-menu');
  nav.innerHTML = navItems.map(item => `
    <div class="nav-item" id="nav-${item.page}" onclick="showPage('${item.page}')">
      <i class="fas ${item.icon} w-5 text-center"></i>
      <span>${item.label}</span>
    </div>
  `).join('');
  if (isAdmin) {
    ['admin-upload-btn','create-quiz-btn','add-announcement-btn','admin-add-branch-btn','admin-add-subject-btn'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'flex';
    });
  }
}

function updateSidebarUser() {
  if (!currentUser) return;
  const initial = currentUser.name ? currentUser.name[0].toUpperCase() : 'U';
  document.getElementById('sidebar-avatar').textContent = initial;
  document.getElementById('topbar-avatar').textContent = initial;
  document.getElementById('sidebar-name').textContent = currentUser.name;
  document.getElementById('sidebar-points').textContent = `⭐ ${currentUser.points || 0} pts · Lv ${currentUser.level || 1}`;
}

function toggleSidebar() {
  const s = document.getElementById('sidebar'), m = document.getElementById('main-content');
  if (window.innerWidth <= 768) s.classList.toggle('open');
  else { s.classList.toggle('collapsed'); m.classList.toggle('expanded'); }
}

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById('nav-' + page);
  if (navItem) navItem.classList.add('active');
  const titles = {
    dashboard: ['Dashboard', 'Welcome back, ' + (currentUser?.name || 'User') + '!'],
    branches: ['Branches', 'All VTU Engineering Branches'],
    subjects: ['Subjects', 'Browse by Semester'],
    resources: ['Resources', 'Study Materials & PDFs'],
    bookmarks: ['Bookmarks', 'Your Saved Resources'],
    quiz: ['Quizzes', 'Test Your Knowledge'],
    ai: ['AI Assistant', 'Powered by AI — Ask Anything!'],
    placement: ['Placement Prep', 'Aptitude, Coding & HR'],
    planner: ['Study Planner', 'Organize Your Study Sessions'],
    notifications: ['Notifications', 'Stay Updated'],
    gamification: ['Achievements', 'Points, Badges & Leaderboard'],
    exams: ['Exam Countdown', 'Upcoming VTU Exams'],
    analytics: ['Analytics', 'Your Learning Progress'],
    profile: ['Profile', 'Your Account'],
    'admin-users': ['Manage Users', 'Admin Panel'],
    announcements: ['Announcements', 'Latest Updates'],
    challenge: ['Daily Challenge', 'Daily Practice Challenge'],
    'quiz-manager': ['Quiz Manager', 'Create & Manage Quizzes'],
  };
  const [title, subtitle] = titles[page] || [page, ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
  loadPage(page);
}

function loadPage(page) {
  const handlers = {
    dashboard: loadDashboard, branches: loadBranches, subjects: loadSubjects,
    resources: loadResources, bookmarks: loadBookmarks, quiz: loadQuizList,
    placement: loadPlacement, planner: loadPlanner, notifications: loadNotifications,
    gamification: loadGamification, exams: loadExams, analytics: loadAnalytics,
    profile: loadProfile, 'admin-users': loadAdminUsers,
    announcements: loadAnnouncements, challenge: loadDailyChallenge,
    'quiz-manager': loadQuizManager,
  };
  if (handlers[page]) handlers[page]();
}

// ── Search Dropdown ───────────────────────────────────────────
function setupSearchDropdown() {
  const searchInput = document.getElementById('global-search');
  if (!searchInput) return;
  searchDropdown = document.createElement('div');
  searchDropdown.id = 'search-dropdown';
  searchDropdown.style.cssText = `position:absolute;top:100%;left:0;right:0;border-radius:12px;z-index:999;display:none;max-height:320px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.4)`;
  searchDropdown.className = 'card';
  searchInput.parentElement.style.position = 'relative';
  searchInput.parentElement.appendChild(searchDropdown);
  document.addEventListener('click', e => {
    if (!searchInput.parentElement.contains(e.target)) searchDropdown.style.display = 'none';
  });
}

async function globalSearch(q) {
  clearTimeout(searchTimeout);
  if (!q || q.length < 2) { if (searchDropdown) searchDropdown.style.display = 'none'; return; }
  searchTimeout = setTimeout(async () => {
    try {
      const [resources, subjects] = await Promise.allSettled([
        apiFetch(`/resources?search=${encodeURIComponent(q)}&limit=5`),
        apiFetch(`/subjects?search=${encodeURIComponent(q)}&branch=${currentUser?.branch||'CSE'}`),
      ]);
      const resList = resources.status === 'fulfilled' ? resources.value.resources || [] : [];
      const subList = subjects.status === 'fulfilled' ? subjects.value.subjects || [] : [];
      if (!resList.length && !subList.length) { searchDropdown.style.display = 'none'; return; }
      searchDropdown.style.display = 'block';
      searchDropdown.style.padding = '8px';
      searchDropdown.innerHTML = `
        ${resList.length ? `<div class="text-xs font-semibold mb-1 px-2" style="color:#6366f1">📚 Resources</div>` : ''}
        ${resList.slice(0, 4).map(r => `
          <div class="p-2 rounded-lg cursor-pointer hover:bg-primary-500 hover:bg-opacity-10 flex items-center gap-2 transition-all" onclick="searchDropdown.style.display='none';showPage('resources');setTimeout(()=>{viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')},300)">
            <span>${resourceIcon(r.type)}</span>
            <div><div class="text-sm font-medium">${r.title}</div><div class="text-xs" style="color:#64748b">${capitalizeFirst(r.type)} · Sem ${r.semester||'?'}</div></div>
          </div>`).join('')}
        ${subList.length ? `<div class="text-xs font-semibold mt-2 mb-1 px-2" style="color:#6366f1">📖 Subjects</div>` : ''}
        ${subList.slice(0, 3).map(s => `
          <div class="p-2 rounded-lg cursor-pointer hover:bg-primary-500 hover:bg-opacity-10 flex items-center gap-2 transition-all" onclick="searchDropdown.style.display='none';viewSubjectResources(${s.id},'${escHtml(s.name)}')">
            <span>📖</span>
            <div><div class="text-sm font-medium">${s.name}</div><div class="text-xs" style="color:#64748b">Sem ${s.semester}</div></div>
          </div>`).join('')}
        <div class="text-xs px-2 py-1 mt-1" style="color:#475569">Press Enter to search all resources</div>
      `;
    } catch(e) {}
  }, 280);
}

// ── Dashboard ─────────────────────────────────────────────────
async function loadDashboard() {
  const el = document.getElementById('dashboard-content');
  el.innerHTML = skeletonGrid(4, 80) + skeletonGrid(2, 160);
  try {
    if (currentUser?.role === 'admin') await loadAdminDashboard(el);
    else await loadStudentDashboard(el);
  } catch(e) { el.innerHTML = errorBox(e.message); }
}

async function loadStudentDashboard(el) {
  const [analyticsData, quizzes, resources, challenge, exams] = await Promise.allSettled([
    apiFetch('/analytics/student'),
    apiFetch('/quiz?limit=4'),
    apiFetch('/resources?limit=6&important=1'),
    apiFetch('/challenge/today'),
    apiFetch('/exams?limit=3'),
  ]);
  const stats = analyticsData.status === 'fulfilled' ? analyticsData.value : {};
  const quizList = quizzes.status === 'fulfilled' ? quizzes.value.quizzes || [] : [];
  const resList = resources.status === 'fulfilled' ? resources.value.resources || [] : [];
  const ch = challenge.status === 'fulfilled' ? challenge.value.challenge : null;
  const examList = exams.status === 'fulfilled' ? exams.value.exams || [] : [];
  const levelPct = Math.min(((currentUser.points || 0) % 200) / 2, 100);

  el.innerHTML = `
    <!-- Welcome Banner -->
    <div class="card p-6 mb-6 relative overflow-hidden" style="background:linear-gradient(135deg,#1e1e3f,#2d1b69)">
      <div class="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style="background:#6366f1;transform:translate(30px,-30px)"></div>
      <div class="absolute bottom-0 left-20 w-24 h-24 rounded-full opacity-5" style="background:#a855f7;transform:translateY(12px)"></div>
      <div class="flex items-center justify-between relative z-10">
        <div>
          <h2 class="text-2xl font-bold text-white">Welcome back, ${currentUser.name}! 👋</h2>
          <p class="text-sm mt-1" style="color:#a5b4fc">${currentUser.branch || 'CSE'} · Semester ${currentUser.semester || 1} · Level ${currentUser.level || 1}</p>
          <div class="flex items-center gap-3 mt-3 flex-wrap">
            <span class="badge-pill badge-purple">🔥 ${currentUser.streak || 0} day streak</span>
            <span class="badge-pill badge-yellow">⭐ ${currentUser.points || 0} points</span>
            <span class="badge-pill badge-green">🎯 Rank #${stats.rank || '—'}</span>
          </div>
          <div class="mt-3 max-w-xs">
            <div class="flex justify-between text-xs mb-1" style="color:#a5b4fc"><span>Level Progress</span><span>${currentUser.points || 0}/200 pts</span></div>
            <div class="progress-bar h-2"><div class="progress-fill" style="width:${levelPct}%"></div></div>
          </div>
        </div>
        <div class="hidden md:flex flex-col items-center gap-2">
          <div class="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold" style="background:rgba(99,102,241,.3);border:3px solid #6366f1;color:#fff">${currentUser.name[0]}</div>
          <div class="text-sm font-bold" style="color:#a5b4fc">Level ${currentUser.level || 1}</div>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card cursor-pointer" onclick="showPage('resources')">
        <div class="text-2xl mb-1">📚</div>
        <div class="text-2xl font-bold text-primary-400">${stats.total_resources || 0}</div>
        <div class="text-xs mt-1" style="color:#64748b">Resources Viewed</div>
      </div>
      <div class="stat-card cursor-pointer" onclick="showPage('quiz')">
        <div class="text-2xl mb-1">🎯</div>
        <div class="text-2xl font-bold text-green-400">${stats.quizzes_taken || 0}</div>
        <div class="text-xs mt-1" style="color:#64748b">Quizzes Taken</div>
      </div>
      <div class="stat-card cursor-pointer" onclick="showPage('analytics')">
        <div class="text-2xl mb-1">📊</div>
        <div class="text-2xl font-bold text-yellow-400">${stats.avg_score ? stats.avg_score.toFixed(0) : 0}%</div>
        <div class="text-xs mt-1" style="color:#64748b">Avg Quiz Score</div>
      </div>
      <div class="stat-card cursor-pointer" onclick="showPage('gamification')">
        <div class="text-2xl mb-1">🏆</div>
        <div class="text-2xl font-bold text-orange-400">${stats.badges_earned || 0}</div>
        <div class="text-xs mt-1" style="color:#64748b">Badges Earned</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Available Quizzes -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold">🎯 Available Quizzes</h3>
          <button class="text-xs text-primary-400 hover:underline" onclick="showPage('quiz')">View All →</button>
        </div>
        ${quizList.length ? quizList.map(q => `
          <div class="flex items-center justify-between p-3 rounded-xl mb-2 cursor-pointer hover:opacity-80 transition-all" style="background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.1)" onclick="showPage('quiz');setTimeout(()=>startQuiz(${q.id}),300)">
            <div class="flex items-center gap-3">
              <div class="text-xl">${q.difficulty==='easy'?'🟢':q.difficulty==='hard'?'🔴':'🟡'}</div>
              <div>
                <div class="font-medium text-sm">${q.title}</div>
                <div class="text-xs mt-0.5" style="color:#64748b">${q.total_questions} Qs · ${q.duration_minutes} min · ${capitalizeFirst(q.difficulty)}</div>
              </div>
            </div>
            <button class="btn-primary text-xs px-3 py-1">Start →</button>
          </div>
        `).join('') : '<p class="text-sm text-center py-6" style="color:#64748b">No quizzes available yet</p>'}
      </div>

      <!-- Right column: Challenge + Streak -->
      <div class="flex flex-col gap-4">
        <div class="card p-5">
          <h3 class="font-bold mb-3">🔥 Daily Challenge</h3>
          ${ch ? `
            <div class="exam-countdown-card mb-3">
              <div class="text-2xl mb-1">⚡</div>
              <div class="font-semibold text-sm">${ch.title}</div>
              <div class="badge-pill badge-yellow mt-2">+${ch.points_reward} pts</div>
            </div>
            <button class="btn-primary w-full text-sm" onclick="showPage('challenge')">Take Challenge</button>
          ` : '<p class="text-sm text-center py-3" style="color:#64748b">No challenge today</p>'}
          <div class="mt-4 pt-4 border-t" style="border-color:rgba(255,255,255,.07)">
            <div class="flex justify-between text-sm mb-2">
              <span style="color:#94a3b8">Study Streak</span>
              <span class="font-bold text-orange-400">🔥 ${currentUser.streak || 0} days</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min((currentUser.streak||0)*10,100)}%"></div></div>
          </div>
        </div>

        <!-- Exam Countdown mini -->
        <div class="card p-4">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-bold text-sm">⏰ Upcoming Exams</h3>
            <button class="text-xs text-primary-400" onclick="showPage('exams')">All →</button>
          </div>
          ${examList.slice(0,2).map(exam => {
            const days = Math.max(0, Math.ceil((new Date(exam.exam_date) - new Date()) / 86400000));
            return `<div class="flex justify-between items-center py-2 border-b" style="border-color:rgba(255,255,255,.06)">
              <div class="text-xs font-medium">${exam.title.substring(0,28)}${exam.title.length>28?'…':''}</div>
              <div class="text-right"><div class="countdown-num text-base">${days}</div><div class="text-xs" style="color:#94a3b8">days</div></div>
            </div>`;
          }).join('') || '<p class="text-xs text-center py-2" style="color:#64748b">No upcoming exams</p>'}
        </div>
      </div>
    </div>

    <!-- Key Resources -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold">📚 Key Resources</h3>
        <button class="text-xs text-primary-400 hover:underline" onclick="showPage('resources')">View All →</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${resList.length ? resList.map(r => `
          <div class="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-all" style="background:rgba(99,102,241,.05);border:1px solid rgba(99,102,241,.08)" onclick="viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')">
            <div class="text-2xl">${resourceIcon(r.type)}</div>
            <div class="flex-1 overflow-hidden">
              <div class="font-medium text-sm truncate">${r.title}</div>
              <div class="text-xs mt-0.5" style="color:#64748b">${capitalizeFirst(r.type.replace('_',' '))} · Sem ${r.semester||'?'}</div>
            </div>
            ${r.is_important ? '<span class="badge-pill badge-red text-xs">⭐</span>' : ''}
          </div>
        `).join('') : '<p class="text-sm text-center col-span-3 py-6" style="color:#64748b">No resources yet</p>'}
      </div>
    </div>
  `;
}

async function loadAdminDashboard(el) {
  const [analyticsData, users] = await Promise.allSettled([
    apiFetch('/analytics/admin'),
    apiFetch('/users?limit=5'),
  ]);
  const stats = analyticsData.status === 'fulfilled' ? analyticsData.value : {};
  const userList = users.status === 'fulfilled' ? (users.value.users || []) : [];

  el.innerHTML = `
    <div class="card p-6 mb-6 relative overflow-hidden" style="background:linear-gradient(135deg,#1e1e3f,#2d1b69)">
      <h2 class="text-2xl font-bold text-white mb-1">👑 Admin Dashboard</h2>
      <p style="color:#a5b4fc">VTU Super Learning Platform — Control Panel</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card cursor-pointer" onclick="showPage('admin-users')"><div class="text-2xl mb-1">👥</div><div class="text-2xl font-bold text-primary-400">${stats.total_users||0}</div><div class="text-xs mt-1" style="color:#64748b">Total Users</div></div>
      <div class="stat-card cursor-pointer" onclick="showPage('resources')"><div class="text-2xl mb-1">📚</div><div class="text-2xl font-bold text-green-400">${stats.total_resources||0}</div><div class="text-xs mt-1" style="color:#64748b">Resources</div></div>
      <div class="stat-card cursor-pointer" onclick="showPage('quiz')"><div class="text-2xl mb-1">🎯</div><div class="text-2xl font-bold text-yellow-400">${stats.total_quizzes||0}</div><div class="text-xs mt-1" style="color:#64748b">Quizzes</div></div>
      <div class="stat-card cursor-pointer" onclick="showPage('analytics')"><div class="text-2xl mb-1">📥</div><div class="text-2xl font-bold text-orange-400">${stats.total_downloads||0}</div><div class="text-xs mt-1" style="color:#64748b">Downloads</div></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="card p-5">
        <h3 class="font-bold mb-4">⚡ Quick Actions</h3>
        <div class="grid grid-cols-2 gap-3">
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500 transition-all" onclick="showUploadModal()"><div class="text-2xl mb-1">📤</div><div class="text-xs font-semibold">Upload Resource</div></button>
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500 transition-all" onclick="showCreateQuizModal()"><div class="text-2xl mb-1">➕</div><div class="text-xs font-semibold">Create Quiz</div></button>
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500 transition-all" onclick="showAddAnnouncementModal()"><div class="text-2xl mb-1">📢</div><div class="text-xs font-semibold">Announcement</div></button>
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500 transition-all" onclick="showPage('quiz-manager')"><div class="text-2xl mb-1">⚙️</div><div class="text-xs font-semibold">Quiz Manager</div></button>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold mb-4">👥 Recent Users</h3>
        ${userList.map(u => `
          <div class="flex items-center gap-3 p-2 rounded-lg mb-1 hover:bg-primary-500 hover:bg-opacity-5 transition-all">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${u.name[0]}</div>
            <div class="flex-1">
              <div class="text-sm font-medium">${u.name}</div>
              <div class="text-xs" style="color:#64748b">${u.branch||'—'} · Sem ${u.semester||'—'} · ⭐ ${u.points||0}</div>
            </div>
            <span class="badge-pill ${u.role==='admin'?'badge-yellow':'badge-green'} text-xs">${u.role}</span>
          </div>
        `).join('')}
        <button class="btn-secondary w-full mt-3 text-sm" onclick="showPage('admin-users')">View All Users</button>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="stat-card text-center"><div class="text-xl mb-1">🎓</div><div class="text-xl font-bold text-green-400">${stats.total_students||0}</div><div class="text-xs" style="color:#64748b">Students</div></div>
      <div class="stat-card text-center"><div class="text-xl mb-1">🌿</div><div class="text-xl font-bold text-blue-400">${stats.total_branches||20}</div><div class="text-xs" style="color:#64748b">Branches</div></div>
      <div class="stat-card text-center"><div class="text-xl mb-1">📝</div><div class="text-xl font-bold text-purple-400">${stats.total_quiz_attempts||0}</div><div class="text-xs" style="color:#64748b">Quiz Attempts</div></div>
      <div class="stat-card text-center"><div class="text-xl mb-1">📊</div><div class="text-xl font-bold text-yellow-400">${stats.avg_quiz_score ? stats.avg_quiz_score.toFixed(1) : 0}%</div><div class="text-xs" style="color:#64748b">Avg Score</div></div>
    </div>
  `;
}

// ── Branches ──────────────────────────────────────────────────
async function loadBranches() {
  const el = document.getElementById('branches-content');
  el.innerHTML = skeletonGrid(4, 100);
  try {
    const data = await apiFetch('/branches');
    allBranches = data.branches || [];
    renderBranches(allBranches);
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
function renderBranches(branches) {
  const el = document.getElementById('branches-content');
  const grouped = {};
  branches.forEach(b => { if (!grouped[b.category]) grouped[b.category] = []; grouped[b.category].push(b); });
  if (!Object.keys(grouped).length) { el.innerHTML = '<p class="text-center py-12" style="color:#64748b">No branches found</p>'; return; }
  el.innerHTML = Object.entries(grouped).map(([cat, list]) => `
    <div class="mb-8">
      <h3 class="text-base font-bold mb-4 flex items-center gap-2">
        <span class="inline-block w-1 h-5 rounded-full" style="background:#6366f1"></span>${cat}
        <span class="badge-pill badge-purple text-xs">${list.length}</span>
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${list.map(b => `
          <div class="card p-5 cursor-pointer group" onclick="selectBranch('${b.code}','${escHtml(b.name)}')">
            <div class="text-3xl mb-3">${b.icon||'📚'}</div>
            <div class="font-bold text-sm">${b.code}</div>
            <div class="text-xs mt-1" style="color:#94a3b8">${b.name}</div>
            ${b.description ? `<div class="text-xs mt-2 line-clamp-2" style="color:#64748b">${b.description}</div>` : ''}
            <div class="mt-3 flex gap-1 flex-wrap">
              <span class="badge-pill badge-purple text-xs">${b.total_semesters||8} Sems</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
function filterBranches(q) {
  renderBranches(allBranches.filter(b =>
    b.name.toLowerCase().includes(q.toLowerCase()) ||
    b.code.toLowerCase().includes(q.toLowerCase()) ||
    (b.category||'').toLowerCase().includes(q.toLowerCase())
  ));
}
function selectBranch(code) {
  document.getElementById('subject-sem-filter').value = '';
  sessionStorage.setItem('current_branch', code);
  showPage('subjects');
}

async function populateBranchSelect(selectId, selectedCode = '') {
  const select = document.getElementById(selectId);
  if (!select) return;
  if (!allBranches.length) {
    const data = await apiFetch('/branches');
    allBranches = data.branches || [];
  }
  select.innerHTML = allBranches.map(b => `<option value="${b.code}">${b.code} - ${b.name}</option>`).join('');
  if (selectedCode && allBranches.some(b => b.code === selectedCode)) select.value = selectedCode;
}

function showAddBranchModal() {
  document.getElementById('branch-modal').style.display = 'flex';
}

async function submitBranch() {
  const code = document.getElementById('branch-code').value.trim().toUpperCase();
  const name = document.getElementById('branch-name').value.trim();
  const category = document.getElementById('branch-category').value.trim();
  if (!code || !name || !category) return showToast('Code, name and category are required', 'error');
  try {
    await apiFetch('/branches', { method: 'POST', body: JSON.stringify({
      code, name, category,
      description: document.getElementById('branch-desc').value.trim(),
      icon: document.getElementById('branch-icon').value.trim() || '🌿',
      total_semesters: 8,
    })});
    ['branch-code','branch-name','branch-category','branch-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('branch-icon').value = '🌿';
    closeModal('branch-modal');
    showToast('Branch added successfully', 'success');
    allBranches = [];
    loadBranches();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Subjects ──────────────────────────────────────────────────
async function loadSubjects() {
  const el = document.getElementById('subjects-content');
  el.innerHTML = skeletonGrid(6, 90);
  const sem = document.getElementById('subject-sem-filter').value;
  const branch = sessionStorage.getItem('current_branch') || (currentUser?.branch || 'CSE');
  try {
    let url = `/subjects?branch=${branch}`;
    if (sem) url += `&semester=${sem}`;
    const data = await apiFetch(url);
    allSubjects = data.subjects || [];
    renderSubjects(allSubjects, branch);
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
function renderSubjects(subjects, branch) {
  const el = document.getElementById('subjects-content');
  if (!subjects.length) { el.innerHTML = '<p class="text-center py-12" style="color:#64748b">No subjects found for this branch/semester</p>'; return; }
  const bySem = {};
  subjects.forEach(s => { if (!bySem[s.semester]) bySem[s.semester] = []; bySem[s.semester].push(s); });
  el.innerHTML = `
    <div class="mb-4 p-3 card text-sm flex items-center gap-2">
      <span class="font-medium">Branch:</span>
      <span class="badge-pill badge-purple">${branch}</span>
      <span class="badge-pill badge-blue">${subjects.length} subjects</span>
      <button class="ml-auto text-xs text-primary-400" onclick="showPage('branches')">← Change Branch</button>
    </div>
    ${Object.entries(bySem).sort(([a],[b]) => +a - +b).map(([sem, list]) => `
      <div class="mb-6">
        <h3 class="font-bold mb-3 text-base flex items-center gap-2">
          <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${sem}</span>
          Semester ${sem}
          <span class="badge-pill badge-blue text-xs">${list.length} subjects</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${list.map(s => `
            <div class="card p-4 cursor-pointer" onclick="viewSubjectResources(${s.id},'${escHtml(s.name)}')">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-semibold text-sm">${s.name}</div>
                  <div class="text-xs mt-1" style="color:#6366f1">${s.code}</div>
                  <div class="text-xs mt-1" style="color:#64748b">${s.credits||4} Credits</div>
                </div>
                <span class="badge-pill badge-blue text-xs">Sem ${s.semester}</span>
              </div>
              ${s.description ? `<p class="text-xs mt-2 line-clamp-2" style="color:#94a3b8">${s.description}</p>` : ''}
              <div class="flex gap-2 mt-3">
                <button class="btn-secondary text-xs py-1 px-2 flex-1" onclick="event.stopPropagation();viewSubjectResources(${s.id},'${escHtml(s.name)}')"><i class="fas fa-file-pdf mr-1"></i>Resources</button>
                <button class="btn-secondary text-xs py-1 px-2 flex-1" onclick="event.stopPropagation();filterQuizBySubject(${s.id})"><i class="fas fa-question-circle mr-1"></i>Quiz</button>
                <button class="btn-secondary text-xs py-1 px-2" onclick="event.stopPropagation();aiAskAbout('${escHtml(s.name)}')"><i class="fas fa-robot"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

async function showAddSubjectModal() {
  await populateBranchSelect('subject-branch', sessionStorage.getItem('current_branch') || currentUser?.branch || '');
  document.getElementById('subject-modal').style.display = 'flex';
}

async function submitSubject() {
  const code = document.getElementById('subject-code').value.trim().toUpperCase();
  const name = document.getElementById('subject-name').value.trim();
  const branchCode = document.getElementById('subject-branch').value;
  const semester = parseInt(document.getElementById('subject-semester').value);
  const credits = parseInt(document.getElementById('subject-credits').value) || 4;
  if (!code || !name || !branchCode || !semester) return showToast('Code, name, branch and semester are required', 'error');
  try {
    await apiFetch('/subjects', { method: 'POST', body: JSON.stringify({
      code, name, branch_code: branchCode, semester, credits,
      description: document.getElementById('subject-desc').value.trim(),
    })});
    ['subject-code','subject-name','subject-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('subject-semester').value = '1';
    document.getElementById('subject-credits').value = '4';
    sessionStorage.setItem('current_branch', branchCode);
    closeModal('subject-modal');
    showToast('Subject added successfully', 'success');
    loadSubjects();
  } catch(e) { showToast(e.message, 'error'); }
}
function viewSubjectResources(subjectId, subjectName) {
  sessionStorage.setItem('filter_subject_id', subjectId);
  sessionStorage.setItem('filter_subject_name', subjectName);
  showPage('resources');
}
function filterQuizBySubject(subjectId) {
  sessionStorage.setItem('filter_quiz_subject', subjectId);
  showPage('quiz');
}
function aiAskAbout(subjectName) {
  document.getElementById('chat-input') && (document.getElementById('chat-input').value = `Explain the key concepts of ${subjectName} for VTU exams`);
  showPage('ai');
  setTimeout(sendChat, 200);
}

// ── Resources ─────────────────────────────────────────────────
async function loadResources() {
  const el = document.getElementById('resources-content');
  el.innerHTML = skeletonGrid(6, 100);
  const type = document.getElementById('res-type-filter')?.value || '';
  const sem = document.getElementById('res-sem-filter')?.value || '';
  const scheme = document.getElementById('res-scheme-filter')?.value || '';
  const search = document.getElementById('res-search')?.value || '';
  const subjectId = sessionStorage.getItem('filter_subject_id');
  const subjectName = sessionStorage.getItem('filter_subject_name');
  let url = '/resources?limit=40';
  if (type) url += `&type=${type}`;
  if (sem) url += `&semester=${sem}`;
  if (scheme) url += `&scheme=${encodeURIComponent(scheme)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (subjectId) url += `&subject_id=${subjectId}`;
  try {
    const data = await apiFetch(url);
    allResources = data.resources || [];
    let html = '';
    if (subjectId && subjectName) {
      html += `<div class="mb-4 p-3 card text-sm flex items-center gap-2">
        <span>📌 Resources for:</span><span class="badge-pill badge-purple">${subjectName}</span>
        <button class="ml-auto text-xs text-primary-400" onclick="sessionStorage.removeItem('filter_subject_id');sessionStorage.removeItem('filter_subject_name');loadResources()">✕ Clear</button>
      </div>`;
    }
    if (!allResources.length) {
      html += '<div class="text-center py-16 card p-10"><div class="text-5xl mb-3">📭</div><p class="font-semibold mb-2">No resources found</p><p class="text-sm" style="color:#64748b">Try adjusting your filters or search terms</p></div>';
      el.innerHTML = html; return;
    }
    html += `
      <div class="flex gap-2 flex-wrap mb-5">
        ${['all','notes','syllabus','textbook','question_paper','lab_manual','video'].map(t => `
          <button class="tab-btn text-xs ${type===t||(!type&&t==='all')?'active':''}" onclick="document.getElementById('res-type-filter').value='${t==='all'?'':t}';loadResources()">
            ${t==='all'?'📋 All':resourceIcon(t)+' '+capitalizeFirst(t.replace('_',' '))}
          </button>
        `).join('')}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${allResources.map(r => `
          <div class="resource-card" onclick="viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')">
            <div class="flex items-start gap-3">
              <div class="text-3xl">${resourceIcon(r.type)}</div>
              <div class="flex-1 overflow-hidden">
                <div class="font-semibold text-sm leading-tight">${r.title}</div>
                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span class="badge-pill badge-blue text-xs">${capitalizeFirst(r.type.replace('_',' '))}</span>
                  ${r.semester ? `<span class="badge-pill badge-purple text-xs">Sem ${r.semester}</span>` : ''}
                  <span class="badge-pill badge-green text-xs">${r.scheme || '2021'} Scheme</span>
                  ${r.is_important ? `<span class="badge-pill badge-red text-xs">⭐ Key</span>` : ''}
                </div>
                ${r.description ? `<p class="text-xs mt-1.5 line-clamp-2" style="color:#94a3b8">${r.description}</p>` : ''}
                <div class="flex items-center gap-3 mt-2 text-xs" style="color:#64748b">
                  <span><i class="fas fa-eye mr-1"></i>${r.view_count||0}</span>
                  <span><i class="fas fa-download mr-1"></i>${r.download_count||0}</span>
                  ${r.uploader_name ? `<span><i class="fas fa-user mr-1"></i>${r.uploader_name}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="flex gap-2 mt-3">
              <button class="btn-primary text-xs py-1 flex-1" onclick="event.stopPropagation();viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')"><i class="fas fa-eye mr-1"></i>View</button>
              ${r.file_url ? `<button class="btn-secondary text-xs py-1 px-3" title="Download" onclick="event.stopPropagation();downloadResource(${r.id},'${r.file_url}','${escHtml(r.title)}')"><i class="fas fa-download"></i></button>` : ''}
              <button class="btn-secondary text-xs py-1 px-3" title="Bookmark" onclick="event.stopPropagation();toggleBookmark(${r.id},this)"><i class="fas fa-bookmark"></i></button>
              ${currentUser?.role === 'admin' ? `
                <button class="btn-secondary text-xs py-1 px-2" title="Edit" onclick="event.stopPropagation();showEditResourceModal(${r.id},'${escHtml(r.title)}','${escHtml(r.description||'')}','${r.type}',${r.semester||1},'${r.scheme||'2021'}','${r.file_url||''}',${r.is_important||0})"><i class="fas fa-edit"></i></button>
                <button class="btn-danger text-xs py-1 px-2" title="Delete" onclick="event.stopPropagation();deleteResource(${r.id})"><i class="fas fa-trash"></i></button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}

function dataUrlToObjectUrl(dataUrl) {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/pdf';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

function getPdfViewerUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:application/pdf')) return dataUrlToObjectUrl(url);
  if (url.toLowerCase().includes('.pdf')) return url;
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}

function viewResource(id, title, url, type) {
  apiFetch(`/resources/${id}/view`, { method: 'POST' }).catch(() => {});
  const body = document.getElementById('res-modal-body');
  document.getElementById('res-modal-title').textContent = title;
  if (body.dataset.objectUrl) {
    URL.revokeObjectURL(body.dataset.objectUrl);
    delete body.dataset.objectUrl;
  }
  let content = '';
  if (type === 'video' && url) {
    const ytId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)?.[1];
    content = ytId
      ? `<div style="position:relative;padding-bottom:56.25%;height:0"><iframe src="https://www.youtube.com/embed/${ytId}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`
      : `<div class="text-center py-8"><a href="${url}" target="_blank" class="btn-primary"><i class="fas fa-external-link-alt mr-2"></i>Open Video</a></div>`;
  } else if (url) {
    const isPdf = url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf');
    const viewerUrl = getPdfViewerUrl(url);
    if (viewerUrl.startsWith('blob:')) body.dataset.objectUrl = viewerUrl;
    content = `
      <div class="flex gap-2 mb-3 flex-wrap">
        <a href="${url}" target="_blank" class="btn-primary text-sm"><i class="fas fa-external-link-alt mr-1"></i>Open PDF</a>
        <button class="btn-secondary text-sm" onclick="downloadResource(${id},'${url}','${escHtml(title)}')"><i class="fas fa-download mr-1"></i>Download</button>
        <button class="btn-secondary text-sm" onclick="toggleBookmark(${id},this)"><i class="fas fa-bookmark mr-1"></i>Bookmark</button>
      </div>
      <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(99,102,241,.2);background:#0f172a">
        <iframe title="${escHtml(title)} PDF viewer" src="${viewerUrl}" style="width:100%;height:min(72vh,680px);border:none;background:#fff"></iframe>
      </div>
      <p class="text-xs mt-2 text-center" style="color:#64748b">${isPdf ? 'Uploaded PDF preview is shown above. Use Open PDF or Download if your browser blocks inline viewing.' : 'If the preview does not load, click to open directly.'}</p>`;
  } else {
    content = `<div class="text-center py-12"><div class="text-5xl mb-3">📄</div><p style="color:#64748b">No file attached to this resource</p></div>`;
  }
  body.innerHTML = content;
  document.getElementById('resource-modal').style.display = 'flex';
}

async function downloadResource(id, url, title) {
  try {
    await apiFetch(`/resources/${id}/download`, { method: 'POST' });
    const a = document.createElement('a');
    a.href = url; a.download = title + '.pdf'; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Download started! ⬇️', 'success');
  } catch(e) { window.open(url, '_blank'); }
}

async function toggleBookmark(resourceId, btn) {
  try {
    const data = await apiFetch(`/resources/${resourceId}/bookmark`, { method: 'POST' });
    if (data.bookmarked) {
      btn.innerHTML = '<i class="fas fa-bookmark text-primary-400"></i>';
      showToast('Bookmarked! 🔖', 'success');
    } else {
      btn.innerHTML = '<i class="fas fa-bookmark"></i>';
      showToast('Bookmark removed', 'info');
    }
  } catch(e) { showToast(e.message, 'error'); }
}

async function deleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  try {
    await apiFetch(`/resources/${id}`, { method: 'DELETE' });
    showToast('Resource deleted', 'success');
    loadResources();
  } catch(e) { showToast(e.message, 'error'); }
}

async function showUploadModal() {
  document.getElementById('upload-modal').style.display = 'flex';
  await populateBranchSelect('upload-branch', currentUser?.branch || '');
  await loadUploadSubjects();
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read selected PDF'));
    reader.readAsDataURL(file);
  });
}

async function loadUploadSubjects() {
  const branch = document.getElementById('upload-branch')?.value || currentUser?.branch || 'CSE';
  const select = document.getElementById('upload-subject');
  if (!select) return;
  select.innerHTML = '<option value="">No subject</option>';
  try {
    const data = await apiFetch(`/subjects?branch=${encodeURIComponent(branch)}&limit=200`);
    (data.subjects || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.code} - ${s.name} (Sem ${s.semester})`;
      select.appendChild(opt);
    });
  } catch(e) {}
}

async function submitUpload() {
  const title = document.getElementById('upload-title').value.trim();
  const type = document.getElementById('upload-type').value;
  const url = document.getElementById('upload-url').value.trim();
  const file = document.getElementById('upload-file')?.files?.[0];
  const isVideo = type === 'video';
  if (!title) return showToast('Title is required', 'error');
  if (!isVideo && !file) return showToast('Select a PDF file to upload', 'error');
  if (isVideo && !url && !file) return showToast('Add a video link or select a PDF file', 'error');
  if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return showToast('Only PDF files are allowed', 'error');
  if (file && file.size > 5 * 1024 * 1024) return showToast('PDF must be 5 MB or smaller for this local database upload', 'error');
  const fileUrl = file ? await fileToDataUrl(file) : url;
  const branchCode = document.getElementById('upload-branch')?.value || currentUser?.branch || 'CSE';
  const subjectId = document.getElementById('upload-subject')?.value || null;
  const body = {
    title, description: document.getElementById('upload-desc').value,
    type,
    semester: parseInt(document.getElementById('upload-semester').value),
    scheme: document.getElementById('upload-scheme')?.value || '2021',
    file_url: fileUrl, file_name: file ? file.name : title + (isVideo ? '' : '.pdf'), file_size: file ? file.size : null,
    tags: document.getElementById('upload-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    is_important: document.getElementById('upload-important').checked ? 1 : 0,
    branch_code: branchCode,
    subject_id: subjectId ? parseInt(subjectId) : null,
  };
  try {
    const data = await apiFetch('/resources', { method: 'POST', body: JSON.stringify(body) });
    closeModal('upload-modal');
    // Clear form
    ['upload-title','upload-desc','upload-url','upload-tags','upload-file'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    const schemeEl = document.getElementById('upload-scheme'); if (schemeEl) schemeEl.value = '2021';
    document.getElementById('upload-important').checked = false;
    showToast('Resource uploaded successfully! 📚', 'success');
    await loadResources();
    if (data.resource) viewResource(data.resource.id, data.resource.title, data.resource.file_url, data.resource.type);
  } catch(e) { showToast(e.message, 'error'); }
}

function showEditResourceModal(id, title, desc, type, sem, scheme, url, important) {
  document.getElementById('edit-res-id').value = id;
  document.getElementById('edit-res-title').value = title;
  document.getElementById('edit-res-desc').value = desc;
  document.getElementById('edit-res-type').value = type;
  document.getElementById('edit-res-semester').value = sem;
  document.getElementById('edit-res-scheme').value = scheme || '2021';
  document.getElementById('edit-res-url').value = url;
  document.getElementById('edit-res-important').checked = !!important;
  document.getElementById('edit-resource-modal').style.display = 'flex';
}
async function submitEditResource() {
  const id = document.getElementById('edit-res-id').value;
  const title = document.getElementById('edit-res-title').value.trim();
  const url = document.getElementById('edit-res-url').value.trim();
  if (!title || !url) return showToast('Title and URL required', 'error');
  try {
    await apiFetch(`/resources/${id}`, { method: 'PUT', body: JSON.stringify({
      title, description: document.getElementById('edit-res-desc').value,
      type: document.getElementById('edit-res-type').value,
      semester: parseInt(document.getElementById('edit-res-semester').value),
      scheme: document.getElementById('edit-res-scheme')?.value || '2021',
      file_url: url, is_important: document.getElementById('edit-res-important').checked ? 1 : 0,
    })});
    closeModal('edit-resource-modal');
    showToast('Resource updated! ✅', 'success');
    loadResources();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Bookmarks ─────────────────────────────────────────────────
async function loadBookmarks() {
  const el = document.getElementById('bookmarks-content');
  el.innerHTML = skeletonGrid(3, 100);
  try {
    const data = await apiFetch('/resources/bookmarks/me');
    const resources = data.resources || [];
    if (!resources.length) {
      el.innerHTML = `<div class="text-center py-20 card p-12">
        <div class="text-6xl mb-4">🔖</div>
        <h3 class="text-xl font-bold mb-2">No Bookmarks Yet</h3>
        <p class="text-sm mb-6" style="color:#64748b">Save resources you want to revisit by clicking the 🔖 bookmark button on any resource.</p>
        <button class="btn-primary" onclick="showPage('resources')"><i class="fas fa-search mr-2"></i>Browse Resources</button>
      </div>`; return;
    }
    el.innerHTML = `
      <p class="text-sm mb-4" style="color:#64748b">${resources.length} bookmarked resource${resources.length!==1?'s':''}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${resources.map(r => `
          <div class="resource-card" onclick="viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')">
            <div class="flex items-start gap-3">
              <div class="text-3xl">${resourceIcon(r.type)}</div>
              <div class="flex-1 overflow-hidden">
                <div class="font-semibold text-sm">${r.title}</div>
                <div class="flex gap-1.5 mt-1 flex-wrap">
                  <span class="badge-pill badge-blue text-xs">${capitalizeFirst(r.type.replace('_',' '))}</span>
                  ${r.semester ? `<span class="badge-pill badge-purple text-xs">Sem ${r.semester}</span>` : ''}
                  ${r.is_important ? `<span class="badge-pill badge-red text-xs">⭐ Key</span>` : ''}
                </div>
                <div class="text-xs mt-1" style="color:#64748b">Saved ${timeAgo(r.bookmarked_at)}</div>
              </div>
            </div>
            <div class="flex gap-2 mt-3">
              <button class="btn-primary text-xs py-1 flex-1" onclick="event.stopPropagation();viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')"><i class="fas fa-eye mr-1"></i>View</button>
              ${r.file_url ? `<button class="btn-secondary text-xs py-1 px-3" onclick="event.stopPropagation();downloadResource(${r.id},'${r.file_url}','${escHtml(r.title)}')"><i class="fas fa-download"></i></button>` : ''}
              <button class="btn-danger text-xs py-1 px-3" title="Remove bookmark" onclick="event.stopPropagation();removeBookmark(${r.id},this)"><i class="fas fa-bookmark"></i></button>
            </div>
          </div>
        `).join('')}
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
async function removeBookmark(id, btn) {
  try {
    await apiFetch(`/resources/${id}/bookmark`, { method: 'POST' });
    btn.closest('.resource-card').style.opacity = '0';
    btn.closest('.resource-card').style.transform = 'scale(.95)';
    btn.closest('.resource-card').style.transition = 'all .3s';
    setTimeout(() => loadBookmarks(), 350);
    showToast('Bookmark removed', 'info');
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Quiz ──────────────────────────────────────────────────────
async function loadQuizList() {
  const el = document.getElementById('quiz-list-content');
  el.innerHTML = skeletonGrid(4, 100);
  document.getElementById('quiz-list-view').style.display = 'block';
  document.getElementById('quiz-take-view').style.display = 'none';
  document.getElementById('quiz-result-view').style.display = 'none';
  try {
    const data = await apiFetch('/quiz');
    const quizzes = data.quizzes || [];
    if (!quizzes.length) { el.innerHTML = '<div class="text-center py-16"><div class="text-5xl mb-3">🎯</div><p style="color:#64748b">No quizzes available yet</p></div>'; return; }
    el.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${quizzes.map(q => `
          <div class="card p-5 flex flex-col">
            <div class="flex items-start justify-between mb-3">
              <div class="text-3xl">${q.difficulty==='easy'?'🟢':q.difficulty==='hard'?'🔴':'🟡'}</div>
              <span class="badge-pill ${q.difficulty==='easy'?'badge-green':q.difficulty==='hard'?'badge-red':'badge-yellow'}">${q.difficulty}</span>
            </div>
            <h3 class="font-bold text-base mb-1">${q.title}</h3>
            <p class="text-xs mb-3 flex-1" style="color:#94a3b8">${q.description||'Test your knowledge with this quiz'}</p>
            <div class="grid grid-cols-3 gap-2 text-center mb-4">
              <div class="p-2 rounded-lg" style="background:rgba(99,102,241,.08)"><div class="text-sm font-bold">${q.total_questions}</div><div class="text-xs" style="color:#64748b">Questions</div></div>
              <div class="p-2 rounded-lg" style="background:rgba(99,102,241,.08)"><div class="text-sm font-bold">${q.duration_minutes}m</div><div class="text-xs" style="color:#64748b">Time</div></div>
              <div class="p-2 rounded-lg" style="background:rgba(99,102,241,.08)"><div class="text-sm font-bold">${q.passing_score}%</div><div class="text-xs" style="color:#64748b">Pass</div></div>
            </div>
            <button class="btn-primary w-full" onclick="startQuiz(${q.id})"><i class="fas fa-play mr-2"></i>Start Quiz</button>
          </div>
        `).join('')}
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
async function startQuiz(quizId) {
  try {
    showToast('Loading quiz…', 'info');
    const data = await apiFetch(`/quiz/${quizId}`);
    if (!data.questions || data.questions.length === 0) {
      showToast('This quiz has no questions yet!', 'error'); return;
    }
    currentQuiz = data; quizAnswers = {}; currentQuestionIndex = 0;
    document.getElementById('quiz-list-view').style.display = 'none';
    document.getElementById('quiz-take-view').style.display = 'block';
    document.getElementById('quiz-result-view').style.display = 'none';
    renderQuizQuestion();
    startQuizTimer(data.quiz.duration_minutes * 60);
  } catch(e) { showToast('Failed to load quiz: ' + e.message, 'error'); }
}

function renderQuizQuestion() {
  const el = document.getElementById('quiz-take-content');
  if (!currentQuiz) return;
  const q = currentQuiz.questions[currentQuestionIndex];
  const total = currentQuiz.questions.length;
  const quiz = currentQuiz.quiz;
  const progress = ((currentQuestionIndex + 1) / total * 100).toFixed(0);
  el.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <button class="btn-secondary text-sm" onclick="if(confirm('Exit quiz? Progress will be lost.'))loadQuizList()"><i class="fas fa-times mr-1"></i>Exit</button>
        <div class="text-center">
          <div class="font-bold text-sm">${quiz.title}</div>
          <div class="text-xs" style="color:#64748b">Q ${currentQuestionIndex+1} of ${total}</div>
        </div>
        <div class="text-lg font-bold text-primary-400 font-mono" id="quiz-timer">--:--</div>
      </div>
      <div class="progress-bar mb-6 h-2"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="card p-6 mb-4">
        <div class="text-xs mb-2" style="color:#6366f1">Question ${currentQuestionIndex+1}</div>
        <h3 class="text-base font-semibold mb-5 leading-relaxed">${q.question}</h3>
        <div>
          ${['a','b','c','d'].map(opt => `
            <div class="quiz-option ${quizAnswers[currentQuestionIndex]===opt?'selected':''}" onclick="selectAnswer(${currentQuestionIndex},'${opt}',this)">
              <span class="font-bold mr-2" style="color:#6366f1">${opt.toUpperCase()}.</span>${q['option_'+opt]}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="flex items-center justify-between">
        <button class="btn-secondary" onclick="prevQuestion()" ${currentQuestionIndex===0?'disabled style="opacity:.4"':''}>← Prev</button>
        <div class="flex gap-1.5 flex-wrap justify-center max-w-xs">
          ${currentQuiz.questions.map((_,i) => `
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all"
              style="background:${i===currentQuestionIndex?'#6366f1':quizAnswers[i]?'#22c55e':'rgba(99,102,241,.15)'};color:${i===currentQuestionIndex||quizAnswers[i]?'#fff':'#818cf8'}"
              onclick="goToQuestion(${i})">${i+1}</div>
          `).join('')}
        </div>
        ${currentQuestionIndex < total-1
          ? `<button class="btn-primary" onclick="nextQuestion()">Next →</button>`
          : `<button class="btn-primary" onclick="submitQuiz()" style="background:linear-gradient(135deg,#22c55e,#16a34a)"><i class="fas fa-check mr-1"></i>Submit</button>`}
      </div>
    </div>`;
}

function selectAnswer(qIdx, opt, el) {
  quizAnswers[qIdx] = opt;
  el.closest('.card').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}
function nextQuestion() { if (currentQuestionIndex < currentQuiz.questions.length-1) { currentQuestionIndex++; renderQuizQuestion(); } }
function prevQuestion() { if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuizQuestion(); } }
function goToQuestion(i) { currentQuestionIndex = i; renderQuizQuestion(); }

function startQuizTimer(seconds) {
  if (quizTimer) clearInterval(quizTimer);
  let remaining = seconds;
  quizTimer = setInterval(() => {
    remaining--;
    const timerEl = document.getElementById('quiz-timer');
    if (timerEl) {
      const m = Math.floor(remaining/60).toString().padStart(2,'0');
      const s = (remaining%60).toString().padStart(2,'0');
      timerEl.textContent = `${m}:${s}`;
      if (remaining <= 60) timerEl.style.color = '#ef4444';
      if (remaining <= 10) timerEl.style.animation = 'pulse 0.5s infinite';
    }
    if (remaining <= 0) { clearInterval(quizTimer); submitQuiz(); }
  }, 1000);
}

async function submitQuiz() {
  if (quizTimer) clearInterval(quizTimer);
  const answers = currentQuiz.questions.map((_, i) => quizAnswers[i] || '');
  try {
    const data = await apiFetch(`/quiz/${currentQuiz.quiz.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, time_taken: currentQuiz.quiz.duration_minutes * 60 })
    });
    showQuizResult(data);
    // Update points in UI
    if (data.attempt?.points_earned) {
      currentUser.points = (currentUser.points || 0) + data.attempt.points_earned;
      updateSidebarUser();
    }
  } catch(e) { showToast('Failed to submit: ' + e.message, 'error'); }
}

function showQuizResult(data) {
  document.getElementById('quiz-take-view').style.display = 'none';
  document.getElementById('quiz-result-view').style.display = 'block';
  const el = document.getElementById('quiz-result-content');
  const { attempt, questions } = data;
  const pct = attempt.percentage || 0;
  const passed = pct >= (currentQuiz?.quiz?.passing_score || 60);
  el.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="card p-8 text-center mb-6">
        <div class="text-7xl mb-4">${pct>=90?'🏆':pct>=75?'🎉':pct>=60?'✅':'😔'}</div>
        <h2 class="text-4xl font-extrabold mb-2">${pct.toFixed(1)}%</h2>
        <p class="text-xl mb-2 font-semibold">${passed?'✅ Passed!':'❌ Not Passed'}</p>
        <p style="color:#64748b">${attempt.score} / ${attempt.total_marks} correct answers</p>
        <div class="flex gap-3 justify-center mt-4 flex-wrap">
          <span class="badge-pill ${passed?'badge-green':'badge-red'} text-sm">${passed?'PASSED':'FAILED'}</span>
          ${attempt.points_earned > 0 ? `<span class="badge-pill badge-yellow text-sm">+${attempt.points_earned} pts earned! ⭐</span>` : ''}
        </div>
        <div class="w-full max-w-xs mx-auto mt-6">
          <div class="progress-bar h-4 rounded-full"><div class="progress-fill rounded-full" style="width:${pct}%;background:${passed?'linear-gradient(90deg,#22c55e,#16a34a)':'linear-gradient(90deg,#ef4444,#dc2626)'}"></div></div>
        </div>
      </div>
      <div class="card p-5 mb-6">
        <h3 class="font-bold mb-4">📋 Answer Review</h3>
        ${(questions||[]).map((q,i) => `
          <div class="p-4 rounded-xl mb-3" style="background:rgba(${q.user_answer===q.correct_answer?'34,197,94':'239,68,68'},.07);border:1px solid rgba(${q.user_answer===q.correct_answer?'34,197,94':'239,68,68'},.2)">
            <div class="flex items-start gap-2">
              <span class="text-lg">${q.user_answer===q.correct_answer?'✅':'❌'}</span>
              <div class="flex-1">
                <p class="font-medium text-sm">${i+1}. ${q.question}</p>
                <p class="text-xs mt-1">Your answer: <strong>${q.user_answer ? q.user_answer.toUpperCase()+'. '+q['option_'+q.user_answer] : '⚠️ Not answered'}</strong></p>
                ${q.user_answer!==q.correct_answer ? `<p class="text-xs mt-0.5" style="color:#22c55e">✓ Correct: ${q.correct_answer.toUpperCase()}. ${q['option_'+q.correct_answer]}</p>` : ''}
                ${q.explanation ? `<p class="text-xs mt-2 p-2 rounded-lg" style="background:rgba(99,102,241,.12);color:#a5b4fc">💡 ${q.explanation}</p>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary flex-1" onclick="loadQuizList()"><i class="fas fa-list mr-1"></i>All Quizzes</button>
        <button class="btn-primary flex-1" onclick="startQuiz(${currentQuiz.quiz.id})"><i class="fas fa-redo mr-1"></i>Retry</button>
      </div>
    </div>`;
}

function showCreateQuizModal() { document.getElementById('create-quiz-modal').style.display = 'flex'; }
async function submitCreateQuiz() {
  const title = document.getElementById('cq-title').value.trim();
  if (!title) return showToast('Quiz title is required', 'error');
  const body = {
    title, description: document.getElementById('cq-desc').value,
    branch_code: document.getElementById('cq-branch').value,
    semester: parseInt(document.getElementById('cq-semester').value),
    duration_minutes: parseInt(document.getElementById('cq-duration').value),
    difficulty: document.getElementById('cq-difficulty').value,
    passing_score: parseInt(document.getElementById('cq-passing').value),
  };
  try {
    const data = await apiFetch('/quiz', { method: 'POST', body: JSON.stringify(body) });
    closeModal('create-quiz-modal');
    document.getElementById('cq-title').value = '';
    showToast('Quiz created! 🎯 Now add questions in Quiz Manager.', 'success');
    if (currentPage === 'quiz-manager') loadQuizManager();
    else loadQuizList();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Quiz Manager (Admin) ───────────────────────────────────────
async function loadQuizManager() {
  const el = document.getElementById('quiz-manager-content');
  el.innerHTML = skeletonGrid(3, 80);
  try {
    const data = await apiFetch('/quiz?limit=50');
    const quizzes = data.quizzes || [];
    if (!quizzes.length) {
      el.innerHTML = `<div class="text-center py-16 card p-10">
        <div class="text-5xl mb-3">🎯</div>
        <p class="font-semibold mb-4">No quizzes yet</p>
        <button class="btn-primary" onclick="showCreateQuizModal()"><i class="fas fa-plus mr-1"></i>Create First Quiz</button>
      </div>`; return;
    }
    el.innerHTML = `
      <div class="space-y-4">
        ${quizzes.map(q => `
          <div class="card p-5">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 class="font-bold">${q.title}</h3>
                  <span class="badge-pill ${q.difficulty==='easy'?'badge-green':q.difficulty==='hard'?'badge-red':'badge-yellow'}">${q.difficulty}</span>
                  <span class="badge-pill badge-blue">${q.branch_code} Sem ${q.semester}</span>
                </div>
                <p class="text-sm mb-2" style="color:#94a3b8">${q.description||'No description'}</p>
                <div class="flex gap-3 text-xs" style="color:#64748b">
                  <span><i class="fas fa-question-circle mr-1"></i>${q.total_questions} questions</span>
                  <span><i class="fas fa-clock mr-1"></i>${q.duration_minutes} min</span>
                  <span><i class="fas fa-check-circle mr-1"></i>${q.passing_score}% to pass</span>
                </div>
              </div>
              <div class="flex gap-2 ml-4">
                <button class="btn-primary text-xs px-3 py-1" onclick="loadQuizQuestions(${q.id},'${escHtml(q.title)}')">
                  <i class="fas fa-list mr-1"></i>Questions
                </button>
                <button class="btn-danger text-xs px-2 py-1" onclick="deleteQuiz(${q.id})">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div id="quiz-questions-${q.id}" style="display:none" class="mt-4 pt-4 border-t" style="border-color:rgba(255,255,255,.07)"></div>
          </div>
        `).join('')}
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}

async function loadQuizQuestions(quizId, quizTitle) {
  const container = document.getElementById(`quiz-questions-${quizId}`);
  if (container.style.display !== 'none') { container.style.display = 'none'; return; }
  container.style.display = 'block';
  container.innerHTML = '<div class="text-sm text-center py-3" style="color:#64748b">Loading questions…</div>';
  try {
    const data = await apiFetch(`/quiz/${quizId}/questions`);
    const questions = data.questions || [];
    container.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-semibold">${questions.length} Questions in "${quizTitle}"</span>
        <button class="btn-primary text-xs px-3 py-1" onclick="showAddQuestionModal(${quizId})">
          <i class="fas fa-plus mr-1"></i>Add Question
        </button>
      </div>
      ${questions.length ? `
        <div class="space-y-2">
          ${questions.map((q, i) => `
            <div class="p-3 rounded-xl text-sm" style="background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.1)">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <span class="font-semibold text-xs text-primary-400">Q${i+1}.</span> ${q.question}
                  <div class="grid grid-cols-2 gap-1 mt-2">
                    ${['a','b','c','d'].map(opt => `
                      <div class="text-xs p-1.5 rounded ${q.correct_answer===opt?'text-green-400 font-bold':'opacity-60'}" style="background:rgba(${q.correct_answer===opt?'34,197,94':'99,102,241'},.08)">
                        ${opt.toUpperCase()}. ${q['option_'+opt]}${q.correct_answer===opt?' ✓':''}
                      </div>
                    `).join('')}
                  </div>
                  ${q.explanation ? `<p class="text-xs mt-1.5 p-1.5 rounded" style="background:rgba(99,102,241,.1);color:#a5b4fc">💡 ${q.explanation}</p>` : ''}
                </div>
                <button class="btn-danger text-xs px-2 py-1 flex-shrink-0" onclick="deleteQuestion(${q.id},${quizId},'${escHtml(quizTitle)}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `<div class="text-center py-6"><p class="text-sm mb-3" style="color:#64748b">No questions yet</p><button class="btn-primary text-sm" onclick="showAddQuestionModal(${quizId})"><i class="fas fa-plus mr-1"></i>Add First Question</button></div>`}
    `;
  } catch(e) { container.innerHTML = errorBox(e.message); }
}

function showAddQuestionModal(quizId) {
  document.getElementById('qq-quiz-id').value = quizId;
  ['qq-question','qq-a','qq-b','qq-c','qq-d','qq-explanation'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('qq-correct').value = 'a';
  document.getElementById('qq-marks').value = '1';
  document.getElementById('add-question-modal').style.display = 'flex';
}
async function submitAddQuestion() {
  const quizId = document.getElementById('qq-quiz-id').value;
  const question = document.getElementById('qq-question').value.trim();
  const a = document.getElementById('qq-a').value.trim();
  const b = document.getElementById('qq-b').value.trim();
  const c = document.getElementById('qq-c').value.trim();
  const d = document.getElementById('qq-d').value.trim();
  if (!question || !a || !b || !c || !d) return showToast('All fields are required', 'error');
  try {
    await apiFetch(`/quiz/${quizId}/questions`, { method: 'POST', body: JSON.stringify({
      question, option_a: a, option_b: b, option_c: c, option_d: d,
      correct_answer: document.getElementById('qq-correct').value,
      explanation: document.getElementById('qq-explanation').value.trim(),
      marks: parseInt(document.getElementById('qq-marks').value),
    })});
    closeModal('add-question-modal');
    showToast('Question added! ✅', 'success');
    loadQuizManager();
  } catch(e) { showToast(e.message, 'error'); }
}
async function deleteQuestion(qId, quizId, quizTitle) {
  if (!confirm('Delete this question?')) return;
  try {
    await apiFetch(`/quiz/questions/${qId}`, { method: 'DELETE' });
    showToast('Question deleted', 'info');
    loadQuizManager();
  } catch(e) { showToast(e.message, 'error'); }
}
async function deleteQuiz(id) {
  if (!confirm('Delete this quiz and all its questions?')) return;
  try {
    await apiFetch(`/quiz/${id}`, { method: 'DELETE' });
    showToast('Quiz deleted', 'info');
    loadQuizManager();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── AI Assistant ──────────────────────────────────────────────
async function loadSubjectsForAI() {
  try {
    const data = await apiFetch(`/subjects?branch=${currentUser?.branch||'CSE'}`);
    const sel = document.getElementById('ai-subject-select');
    if (sel && data.subjects) {
      data.subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id; opt.textContent = `${s.name} (Sem ${s.semester})`;
        sel.appendChild(opt);
      });
    }
  } catch(e) {}
}

function quickChat(msg) {
  document.getElementById('chat-input').value = msg;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const subjectId = document.getElementById('ai-subject-select').value;
  chatHistory.push({ role: 'user', content: msg });
  renderChatMessages();
  const container = document.getElementById('chat-messages');
  const typingEl = document.createElement('div');
  typingEl.id = 'typing-indicator';
  typingEl.innerHTML = `<div class="flex gap-2 items-end"><div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style="background:linear-gradient(135deg,#6366f1,#4f46e5)">🤖</div><div class="chat-bubble-ai p-3"><div class="flex gap-1 items-center">${[1,2,3].map(i=>`<div class="typing-dot" style="animation-delay:${(i-1)*.15}s"></div>`).join('')}</div></div></div>`;
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;
  try {
    const data = await apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message: msg, subject_id: subjectId ? parseInt(subjectId) : null, history: chatHistory.slice(-6) }) });
    typingEl.remove();
    chatHistory.push({ role: 'assistant', content: data.reply || 'I could not process that.' });
    renderChatMessages();
  } catch(e) {
    typingEl.remove();
    chatHistory.push({ role: 'assistant', content: "I'm having trouble connecting. Please try again!" });
    renderChatMessages();
  }
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container || !chatHistory.length) return;
  container.innerHTML = chatHistory.map(m => `
    <div class="flex gap-2 items-end ${m.role==='user'?'justify-end':''}">
      ${m.role==='assistant' ? '<div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style="background:linear-gradient(135deg,#6366f1,#4f46e5)">🤖</div>' : ''}
      <div class="${m.role==='user'?'chat-bubble-user':'chat-bubble-ai'}">
        <div class="text-sm" style="line-height:1.7">${m.role==='assistant' ? (typeof marked !== 'undefined' ? marked.parse(m.content) : m.content.replace(/\n/g,'<br>')) : escHtmlFull(m.content)}</div>
      </div>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

function clearChat() {
  chatHistory = [];
  document.getElementById('chat-messages').innerHTML = `
    <div class="text-center py-8">
      <div class="text-5xl mb-3">🤖</div>
      <p class="font-semibold">Chat cleared!</p>
      <p class="text-sm mt-1" style="color:#64748b">Start a new conversation.</p>
    </div>`;
}

// ── Placement Prep ─────────────────────────────────────────────
async function loadPlacement(category) {
  const el = document.getElementById('placement-content');
  el.innerHTML = skeletonGrid(3, 100);
  const cat = category || document.getElementById('placement-cat')?.value || '';
  try {
    let url = '/placement';
    if (cat) url += `?category=${cat}`;
    const data = await apiFetch(url);
    const questions = data.questions || [];
    if (!questions.length) { el.innerHTML = '<div class="text-center py-12"><div class="text-5xl mb-3">💼</div><p style="color:#64748b">No questions found</p></div>'; return; }
    el.innerHTML = `
      <div class="space-y-4">
        ${questions.map((q,i) => `
          <div class="card p-5">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${i+1}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="badge-pill ${q.category==='aptitude'?'badge-blue':q.category==='coding'?'badge-green':q.category==='hr'?'badge-yellow':'badge-purple'}">${capitalizeFirst(q.category)}</span>
                  ${q.company ? `<span class="badge-pill badge-blue text-xs"><i class="fas fa-building mr-1"></i>${q.company}</span>` : ''}
                  <span class="badge-pill ${q.difficulty==='easy'?'badge-green':q.difficulty==='hard'?'badge-red':'badge-yellow'}">${q.difficulty}</span>
                </div>
                <p class="font-semibold text-sm mb-3 leading-relaxed">${q.question}</p>
                <div id="ans-${i}" style="display:none">
                  <div class="p-3 rounded-xl text-sm" style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#86efac">
                    <strong>Answer:</strong><br>${q.answer||'No answer provided'}
                  </div>
                </div>
                <button class="btn-secondary text-xs mt-1" onclick="toggleAnswer(${i})"><i class="fas fa-lightbulb mr-1"></i>Show Answer</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
function filterPlacement(cat) {
  document.getElementById('placement-cat').value = cat;
  loadPlacement(cat);
}
function toggleAnswer(i) {
  const el = document.getElementById('ans-'+i);
  const btn = el.nextElementSibling;
  if (el.style.display === 'none') {
    el.style.display = 'block'; btn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Hide Answer';
  } else {
    el.style.display = 'none'; btn.innerHTML = '<i class="fas fa-lightbulb mr-1"></i>Show Answer';
  }
}

// ── Study Planner ─────────────────────────────────────────────
async function loadPlanner() {
  const el = document.getElementById('planner-content');
  el.innerHTML = skeletonGrid(3, 80);
  try {
    const data = await apiFetch('/planner');
    const plans = data.plans || [];
    const pending = plans.filter(p => p.status === 'pending');
    const completed = plans.filter(p => p.status === 'completed');
    const today = new Date().toISOString().split('T')[0];
    const todayPlans = pending.filter(p => p.scheduled_date === today);
    el.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card text-center"><div class="text-2xl font-bold text-primary-400">${plans.length}</div><div class="text-xs mt-1" style="color:#64748b">Total</div></div>
        <div class="stat-card text-center"><div class="text-2xl font-bold text-yellow-400">${pending.length}</div><div class="text-xs mt-1" style="color:#64748b">Pending</div></div>
        <div class="stat-card text-center"><div class="text-2xl font-bold text-green-400">${completed.length}</div><div class="text-xs mt-1" style="color:#64748b">Completed</div></div>
        <div class="stat-card text-center"><div class="text-2xl font-bold text-orange-400">${todayPlans.length}</div><div class="text-xs mt-1" style="color:#64748b">Today</div></div>
      </div>
      ${!plans.length ? `
        <div class="text-center py-16 card p-10">
          <div class="text-5xl mb-3">📅</div>
          <p class="font-semibold mb-2">No study sessions planned</p>
          <p class="text-sm mb-4" style="color:#64748b">Organize your studies by creating sessions</p>
          <button class="btn-primary" onclick="showAddPlanModal()"><i class="fas fa-plus mr-1"></i>Add First Session</button>
        </div>
      ` : `
        ${todayPlans.length ? `
          <div class="card p-4 mb-4" style="border-left:3px solid #22c55e">
            <h3 class="font-bold text-sm mb-2" style="color:#22c55e">📅 Today's Sessions (${todayPlans.length})</h3>
            ${todayPlans.map(p => `
              <div class="flex items-center justify-between p-2 rounded-lg mb-1" style="background:rgba(34,197,94,.06)">
                <div class="text-sm font-medium">${p.title} <span class="text-xs" style="color:#64748b">· ${p.duration_minutes} min</span></div>
                <button class="btn-primary text-xs px-3 py-1" onclick="completePlan(${p.id})">✓ Done</button>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="space-y-3">
          ${plans.map(p => `
            <div class="card p-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0" style="background:${p.status==='completed'?'rgba(34,197,94,.15)':p.priority==='high'?'rgba(239,68,68,.15)':p.priority==='medium'?'rgba(234,179,8,.15)':'rgba(99,102,241,.15)'}">
                ${p.status==='completed'?'✅':p.priority==='high'?'🔴':p.priority==='medium'?'🟡':'🟢'}
              </div>
              <div class="flex-1">
                <div class="font-semibold text-sm ${p.status==='completed'?'line-through opacity-60':''}">${p.title}</div>
                <div class="text-xs mt-0.5" style="color:#64748b">📅 ${p.scheduled_date} · ⏱ ${p.duration_minutes} min · ${capitalizeFirst(p.priority)} priority</div>
                ${p.description ? `<div class="text-xs mt-1" style="color:#94a3b8">${p.description}</div>` : ''}
              </div>
              <div class="flex gap-2 flex-shrink-0">
                ${p.status === 'pending' ? `
                  <button class="btn-primary text-xs px-3 py-1" onclick="completePlan(${p.id})">✓ Done</button>
                  <button class="btn-danger text-xs px-2 py-1" onclick="deletePlan(${p.id})"><i class="fas fa-trash"></i></button>
                ` : `<span class="badge-pill badge-green text-xs">✅ Done</span>`}
              </div>
            </div>
          `).join('')}
        </div>
      `}`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
function showAddPlanModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('plan-date').value = today;
  document.getElementById('plan-modal').style.display = 'flex';
}
async function submitPlan() {
  const title = document.getElementById('plan-title').value.trim();
  const date = document.getElementById('plan-date').value;
  if (!title || !date) return showToast('Title and date are required', 'error');
  try {
    await apiFetch('/planner', { method: 'POST', body: JSON.stringify({
      title, description: document.getElementById('plan-desc').value,
      scheduled_date: date,
      duration_minutes: parseInt(document.getElementById('plan-duration').value),
      priority: document.getElementById('plan-priority').value,
    })});
    closeModal('plan-modal');
    document.getElementById('plan-title').value = '';
    document.getElementById('plan-desc').value = '';
    showToast('Study session added! 📅', 'success');
    loadPlanner();
  } catch(e) { showToast(e.message, 'error'); }
}
async function completePlan(id) {
  try {
    await apiFetch(`/planner/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
    showToast('Session completed! ✅', 'success');
    loadPlanner();
  } catch(e) { showToast(e.message, 'error'); }
}
async function deletePlan(id) {
  if (!confirm('Delete this session?')) return;
  try {
    await apiFetch(`/planner/${id}`, { method: 'DELETE' });
    showToast('Deleted', 'info');
    loadPlanner();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Notifications ──────────────────────────────────────────────
async function loadNotifications() {
  const el = document.getElementById('notifications-content');
  el.innerHTML = skeletonGrid(3, 60);
  try {
    const data = await apiFetch('/notifications');
    const notifs = data.notifications || [];
    document.getElementById('notif-count').style.display = 'none';
    if (!notifs.length) { el.innerHTML = '<div class="text-center py-16"><div class="text-5xl mb-3">🔔</div><p style="color:#64748b">No notifications yet</p></div>'; return; }
    el.innerHTML = notifs.map(n => `
      <div class="notification-item mb-2" style="border-color:${n.type==='success'?'#22c55e':n.type==='warning'?'#eab308':n.type==='quiz'?'#6366f1':n.type==='resource'?'#3b82f6':'#94a3b8'};opacity:${n.is_read?.7:1}">
        <div class="flex items-start gap-3">
          <div class="text-xl flex-shrink-0">${n.type==='success'?'✅':n.type==='warning'?'⚠️':n.type==='quiz'?'🎯':n.type==='resource'?'📚':'ℹ️'}</div>
          <div class="flex-1">
            <div class="font-semibold text-sm">${n.title}</div>
            <p class="text-xs mt-1" style="color:#94a3b8">${n.message}</p>
            <div class="text-xs mt-2" style="color:#64748b">${timeAgo(n.created_at)}</div>
          </div>
          ${!n.is_read ? '<div class="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style="background:#6366f1"></div>' : ''}
        </div>
      </div>
    `).join('');
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
async function loadNotificationCount() {
  try {
    const data = await apiFetch('/notifications?unread=1');
    const count = (data.notifications||[]).filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-count');
    if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = 'flex'; }
  } catch(e) {}
}
async function markAllRead() {
  try {
    await apiFetch('/notifications/read-all', { method: 'POST' });
    showToast('All notifications marked as read ✅', 'success');
    loadNotifications();
    document.getElementById('notif-count').style.display = 'none';
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Gamification ───────────────────────────────────────────────
async function loadGamification() {
  const el = document.getElementById('gamification-content');
  el.innerHTML = skeletonGrid(4, 100);
  try {
    const [leaderboard, badges, stats] = await Promise.allSettled([
      apiFetch('/gamification/leaderboard'),
      apiFetch('/gamification/badges'),
      apiFetch('/gamification/my-stats'),
    ]);
    const lb = leaderboard.status === 'fulfilled' ? leaderboard.value.leaderboard || [] : [];
    const allBadges = badges.status === 'fulfilled' ? badges.value.badges || [] : [];
    const myStats = stats.status === 'fulfilled' ? stats.value : {};
    const myBadgeIds = (myStats.badges||[]).map(b => b.id);
    el.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card text-center"><div class="text-3xl mb-1">⭐</div><div class="text-2xl font-bold text-yellow-400">${currentUser.points||0}</div><div class="text-xs" style="color:#64748b">Total Points</div></div>
        <div class="stat-card text-center"><div class="text-3xl mb-1">🏅</div><div class="text-2xl font-bold text-primary-400">Lv ${currentUser.level||1}</div><div class="text-xs" style="color:#64748b">Level</div></div>
        <div class="stat-card text-center"><div class="text-3xl mb-1">🔥</div><div class="text-2xl font-bold text-orange-400">${currentUser.streak||0}</div><div class="text-xs" style="color:#64748b">Day Streak</div></div>
        <div class="stat-card text-center"><div class="text-3xl mb-1">🎖️</div><div class="text-2xl font-bold text-green-400">${myStats.badges_count||0} / ${allBadges.length}</div><div class="text-xs" style="color:#64748b">Badges</div></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Leaderboard -->
        <div class="card p-5">
          <h3 class="font-bold mb-4">🏆 Leaderboard</h3>
          ${lb.length ? lb.slice(0,10).map((u,i) => `
            <div class="leaderboard-row ${u.id === currentUser?.id ? 'ring-1 ring-primary-500' : ''}">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style="background:${i===0?'linear-gradient(135deg,#fbbf24,#f59e0b)':i===1?'linear-gradient(135deg,#9ca3af,#6b7280)':i===2?'linear-gradient(135deg,#d97706,#b45309)':'rgba(99,102,241,.2)'};color:${i<3?'#fff':'#818cf8'}">
                ${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
              </div>
              <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${u.name[0]}</div>
              <div class="flex-1 overflow-hidden">
                <div class="font-semibold text-sm truncate">${u.name}${u.id===currentUser?.id?' (You)':''}</div>
                <div class="text-xs" style="color:#64748b">${u.branch||'—'} · Lv ${u.level||1}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="font-bold text-sm text-yellow-400">⭐ ${u.points||0}</div>
                <div class="text-xs" style="color:#64748b">🔥 ${u.streak||0}d</div>
              </div>
            </div>
          `).join('') : '<p class="text-sm text-center py-8" style="color:#64748b">No leaderboard data yet</p>'}
        </div>
        <!-- Badges -->
        <div class="card p-5">
          <h3 class="font-bold mb-4">🎖️ Badges (${myStats.badges_count||0} earned)</h3>
          <div class="grid grid-cols-2 gap-3">
            ${allBadges.map(b => `
              <div class="p-3 rounded-xl text-center transition-all ${myBadgeIds.includes(b.id)?'ring-1 ring-primary-500':''}" style="background:rgba(${myBadgeIds.includes(b.id)?'99,102,241,.15':'99,102,241,.06'});border:1px solid rgba(99,102,241,${myBadgeIds.includes(b.id)?'.3':'.1'})">
                <div class="text-2xl mb-1 ${!myBadgeIds.includes(b.id)?'filter grayscale opacity-40':''}">${b.icon||'🏅'}</div>
                <div class="font-semibold text-xs">${b.name}</div>
                <div class="text-xs mt-0.5" style="color:#64748b">${b.description}</div>
                ${myBadgeIds.includes(b.id) ? '<div class="badge-pill badge-green text-xs mt-1">Earned ✓</div>' : '<div class="badge-pill text-xs mt-1" style="background:rgba(100,116,139,.15);color:#64748b">Locked 🔒</div>'}
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}

// ── Exams Countdown ────────────────────────────────────────────
async function loadExams() {
  const el = document.getElementById('exams-content');
  el.innerHTML = skeletonGrid(3, 100);
  try {
    const data = await apiFetch('/exams');
    const exams = data.exams || [];
    if (!exams.length) { el.innerHTML = '<div class="text-center py-16"><div class="text-5xl mb-3">⏰</div><p style="color:#64748b">No upcoming exams</p></div>'; return; }
    el.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${exams.map(exam => {
          const diff = new Date(exam.exam_date) - new Date();
          const days = Math.max(0, Math.ceil(diff / 86400000));
          const hours = Math.max(0, Math.ceil(diff / 3600000)) % 24;
          const isUrgent = days <= 7;
          const isPast = diff < 0;
          return `
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-3 flex-wrap">
              ${isPast ? '<span class="badge-pill badge-red">✅ Concluded</span>' : isUrgent ? '<span class="badge-pill badge-red">🚨 Urgent!</span>' : '<span class="badge-pill badge-blue">📅 Upcoming</span>'}
              ${exam.branch_code ? `<span class="badge-pill badge-purple">${exam.branch_code}</span>` : '<span class="badge-pill badge-green">All Branches</span>'}
            </div>
            <h3 class="font-bold mb-1">${exam.title}</h3>
            ${exam.description ? `<p class="text-xs mb-3" style="color:#94a3b8">${exam.description}</p>` : ''}
            <div class="exam-countdown-card mt-3">
              <div class="text-xs mb-2" style="color:#94a3b8">${isPast ? 'Exam date has passed' : 'Time Remaining'}</div>
              <div class="flex gap-4 justify-center">
                <div><div class="countdown-num ${isUrgent&&!isPast?'text-red-400':''}">${days}</div><div class="text-xs" style="color:#94a3b8">days</div></div>
                <div class="countdown-num" style="color:#475569">:</div>
                <div><div class="countdown-num ${isUrgent&&!isPast?'text-red-400':''}">${hours}</div><div class="text-xs" style="color:#94a3b8">hours</div></div>
              </div>
              <div class="text-xs mt-2" style="color:#94a3b8">📅 ${exam.exam_date}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}

// ── Analytics ─────────────────────────────────────────────────
async function loadAnalytics() {
  const el = document.getElementById('analytics-content');
  el.innerHTML = skeletonGrid(4, 120);
  try {
    const data = await apiFetch(currentUser.role === 'admin' ? '/analytics/admin' : '/analytics/student');
    if (currentUser.role === 'admin') {
      el.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card"><div class="text-2xl mb-1">👥</div><div class="text-2xl font-bold text-primary-400">${data.total_users||0}</div><div class="text-xs" style="color:#64748b">Total Users</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">🎓</div><div class="text-2xl font-bold text-green-400">${data.total_students||0}</div><div class="text-xs" style="color:#64748b">Students</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">📚</div><div class="text-2xl font-bold text-yellow-400">${data.total_resources||0}</div><div class="text-xs" style="color:#64748b">Resources</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">🎯</div><div class="text-2xl font-bold text-orange-400">${data.total_quiz_attempts||0}</div><div class="text-xs" style="color:#64748b">Quiz Attempts</div></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="font-bold mb-4">📊 Platform Stats</h3>
            <div class="space-y-3">
              ${[['Total Downloads','📥',data.total_downloads||0],['Total Quizzes','🎯',data.total_quizzes||0],['Total Branches','🌿',data.total_branches||20],['Avg Quiz Score','📈',(data.avg_quiz_score||0).toFixed(1)+'%'],['Admin Users','👑',(data.total_users||0)-(data.total_students||0)]].map(([label,icon,val]) => `
              <div class="flex justify-between items-center p-2 rounded-xl" style="background:rgba(99,102,241,.05)">
                <span class="text-sm" style="color:#94a3b8"><span class="mr-2">${icon}</span>${label}</span>
                <span class="font-bold text-sm">${val}</span>
              </div>`).join('')}
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4">📈 Quiz Analytics</h3>
            <canvas id="quiz-chart" height="220"></canvas>
          </div>
        </div>`;
      // Admin chart
      try {
        const ctx = document.getElementById('quiz-chart')?.getContext('2d');
        if (ctx) new Chart(ctx, { type: 'doughnut', data: { labels: ['Passed', 'Failed', 'Avg Score'], datasets: [{ data: [Math.round(data.total_quiz_attempts*0.7||0), Math.round(data.total_quiz_attempts*0.3||0), 0], backgroundColor: ['#22c55e','#ef4444','#6366f1'], borderWidth: 0 }] }, options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } } } });
      } catch(e) {}
    } else {
      el.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card"><div class="text-2xl mb-1">🎯</div><div class="text-2xl font-bold text-primary-400">${data.quizzes_taken||0}</div><div class="text-xs" style="color:#64748b">Quizzes Taken</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">📊</div><div class="text-2xl font-bold text-green-400">${data.avg_score ? data.avg_score.toFixed(0) : 0}%</div><div class="text-xs" style="color:#64748b">Avg Score</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">📥</div><div class="text-2xl font-bold text-yellow-400">${data.total_resources||0}</div><div class="text-xs" style="color:#64748b">Resources Accessed</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">🏆</div><div class="text-2xl font-bold text-orange-400">${data.badges_earned||0}</div><div class="text-xs" style="color:#64748b">Badges Earned</div></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="card p-5">
            <h3 class="font-bold mb-4">📈 Quiz Performance</h3>
            <canvas id="quiz-chart" height="220"></canvas>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4">📚 Subject Progress</h3>
            <div class="space-y-3">
              ${(data.subject_progress||[]).map(s => `
                <div>
                  <div class="flex justify-between text-xs mb-1"><span>${s.name||'Subject'}</span><span class="font-bold">${(s.completion||0).toFixed(0)}%</span></div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${s.completion||0}%"></div></div>
                </div>
              `).join('') || '<div class="text-center py-6"><div class="text-3xl mb-2">📊</div><p class="text-sm" style="color:#64748b">No progress data yet. Take some quizzes!</p></div>'}
            </div>
          </div>
        </div>
        ${(data.quiz_history||[]).length ? `
          <div class="card p-5">
            <h3 class="font-bold mb-4">📋 Recent Quiz History</h3>
            <div class="space-y-2">
              ${(data.quiz_history||[]).map(a => `
                <div class="flex items-center justify-between p-3 rounded-xl" style="background:rgba(99,102,241,.05)">
                  <div>
                    <div class="font-medium text-sm">${a.quiz_title||'Quiz'}</div>
                    <div class="text-xs" style="color:#64748b">${a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold ${a.percentage>=60?'text-green-400':'text-red-400'}">${(a.percentage||0).toFixed(0)}%</div>
                    <div class="text-xs" style="color:#64748b">${a.score}/${a.total_marks}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}`;
      // Student chart
      try {
        const ctx = document.getElementById('quiz-chart')?.getContext('2d');
        if (ctx && data.quiz_history?.length) {
          new Chart(ctx, { type: 'line', data: {
            labels: data.quiz_history.slice(0,8).map((_,i) => 'Quiz '+(i+1)),
            datasets: [{ label: 'Score %', data: data.quiz_history.slice(0,8).map(a => a.percentage||0), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.12)', fill: true, tension: 0.4, pointBackgroundColor: '#6366f1' }]
          }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#64748b' } }, x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#64748b' } } } } });
        } else if (ctx) {
          ctx.canvas.parentElement.innerHTML = '<div class="text-center py-6"><div class="text-4xl mb-2">📊</div><p class="text-sm" style="color:#64748b">Take some quizzes to see your performance chart!</p></div>';
        }
      } catch(e) {}
    }
  } catch(e) { el.innerHTML = errorBox(e.message); }
}

// ── Profile ────────────────────────────────────────────────────
async function loadProfile() {
  const el = document.getElementById('profile-content');
  el.innerHTML = skeletonGrid(2, 120);
  try {
    const data = await apiFetch('/auth/me');
    const u = data.user || currentUser;
    el.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="card p-6 mb-6 text-center relative overflow-hidden">
          <div class="absolute inset-0 opacity-10" style="background:linear-gradient(135deg,#6366f1,#a855f7)"></div>
          <div class="relative z-10">
            <div class="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-extrabold mb-3" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:4px solid rgba(255,255,255,.1)">${u.name[0]}</div>
            <h2 class="text-xl font-bold">${u.name}</h2>
            <p class="text-sm mt-1" style="color:#64748b">${u.email}</p>
            <div class="flex justify-center gap-2 mt-3 flex-wrap">
              <span class="badge-pill badge-purple">${u.branch||'—'}</span>
              <span class="badge-pill badge-blue">Semester ${u.semester||1}</span>
              <span class="badge-pill ${u.role==='admin'?'badge-yellow':'badge-green'}">${u.role}</span>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-6">
              <div class="p-3 rounded-xl" style="background:rgba(99,102,241,.1)"><div class="text-lg font-bold text-yellow-400">⭐ ${u.points||0}</div><div class="text-xs" style="color:#64748b">Points</div></div>
              <div class="p-3 rounded-xl" style="background:rgba(99,102,241,.1)"><div class="text-lg font-bold text-primary-400">Lv ${u.level||1}</div><div class="text-xs" style="color:#64748b">Level</div></div>
              <div class="p-3 rounded-xl" style="background:rgba(99,102,241,.1)"><div class="text-lg font-bold text-orange-400">🔥 ${u.streak||0}</div><div class="text-xs" style="color:#64748b">Streak</div></div>
            </div>
            ${u.bio ? `<p class="text-sm mt-4 italic" style="color:#94a3b8">"${u.bio}"</p>` : ''}
          </div>
        </div>
        <div class="card p-6">
          <h3 class="font-bold mb-4">✏️ Edit Profile</h3>
          <div class="space-y-4">
            <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Full Name</label><input id="prof-name" type="text" class="input-field" value="${u.name}"></div>
            <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Bio</label><textarea id="prof-bio" class="input-field" rows="3" placeholder="Tell something about yourself...">${u.bio||''}</textarea></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Branch</label>
                <select id="prof-branch" class="input-field">
                  ${['CSE','ISE','AIML','DS','CS','ECE','EEE','EIE','ME','CV','CH','BT','AE','AS','AU','BM','EN','RA','IEM','ARCH'].map(b => `<option ${u.branch===b?'selected':''} value="${b}">${b}</option>`).join('')}
                </select>
              </div>
              <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Semester</label>
                <select id="prof-semester" class="input-field">
                  ${[1,2,3,4,5,6,7,8].map(i => `<option ${u.semester==i?'selected':''} value="${i}">Sem ${i}</option>`).join('')}
                </select>
              </div>
            </div>
            <button class="btn-primary w-full py-3" onclick="saveProfile()"><i class="fas fa-save mr-2"></i>Save Changes</button>
          </div>
        </div>
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
async function saveProfile() {
  try {
    const data = await apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify({
      name: document.getElementById('prof-name').value.trim(),
      bio: document.getElementById('prof-bio').value.trim(),
      branch: document.getElementById('prof-branch').value,
      semester: parseInt(document.getElementById('prof-semester').value),
    })});
    currentUser = { ...currentUser, ...data.user };
    updateSidebarUser();
    showToast('Profile updated! ✅', 'success');
    loadProfile();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Admin Users ────────────────────────────────────────────────
async function loadAdminUsers() {
  const el = document.getElementById('admin-users-content');
  el.innerHTML = skeletonGrid(4, 60);
  try {
    const data = await apiFetch('/users');
    const users = data.users || [];
    el.innerHTML = `
      <div class="card overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between" style="border-color:rgba(255,255,255,.07)">
          <span class="font-semibold">${users.length} Users</span>
          <span class="text-xs" style="color:#64748b">${users.filter(u=>u.role==='student').length} Students · ${users.filter(u=>u.role==='admin').length} Admins</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr style="background:rgba(99,102,241,.08)">
              <th class="p-3 text-left font-semibold" style="color:#94a3b8">User</th>
              <th class="p-3 text-left font-semibold" style="color:#94a3b8">Email</th>
              <th class="p-3 text-left font-semibold" style="color:#94a3b8">Branch</th>
              <th class="p-3 text-left font-semibold" style="color:#94a3b8">Role</th>
              <th class="p-3 text-left font-semibold" style="color:#94a3b8">Points</th>
              <th class="p-3 text-left font-semibold" style="color:#94a3b8">Status</th>
              <th class="p-3 text-left font-semibold" style="color:#94a3b8">Action</th>
            </tr></thead>
            <tbody>
              ${users.map(u => `
                <tr class="border-t hover:bg-primary-500 hover:bg-opacity-5 transition-all" style="border-color:rgba(255,255,255,.04)">
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${u.name[0]}</div>
                      <div>
                        <div class="font-medium">${u.name}</div>
                        <div class="text-xs" style="color:#64748b">Sem ${u.semester||'—'}</div>
                      </div>
                    </div>
                  </td>
                  <td class="p-3" style="color:#94a3b8">${u.email}</td>
                  <td class="p-3"><span class="badge-pill badge-blue">${u.branch||'—'}</span></td>
                  <td class="p-3"><span class="badge-pill ${u.role==='admin'?'badge-yellow':'badge-green'}">${u.role}</span></td>
                  <td class="p-3 font-bold text-yellow-400">⭐ ${u.points||0}</td>
                  <td class="p-3"><span class="badge-pill ${u.is_active?'badge-green':'badge-red'}">${u.is_active?'Active':'Inactive'}</span></td>
                  <td class="p-3">
                    <button class="btn-${u.is_active?'danger':'primary'} text-xs px-3 py-1" onclick="toggleUserStatus(${u.id},${u.is_active})">${u.is_active?'Deactivate':'Activate'}</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
async function toggleUserStatus(userId, isActive) {
  try {
    await apiFetch(`/users/${userId}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive ? 0 : 1 }) });
    showToast('User status updated', 'success');
    loadAdminUsers();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Announcements ─────────────────────────────────────────────
async function loadAnnouncements() {
  const el = document.getElementById('announcements-content');
  el.innerHTML = skeletonGrid(3, 80);
  try {
    const data = await apiFetch('/announcements');
    const anns = data.announcements || [];
    if (!anns.length) { el.innerHTML = '<div class="text-center py-16"><div class="text-5xl mb-3">📢</div><p style="color:#64748b">No announcements yet</p></div>'; return; }
    el.innerHTML = anns.map(a => `
      <div class="card p-5 mb-4">
        <div class="flex items-start gap-3">
          <div class="text-2xl flex-shrink-0">${a.type==='exam'?'📅':a.type==='placement'?'💼':a.type==='resource'?'📚':a.type==='result'?'📊':'📢'}</div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <h3 class="font-bold">${a.title}</h3>
              <span class="badge-pill ${a.type==='exam'?'badge-red':a.type==='placement'?'badge-yellow':a.type==='resource'?'badge-blue':'badge-purple'}">${capitalizeFirst(a.type||'general')}</span>
            </div>
            <p class="text-sm" style="color:#94a3b8">${a.content}</p>
            <div class="text-xs mt-2" style="color:#64748b">${timeAgo(a.created_at)}</div>
          </div>
          ${currentUser?.role==='admin' ? `<button class="btn-danger text-xs px-2 py-1 flex-shrink-0" onclick="deleteAnnouncement(${a.id})"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </div>
    `).join('');
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
function showAddAnnouncementModal() { document.getElementById('announcement-modal').style.display = 'flex'; }
async function submitAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const content = document.getElementById('ann-content').value.trim();
  if (!title || !content) return showToast('Title and content are required', 'error');
  try {
    await apiFetch('/announcements', { method: 'POST', body: JSON.stringify({ title, content, type: document.getElementById('ann-type').value }) });
    closeModal('announcement-modal');
    document.getElementById('ann-title').value = '';
    document.getElementById('ann-content').value = '';
    showToast('Announcement posted! 📢', 'success');
    loadAnnouncements();
  } catch(e) { showToast(e.message, 'error'); }
}
async function deleteAnnouncement(id) {
  if (!confirm('Delete announcement?')) return;
  try {
    await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
    showToast('Deleted', 'info');
    loadAnnouncements();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── Daily Challenge ────────────────────────────────────────────
async function loadDailyChallenge() {
  const el = document.getElementById('challenge-content');
  el.innerHTML = skeletonGrid(2, 120);
  try {
    const data = await apiFetch('/challenge/today');
    const challenge = data.challenge;
    if (!challenge) {
      el.innerHTML = `<div class="text-center py-16 card p-10"><div class="text-5xl mb-3">🔥</div><p class="font-semibold mb-2">No Challenge Today</p><p class="text-sm" style="color:#64748b">Check back tomorrow for a new daily challenge!</p></div>`; return;
    }
    let content;
    try { content = typeof challenge.content === 'string' ? JSON.parse(challenge.content) : challenge.content; } catch(e) { content = {}; }
    el.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="card p-6 mb-5" style="background:linear-gradient(135deg,#1e1e3f,#2d1b69)">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-4xl">🔥</span>
            <div>
              <h2 class="text-xl font-bold text-white">${challenge.title}</h2>
              <p style="color:#a5b4fc">Complete for +${challenge.points_reward} points</p>
            </div>
          </div>
          <span class="badge-pill badge-yellow">${challenge.type==='mcq'?'🧠 MCQ Challenge':'💻 Coding Challenge'}</span>
        </div>
        <div class="card p-6" id="challenge-question-box">
          <h3 class="font-semibold text-base mb-5 leading-relaxed">${content.question||'Question not available'}</h3>
          <div>
            ${(content.options||[]).map((opt, i) => `
              <div class="quiz-option" id="chall-opt-${i}" onclick="selectChallengeAnswer(${i}, this, ${content.correct||0}, '${escHtml(content.explanation||'')}')">
                <span class="font-bold mr-2" style="color:#6366f1">${String.fromCharCode(65+i)}.</span>${opt}
              </div>
            `).join('')}
          </div>
          <div id="challenge-explanation" style="display:none" class="mt-4"></div>
        </div>
      </div>`;
  } catch(e) { el.innerHTML = errorBox(e.message); }
}
function selectChallengeAnswer(idx, el, correct, explanation) {
  document.querySelectorAll('#challenge-question-box .quiz-option').forEach(o => o.style.pointerEvents = 'none');
  if (idx === correct) {
    el.classList.add('correct');
    showToast('🎉 Correct! Points earned!', 'success');
  } else {
    el.classList.add('wrong');
    const correctEl = document.getElementById('chall-opt-'+correct);
    if (correctEl) correctEl.classList.add('correct');
    showToast('❌ Wrong answer!', 'error');
  }
  const expEl = document.getElementById('challenge-explanation');
  if (expEl && explanation) {
    expEl.style.display = 'block';
    expEl.innerHTML = `<div class="p-3 rounded-xl" style="background:rgba(99,102,241,.1)"><p class="text-sm" style="color:#a5b4fc">💡 <strong>Explanation:</strong> ${explanation}</p></div>`;
  }
  apiFetch('/challenge/complete', { method: 'POST', body: JSON.stringify({ answer_index: idx }) }).catch(() => {});
}

// ── Theme ──────────────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('vtu_theme', isDark ? 'light' : 'dark');
  document.querySelector('#sidebar .fa-moon')?.classList.toggle('fa-moon', !isDark);
  document.querySelector('#sidebar .fa-moon')?.classList.toggle('fa-sun', isDark);
}

// ── Modals ─────────────────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  if (id === 'resource-modal') {
    const body = document.getElementById('res-modal-body');
    if (body?.dataset.objectUrl) {
      URL.revokeObjectURL(body.dataset.objectUrl);
      delete body.dataset.objectUrl;
    }
  }
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(m => { if (m.style.display !== 'none') m.style.display = 'none'; });
  if (e.key === 'Enter' && document.getElementById('auth-screen')?.style.display !== 'none') {
    const activeTab = document.getElementById('login-form')?.style.display !== 'none' ? 'login' : 'register';
    if (activeTab === 'login') doLogin();
  }
});

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all .3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Utilities ─────────────────────────────────────────────────
function resourceIcon(type) {
  return { notes: '📝', syllabus: '📋', textbook: '📚', question_paper: '❓', lab_manual: '🔬', video: '🎥', link: '🔗' }[type] || '📄';
}
function capitalizeFirst(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
function escHtml(str) { return (str||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,' '); }
function escHtmlFull(str) { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}
function skeletonGrid(count, height) {
  const cols = count > 3 ? 3 : count;
  return `<div class="grid grid-cols-1 md:grid-cols-${cols} gap-4">${Array(count).fill(`<div class="skeleton rounded-2xl" style="height:${height}px"></div>`).join('')}</div>`;
}
function errorBox(msg) {
  return `<div class="card p-8 text-center"><div class="text-4xl mb-3">⚠️</div><p class="font-semibold">Something went wrong</p><p class="text-sm mt-1" style="color:#64748b">${msg}</p></div>`;
}
