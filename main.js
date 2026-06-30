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
    { num: 1,  name: "Introduction to Cybersecurity",  icon: "fi fi-tr-shield-check" },
    { num: 2,  name: "Recognizing Phishing Attacks",   icon: "fi fi-tr-hook" },
    { num: 3,  name: "Email Security Best Practices",  icon: "fi fi-tr-envelope-shield" },
    { num: 4,  name: "Strong Password Creation",       icon: "fi fi-tr-key" },
    { num: 5,  name: "Password Managers",              icon: "fi fi-tr-padlock-check" },
    { num: 6,  name: "Two-Factor Authentication",      icon: "fi fi-ts-user-unlock" },
    { num: 7,  name: "Social Engineering Tactics",     icon: "fi fi-tr-user-secret" },
    { num: 8,  name: "Protecting Personal Data",       icon: "fi fi-tr-shield-keyhole" },
    { num: 9,  name: "Ransomware Prevention",          icon: "fi fi-tr-skull" },
    { num: 10, name: "Malware Detection",              icon: "fi fi-tr-virus" },
    { num: 11, name: "Safe Web Browsing",               icon: "fi fi-tr-globe-shield" },
    { num: 12, name: "Public WiFi Security",            icon: "fi fi-tr-wifi-exclamation" },
    { num: 13, name: "Mobile Device Security",          icon: "fi fi-tr-mobile-notch" },
    { num: 14, name: "Cloud Storage Safety",            icon: "fi fi-tr-cloud-shield" },
    { num: 15, name: "Data Backup Strategies",          icon: "fi fi-tr-database" },
    { num: 16, name: "Physical Security",               icon: "fi fi-tr-lock" },
    { num: 17, name: "Incident Reporting",              icon: "fi fi-tr-megaphone" },
    { num: 18, name: "Privacy & Compliance",             icon: "fi fi-ts-compliance-document" },
    { num: 19, name: "Advanced Threats",                icon: "fi fi-tr-triangle-warning" },
    { num: 20, name: "Security Culture",                icon: "fi fi-tr-trophy-star" },
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
          <div class="module-thumb"><i class="${mod.icon}"></i></div>
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


// ═══════════════════════════════════════════════
// MODULE CONTENT PAGE
// ═══════════════════════════════════════════════
const moduleTitleEl = document.getElementById('moduleTitle');

if (moduleTitleEl) {

  // Module content library — each module has 1+ "pages"
  const MODULE_CONTENT = {
    1: {
      name: "Introduction to Cybersecurity",
      character: { name: "James Okafor", role: "IT Director", initials: "JO" },
      dialogue: "Welcome to e-Safe. Before we dive into specific threats, let's understand why this matters to you personally — not just to the company.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Bigger Picture",
      paragraphs: [
        "Cybersecurity isn't just an IT problem — it's everyone's responsibility. A single click on the wrong link, one reused password, or one moment of carelessness can expose an entire organization.",
        "Cissy Technologies handles sensitive client data every day. Attackers know this, and they specifically target employees — not just servers — because people are often the easiest way in."
      ],
      keyLesson: "Every employee is a security checkpoint. Your daily decisions directly affect whether an attack succeeds or fails.",
      actionHeading: "What you should remember:",
      actionSteps: [
        "Security is a shared responsibility, not just IT's job",
        "Attackers target people because it's often easier than breaking technical defences",
        "Small daily habits make the biggest difference"
      ]
    },
    7: {
      name: "Social Engineering Tactics",
      character: { name: "Sarah Martinez", role: "Finance Manager", initials: "SM" },
      dialogue: "Hi, this is Tom from IT Support. We've detected unusual activity on your account and need to verify your identity. Can you confirm your employee ID and the last 4 digits of your phone number?",
      scenarioTag: "Scenario",
      scenarioTitle: "The Phone Call",
      paragraphs: [
        "Sarah receives a call from someone claiming to be from the IT department. The caller sounds professional and knows her name, department, and even mentions a recent company-wide email about security updates.",
        "The caller explains that they need to \"verify her identity\" before they can fix the security issue on her account. They ask for her employee ID and personal information.",
        "Sarah feels uncertain. The caller seems legitimate, but something feels off about being asked for personal information over the phone..."
      ],
      keyLesson: "Legitimate IT support will never ask you to verify your identity by providing sensitive information over the phone. Always verify the caller's identity through official channels before sharing any information.",
      actionHeading: "What Sarah should do:",
      actionSteps: [
        "Politely end the call and don't provide any information",
        "Contact IT support directly using the official company directory",
        "Report the suspicious call to the security team"
      ]
    }
  };

  // Generic fallback content generator for modules without custom content yet
  function getGenericContent(modNum, modName) {
    return {
      name: modName,
      character: { name: "Alex Chen", role: "Operations Lead", initials: "AC" },
      dialogue: `Let's walk through a real situation involving ${modName.toLowerCase()}.`,
      scenarioTag: "Scenario",
      scenarioTitle: "A Closer Look",
      paragraphs: [
        `This module covers ${modName.toLowerCase()} — a topic that affects everyone at Cissy Technologies, regardless of role or department.`,
        "Understanding the risks and the right response is the first step toward building a safer workplace for everyone."
      ],
      keyLesson: `Stay alert and follow Cissy Technologies' official procedures whenever ${modName.toLowerCase()} is involved.`,
      actionHeading: "What you should do:",
      actionSteps: [
        "Pause before acting on anything unexpected or urgent",
        "Verify through official channels when in doubt",
        "Report anything suspicious to the security team"
      ]
    };
  }

  const MODULE_NAMES = {
    1: "Introduction to Cybersecurity", 2: "Recognizing Phishing Attacks", 3: "Email Security Best Practices",
    4: "Strong Password Creation", 5: "Password Managers", 6: "Two-Factor Authentication",
    7: "Social Engineering Tactics", 8: "Protecting Personal Data", 9: "Ransomware Prevention",
    10: "Malware Detection", 11: "Safe Web Browsing", 12: "Public WiFi Security",
    13: "Mobile Device Security", 14: "Cloud Storage Safety", 15: "Data Backup Strategies",
    16: "Physical Security", 17: "Incident Reporting", 18: "Privacy & Compliance",
    19: "Advanced Threats", 20: "Security Culture"
  };

  // Get module ID from URL, e.g. module.html?id=7
  const urlParams = new URLSearchParams(window.location.search);
  const modId = parseInt(urlParams.get('id')) || 1;
  const modName = MODULE_NAMES[modId] || `Module ${modId}`;
  const content = MODULE_CONTENT[modId] || getGenericContent(modId, modName);

  // Populate the page
  document.getElementById('moduleTitle').textContent = content.name;
  document.getElementById('moduleBadge').textContent = `Module ${modId} of 20`;
  document.getElementById('charAvatar').textContent = content.character.initials;
  document.getElementById('charName').textContent = content.character.name;
  document.getElementById('charRole').textContent = content.character.role;
  document.getElementById('dialogueText').textContent = `"${content.dialogue}"`;
  document.getElementById('scenarioTitle').textContent = content.scenarioTitle;
  document.getElementById('keyLessonText').textContent = content.keyLesson;
  document.getElementById('actionStepsHeading').textContent = content.actionHeading;

  // Render scenario paragraphs
  const scenarioBody = document.getElementById('scenarioBody');
  scenarioBody.innerHTML = content.paragraphs.map(p => `<p>${p}</p>`).join('');

  // Render action steps
  const actionList = document.getElementById('actionStepsList');
  actionList.innerHTML = content.actionSteps.map((step, i) => `
    <li>
      <span class="step-num-box">${i + 1}</span>
      <span>${step}</span>
    </li>
  `).join('');

  // Set module progress bar (single page module for now — 100% on load)
  document.getElementById('modProgressPct').textContent = '100%';
  document.getElementById('modProgressFill').style.width = '100%';

  // User avatar in navbar
  const moduleUserRaw = localStorage.getItem('esafe_user');
  const moduleUser = moduleUserRaw ? JSON.parse(moduleUserRaw) : { fullName: "Guest" };
  const modInitials = moduleUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const modAvatarEl = document.getElementById('userAvatar');
  if (modAvatarEl) modAvatarEl.textContent = modInitials || 'U';

  // Continue button — marks module complete and returns to dashboard
  document.getElementById('moduleContinueBtn').addEventListener('click', () => {
    let completedModules = JSON.parse(localStorage.getItem('esafe_completed_modules') || '[]');
    if (!completedModules.includes(modId)) {
      completedModules.push(modId);
      localStorage.setItem('esafe_completed_modules', JSON.stringify(completedModules));
    }
    window.location.href = 'dashboard.html';
  });
}
