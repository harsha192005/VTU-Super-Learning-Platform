// ============================================================
// VTU SUPER LEARNING PLATFORM - Complete Frontend App
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

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (authToken) {
    try {
      const res = await apiFetch('/auth/me');
      if (res.user) {
        currentUser = res.user;
        showApp();
        return;
      }
    } catch (e) {}
  }
  showLanding();
});

// ============================================================
// SCREEN MANAGEMENT
// ============================================================
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

// ============================================================
// API HELPER
// ============================================================
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  if (opts.headers) Object.assign(headers, opts.headers);
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ============================================================
// AUTH
// ============================================================
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showToast('Enter email and password', 'error');
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('vtu_token', authToken);
    showToast('Welcome back, ' + currentUser.name + '! 🎉', 'success');
    showApp();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const branch = document.getElementById('reg-branch').value;
  const semester = document.getElementById('reg-semester').value;
  if (!name || !email || !password) return showToast('Fill all required fields', 'error');
  try {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, branch, semester: parseInt(semester) }) });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('vtu_token', authToken);
    showToast('Account created! Welcome ' + currentUser.name + ' 🎓', 'success');
    showApp();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function demoLogin(role) {
  try {
    const data = await apiFetch('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('vtu_token', authToken);
    showToast('Demo login as ' + role + '! 🚀', 'success');
    showApp();
  } catch (e) {
    showToast('Demo login failed: ' + e.message, 'error');
  }
}

function doLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('vtu_token');
  showLanding();
  showToast('Logged out successfully', 'info');
}

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// ============================================================
// APP INIT
// ============================================================
function initApp() {
  buildSidebar();
  updateSidebarUser();
  showPage('dashboard');
  loadNotificationCount();
  loadSubjectsForAI();
}

function buildSidebar() {
  const isAdmin = currentUser?.role === 'admin';
  document.getElementById('sidebar-role-badge').textContent = isAdmin ? '👑 Admin' : '🎓 Student';
  document.getElementById('sidebar-role-badge').className = 'badge-pill text-xs mt-1 ' + (isAdmin ? 'badge-yellow' : 'badge-purple');

  const studentNav = [
    { icon: 'fa-home', label: 'Dashboard', page: 'dashboard' },
    { icon: 'fa-code-branch', label: 'Branches', page: 'branches' },
    { icon: 'fa-book', label: 'Subjects', page: 'subjects' },
    { icon: 'fa-file-pdf', label: 'Resources', page: 'resources' },
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
  ];

  const adminNav = [
    { icon: 'fa-tachometer-alt', label: 'Admin Dashboard', page: 'dashboard' },
    { icon: 'fa-users', label: 'Manage Users', page: 'admin-users' },
    { icon: 'fa-file-pdf', label: 'Resources', page: 'resources' },
    { icon: 'fa-question-circle', label: 'Quizzes', page: 'quiz' },
    { icon: 'fa-bullhorn', label: 'Announcements', page: 'announcements' },
    { icon: 'fa-chart-bar', label: 'Analytics', page: 'analytics' },
    { icon: 'fa-clock', label: 'Exam Countdown', page: 'exams' },
    { icon: 'fa-bell', label: 'Notifications', page: 'notifications' },
    { icon: 'fa-code-branch', label: 'Branches', page: 'branches' },
    { icon: 'fa-book', label: 'Subjects', page: 'subjects' },
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
    const uploadBtn = document.getElementById('admin-upload-btn');
    if (uploadBtn) uploadBtn.style.display = 'flex';
    const createQuizBtn = document.getElementById('create-quiz-btn');
    if (createQuizBtn) createQuizBtn.style.display = 'flex';
    const annBtn = document.getElementById('add-announcement-btn');
    if (annBtn) annBtn.style.display = 'flex';
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
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-content');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
  }
}

function showPage(page) {
  currentPage = page;
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  // Update nav active
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById('nav-' + page);
  if (navItem) navItem.classList.add('active');
  // Update topbar
  const titles = {
    dashboard: ['Dashboard', 'Welcome back, ' + (currentUser?.name || 'User') + '!'],
    branches: ['Branches', 'All VTU Engineering Branches'],
    subjects: ['Subjects', 'Browse by Semester'],
    resources: ['Resources', 'Study Materials & PDFs'],
    quiz: ['Quizzes', 'Test Your Knowledge'],
    ai: ['AI Assistant', 'Powered by AI'],
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
  };
  const [title, subtitle] = titles[page] || [page, ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
  // Load page content
  loadPage(page);
}

function loadPage(page) {
  switch(page) {
    case 'dashboard': loadDashboard(); break;
    case 'branches': loadBranches(); break;
    case 'subjects': loadSubjects(); break;
    case 'resources': loadResources(); break;
    case 'quiz': loadQuizList(); break;
    case 'placement': loadPlacement(); break;
    case 'planner': loadPlanner(); break;
    case 'notifications': loadNotifications(); break;
    case 'gamification': loadGamification(); break;
    case 'exams': loadExams(); break;
    case 'analytics': loadAnalytics(); break;
    case 'profile': loadProfile(); break;
    case 'admin-users': loadAdminUsers(); break;
    case 'announcements': loadAnnouncements(); break;
    case 'challenge': loadDailyChallenge(); break;
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  const el = document.getElementById('dashboard-content');
  const isAdmin = currentUser?.role === 'admin';
  el.innerHTML = skeletonGrid(4, 80) + skeletonGrid(2, 160);

  try {
    if (isAdmin) {
      await loadAdminDashboard(el);
    } else {
      await loadStudentDashboard(el);
    }
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

async function loadStudentDashboard(el) {
  const [analyticsData, quizzes, resources, challenges, exams] = await Promise.allSettled([
    apiFetch('/analytics/student'),
    apiFetch('/quiz?limit=3'),
    apiFetch('/resources?limit=4'),
    apiFetch('/challenge/today'),
    apiFetch('/exams?limit=2'),
  ]);

  const stats = analyticsData.status === 'fulfilled' ? analyticsData.value : {};
  const quizList = quizzes.status === 'fulfilled' ? quizzes.value.quizzes || [] : [];
  const resList = resources.status === 'fulfilled' ? resources.value.resources || [] : [];
  const challenge = challenges.status === 'fulfilled' ? challenges.value.challenge : null;
  const examList = exams.status === 'fulfilled' ? exams.value.exams || [] : [];

  el.innerHTML = `
    <!-- Welcome Banner -->
    <div class="card p-6 mb-6 relative overflow-hidden" style="background:linear-gradient(135deg,#1e1e3f,#2d1b69)">
      <div class="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style="background:#6366f1;transform:translate(20px,-20px)"></div>
      <div class="flex items-center justify-between relative z-10">
        <div>
          <h2 class="text-2xl font-bold text-white">Welcome back, ${currentUser.name}! 👋</h2>
          <p class="text-sm mt-1" style="color:#a5b4fc">${currentUser.branch || 'CSE'} · Semester ${currentUser.semester || 1} · Level ${currentUser.level || 1}</p>
          <div class="flex items-center gap-4 mt-3">
            <span class="badge-pill badge-purple">🔥 ${currentUser.streak || 0} day streak</span>
            <span class="badge-pill badge-yellow">⭐ ${currentUser.points || 0} points</span>
          </div>
        </div>
        <div class="hidden md:block text-7xl opacity-80">🎓</div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card"><div class="text-2xl mb-1">📚</div><div class="text-2xl font-bold text-primary-400">${stats.total_resources || 0}</div><div class="text-xs mt-1" style="color:#64748b">Resources Viewed</div></div>
      <div class="stat-card"><div class="text-2xl mb-1">🎯</div><div class="text-2xl font-bold text-green-400">${stats.quizzes_taken || 0}</div><div class="text-xs mt-1" style="color:#64748b">Quizzes Taken</div></div>
      <div class="stat-card"><div class="text-2xl mb-1">📊</div><div class="text-2xl font-bold text-yellow-400">${stats.avg_score ? stats.avg_score.toFixed(0) : 0}%</div><div class="text-xs mt-1" style="color:#64748b">Avg Quiz Score</div></div>
      <div class="stat-card"><div class="text-2xl mb-1">🏆</div><div class="text-2xl font-bold text-orange-400">${stats.badges_earned || 0}</div><div class="text-xs mt-1" style="color:#64748b">Badges Earned</div></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Recent Quizzes -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold">🎯 Available Quizzes</h3>
          <button class="text-xs text-primary-400 hover:underline" onclick="showPage('quiz')">View All →</button>
        </div>
        ${quizList.length ? quizList.map(q => `
          <div class="flex items-center justify-between p-3 rounded-xl mb-2 cursor-pointer hover:bg-primary-500 hover:bg-opacity-10 transition-all" onclick="startQuiz(${q.id})" style="background:rgba(99,102,241,.05)">
            <div>
              <div class="font-medium text-sm">${q.title}</div>
              <div class="text-xs mt-0.5" style="color:#64748b">${q.total_questions} questions · ${q.duration_minutes} min · <span class="capitalize">${q.difficulty}</span></div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge-pill ${q.difficulty==='easy'?'badge-green':q.difficulty==='hard'?'badge-red':'badge-yellow'}">${q.difficulty}</span>
              <button class="btn-primary text-xs px-3 py-1">Take</button>
            </div>
          </div>
        `).join('') : '<p class="text-sm text-center py-6" style="color:#64748b">No quizzes available yet</p>'}
      </div>

      <!-- Daily Challenge -->
      <div class="card p-5">
        <h3 class="font-bold mb-4">🔥 Daily Challenge</h3>
        ${challenge ? `
          <div class="exam-countdown-card mb-4">
            <div class="text-2xl mb-2">⚡</div>
            <div class="font-semibold text-sm">${challenge.title}</div>
            <div class="badge-pill badge-yellow mt-2">+${challenge.points_reward} pts</div>
          </div>
          <button class="btn-primary w-full text-sm" onclick="showPage('challenge')">Take Challenge</button>
        ` : `<p class="text-sm py-4 text-center" style="color:#64748b">No challenge today</p>`}
        <div class="mt-4 pt-4 border-t" style="border-color:rgba(255,255,255,.07)">
          <div class="flex items-center justify-between text-sm">
            <span style="color:#94a3b8">Study Streak</span>
            <span class="font-bold text-orange-400">🔥 ${currentUser.streak || 0} days</span>
          </div>
          <div class="progress-bar mt-2"><div class="progress-fill" style="width:${Math.min((currentUser.streak||0)*10,100)}%"></div></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Resources -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold">📚 Recent Resources</h3>
          <button class="text-xs text-primary-400 hover:underline" onclick="showPage('resources')">View All →</button>
        </div>
        ${resList.length ? resList.map(r => `
          <div class="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer hover:bg-primary-500 hover:bg-opacity-10 transition-all" onclick="viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')" style="background:rgba(99,102,241,.05)">
            <div class="text-xl">${resourceIcon(r.type)}</div>
            <div class="overflow-hidden">
              <div class="font-medium text-sm truncate">${r.title}</div>
              <div class="text-xs" style="color:#64748b">${capitalizeFirst(r.type)} · Sem ${r.semester || '?'}</div>
            </div>
            ${r.is_important ? '<span class="badge-pill badge-red text-xs ml-auto">★ Key</span>' : ''}
          </div>
        `).join('') : '<p class="text-sm text-center py-6" style="color:#64748b">No resources yet</p>'}
      </div>

      <!-- Exam Countdown -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold">⏰ Upcoming Exams</h3>
          <button class="text-xs text-primary-400 hover:underline" onclick="showPage('exams')">View All →</button>
        </div>
        ${examList.length ? examList.map(exam => {
          const days = Math.max(0, Math.ceil((new Date(exam.exam_date) - new Date()) / 86400000));
          return `
          <div class="exam-countdown-card mb-3">
            <div class="flex items-center justify-between">
              <div class="text-left">
                <div class="font-semibold text-sm">${exam.title}</div>
                <div class="text-xs mt-0.5" style="color:#94a3b8">${exam.exam_date}</div>
              </div>
              <div class="text-right">
                <div class="countdown-num">${days}</div>
                <div class="text-xs" style="color:#94a3b8">days left</div>
              </div>
            </div>
          </div>`;
        }).join('') : '<div class="exam-countdown-card text-center py-8"><div class="text-3xl mb-2">📅</div><div class="text-sm" style="color:#94a3b8">No upcoming exams</div></div>'}
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
    <div class="card p-6 mb-6" style="background:linear-gradient(135deg,#1e1e3f,#2d1b69)">
      <h2 class="text-2xl font-bold text-white mb-1">👑 Admin Dashboard</h2>
      <p style="color:#a5b4fc">Manage the VTU Super Learning Platform</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card"><div class="text-2xl mb-1">👥</div><div class="text-2xl font-bold text-primary-400">${stats.total_users || 0}</div><div class="text-xs mt-1" style="color:#64748b">Total Users</div></div>
      <div class="stat-card"><div class="text-2xl mb-1">📚</div><div class="text-2xl font-bold text-green-400">${stats.total_resources || 0}</div><div class="text-xs mt-1" style="color:#64748b">Resources</div></div>
      <div class="stat-card"><div class="text-2xl mb-1">🎯</div><div class="text-2xl font-bold text-yellow-400">${stats.total_quizzes || 0}</div><div class="text-xs mt-1" style="color:#64748b">Quizzes</div></div>
      <div class="stat-card"><div class="text-2xl mb-1">📥</div><div class="text-2xl font-bold text-orange-400">${stats.total_downloads || 0}</div><div class="text-xs mt-1" style="color:#64748b">Downloads</div></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="card p-5">
        <h3 class="font-bold mb-4">Quick Actions</h3>
        <div class="grid grid-cols-2 gap-3">
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500" onclick="showUploadModal()"><div class="text-2xl mb-1">📤</div><div class="text-xs font-semibold">Upload Resource</div></button>
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500" onclick="showCreateQuizModal()"><div class="text-2xl mb-1">➕</div><div class="text-xs font-semibold">Create Quiz</div></button>
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500" onclick="showAddAnnouncementModal()"><div class="text-2xl mb-1">📢</div><div class="text-xs font-semibold">Announcement</div></button>
          <button class="card p-4 text-center cursor-pointer hover:border-primary-500" onclick="showPage('admin-users')"><div class="text-2xl mb-1">👥</div><div class="text-xs font-semibold">Manage Users</div></button>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold mb-4">Recent Users</h3>
        ${userList.map(u => `
          <div class="flex items-center gap-3 p-2 rounded-lg mb-1">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background:linear-gradient(135deg,#6366f1,#4f46e5)">${u.name[0]}</div>
            <div>
              <div class="text-sm font-medium">${u.name}</div>
              <div class="text-xs" style="color:#64748b">${u.branch} · Sem ${u.semester} · ${u.role}</div>
            </div>
          </div>
        `).join('')}
        <button class="btn-secondary w-full mt-3 text-sm" onclick="showPage('admin-users')">View All Users</button>
      </div>
    </div>
  `;
}

// ============================================================
// BRANCHES
// ============================================================
async function loadBranches() {
  const el = document.getElementById('branches-content');
  el.innerHTML = skeletonGrid(4, 100);
  try {
    const data = await apiFetch('/branches');
    allBranches = data.branches || [];
    renderBranches(allBranches);
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

function renderBranches(branches) {
  const el = document.getElementById('branches-content');
  const grouped = {};
  branches.forEach(b => {
    if (!grouped[b.category]) grouped[b.category] = [];
    grouped[b.category].push(b);
  });
  if (!Object.keys(grouped).length) { el.innerHTML = '<p class="text-center py-12" style="color:#64748b">No branches found</p>'; return; }
  el.innerHTML = Object.entries(grouped).map(([cat, list]) => `
    <div class="mb-8">
      <h3 class="text-lg font-bold mb-4 flex items-center gap-2"><span class="w-2 h-6 rounded-full" style="background:#6366f1;display:inline-block"></span>${cat}</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${list.map(b => `
          <div class="card p-5 cursor-pointer" onclick="selectBranch('${b.code}','${escHtml(b.name)}')">
            <div class="text-3xl mb-3">${b.icon || '📚'}</div>
            <div class="font-bold text-sm">${b.code}</div>
            <div class="text-xs mt-1" style="color:#94a3b8">${b.name}</div>
            <div class="text-xs mt-2" style="color:#64748b">${b.description ? b.description.substring(0,60)+'...' : ''}</div>
            <div class="mt-3 flex gap-1 flex-wrap">
              <span class="badge-pill badge-purple text-xs">${b.total_semesters || 8} Sems</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function filterBranches(q) {
  const filtered = allBranches.filter(b =>
    b.name.toLowerCase().includes(q.toLowerCase()) ||
    b.code.toLowerCase().includes(q.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(q.toLowerCase()))
  );
  renderBranches(filtered);
}

function selectBranch(code, name) {
  document.getElementById('subject-sem-filter').value = '';
  sessionStorage.setItem('current_branch', code);
  showPage('subjects');
}

// ============================================================
// SUBJECTS
// ============================================================
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
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

function renderSubjects(subjects, branch) {
  const el = document.getElementById('subjects-content');
  if (!subjects.length) { el.innerHTML = '<p class="text-center py-12" style="color:#64748b">No subjects found for this branch/semester</p>'; return; }

  const bySem = {};
  subjects.forEach(s => {
    if (!bySem[s.semester]) bySem[s.semester] = [];
    bySem[s.semester].push(s);
  });

  el.innerHTML = `
    <div class="mb-4 p-3 card text-sm flex items-center gap-2">
      <span class="font-medium">Branch:</span>
      <span class="badge-pill badge-purple">${branch}</span>
      <button class="ml-auto text-xs text-primary-400" onclick="showPage('branches')">← Change Branch</button>
    </div>
    ${Object.entries(bySem).sort(([a],[b]) => a-b).map(([sem, list]) => `
      <div class="mb-6">
        <h3 class="font-bold mb-3 text-base">📘 Semester ${sem}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${list.map(s => `
            <div class="card p-4 cursor-pointer" onclick="viewSubjectResources(${s.id},'${escHtml(s.name)}')">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-semibold text-sm">${s.name}</div>
                  <div class="text-xs mt-1" style="color:#6366f1">${s.code}</div>
                  <div class="text-xs mt-1" style="color:#64748b">${s.credits || 4} Credits</div>
                </div>
                <span class="badge-pill badge-blue text-xs">Sem ${s.semester}</span>
              </div>
              ${s.description ? `<p class="text-xs mt-2" style="color:#94a3b8">${s.description.substring(0,80)}...</p>` : ''}
              <div class="flex gap-2 mt-3">
                <button class="btn-secondary text-xs py-1 px-2" onclick="event.stopPropagation();viewSubjectResources(${s.id},'${escHtml(s.name)}')"><i class="fas fa-file-pdf mr-1"></i>Resources</button>
                <button class="btn-secondary text-xs py-1 px-2" onclick="event.stopPropagation();loadSubjectQuizzes(${s.id})"><i class="fas fa-question-circle mr-1"></i>Quiz</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function viewSubjectResources(subjectId, subjectName) {
  sessionStorage.setItem('filter_subject_id', subjectId);
  sessionStorage.setItem('filter_subject_name', subjectName);
  showPage('resources');
}

async function loadSubjectQuizzes(subjectId) {
  sessionStorage.setItem('filter_quiz_subject', subjectId);
  showPage('quiz');
}

// ============================================================
// RESOURCES
// ============================================================
async function loadResources() {
  const el = document.getElementById('resources-content');
  el.innerHTML = skeletonGrid(6, 100);

  const type = document.getElementById('res-type-filter').value;
  const sem = document.getElementById('res-sem-filter').value;
  const search = document.getElementById('res-search').value;
  const subjectId = sessionStorage.getItem('filter_subject_id');
  const subjectName = sessionStorage.getItem('filter_subject_name');

  let url = '/resources?limit=30';
  if (type) url += `&type=${type}`;
  if (sem) url += `&semester=${sem}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (subjectId) url += `&subject_id=${subjectId}`;

  try {
    const data = await apiFetch(url);
    allResources = data.resources || [];

    let html = '';
    if (subjectId && subjectName) {
      html += `<div class="mb-4 p-3 card text-sm flex items-center gap-2">
        <span>Showing resources for:</span><span class="badge-pill badge-purple">${subjectName}</span>
        <button class="ml-auto text-xs text-primary-400" onclick="sessionStorage.removeItem('filter_subject_id');sessionStorage.removeItem('filter_subject_name');loadResources()">✕ Clear filter</button>
      </div>`;
    }

    if (!allResources.length) {
      html += '<div class="text-center py-16"><div class="text-5xl mb-3">📭</div><p style="color:#64748b">No resources found. Try adjusting filters.</p></div>';
      el.innerHTML = html;
      return;
    }

    html += `
      <!-- Resource Type Tabs -->
      <div class="flex gap-2 flex-wrap mb-5">
        ${['all','notes','syllabus','textbook','question_paper','lab_manual','video'].map(t => `
          <button class="tab-btn text-xs ${type===t||(!type&&t==='all')?'active':''}" onclick="document.getElementById('res-type-filter').value='${t==='all'?'':t}';loadResources()">${t==='all'?'All':capitalizeFirst(t.replace('_',' '))}</button>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${allResources.map(r => `
          <div class="resource-card" onclick="viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')">
            <div class="flex items-start gap-3">
              <div class="text-3xl">${resourceIcon(r.type)}</div>
              <div class="flex-1 overflow-hidden">
                <div class="font-semibold text-sm leading-tight">${r.title}</div>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="badge-pill badge-blue text-xs">${capitalizeFirst(r.type.replace('_',' '))}</span>
                  ${r.semester ? `<span class="badge-pill badge-purple text-xs">Sem ${r.semester}</span>` : ''}
                  ${r.is_important ? `<span class="badge-pill badge-red text-xs">★ Important</span>` : ''}
                </div>
                ${r.description ? `<p class="text-xs mt-2 line-clamp-2" style="color:#94a3b8">${r.description}</p>` : ''}
                <div class="flex items-center gap-3 mt-3 text-xs" style="color:#64748b">
                  <span><i class="fas fa-eye mr-1"></i>${r.view_count||0}</span>
                  <span><i class="fas fa-download mr-1"></i>${r.download_count||0}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2 mt-3">
              <button class="btn-primary text-xs py-1 flex-1" onclick="event.stopPropagation();viewResource(${r.id},'${escHtml(r.title)}','${r.file_url||''}','${r.type}')"><i class="fas fa-eye mr-1"></i>View</button>
              ${r.file_url ? `<button class="btn-secondary text-xs py-1 px-3" onclick="event.stopPropagation();downloadResource(${r.id},'${r.file_url}','${escHtml(r.title)}')"><i class="fas fa-download"></i></button>` : ''}
              <button class="btn-secondary text-xs py-1 px-3" onclick="event.stopPropagation();toggleBookmark(${r.id},this)"><i class="fas fa-bookmark"></i></button>
              ${currentUser?.role === 'admin' ? `<button class="btn-danger text-xs py-1 px-3" onclick="event.stopPropagation();deleteResource(${r.id})"><i class="fas fa-trash"></i></button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

function viewResource(id, title, url, type) {
  // Track view
  apiFetch(`/resources/${id}/view`, { method: 'POST' }).catch(() => {});

  const body = document.getElementById('res-modal-body');
  document.getElementById('res-modal-title').textContent = title;

  let content = '';
  if (type === 'video' && url) {
    const youtubeId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)?.[1];
    content = youtubeId
      ? `<div style="position:relative;padding-bottom:56.25%;height:0"><iframe src="https://www.youtube.com/embed/${youtubeId}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`
      : `<div class="text-center py-8"><a href="${url}" target="_blank" class="btn-primary"><i class="fas fa-external-link-alt mr-2"></i>Open Video</a></div>`;
  } else if (url) {
    content = `
      <div class="mb-3 flex gap-2">
        <a href="${url}" target="_blank" class="btn-primary text-sm"><i class="fas fa-external-link-alt mr-1"></i>Open PDF</a>
        <button class="btn-secondary text-sm" onclick="downloadResource(${id},'${url}','${escHtml(title)}')"><i class="fas fa-download mr-1"></i>Download</button>
        <button class="btn-secondary text-sm" onclick="toggleBookmark(${id},this)"><i class="fas fa-bookmark mr-1"></i>Bookmark</button>
      </div>
      <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
        <iframe src="https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true" style="width:100%;height:500px" frameborder="0">
          <p class="p-4 text-sm">PDF preview not available. <a href="${url}" target="_blank" class="text-primary-400">Click here to open</a>.</p>
        </iframe>
      </div>`;
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
    a.href = url;
    a.download = title + '.pdf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started!', 'success');
  } catch(e) {
    window.open(url, '_blank');
  }
}

async function toggleBookmark(resourceId, btn) {
  try {
    await apiFetch(`/resources/${resourceId}/bookmark`, { method: 'POST' });
    btn.innerHTML = '<i class="fas fa-bookmark text-primary-400"></i>';
    showToast('Bookmarked! 🔖', 'success');
  } catch(e) {
    showToast(e.message, 'error');
  }
}

async function deleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  try {
    await apiFetch(`/resources/${id}`, { method: 'DELETE' });
    showToast('Resource deleted', 'success');
    loadResources();
  } catch(e) {
    showToast(e.message, 'error');
  }
}

function showUploadModal() {
  document.getElementById('upload-modal').style.display = 'flex';
}

async function submitUpload() {
  const title = document.getElementById('upload-title').value.trim();
  const url = document.getElementById('upload-url').value.trim();
  if (!title || !url) return showToast('Title and URL are required', 'error');
  const body = {
    title,
    description: document.getElementById('upload-desc').value,
    type: document.getElementById('upload-type').value,
    semester: parseInt(document.getElementById('upload-semester').value),
    file_url: url,
    file_name: title + '.pdf',
    tags: document.getElementById('upload-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    is_important: document.getElementById('upload-important').checked ? 1 : 0,
    branch_code: currentUser?.branch || 'CSE',
  };
  try {
    await apiFetch('/resources', { method: 'POST', body: JSON.stringify(body) });
    closeModal('upload-modal');
    showToast('Resource uploaded successfully! 📚', 'success');
    loadResources();
  } catch(e) {
    showToast(e.message, 'error');
  }
}

// ============================================================
// QUIZ
// ============================================================
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
            <p class="text-xs mb-3 flex-1" style="color:#94a3b8">${q.description || 'Test your knowledge with this quiz'}</p>
            <div class="grid grid-cols-3 gap-2 text-center mb-4">
              <div class="p-2 rounded-lg" style="background:rgba(99,102,241,.08)"><div class="text-sm font-bold">${q.total_questions}</div><div class="text-xs" style="color:#64748b">Questions</div></div>
              <div class="p-2 rounded-lg" style="background:rgba(99,102,241,.08)"><div class="text-sm font-bold">${q.duration_minutes}m</div><div class="text-xs" style="color:#64748b">Time</div></div>
              <div class="p-2 rounded-lg" style="background:rgba(99,102,241,.08)"><div class="text-sm font-bold">${q.passing_score}%</div><div class="text-xs" style="color:#64748b">Pass</div></div>
            </div>
            <button class="btn-primary w-full" onclick="startQuiz(${q.id})"><i class="fas fa-play mr-2"></i>Start Quiz</button>
          </div>
        `).join('')}
      </div>
    `;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

async function startQuiz(quizId) {
  try {
    showToast('Loading quiz...', 'info');
    const data = await apiFetch(`/quiz/${quizId}`);
    currentQuiz = data;
    quizAnswers = {};
    currentQuestionIndex = 0;
    document.getElementById('quiz-list-view').style.display = 'none';
    document.getElementById('quiz-take-view').style.display = 'block';
    document.getElementById('quiz-result-view').style.display = 'none';
    renderQuizQuestion();
    startQuizTimer(data.quiz.duration_minutes * 60);
  } catch(e) {
    showToast('Failed to load quiz: ' + e.message, 'error');
  }
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
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <button class="btn-secondary text-sm" onclick="loadQuizList()"><i class="fas fa-times mr-1"></i>Exit</button>
        <div class="text-center">
          <div class="font-bold text-sm">${quiz.title}</div>
          <div class="text-xs" style="color:#64748b">Question ${currentQuestionIndex+1} of ${total}</div>
        </div>
        <div class="text-lg font-bold text-primary-400" id="quiz-timer">--:--</div>
      </div>
      <!-- Progress -->
      <div class="progress-bar mb-6"><div class="progress-fill" style="width:${progress}%"></div></div>
      <!-- Question -->
      <div class="card p-6 mb-4">
        <div class="text-xs mb-3" style="color:#6366f1">Question ${currentQuestionIndex+1}</div>
        <h3 class="text-base font-semibold mb-5">${q.question}</h3>
        <div>
          ${['a','b','c','d'].map(opt => `
            <div class="quiz-option ${quizAnswers[currentQuestionIndex]===opt?'selected':''}" onclick="selectAnswer(${currentQuestionIndex},'${opt}',this)">
              <span class="font-bold mr-2 text-primary-400">${opt.toUpperCase()}.</span>
              ${q['option_'+opt]}
            </div>
          `).join('')}
        </div>
      </div>
      <!-- Navigation -->
      <div class="flex items-center justify-between">
        <button class="btn-secondary" onclick="prevQuestion()" ${currentQuestionIndex===0?'disabled':''}>← Previous</button>
        <div class="flex gap-2 flex-wrap justify-center">
          ${currentQuiz.questions.map((_,i) => `
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${i===currentQuestionIndex?'bg-primary-500 text-white':quizAnswers[i]?'bg-green-500 text-white':''}" 
              style="${i!==currentQuestionIndex&&!quizAnswers[i]?'background:rgba(99,102,241,.15);color:#818cf8':''}"
              onclick="goToQuestion(${i})">${i+1}</div>
          `).join('')}
        </div>
        ${currentQuestionIndex < total-1
          ? `<button class="btn-primary" onclick="nextQuestion()">Next →</button>`
          : `<button class="btn-primary" onclick="submitQuiz()" style="background:linear-gradient(135deg,#22c55e,#16a34a)"><i class="fas fa-check mr-1"></i>Submit</button>`
        }
      </div>
    </div>
  `;
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
  } catch(e) {
    showToast('Failed to submit: ' + e.message, 'error');
  }
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
        <div class="text-6xl mb-4">${pct>=90?'🏆':pct>=60?'🎉':'😔'}</div>
        <h2 class="text-3xl font-bold mb-2">${pct.toFixed(1)}%</h2>
        <p class="text-xl mb-2">${passed?'✅ Passed!':'❌ Not Passed'}</p>
        <p style="color:#64748b">${attempt.score}/${attempt.total_marks} correct answers</p>
        <div class="flex gap-4 justify-center mt-4 flex-wrap">
          <span class="badge-pill ${passed?'badge-green':'badge-red'}">${passed?'PASSED':'FAILED'}</span>
          ${attempt.points_earned > 0 ? `<span class="badge-pill badge-yellow">+${attempt.points_earned} pts earned</span>` : ''}
        </div>
        <div class="w-full max-w-xs mx-auto mt-6"><div class="progress-bar h-3"><div class="progress-fill" style="width:${pct}%;background:${passed?'linear-gradient(90deg,#22c55e,#16a34a)':'linear-gradient(90deg,#ef4444,#dc2626)'}"></div></div></div>
      </div>

      <div class="card p-5 mb-6">
        <h3 class="font-bold mb-4">📋 Review Answers</h3>
        ${(questions||[]).map((q,i) => `
          <div class="p-4 rounded-xl mb-3" style="background:rgba(${q.user_answer===q.correct_answer?'34,197,94':'239,68,68'},.08);border:1px solid rgba(${q.user_answer===q.correct_answer?'34,197,94':'239,68,68'},.2)">
            <div class="flex items-start gap-2">
              <span>${q.user_answer===q.correct_answer?'✅':'❌'}</span>
              <div class="flex-1">
                <p class="font-medium text-sm">${i+1}. ${q.question}</p>
                <p class="text-xs mt-1">Your answer: <strong>${q.user_answer ? q.user_answer.toUpperCase()+'. '+q['option_'+q.user_answer] : 'Not answered'}</strong></p>
                ${q.user_answer!==q.correct_answer ? `<p class="text-xs text-green-400">Correct: ${q.correct_answer.toUpperCase()}. ${q['option_'+q.correct_answer]}</p>` : ''}
                ${q.explanation ? `<p class="text-xs mt-2 p-2 rounded" style="background:rgba(99,102,241,.1);color:#a5b4fc">💡 ${q.explanation}</p>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="flex gap-3">
        <button class="btn-secondary flex-1" onclick="loadQuizList()"><i class="fas fa-list mr-1"></i>All Quizzes</button>
        <button class="btn-primary flex-1" onclick="startQuiz(${currentQuiz.quiz.id})"><i class="fas fa-redo mr-1"></i>Retry Quiz</button>
      </div>
    </div>
  `;
}

function showCreateQuizModal() { document.getElementById('create-quiz-modal').style.display = 'flex'; }

async function submitCreateQuiz() {
  const title = document.getElementById('cq-title').value.trim();
  if (!title) return showToast('Quiz title is required', 'error');
  const body = {
    title,
    description: document.getElementById('cq-desc').value,
    branch_code: document.getElementById('cq-branch').value,
    semester: parseInt(document.getElementById('cq-semester').value),
    duration_minutes: parseInt(document.getElementById('cq-duration').value),
    difficulty: document.getElementById('cq-difficulty').value,
    passing_score: parseInt(document.getElementById('cq-passing').value),
  };
  try {
    await apiFetch('/quiz', { method: 'POST', body: JSON.stringify(body) });
    closeModal('create-quiz-modal');
    showToast('Quiz created! 🎯', 'success');
    loadQuizList();
  } catch(e) {
    showToast(e.message, 'error');
  }
}

// ============================================================
// AI ASSISTANT
// ============================================================
async function loadSubjectsForAI() {
  try {
    const data = await apiFetch(`/subjects?branch=${currentUser?.branch||'CSE'}`);
    const sel = document.getElementById('ai-subject-select');
    if (sel && data.subjects) {
      data.subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (Sem ${s.semester})`;
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

  // Add typing indicator
  const container = document.getElementById('chat-messages');
  const typingEl = document.createElement('div');
  typingEl.id = 'typing-indicator';
  typingEl.innerHTML = `<div class="flex gap-2 items-end"><div class="chat-bubble-ai p-3"><div class="flex gap-1 items-center">${[1,2,3].map(i=>`<div class="typing-dot" style="animation-delay:${(i-1)*.15}s"></div>`).join('')}</div></div></div>`;
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;

  try {
    const data = await apiFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: msg, subject_id: subjectId ? parseInt(subjectId) : null, history: chatHistory.slice(-6) })
    });
    typingEl.remove();
    const reply = data.reply || 'I could not process that request.';
    chatHistory.push({ role: 'assistant', content: reply });
    renderChatMessages();
  } catch(e) {
    typingEl.remove();
    const errMsg = "I'm having trouble connecting right now. Please check your configuration or try again later.";
    chatHistory.push({ role: 'assistant', content: errMsg });
    renderChatMessages();
  }
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  // Keep welcome msg if no history
  if (!chatHistory.length) return;

  container.innerHTML = chatHistory.map(m => `
    <div class="flex gap-2 items-end ${m.role==='user'?'justify-end':''}">
      ${m.role==='assistant' ? '<div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm" style="background:linear-gradient(135deg,#6366f1,#4f46e5)">🤖</div>' : ''}
      <div class="${m.role==='user'?'chat-bubble-user':'chat-bubble-ai'}">
        <div class="text-sm" style="line-height:1.6">${m.role==='assistant' ? (typeof marked !== 'undefined' ? marked.parse(m.content) : m.content.replace(/\n/g,'<br>')) : m.content}</div>
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

// ============================================================
// PLACEMENT
// ============================================================
async function loadPlacement(category) {
  const el = document.getElementById('placement-content');
  el.innerHTML = skeletonGrid(4, 100);
  const cat = category || document.getElementById('placement-cat').value;
  try {
    let url = '/placement';
    if (cat) url += `?category=${cat}`;
    const data = await apiFetch(url);
    const questions = data.questions || [];
    if (!questions.length) { el.innerHTML = '<div class="text-center py-12"><div class="text-5xl mb-3">💼</div><p style="color:#64748b">No questions found for this category</p></div>'; return; }
    el.innerHTML = `
      <div class="space-y-4">
        ${questions.map((q,i) => `
          <div class="card p-5">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${i+1}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="badge-pill ${q.category==='aptitude'?'badge-blue':q.category==='coding'?'badge-green':q.category==='hr'?'badge-yellow':'badge-purple'}">${capitalizeFirst(q.category)}</span>
                  ${q.company ? `<span class="badge-pill badge-blue text-xs"><i class="fas fa-building mr-1"></i>${q.company}</span>` : ''}
                  <span class="badge-pill ${q.difficulty==='easy'?'badge-green':q.difficulty==='hard'?'badge-red':'badge-yellow'}">${q.difficulty}</span>
                </div>
                <p class="font-semibold text-sm mb-3">${q.question}</p>
                <div class="collapsed-answer" id="ans-${i}" style="display:none">
                  <div class="p-3 rounded-xl text-sm" style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#86efac">
                    <strong>Answer:</strong><br>${q.answer || 'See solution below'}
                  </div>
                </div>
                <button class="btn-secondary text-xs mt-2" onclick="toggleAnswer(${i})">
                  <i class="fas fa-lightbulb mr-1"></i>Show Answer
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

function filterPlacement(cat) {
  document.getElementById('placement-cat').value = cat;
  loadPlacement(cat);
}

function toggleAnswer(i) {
  const el = document.getElementById('ans-'+i);
  const btn = el.nextElementSibling;
  if (el.style.display === 'none') {
    el.style.display = 'block';
    btn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Hide Answer';
  } else {
    el.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-lightbulb mr-1"></i>Show Answer';
  }
}

// ============================================================
// STUDY PLANNER
// ============================================================
async function loadPlanner() {
  const el = document.getElementById('planner-content');
  el.innerHTML = skeletonGrid(3, 80);
  try {
    const data = await apiFetch('/planner');
    const plans = data.plans || [];
    const pending = plans.filter(p => p.status === 'pending');
    const completed = plans.filter(p => p.status === 'completed');

    el.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="stat-card text-center"><div class="text-2xl font-bold text-primary-400">${plans.length}</div><div class="text-xs mt-1" style="color:#64748b">Total Sessions</div></div>
        <div class="stat-card text-center"><div class="text-2xl font-bold text-yellow-400">${pending.length}</div><div class="text-xs mt-1" style="color:#64748b">Pending</div></div>
        <div class="stat-card text-center"><div class="text-2xl font-bold text-green-400">${completed.length}</div><div class="text-xs mt-1" style="color:#64748b">Completed</div></div>
      </div>

      ${!plans.length ? `
        <div class="text-center py-16 card p-10">
          <div class="text-5xl mb-3">📅</div>
          <p class="font-semibold mb-2">No study sessions planned</p>
          <p class="text-sm mb-4" style="color:#64748b">Create your first study session to stay organized</p>
          <button class="btn-primary" onclick="showAddPlanModal()"><i class="fas fa-plus mr-1"></i>Add First Session</button>
        </div>
      ` : `
        <div class="space-y-3">
          ${plans.map(p => `
            <div class="card p-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style="background:${p.status==='completed'?'rgba(34,197,94,.15)':p.priority==='high'?'rgba(239,68,68,.15)':'rgba(99,102,241,.15)'}">
                ${p.status==='completed'?'✅':p.priority==='high'?'🔴':'📘'}
              </div>
              <div class="flex-1">
                <div class="font-semibold text-sm">${p.title}</div>
                <div class="text-xs mt-0.5" style="color:#64748b">📅 ${p.scheduled_date} · ⏱ ${p.duration_minutes} min · ${capitalizeFirst(p.priority)} priority</div>
                ${p.description ? `<div class="text-xs mt-1" style="color:#94a3b8">${p.description}</div>` : ''}
              </div>
              <div class="flex gap-2">
                ${p.status === 'pending' ? `
                  <button class="btn-primary text-xs px-3 py-1" onclick="completePlan(${p.id})">✓ Done</button>
                  <button class="btn-danger text-xs px-3 py-1" onclick="deletePlan(${p.id})"><i class="fas fa-trash"></i></button>
                ` : `<span class="badge-pill badge-green">Completed</span>`}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
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
    await apiFetch('/planner', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: document.getElementById('plan-desc').value,
        scheduled_date: date,
        duration_minutes: parseInt(document.getElementById('plan-duration').value),
        priority: document.getElementById('plan-priority').value,
      })
    });
    closeModal('plan-modal');
    showToast('Study session added! 📅', 'success');
    loadPlanner();
  } catch(e) { showToast(e.message, 'error'); }
}

async function completePlan(id) {
  try {
    await apiFetch(`/planner/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
    showToast('Session marked as completed! ✅', 'success');
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

// ============================================================
// NOTIFICATIONS
// ============================================================
async function loadNotifications() {
  const el = document.getElementById('notifications-content');
  el.innerHTML = skeletonGrid(3, 60);
  try {
    const data = await apiFetch('/notifications');
    const notifs = data.notifications || [];
    document.getElementById('notif-count').style.display = 'none';

    if (!notifs.length) { el.innerHTML = '<div class="text-center py-16"><div class="text-5xl mb-3">🔔</div><p style="color:#64748b">No notifications</p></div>'; return; }

    el.innerHTML = notifs.map(n => `
      <div class="notification-item" style="border-color:${n.type==='success'?'#22c55e':n.type==='warning'?'#eab308':n.type==='quiz'?'#6366f1':'#3b82f6'};opacity:${n.is_read?'.6':'1'}">
        <div class="flex items-start gap-3">
          <div class="text-xl">${n.type==='success'?'✅':n.type==='warning'?'⚠️':n.type==='quiz'?'🎯':n.type==='resource'?'📚':'ℹ️'}</div>
          <div class="flex-1">
            <div class="font-semibold text-sm">${n.title}</div>
            <p class="text-xs mt-1" style="color:#94a3b8">${n.message}</p>
            <div class="text-xs mt-2" style="color:#64748b">${timeAgo(n.created_at)}</div>
          </div>
          ${!n.is_read ? '<div class="w-2 h-2 rounded-full mt-1 flex-shrink-0" style="background:#6366f1"></div>' : ''}
        </div>
      </div>
    `).join('');
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

async function loadNotificationCount() {
  try {
    const data = await apiFetch('/notifications?unread=1');
    const count = (data.notifications || []).filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-count');
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'flex';
    }
  } catch(e) {}
}

async function markAllRead() {
  try {
    await apiFetch('/notifications/read-all', { method: 'POST' });
    showToast('All notifications marked as read', 'success');
    loadNotifications();
    document.getElementById('notif-count').style.display = 'none';
  } catch(e) { showToast(e.message, 'error'); }
}

// ============================================================
// GAMIFICATION
// ============================================================
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

    el.innerHTML = `
      <!-- My Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card text-center"><div class="text-3xl mb-1">⭐</div><div class="text-2xl font-bold text-yellow-400">${currentUser.points || 0}</div><div class="text-xs" style="color:#64748b">Total Points</div></div>
        <div class="stat-card text-center"><div class="text-3xl mb-1">🏅</div><div class="text-2xl font-bold text-primary-400">${currentUser.level || 1}</div><div class="text-xs" style="color:#64748b">Level</div></div>
        <div class="stat-card text-center"><div class="text-3xl mb-1">🔥</div><div class="text-2xl font-bold text-orange-400">${currentUser.streak || 0}</div><div class="text-xs" style="color:#64748b">Day Streak</div></div>
        <div class="stat-card text-center"><div class="text-3xl mb-1">🎖️</div><div class="text-2xl font-bold text-green-400">${myStats.badges_count || 0}</div><div class="text-xs" style="color:#64748b">Badges</div></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Leaderboard -->
        <div class="card p-5">
          <h3 class="font-bold mb-4">🏆 Leaderboard</h3>
          ${lb.length ? lb.slice(0,10).map((u,i) => `
            <div class="leaderboard-row ${u.id === currentUser?.id ? 'border border-primary-500' : ''}">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style="background:${i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#b45309':'rgba(99,102,241,.2)'}">
                ${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
              </div>
              <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${u.name[0]}</div>
              <div class="flex-1 overflow-hidden">
                <div class="font-semibold text-sm truncate">${u.name} ${u.id === currentUser?.id ? '(You)' : ''}</div>
                <div class="text-xs" style="color:#64748b">${u.branch} · Lv ${u.level}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-sm text-yellow-400">⭐ ${u.points}</div>
                <div class="text-xs" style="color:#64748b">🔥 ${u.streak}d</div>
              </div>
            </div>
          `).join('') : '<p class="text-sm text-center py-8" style="color:#64748b">No leaderboard data yet</p>'}
        </div>

        <!-- Badges -->
        <div class="card p-5">
          <h3 class="font-bold mb-4">🎖️ All Badges</h3>
          <div class="grid grid-cols-2 gap-3">
            ${allBadges.map(b => `
              <div class="p-3 rounded-xl text-center" style="background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.15)">
                <div class="text-2xl mb-1">${b.icon || '🏅'}</div>
                <div class="font-semibold text-xs">${b.name}</div>
                <div class="text-xs mt-0.5" style="color:#64748b">${b.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

// ============================================================
// EXAMS COUNTDOWN
// ============================================================
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
          const days = Math.max(0, Math.ceil((new Date(exam.exam_date) - new Date()) / 86400000));
          const hours = Math.max(0, Math.ceil((new Date(exam.exam_date) - new Date()) / 3600000));
          const isUrgent = days <= 7;
          return `
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-3">
              ${isUrgent ? '<span class="badge-pill badge-red">🚨 Urgent</span>' : '<span class="badge-pill badge-blue">📅 Upcoming</span>'}
              ${exam.branch_code ? `<span class="badge-pill badge-purple">${exam.branch_code}</span>` : '<span class="badge-pill badge-purple">All Branches</span>'}
            </div>
            <h3 class="font-bold mb-1">${exam.title}</h3>
            ${exam.description ? `<p class="text-xs mb-3" style="color:#94a3b8">${exam.description}</p>` : ''}
            <div class="exam-countdown-card mt-3">
              <div class="text-xs mb-1" style="color:#94a3b8">Time Remaining</div>
              <div class="flex gap-3 justify-center">
                <div><div class="countdown-num">${days}</div><div class="text-xs" style="color:#94a3b8">days</div></div>
                <div class="countdown-num" style="color:#64748b">:</div>
                <div><div class="countdown-num">${hours % 24}</div><div class="text-xs" style="color:#94a3b8">hours</div></div>
              </div>
              <div class="text-xs mt-2" style="color:#94a3b8">📅 ${exam.exam_date}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

// ============================================================
// ANALYTICS
// ============================================================
async function loadAnalytics() {
  const el = document.getElementById('analytics-content');
  el.innerHTML = skeletonGrid(4, 120);
  try {
    const data = await apiFetch(currentUser.role === 'admin' ? '/analytics/admin' : '/analytics/student');
    const isAdmin = currentUser.role === 'admin';

    if (isAdmin) {
      el.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card"><div class="text-2xl mb-1">👥</div><div class="text-2xl font-bold text-primary-400">${data.total_users || 0}</div><div class="text-xs" style="color:#64748b">Total Users</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">🎓</div><div class="text-2xl font-bold text-green-400">${data.total_students || 0}</div><div class="text-xs" style="color:#64748b">Students</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">📚</div><div class="text-2xl font-bold text-yellow-400">${data.total_resources || 0}</div><div class="text-xs" style="color:#64748b">Resources</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">🎯</div><div class="text-2xl font-bold text-orange-400">${data.total_quiz_attempts || 0}</div><div class="text-xs" style="color:#64748b">Quiz Attempts</div></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="font-bold mb-4">Platform Overview</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm"><span style="color:#94a3b8">Total Downloads</span><span class="font-bold">${data.total_downloads || 0}</span></div>
              <div class="flex justify-between text-sm"><span style="color:#94a3b8">Total Quizzes</span><span class="font-bold">${data.total_quizzes || 0}</span></div>
              <div class="flex justify-between text-sm"><span style="color:#94a3b8">Total Branches</span><span class="font-bold">${data.total_branches || 0}</span></div>
              <div class="flex justify-between text-sm"><span style="color:#94a3b8">Avg Quiz Score</span><span class="font-bold">${data.avg_quiz_score ? data.avg_quiz_score.toFixed(1) : 0}%</span></div>
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4">Recent Activity</h3>
            <div class="text-center py-4" style="color:#64748b"><div class="text-3xl mb-2">📊</div><div class="text-sm">Activity tracking active</div></div>
          </div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card"><div class="text-2xl mb-1">🎯</div><div class="text-2xl font-bold text-primary-400">${data.quizzes_taken || 0}</div><div class="text-xs" style="color:#64748b">Quizzes Taken</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">📊</div><div class="text-2xl font-bold text-green-400">${data.avg_score ? data.avg_score.toFixed(0) : 0}%</div><div class="text-xs" style="color:#64748b">Avg Score</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">📥</div><div class="text-2xl font-bold text-yellow-400">${data.total_resources || 0}</div><div class="text-xs" style="color:#64748b">Resources Accessed</div></div>
          <div class="stat-card"><div class="text-2xl mb-1">🏆</div><div class="text-2xl font-bold text-orange-400">${data.badges_earned || 0}</div><div class="text-xs" style="color:#64748b">Badges Earned</div></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="font-bold mb-4">📈 Quiz Performance</h3>
            <canvas id="quiz-chart" height="200"></canvas>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4">📚 Study Progress</h3>
            <div class="space-y-3">
              ${(data.subject_progress || []).map(s => `
                <div>
                  <div class="flex justify-between text-xs mb-1"><span>${s.name || 'Subject'}</span><span>${(s.completion||0).toFixed(0)}%</span></div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${s.completion||0}%"></div></div>
                </div>
              `).join('') || '<p class="text-sm text-center py-4" style="color:#64748b">No progress data yet</p>'}
            </div>
          </div>
        </div>
        ${(data.quiz_history || []).length > 0 ? `
          <div class="card p-5 mt-6">
            <h3 class="font-bold mb-4">📋 Recent Quiz History</h3>
            <div class="space-y-2">
              ${(data.quiz_history || []).map(a => `
                <div class="flex items-center justify-between p-3 rounded-xl" style="background:rgba(99,102,241,.05)">
                  <div>
                    <div class="font-medium text-sm">${a.quiz_title || 'Quiz'}</div>
                    <div class="text-xs" style="color:#64748b">${a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold ${a.percentage >= 60 ? 'text-green-400' : 'text-red-400'}">${(a.percentage||0).toFixed(0)}%</div>
                    <div class="text-xs" style="color:#64748b">${a.score}/${a.total_marks}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
      // Draw chart
      try {
        const ctx = document.getElementById('quiz-chart')?.getContext('2d');
        if (ctx && data.quiz_history && data.quiz_history.length) {
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: (data.quiz_history || []).slice(0,8).map((_,i) => 'Quiz '+(i+1)),
              datasets: [{
                label: 'Score %',
                data: (data.quiz_history || []).slice(0,8).map(a => a.percentage || 0),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,.15)',
                fill: true,
                tension: 0.4,
              }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#64748b' } }, x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#64748b' } } } }
          });
        } else if (ctx) {
          ctx.canvas.closest('.card').querySelector('canvas').insertAdjacentHTML('beforebegin', '<p class="text-sm text-center py-4" style="color:#64748b">Take some quizzes to see your progress chart!</p>');
        }
      } catch(e) {}
    }
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

// ============================================================
// PROFILE
// ============================================================
async function loadProfile() {
  const el = document.getElementById('profile-content');
  el.innerHTML = skeletonGrid(2, 120);
  try {
    const data = await apiFetch('/auth/me');
    const u = data.user || currentUser;
    el.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="card p-6 mb-6 text-center">
          <div class="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-3" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${u.name[0]}</div>
          <h2 class="text-xl font-bold">${u.name}</h2>
          <p class="text-sm mt-1" style="color:#64748b">${u.email}</p>
          <div class="flex justify-center gap-3 mt-3 flex-wrap">
            <span class="badge-pill badge-purple">${u.branch || 'CSE'}</span>
            <span class="badge-pill badge-blue">Semester ${u.semester || 1}</span>
            <span class="badge-pill ${u.role==='admin'?'badge-yellow':'badge-green'}">${u.role}</span>
          </div>
          <div class="grid grid-cols-3 gap-4 mt-6">
            <div class="stat-card text-center"><div class="text-xl font-bold text-yellow-400">⭐ ${u.points || 0}</div><div class="text-xs" style="color:#64748b">Points</div></div>
            <div class="stat-card text-center"><div class="text-xl font-bold text-primary-400">Lv ${u.level || 1}</div><div class="text-xs" style="color:#64748b">Level</div></div>
            <div class="stat-card text-center"><div class="text-xl font-bold text-orange-400">🔥 ${u.streak || 0}</div><div class="text-xs" style="color:#64748b">Streak</div></div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-bold mb-4">Edit Profile</h3>
          <div class="space-y-4">
            <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Full Name</label><input id="prof-name" type="text" class="input-field" value="${u.name}"></div>
            <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Bio</label><textarea id="prof-bio" class="input-field" rows="3" placeholder="Tell something about yourself...">${u.bio || ''}</textarea></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Branch</label>
                <select id="prof-branch" class="input-field">
                  <option ${u.branch==='CSE'?'selected':''} value="CSE">CSE</option>
                  <option ${u.branch==='ISE'?'selected':''} value="ISE">ISE</option>
                  <option ${u.branch==='AIML'?'selected':''} value="AIML">AI&ML</option>
                  <option ${u.branch==='ECE'?'selected':''} value="ECE">ECE</option>
                  <option ${u.branch==='EEE'?'selected':''} value="EEE">EEE</option>
                  <option ${u.branch==='ME'?'selected':''} value="ME">Mechanical</option>
                  <option ${u.branch==='CV'?'selected':''} value="CV">Civil</option>
                </select>
              </div>
              <div><label class="block text-sm font-medium mb-1" style="color:#94a3b8">Semester</label>
                <select id="prof-semester" class="input-field">
                  ${[1,2,3,4,5,6,7,8].map(i => `<option ${u.semester==i?'selected':''} value="${i}">Sem ${i}</option>`).join('')}
                </select>
              </div>
            </div>
            <button class="btn-primary w-full" onclick="saveProfile()"><i class="fas fa-save mr-1"></i>Save Changes</button>
          </div>
        </div>
      </div>
    `;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

async function saveProfile() {
  try {
    const data = await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('prof-name').value.trim(),
        bio: document.getElementById('prof-bio').value.trim(),
        branch: document.getElementById('prof-branch').value,
        semester: parseInt(document.getElementById('prof-semester').value),
      })
    });
    currentUser = { ...currentUser, ...data.user };
    updateSidebarUser();
    showToast('Profile updated! ✅', 'success');
  } catch(e) { showToast(e.message, 'error'); }
}

// ============================================================
// ADMIN USERS
// ============================================================
async function loadAdminUsers() {
  const el = document.getElementById('admin-users-content');
  el.innerHTML = skeletonGrid(4, 60);
  try {
    const data = await apiFetch('/users');
    const users = data.users || [];
    el.innerHTML = `
      <div class="card overflow-hidden">
        <div class="p-4 border-b" style="border-color:rgba(255,255,255,.07)">
          <span class="font-semibold">${users.length} Users</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr style="background:rgba(99,102,241,.08)">
                <th class="p-3 text-left font-semibold" style="color:#94a3b8">Name</th>
                <th class="p-3 text-left font-semibold" style="color:#94a3b8">Email</th>
                <th class="p-3 text-left font-semibold" style="color:#94a3b8">Branch</th>
                <th class="p-3 text-left font-semibold" style="color:#94a3b8">Role</th>
                <th class="p-3 text-left font-semibold" style="color:#94a3b8">Points</th>
                <th class="p-3 text-left font-semibold" style="color:#94a3b8">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr class="border-t hover:bg-primary-500 hover:bg-opacity-5" style="border-color:rgba(255,255,255,.04)">
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff">${u.name[0]}</div>
                      ${u.name}
                    </div>
                  </td>
                  <td class="p-3" style="color:#94a3b8">${u.email}</td>
                  <td class="p-3"><span class="badge-pill badge-blue">${u.branch || '-'}</span></td>
                  <td class="p-3"><span class="badge-pill ${u.role==='admin'?'badge-yellow':'badge-green'}">${u.role}</span></td>
                  <td class="p-3 font-bold text-yellow-400">⭐ ${u.points || 0}</td>
                  <td class="p-3">
                    <button class="btn-danger text-xs px-2 py-1" onclick="toggleUserStatus(${u.id},${u.is_active})">${u.is_active?'Deactivate':'Activate'}</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

async function toggleUserStatus(userId, isActive) {
  try {
    await apiFetch(`/users/${userId}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive ? 0 : 1 }) });
    showToast('User status updated', 'success');
    loadAdminUsers();
  } catch(e) { showToast(e.message, 'error'); }
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================
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
          <div class="text-2xl">${a.type==='exam'?'📅':a.type==='placement'?'💼':a.type==='resource'?'📚':'📢'}</div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <h3 class="font-bold">${a.title}</h3>
              <span class="badge-pill ${a.type==='exam'?'badge-red':a.type==='placement'?'badge-yellow':a.type==='resource'?'badge-blue':'badge-purple'}">${capitalizeFirst(a.type)}</span>
            </div>
            <p class="text-sm" style="color:#94a3b8">${a.content}</p>
            <div class="text-xs mt-2" style="color:#64748b">${timeAgo(a.created_at)}</div>
          </div>
          ${currentUser?.role === 'admin' ? `<button class="btn-danger text-xs px-2 py-1" onclick="deleteAnnouncement(${a.id})"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </div>
    `).join('');
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

function showAddAnnouncementModal() { document.getElementById('announcement-modal').style.display = 'flex'; }

async function submitAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const content = document.getElementById('ann-content').value.trim();
  if (!title || !content) return showToast('Title and content are required', 'error');
  try {
    await apiFetch('/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, content, type: document.getElementById('ann-type').value })
    });
    closeModal('announcement-modal');
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

// ============================================================
// DAILY CHALLENGE
// ============================================================
async function loadDailyChallenge() {
  const el = document.getElementById('challenge-content');
  el.innerHTML = skeletonGrid(2, 120);
  try {
    const data = await apiFetch('/challenge/today');
    const challenge = data.challenge;
    if (!challenge) {
      el.innerHTML = `<div class="text-center py-16 card p-10"><div class="text-5xl mb-3">🔥</div><p class="font-semibold mb-2">No Challenge Today</p><p class="text-sm" style="color:#64748b">Check back tomorrow for a new challenge!</p></div>`;
      return;
    }
    const content = typeof challenge.content === 'string' ? JSON.parse(challenge.content) : challenge.content;
    el.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="card p-6 mb-5" style="background:linear-gradient(135deg,#1e1e3f,#2d1b69)">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-4xl">🔥</span>
            <div>
              <h2 class="text-xl font-bold text-white">${challenge.title}</h2>
              <p style="color:#a5b4fc">Reward: +${challenge.points_reward} points</p>
            </div>
          </div>
          <span class="badge-pill badge-yellow">${challenge.type === 'mcq' ? '🧠 MCQ Challenge' : '💻 Coding Challenge'}</span>
        </div>

        <div class="card p-6" id="challenge-question-box">
          <h3 class="font-semibold text-base mb-5">${content.question}</h3>
          <div>
            ${(content.options || []).map((opt, i) => `
              <div class="quiz-option" id="chall-opt-${i}" onclick="selectChallengeAnswer(${i}, this, ${content.correct}, '${escHtml(content.explanation || '')}')">
                <span class="font-bold mr-2 text-primary-400">${String.fromCharCode(65+i)}.</span>${opt}
              </div>
            `).join('')}
          </div>
          <div id="challenge-explanation" style="display:none" class="mt-4 p-4 rounded-xl" style="background:rgba(99,102,241,.1)"></div>
        </div>
      </div>
    `;
  } catch(e) {
    el.innerHTML = errorBox(e.message);
  }
}

function selectChallengeAnswer(idx, el, correct, explanation) {
  // Disable all options
  document.querySelectorAll('.quiz-option').forEach(o => o.style.pointerEvents = 'none');
  if (idx === correct) {
    el.classList.add('correct');
    showToast('🎉 Correct! +Points earned!', 'success');
  } else {
    el.classList.add('wrong');
    const correctEl = document.getElementById('chall-opt-'+correct);
    if (correctEl) correctEl.classList.add('correct');
    showToast('❌ Wrong answer!', 'error');
  }
  const expEl = document.getElementById('challenge-explanation');
  if (expEl && explanation) {
    expEl.style.display = 'block';
    expEl.style.background = 'rgba(99,102,241,.1)';
    expEl.innerHTML = `<p class="text-sm" style="color:#a5b4fc">💡 <strong>Explanation:</strong> ${explanation}</p>`;
  }
  // Submit to backend
  apiFetch('/challenge/complete', { method: 'POST', body: JSON.stringify({ answer_index: idx }) }).catch(() => {});
}

// ============================================================
// GLOBAL SEARCH
// ============================================================
let searchTimeout;
async function globalSearch(q) {
  clearTimeout(searchTimeout);
  if (!q || q.length < 2) return;
  searchTimeout = setTimeout(async () => {
    try {
      const data = await apiFetch(`/resources?search=${encodeURIComponent(q)}&limit=5`);
      // Could show a dropdown here, for now just filter resources
    } catch(e) {}
  }, 300);
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('vtu_theme', isDark ? 'light' : 'dark');
}

// Apply saved theme
const savedTheme = localStorage.getItem('vtu_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ============================================================
// MODAL HELPERS
// ============================================================
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Close modals on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ============================================================
// UTILITY HELPERS
// ============================================================
function resourceIcon(type) {
  const icons = { notes: '📝', syllabus: '📋', textbook: '📚', question_paper: '❓', lab_manual: '🔬', video: '🎥', link: '🔗' };
  return icons[type] || '📄';
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escHtml(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}

function skeletonGrid(count, height) {
  return `<div class="grid grid-cols-1 md:grid-cols-${count > 3 ? 3 : count} gap-4">
    ${Array(count).fill(`<div class="skeleton rounded-2xl" style="height:${height}px"></div>`).join('')}
  </div>`;
}

function errorBox(msg) {
  return `<div class="card p-8 text-center"><div class="text-4xl mb-3">⚠️</div><p class="font-semibold">Something went wrong</p><p class="text-sm mt-1" style="color:#64748b">${msg}</p><p class="text-xs mt-3" style="color:#475569">Make sure the database is initialized: npm run db:reset</p></div>`;
}
