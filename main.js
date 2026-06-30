// e-Safe Platform — main.js
// Cissy Technologies

// ── Mobile nav toggle ──
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// ── Close mobile nav when a link is clicked ──
document.querySelectorAll('.nav-link, .nav-signin, .nav-cta').forEach(link => {
  link.addEventListener('click', () => {
    navLinks && navLinks.classList.remove('open');
  });
});


// ═══════════════════════════════════════════════
// REGISTER FORM
// ═══════════════════════════════════════════════
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName  = document.getElementById('fullName');
    const workEmail = document.getElementById('workEmail');
    const department = document.getElementById('department');

    let isValid = true;

    // Validate full name (must not be empty)
    if (fullName.value.trim() === '') {
      showError(fullName, 'fullNameError');
      isValid = false;
    } else {
      clearError(fullName, 'fullNameError');
    }

    // Validate email (basic pattern check)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(workEmail.value.trim())) {
      showError(workEmail, 'workEmailError');
      isValid = false;
    } else {
      clearError(workEmail, 'workEmailError');
    }

    if (!isValid) return;

    // Save user info to localStorage so the dashboard can greet them by name
    const userData = {
      fullName: fullName.value.trim(),
      workEmail: workEmail.value.trim(),
      department: department.value || 'Not specified',
      registeredAt: new Date().toISOString()
    };
    localStorage.setItem('esafe_user', JSON.stringify(userData));

    showToast('Account created! Redirecting...');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });
}

function showError(field, errorId) {
  field.classList.add('error');
  document.getElementById(errorId).classList.add('show');
}

function clearError(field, errorId) {
  field.classList.remove('error');
  document.getElementById(errorId).classList.remove('show');
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}


// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
const modulesGrid = document.getElementById('modulesGrid');

if (modulesGrid) {

  // The 20 e-Safe modules
  const MODULES = [
    { num: 1,  name: "Introduction to Cybersecurity",  icon: "🛡️" },
    { num: 2,  name: "Recognizing Phishing Attacks",   icon: "🎣" },
    { num: 3,  name: "Email Security Best Practices",  icon: "📧" },
    { num: 4,  name: "Strong Password Creation",       icon: "🔑" },
    { num: 5,  name: "Password Managers",              icon: "🔐" },
    { num: 6,  name: "Two-Factor Authentication",      icon: "📱" },
    { num: 7,  name: "Social Engineering Tactics",     icon: "🎭" },
    { num: 8,  name: "Protecting Personal Data",       icon: "📋" },
    { num: 9,  name: "Ransomware Prevention",          icon: "💀" },
    { num: 10, name: "Malware Detection",              icon: "🦠" },
    { num: 11, name: "Safe Web Browsing",               icon: "🌐" },
    { num: 12, name: "Public WiFi Security",            icon: "📡" },
    { num: 13, name: "Mobile Device Security",          icon: "💻" },
    { num: 14, name: "Cloud Storage Safety",            icon: "☁️" },
    { num: 15, name: "Data Backup Strategies",          icon: "💾" },
    { num: 16, name: "Physical Security",               icon: "🔒" },
    { num: 17, name: "Incident Reporting",              icon: "🚨" },
    { num: 18, name: "Privacy & Compliance",             icon: "📜" },
    { num: 19, name: "Advanced Threats",                icon: "⚠️" },
    { num: 20, name: "Security Culture",                icon: "🏆" },
  ];

  // ── Load user info ──
  const userDataRaw = localStorage.getItem('esafe_user');
  const userData = userDataRaw ? JSON.parse(userDataRaw) : { fullName: "Guest" };
  const firstName = userData.fullName.split(' ')[0];

  document.getElementById('welcomeTitle').textContent = `Welcome back, ${firstName}!`;

  const initials = userData.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) avatarEl.textContent = initials || 'U';

  // ── Load progress (which modules are completed) ──
  // Stored as an array of completed module numbers, e.g. [1,2,3]
  // First-time visitors get a demo state matching the wireframe (6 done)
  if (localStorage.getItem('esafe_completed_modules') === null) {
    localStorage.setItem('esafe_completed_modules', JSON.stringify([1,2,3,4,5,6]));
  }
  let completed = JSON.parse(localStorage.getItem('esafe_completed_modules') || '[]');

  // Determine the "active" module — first one not yet completed
  let activeModuleNum = MODULES.find(m => !completed.includes(m.num))?.num || null;

  function renderDashboard() {
    completed = JSON.parse(localStorage.getItem('esafe_completed_modules') || '[]');
    activeModuleNum = MODULES.find(m => !completed.includes(m.num))?.num || null;

    const completedCount = completed.length;
    const remainingCount = 20 - completedCount;
    const pct = Math.round((completedCount / 20) * 100);
    const timeRemaining = (remainingCount * 6 / 60).toFixed(1); // ~6 min per module

    // Update progress bar + stats
    document.getElementById('progressPct').textContent = pct + '%';
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('modulesCompletedBadge').textContent = `${completedCount} of 20 modules completed`;
    document.getElementById('statCompleted').textContent = completedCount;
    document.getElementById('statRemaining').textContent = remainingCount;
    document.getElementById('statTime').textContent = remainingCount === 0 ? '0h' : `~${timeRemaining}h`;

    // Certificate banner state
    const certBanner = document.getElementById('certBanner');
    const certTitle = document.getElementById('certBannerTitle');
    const certSub = document.getElementById('certBannerSub');
    const certIcon = document.getElementById('certBannerIcon');

    if (completedCount === 20) {
      certBanner.classList.add('unlocked');
      certTitle.textContent = 'Certificate Unlocked!';
      certSub.textContent = 'All modules complete — take the final quiz to claim it';
      certIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00A878" stroke-width="2"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    // Build module grid
    modulesGrid.innerHTML = '';
    MODULES.forEach(mod => {
      const isDone = completed.includes(mod.num);
      const isActive = mod.num === activeModuleNum;
      const isLocked = !isDone && !isActive;

      const card = document.createElement('div');
      card.className = `module-card ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`;

      let statusIcon = '';
      if (isDone) {
        statusIcon = `<div class="module-status-icon done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
      } else if (isActive) {
        statusIcon = `<div class="module-status-icon active"><svg width="16" height="16" viewBox="0 0 24 24" fill="#1A2744"><path d="M8 5v14l11-7z"/></svg></div>`;
      } else {
        statusIcon = `<div class="module-status-icon locked"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>`;
      }

      card.innerHTML = `
        <div class="module-card-top">
          <div class="module-thumb">${mod.icon}</div>
        </div>
        ${statusIcon}
        <div class="module-name">${mod.name}</div>
        <span class="module-tag">Module ${mod.num}</span>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          window.location.href = `module.html?id=${mod.num}`;
        });
      }

      modulesGrid.appendChild(card);
    });

    // Continue banner
    const continueBanner = document.getElementById('continueBanner');
    const continueSub = document.getElementById('continueSub');
    const continueBtn = document.getElementById('continueBtn');

    if (activeModuleNum) {
      const activeMod = MODULES.find(m => m.num === activeModuleNum);
      continueSub.textContent = `Resume Module ${activeMod.num}: ${activeMod.name}`;
      continueBtn.href = `module.html?id=${activeMod.num}`;
      continueBanner.style.display = 'flex';
    } else {
      continueBanner.style.display = 'none';
    }
  }

  renderDashboard();
}
