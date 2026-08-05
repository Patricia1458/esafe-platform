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


// ══════════════════════════════════════════════
// SECURITY UTILITIES
// ══════════════════════════════════════════════

function sanitise(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, 200);
}

function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email) && email.length <= 254;
}

function isValidName(name) {
  const pattern = /^[a-zA-Z\s'\-\.]{2,100}$/;
  return pattern.test(name.trim());
}

function isValidPassword(pw) {
  return typeof pw === "string" && pw.length >= 8;
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

// Show a banner on signin.html if we were redirected here with a message
// (e.g. registration hit an email that already exists).
(function showSigninBanner() {
  const banner = document.getElementById('signinBanner');
  if (!banner) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('msg') === 'duplicate') {
    const textEl = document.getElementById('signinBannerText');
    if (textEl) textEl.textContent = 'This email is already registered. Please sign in.';
    banner.style.display = 'flex';
  }
})();


// ══════════════════════════════════════════════
// AUTH STATE — single source of truth for every page.
// `auth`, `db`, and `ADMIN_EMAIL` come from firebase-config.js, which
// every page that needs them loads before this file.
// ══════════════════════════════════════════════

const PROTECTED_BODY_CLASSES = [
  'dashboard-body', 'module-body', 'quiz-body', 'results-body',
  'cert-page-body', 'profile-body', 'admin-body', 'resources-body'
];

function isProtectedPage() {
  return PROTECTED_BODY_CLASSES.some(c => document.body.classList.contains(c));
}

if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      if (isProtectedPage()) {
        window.location.replace('signin.html');
      }
      return;
    }

    // Signed in — wire up every sign-out button on this page.
    document.querySelectorAll('#signOutBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().finally(() => {
          localStorage.clear();
          window.location.href = 'signin.html';
        });
      });
    });

    if (!isProtectedPage()) return;

    try {
      const snap = await db.collection('employees').doc(user.uid).get();
      if (!snap.exists) {
        // No Firestore profile for this account — the registration write
        // must have failed partway. Send them back to create one properly
        // rather than rendering a page with no data.
        await auth.signOut();
        window.location.replace('register.html');
        return;
      }

      const employee = { uid: user.uid, ...snap.data() };

      if (document.body.classList.contains('cert-page-body') && !employee.finalQuizPassed) {
        window.location.replace('dashboard.html');
        return;
      }
      if (document.body.classList.contains('quiz-body') && (employee.completedModules || []).length < 10) {
        window.location.replace('dashboard.html');
        return;
      }
      if (document.body.classList.contains('admin-body') && employee.email !== ADMIN_EMAIL) {
        window.location.replace('dashboard.html');
        return;
      }

      initProtectedPage(employee);
    } catch (err) {
      console.error('Failed to load employee profile:', err);
    }
  });
}

function initProtectedPage(employee) {
  setNavAvatar(employee);
  addAdminNavLink(employee);

  if (document.getElementById('modulesGrid'))   initDashboard(employee);
  if (document.getElementById('moduleTitle'))   initModulePage(employee);
  if (document.getElementById('quizIntro'))     initFinalQuiz(employee);
  if (document.getElementById('resultsHero'))   initResultsPage(employee);
  if (document.getElementById('certDoc'))       initCertificatePage(employee);
  if (document.getElementById('profileCard'))   initProfilePage(employee);
  if (document.getElementById('adminTable'))    initAdminPage(employee);
  if (document.getElementById('quickRefList'))  initResourcesPage(employee);
}

function setNavAvatar(employee) {
  const initials = (employee.fullName || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.querySelectorAll('#userAvatar').forEach(el => { el.textContent = initials || 'U'; });
}

function addAdminNavLink(employee) {
  if (employee.email !== ADMIN_EMAIL) return;
  document.querySelectorAll('.nav-links').forEach(navLinksEl => {
    if (navLinksEl.querySelector('#adminNavLink')) return;
    const a = document.createElement('a');
    a.href = 'admin.html';
    a.id = 'adminNavLink';
    a.className = 'nav-link';
    a.textContent = 'Admin';
    const signOutEl = navLinksEl.querySelector('#signOutBtn');
    if (signOutEl) navLinksEl.insertBefore(a, signOutEl);
    else navLinksEl.appendChild(a);
  });
}


// ══════════════════════════════════════════════
// REGISTER FORM — creates the Firebase Auth account
// and the matching Firestore employee document.
// Firebase Auth itself guarantees emails are unique per project, so a
// duplicate signup always surfaces as auth/email-already-in-use — we
// send that case straight to signin.html rather than showing an inline
// error, per the required flow.
// ══════════════════════════════════════════════
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName    = document.getElementById('fullName');
    const workEmail   = document.getElementById('workEmail');
    const password    = document.getElementById('registerPassword');
    const department  = document.getElementById('department');
    const submitBtn   = registerForm.querySelector('button[type="submit"]');
    const formErrorEl = document.getElementById('registerFormError');

    formErrorEl.classList.remove('show');

    let isValid = true;

    if (!isValidName(fullName.value)) {
      showError(fullName, 'fullNameError');
      isValid = false;
    } else {
      clearError(fullName, 'fullNameError');
    }

    if (!isValidEmail(workEmail.value.trim())) {
      showError(workEmail, 'workEmailError');
      isValid = false;
    } else {
      clearError(workEmail, 'workEmailError');
    }

    if (!isValidPassword(password.value)) {
      showError(password, 'registerPasswordError');
      isValid = false;
    } else {
      clearError(password, 'registerPasswordError');
    }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const cred = await auth.createUserWithEmailAndPassword(workEmail.value.trim(), password.value);
      await db.collection('employees').doc(cred.user.uid).set({
        fullName: sanitise(fullName.value),
        email: sanitise(workEmail.value.trim()),
        department: sanitise(department.value) || 'Not specified',
        registeredAt: new Date().toISOString(),
        completedModules: [],
        finalQuizScore: null,
        finalQuizPassed: false,
        certificateIssued: false
      });

      showToast('Account created! Redirecting...');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } catch (err) {
      if (err && err.code === 'auth/email-already-in-use') {
        window.location.href = 'signin.html?msg=duplicate';
        return;
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Begin Training';

      let msg = 'Something went wrong. Please try again.';
      if (err && err.code === 'auth/weak-password') msg = 'Password is too weak — use at least 8 characters.';
      else if (err && err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';

      formErrorEl.textContent = msg;
      formErrorEl.classList.add('show');
    }
  });
}


// ══════════════════════════════════════════════
// SIGN IN FORM — admin@cissytechnologies.com (ADMIN_EMAIL) lands on
// admin.html, every other account lands on dashboard.html.
// ══════════════════════════════════════════════
const signinForm = document.getElementById('signinForm');

if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email       = document.getElementById('signinEmail');
    const password    = document.getElementById('signinPassword');
    const submitBtn   = document.getElementById('signinSubmitBtn');
    const formErrorEl = document.getElementById('signinFormError');

    formErrorEl.classList.remove('show');

    let isValid = true;

    if (!isValidEmail(email.value.trim())) {
      showError(email, 'signinEmailError');
      isValid = false;
    } else {
      clearError(email, 'signinEmailError');
    }

    if (!password.value) {
      showError(password, 'signinPasswordError');
      isValid = false;
    } else {
      clearError(password, 'signinPasswordError');
    }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      const cred = await auth.signInWithEmailAndPassword(email.value.trim(), password.value);
      window.location.href = (cred.user.email === ADMIN_EMAIL) ? 'admin.html' : 'dashboard.html';
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';

      let msg = 'Something went wrong. Please try again.';
      if (err && ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'].includes(err.code)) {
        msg = 'Incorrect email or password.';
      } else if (err && err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment and try again.';
      }

      formErrorEl.textContent = msg;
      formErrorEl.classList.add('show');
    }
  });
}


// ══════════════════════════════════════════════
// DASHBOARD — 10 modules
// ══════════════════════════════════════════════
const DASH_MODULES = [
  { num: 1,  name: "Social Threats",              icon: "fi fi-tr-shield-exclamation",  desc: "Phishing, social engineering, vishing & smishing" },
  { num: 2,  name: "Credentials & Access",        icon: "fi fi-tr-lock",                desc: "Passwords, password managers & two-factor authentication" },
  { num: 3,  name: "Malware & Attacks",           icon: "fi fi-tr-virus",               desc: "Ransomware, trojans, USB risks & man-in-the-middle" },
  { num: 4,  name: "Safe Habits & Devices",       icon: "fi fi-tr-globe-shield",        desc: "Safe browsing, public WiFi, device security & updates" },
  { num: 5,  name: "Data & Compliance",           icon: "fi fi-ts-compliance-document", desc: "Data privacy, cloud storage, incident reporting & compliance" },
  { num: 6,  name: "Insider Threats",             icon: "fi fi-tr-user-slash",          desc: "Access misuse, departing employees & least privilege" },
  { num: 7,  name: "Remote Work Security",        icon: "fi fi-tr-house-laptop",        desc: "Home networks, VPNs, public spaces & video call security" },
  { num: 8,  name: "Mobile Device Security",      icon: "fi fi-tr-mobile-notch",        desc: "Device locking, app permissions & lost device response" },
  { num: 9,  name: "Cloud Security & Shadow IT",  icon: "fi fi-tr-cloud",               desc: "Approved tools, unauthorised apps & data leakage" },
  { num: 10, name: "Security Culture & Reporting",icon: "fi fi-tr-megaphone",           desc: "Speaking up, shared responsibility & incident reporting" },
];

function initDashboard(employee) {
  const modulesGrid = document.getElementById('modulesGrid');
  if (!modulesGrid) return;

  const firstName = (employee.fullName || 'Learner').split(' ')[0];
  document.getElementById('welcomeTitle').textContent = `Welcome back, ${firstName}!`;

  function isDoneAny(completed) { return completed.length > 0; }

  function renderDashboard() {
    const completed = employee.completedModules || [];
    const completedCount = completed.length;
    const remainingCount = 10 - completedCount;
    const pct = Math.round((completedCount / 10) * 100);
    const allDone = completedCount === 10;
    const quizPassed = !!employee.finalQuizPassed;

    // Progress bar
    document.getElementById('progressPct').textContent = pct + '%';
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('welcomeBadge').textContent = `${completedCount} of 10 modules completed`;
    document.getElementById('statCompleted').textContent = completedCount;
    document.getElementById('statRemaining').textContent = remainingCount;
    document.getElementById('statTime').textContent = remainingCount === 0 ? '0h' : `~${(remainingCount * 0.5).toFixed(1)}h`;

    // Certificate / quiz banner
    const certBanner = document.getElementById('certBanner');
    const certTitle = document.getElementById('certBannerTitle');
    const certSub = document.getElementById('certBannerSub');
    const certAction = document.getElementById('certBannerAction');
    const certIconEl = document.getElementById('certBannerIconEl');

    if (quizPassed) {
      certBanner.classList.add('unlocked');
      certTitle.textContent = 'Certificate Unlocked!';
      certSub.textContent = 'Congratulations — download your official certificate';
      certIconEl.className = 'fi fi-tr-check-circle';
      certIconEl.style.color = '#1D9E75';
      certAction.innerHTML = '<a href="certificate.html" class="btn-primary" style="padding:10px 20px">Get certificate</a>';
    } else if (allDone) {
      certBanner.style.background = '#E6F4FF';
      certTitle.textContent = 'All modules complete — take the final quiz!';
      certSub.textContent = 'Pass 100 questions at 70% to earn your certificate';
      certIconEl.className = 'fi fi-tr-document-signed';
      certAction.innerHTML = '<a href="quiz.html" class="btn-primary" style="padding:10px 20px">Start final quiz</a>';
    } else {
      certTitle.textContent = 'Certificate Locked';
      certSub.textContent = 'Complete all 10 modules and pass the final quiz to unlock';
    }

    // Module grid
    modulesGrid.innerHTML = '';
    DASH_MODULES.forEach(mod => {
      const isDone = completed.includes(mod.num);
      const nextNum = DASH_MODULES.find(m => !completed.includes(m.num))?.num;
      const isActive = mod.num === nextNum;
      const isLocked = !isDone && !isActive;

      const card = document.createElement('div');
      card.className = `module-card ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`;

      let statusIcon = '';
      if (isDone) {
        statusIcon = `<div class="module-status-icon done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
      } else if (isActive) {
        statusIcon = `<div class="module-status-icon active"><i class="fi fi-tr-play" style="font-size:13px;color:var(--navy)"></i></div>`;
      } else {
        statusIcon = `<div class="module-status-icon locked"><i class="fi fi-tr-lock" style="font-size:13px;color:#9CA3AF"></i></div>`;
      }

      card.innerHTML = `
        <div class="module-thumb"><i class="${mod.icon}"></i></div>
        ${statusIcon}
        <div class="module-name">${mod.name}</div>
        <div class="module-desc">${mod.desc}</div>
        <span class="module-tag">Module ${mod.num}</span>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          window.location.href = `module.html?id=${mod.num}`;
        });
      }

      modulesGrid.appendChild(card);
    });

    // Continue / final quiz sticky banner
    const banner = document.getElementById('continueBanner');
    const continueTitle = document.getElementById('continueTitle');
    const continueSub = document.getElementById('continueSub');
    const continueBtn = document.getElementById('continueBtn');

    if (allDone && !quizPassed) {
      continueTitle.textContent = 'All modules complete!';
      continueSub.textContent = 'Take the final quiz to earn your certificate';
      continueBtn.textContent = 'Start final quiz';
      continueBtn.href = 'quiz.html';
      banner.style.display = 'flex';
    } else if (quizPassed) {
      banner.style.display = 'none';
    } else {
      const next = DASH_MODULES.find(m => !completed.includes(m.num));
      if (next) {
        continueTitle.textContent = 'Ready to continue?';
        continueSub.textContent = `${isDoneAny(completed) ? 'Resume' : 'Start'} Module ${next.num}: ${next.name}`;
        continueBtn.textContent = 'Continue';
        continueBtn.href = `module.html?id=${next.num}`;
        banner.style.display = 'flex';
      }
    }
  }

  renderDashboard();
}


// ══════════════════════════════════════════════
// FINAL QUIZ DATA — 100 QUESTIONS (10 per module)
// ══════════════════════════════════════════════
const QUIZ_QUESTIONS = [
  // ── Module 1 — Social Threats ──
  { id:1, module:1, question:"Who is ultimately responsible for cybersecurity at Cissy Technologies?", options:["Only the IT department","Only senior management","Every employee in the organisation","Only staff with system access"], correct:2, explanation:"Cybersecurity is a shared responsibility — every employee's daily choices affect the organisation's security." },
  { id:2, module:1, question:"Why do attackers frequently target employees rather than only technical systems?", options:["Employees are easier to find online","People are often the easiest way into an organisation","Technical systems are too costly to attack","Employees always have admin rights"], correct:1, explanation:"Human error is often easier to exploit than breaking through technical defences." },
  { id:3, module:1, question:"David received an email from 'security@yourbank-support.co'. What made this phishing?", options:["It used a friendly greeting","The sender domain did not match the bank's real domain","It was sent during business hours","It had no attachments"], correct:1, explanation:"The look-alike domain is the clearest technical proof of phishing." },
  { id:4, module:1, question:"A caller who knows your name, department, and a recent company email is likely using which technique?", options:["Phishing","Pretexting","Baiting","Typosquatting"], correct:1, explanation:"Pretexting uses researched details to build a convincing false identity." },
  { id:5, module:1, question:"Ruth received a text about her salary being on hold with a link to a fake domain. What made this dangerous?", options:["It was sent late at night","It combined manufactured urgency with a fake link","It came from a known number","It contained no spelling errors"], correct:1, explanation:"Smishing relies on urgency and a fake link pushing you to act before you verify." },
  { id:6, module:1, question:"What pattern is shared by phishing, vishing, and smishing?", options:["They all require malware","They all use urgency, false authority, and a fake link or identity","They only target senior staff","They all happen over email"], correct:1, explanation:"All three channels use the same psychological formula regardless of delivery method." },
  { id:7, module:1, question:"You get an urgent request from someone claiming to be a senior executive. What should you do first?", options:["Comply immediately to avoid delay","Verify the sender through a separate, known channel","Forward it to a colleague to decide","Reply asking for more details"], correct:1, explanation:"Verifying independently is the most reliable way to confirm legitimacy." },
  { id:8, module:1, question:"What should you never do in response to an unexpected, unsolicited message?", options:["Delete it","Report it","Share credentials or MFA codes","Ask a colleague if they got one too"], correct:2, explanation:"Credentials and MFA codes should never be shared in response to unsolicited contact." },
  { id:9, module:1, question:"Where should a suspicious email, call, or text be reported?", options:["Nowhere, unless you are certain it's real","To IT Security immediately","Only to your direct manager","To the sender, asking them to confirm"], correct:1, explanation:"IT Security should be notified immediately regardless of certainty." },
  { id:10, module:1, question:"Why is a look-alike domain such as 'cissytechnol0gies.com' effective?", options:["It uses a different top-level domain entirely","The substituted character is easy to miss at a glance","It is always blocked by browsers","It only works on mobile devices"], correct:1, explanation:"Typosquatted domains rely on visual similarity to slip past a quick glance." },

  // ── Module 2 — Credentials & Access ──
  { id:11, module:2, question:"Why is password reuse dangerous?", options:["It slows down login","A breach on one site exposes every account using the same password","It uses more memory","It is against most company style guides only"], correct:1, explanation:"Credential stuffing attacks take a breached password and try it everywhere else it might be reused." },
  { id:12, module:2, question:"What is the main benefit of a password manager?", options:["It remembers your face","It generates and stores a unique strong password per account","It removes the need for MFA","It shares passwords automatically with coworkers"], correct:1, explanation:"A password manager makes unique, strong passwords practical for every account." },
  { id:13, module:2, question:"Emmanuel's MFA blocked an attacker who had his correct password. Why?", options:["The attacker's connection was too slow","MFA requires a second factor the attacker did not possess","The password had expired","The system detected the wrong browser"], correct:1, explanation:"MFA requires something you have, like your phone, in addition to something you know." },
  { id:14, module:2, question:"A caller claims to be IT and asks for your current MFA code. What should you do?", options:["Give the first few digits only","Refuse, hang up, and report it","Provide it if they know your employee ID","Give it once, then change your password"], correct:1, explanation:"This is a real-time MFA phishing attempt — the caller is trying to complete their own login." },
  { id:15, module:2, question:"Which is the strongest password strategy?", options:["One memorable password reused everywhere","A unique password per account stored in a password manager","A password changed weekly","Your name plus your birth year"], correct:1, explanation:"Unique passwords per account, managed centrally, limit the blast radius of any single breach." },
  { id:16, module:2, question:"What is a passphrase such as 'correct-horse-battery-staple' an example of?", options:["A weak password","A long, memorable password that is harder to crack than a short complex one","A default system password","A password that bypasses MFA"], correct:1, explanation:"Length is one of the strongest factors in password security." },
  { id:17, module:2, question:"Why is an authenticator app generally safer than SMS for MFA?", options:["It requires no phone at all","It is not vulnerable to SIM-swapping attacks","It never expires","It is free while SMS costs money"], correct:1, explanation:"SMS codes can be intercepted via SIM-swapping; authenticator app codes are generated locally on the device." },
  { id:18, module:2, question:"What is credential stuffing?", options:["Manually guessing passwords one at a time","Automatically trying stolen username and password pairs across many services","Writing multiple passwords in one notebook","Sharing one login among a team"], correct:1, explanation:"Credential stuffing automates reuse of breached credentials against other services." },
  { id:19, module:2, question:"Why should MFA codes never be shared, even with someone claiming to be IT?", options:["IT never needs to help with logins","A real-time MFA phishing attack uses your code to complete an attacker's live login attempt","MFA codes are illegal to share","Codes expire before anyone could use them"], correct:1, explanation:"The caller asking for your code is very often the attacker attempting to log in right now." },
  { id:20, module:2, question:"What should you do the moment you suspect your password has been exposed in a breach?", options:["Wait to see if anything unusual happens","Change it immediately and check for reused instances elsewhere","Only change it if you get a login alert","Ignore it if MFA is enabled"], correct:1, explanation:"Immediate action limits the window an attacker has to exploit an exposed password." },

  // ── Module 3 — Malware & Attacks ──
  { id:21, module:3, question:"Brian's ransomware infection began with what action?", options:["Opening a work spreadsheet","Clicking a link in an unverified courier email","Updating his operating system","Restarting his laptop"], correct:1, explanation:"The malicious link in the fake courier email was the entry point for the ransomware." },
  { id:22, module:3, question:"What is the most effective defence against permanently losing data to ransomware?", options:["Paying the ransom quickly","Keeping regular, tested backups stored separately from the main system","Disabling your firewall","Using a longer password"], correct:1, explanation:"Separate, tested backups mean ransomware cannot hold your only copy of the data hostage." },
  { id:23, module:3, question:"What is a trojan?", options:["Malware that self-replicates across a network automatically","Malware disguised as legitimate software that performs malicious actions once installed","A type of firewall","A password recovery tool"], correct:1, explanation:"Trojans rely on the user installing them, disguised as something legitimate." },
  { id:24, module:3, question:"Stella's credentials were stolen for two weeks before detection because of what?", options:["A phishing email she clicked","A free cracked software download from an unofficial site","A weak WiFi password","An expired antivirus licence"], correct:1, explanation:"The cracked software contained a trojan that quietly exfiltrated her credentials." },
  { id:25, module:3, question:"Why is USB baiting effective?", options:["USB drives always contain viruses","It exploits human curiosity about an unknown labelled device","It requires no internet connection to work","It only affects old computers"], correct:1, explanation:"A labelled drive like 'Staff Salary' is designed to make people want to plug it in." },
  { id:26, module:3, question:"What should you do if you find an unknown USB drive?", options:["Plug it in to identify the owner","Take it home to check safely","Hand it to IT or security without plugging it into any device","Format it before use"], correct:2, explanation:"Only IT can safely examine an unknown USB device in isolation." },
  { id:27, module:3, question:"Why should you hover over a link before clicking it?", options:["It speeds up the page load","It reveals the real destination URL so you can check it matches the expected domain","It removes any tracking","It automatically scans for viruses"], correct:1, explanation:"Hovering shows the actual destination, which may differ from the displayed text." },
  { id:28, module:3, question:"What makes 'dhl-parcels-tracking.net' suspicious as a sender domain?", options:["It contains the word 'tracking'","It is not DHL's real domain — a classic look-alike used to deliver malware","It uses HTTPS","It is a .net domain"], correct:1, explanation:"The real DHL domain is dhl.com; this is a look-alike registered by attackers." },
  { id:29, module:3, question:"Why is downloading software only from official sources important?", options:["Official sources are always free","Unofficial and cracked software is one of the most common ways malware is delivered","Official sources load faster","It avoids the need for antivirus software entirely"], correct:1, explanation:"Cracked and unofficial downloads are a leading malware delivery method." },
  { id:30, module:3, question:"What should you do if your computer starts behaving unusually after opening an email attachment?", options:["Restart and continue working normally","Report it to IT immediately rather than investigating it yourself","Wait a day to see if it resolves itself","Forward the attachment to a colleague to check"], correct:1, explanation:"Immediate reporting limits how much damage a potential infection can do." },

  // ── Module 4 — Safe Habits & Devices ──
  { id:31, module:4, question:"Collins entered his credentials on a fake site found through a search result. What is this attack called?", options:["Credential stuffing","Typosquatting — a fake look-alike website","Tailgating","Baiting"], correct:1, explanation:"Typosquatted sites mimic real ones closely enough to fool a quick glance." },
  { id:32, module:4, question:"What is the safest way to reach an important work portal?", options:["Search for it each time","Type the URL directly or use a saved bookmark","Click a link from any email mentioning it","Ask a colleague to forward the link"], correct:1, explanation:"Direct entry or bookmarks avoid the risk of landing on a fake search result." },
  { id:33, module:4, question:"What does HTTPS in a URL actually confirm?", options:["The site is guaranteed legitimate","The connection is encrypted in transit, but the site itself could still be fake","The site has no malware","The site is government-approved"], correct:1, explanation:"HTTPS protects data in transit but says nothing about the site's legitimacy." },
  { id:34, module:4, question:"Why was Ruth's client proposal intercepted on airport WiFi?", options:["The airport blocked her connection","Public WiFi is typically unencrypted and shared with strangers","Her laptop had no antivirus","The file was too large to send securely"], correct:1, explanation:"Unencrypted public networks let others on the same network capture unprotected traffic." },
  { id:35, module:4, question:"What is the safest alternative to unsecured public WiFi for sensitive work tasks?", options:["Incognito browsing mode","Your phone's mobile hotspot, which is encrypted by the mobile network","Any WiFi network with a password","Turning off your firewall temporarily"], correct:1, explanation:"Mobile data is encrypted by the carrier network, unlike most public WiFi." },
  { id:36, module:4, question:"Isaac's stolen phone was immediately accessible because of what?", options:["It had a very old operating system","It had no screen lock enabled","It was connected to public WiFi","It was left in a taxi"], correct:1, explanation:"Without a screen lock, anyone who picks up the device has instant access." },
  { id:37, module:4, question:"How quickly should you report a lost or stolen work device?", options:["Within a week","Immediately, so IT can remotely lock or wipe it","Only if it contained passwords","Only after searching for it yourself first"], correct:1, explanation:"Every minute of delay increases the risk of data exposure." },
  { id:38, module:4, question:"Why is applying software updates promptly important?", options:["It changes the interface colours","Attackers actively target known vulnerabilities in outdated, unpatched software","It is only relevant for mobile devices","It has no real security benefit"], correct:1, explanation:"Patches close vulnerabilities that attackers begin exploiting as soon as they are disclosed." },
  { id:39, module:4, question:"What should you do every time you step away from your desk, even briefly?", options:["Leave your session open for convenience","Lock your screen","Close your email only","Turn off your monitor"], correct:1, explanation:"Locking your screen prevents anyone nearby from accessing your open session." },
  { id:40, module:4, question:"What combination of habits stops most opportunistic attacks according to this module?", options:["Antivirus software alone","Typing URLs directly, using a VPN on public networks, locking your screen, and keeping software updated","Only using a company-issued device","Avoiding email entirely"], correct:1, explanation:"These four daily habits together address the most common attack surfaces." },

  // ── Module 5 — Data & Compliance ──
  { id:41, module:5, question:"Why was storing a client contract on personal Google Drive a security problem for Miriam?", options:["Google Drive does not support PDFs","Personal cloud accounts lack the access controls and encryption of company-approved systems","It used too much storage space","It was against copyright law"], correct:1, explanation:"Personal accounts have none of the oversight or protections company systems have." },
  { id:42, module:5, question:"What data protection rule did the marketing team violate by reusing an old client list for a new campaign?", options:["The company's email formatting guidelines","Personal data can only be used for the purpose it was originally collected for","The email platform's terms of service","No rule was violated"], correct:1, explanation:"Using data outside its original consented purpose is a compliance violation." },
  { id:43, module:5, question:"What should you do if a client asks for their personal data to be deleted?", options:["Delete what you personally have access to","Escalate it to the compliance team to handle through the correct process","Tell them it cannot be deleted","Ignore the request unless it is repeated"], correct:1, explanation:"Deletion requests have legal weight and must go through the proper compliance process." },
  { id:44, module:5, question:"What was the consequence of Samuel waiting three days to report unusual system behaviour?", options:["No consequence — the delay did not matter","The attacker had three extra days to move through the network undetected","IT resolved it faster because they had more time","The system fixed itself"], correct:1, explanation:"Every hour of delay gives an attacker more time to spread or exfiltrate data." },
  { id:45, module:5, question:"What should you do if you are unsure whether something you noticed is a real security threat?", options:["Wait until you are certain before reporting","Report it to IT immediately regardless of certainty","Investigate it yourself first","Ask a colleague to decide for you"], correct:1, explanation:"IT would rather investigate a false alarm than miss a real threat." },
  { id:46, module:5, question:"Which of the following is an appropriate place to store company or client data?", options:["A personal email account","A company-approved system only","A personal USB drive","Whichever tool is fastest to access"], correct:1, explanation:"Only approved systems have the required access controls and oversight." },
  { id:47, module:5, question:"What is the principle behind only using data for its originally stated purpose?", options:["It saves storage space","It respects the consent under which the data was collected","It makes reports easier to write","It is optional for internal use"], correct:1, explanation:"Data protection law ties permitted use to the original consented purpose." },
  { id:48, module:5, question:"How often should important work files be backed up?", options:["Once a year","Regularly — at least weekly or whenever significant work is completed","Only before a holiday","Backups are unnecessary if using cloud storage"], correct:1, explanation:"Frequent backups minimise how much work could be lost in a failure." },
  { id:49, module:5, question:"Why must incident reports be documented with time and details, not just mentioned verbally?", options:["It is a formality with no real value","Clear documentation helps IT respond accurately and quickly","It slows down the response unnecessarily","Only major incidents need documentation"], correct:1, explanation:"Specific details let IT act quickly and accurately on a report." },
  { id:50, module:5, question:"What is the overall message of the Data & Compliance module?", options:["Data rules only matter for the compliance department","Data must be stored properly, used only for its intended purpose, and incidents reported immediately","Data protection is optional if the company is small","Compliance is only relevant during audits"], correct:1, explanation:"These three principles — proper storage, purpose limitation, and prompt reporting — anchor data compliance." },

  // ── Module 6 — Insider Threats ──
  { id:51, module:6, question:"Why was it possible for the departing employee to download 12,000 files on his last night?", options:["His manager approved it","His access was never revoked or reduced during his notice period","He used a stolen password","IT gave him temporary elevated access"], correct:1, explanation:"His account retained its full standard access for the entire notice period." },
  { id:52, module:6, question:"What is the principle of least privilege?", options:["Giving every employee the same baseline access","Giving people access only to what their specific role requires, nothing more","Giving managers unrestricted access to all systems","Reviewing access once per year"], correct:1, explanation:"Least privilege limits the damage any single compromised or departing account can do." },
  { id:53, module:6, question:"A colleague noticed unusual file activity but waited three days to report it because she didn't want to seem paranoid. What was the consequence?", options:["None — the files were already backed up","By the time she reported it, the data had already left the building","IT caught it anyway through routine monitoring","Nothing, since insider threats are rare"], correct:1, explanation:"The delay meant the exfiltration was already complete by the time anyone acted." },
  { id:54, module:6, question:"When should an employee's access be reduced after they resign?", options:["Only on their literal last day","As soon as the departure is confirmed, not held until the final day","Only if they are being terminated for misconduct","Access should never be changed during a notice period"], correct:1, explanation:"Waiting until the last day leaves a wide, unnecessary window of full access." },
  { id:55, module:6, question:"What should you do if a colleague is accessing files that seem outside their normal role, even if you're not sure it's malicious?", options:["Say nothing since you might be wrong","Confront them directly yourself","Report it — reporting is about protecting the company, not accusing a colleague","Wait to see if it happens again before saying anything"], correct:2, explanation:"Reporting isn't an accusation — it flags something for someone qualified to assess." },
  { id:56, module:6, question:"What is an insider threat?", options:["Always a malicious external hacker","A security risk originating from someone with legitimate access, such as a current or former employee","A type of firewall","A virus that only affects internal networks"], correct:1, explanation:"Insider threats come from people who already have legitimate access." },
  { id:57, module:6, question:"Why is it risky to keep an employee's full access active throughout their entire notice period?", options:["It is not risky at all","It leaves a window where a departing employee retains access they may misuse","It slows down their final tasks","It violates copyright law"], correct:1, explanation:"The notice period is exactly when an employee is most likely to have reason to misuse access." },
  { id:58, module:6, question:"What should a manager do as soon as an employee's departure is confirmed?", options:["Wait until the last day to make any changes","Notify IT so access can be reviewed and reduced appropriately","Increase the employee's access to finish projects","Do nothing differently"], correct:1, explanation:"Early notification lets IT manage the access risk proactively." },
  { id:59, module:6, question:"Why might a colleague hesitate to report unusual file access by another employee?", options:["They assume it is always authorised","They worry about being wrong or getting someone in trouble","They are legally prevented from reporting","Reporting is not part of anyone's job"], correct:1, explanation:"This exact hesitation is what let the incident continue undetected." },
  { id:60, module:6, question:"What is the best response to noticing a colleague accessing files outside their normal role?", options:["Say nothing unless you are certain something is wrong","Report it — reporting is not an accusation, it is sharing information for proper review","Confront the colleague directly and demand an explanation","Wait for someone else to notice too"], correct:1, explanation:"Reporting hands the decision to people equipped to properly evaluate it." },

  // ── Module 7 — Remote Work Security ──
  { id:61, module:7, question:"Miriam joined a confidential call from a coffee shop without a VPN. What is the primary risk of unsecured public WiFi?", options:["It is slower than home internet","Data travelling over the network can potentially be intercepted by others on the same network","Public WiFi always contains a virus","It only affects video quality"], correct:1, explanation:"Unencrypted public networks let others nearby capture unprotected traffic." },
  { id:62, module:7, question:"What made Miriam's screen a risk during the call, separate from the network issue?", options:["Her laptop battery was low","The screen faced the room, so anyone nearby could see confidential contract terms","She was using the wrong video app","Her camera resolution was too high"], correct:1, explanation:"Physical visibility is its own risk, independent of network security." },
  { id:63, module:7, question:"Why does a virtual background matter for confidential video calls?", options:["It looks more professional","It prevents visible items in your surroundings — like labelled documents — from being seen by other participants","It improves your internet speed","It is required by law"], correct:1, explanation:"A visible background can accidentally expose real information to call participants." },
  { id:64, module:7, question:"What is the purpose of a meeting waiting room?", options:["To make participants wait for no reason","To ensure no one can join a confidential call before the host is ready and has verified attendees","To improve call video quality","To automatically record the meeting"], correct:1, explanation:"A waiting room gives the host control over exactly who enters a call and when." },
  { id:65, module:7, question:"What is the best overall habit for handling confidential work outside the office?", options:["Avoid remote work entirely","Treat public and home spaces as lower-trust environments and apply VPN, screen privacy, and call hygiene by default","Only worry about security if you notice something suspicious","Use your personal phone hotspot instead of WiFi"], correct:1, explanation:"Building these protections into your default routine closes the gap public and home spaces create." },
  { id:66, module:7, question:"What should you do before accessing work systems on any network you do not control?", options:["Nothing extra is needed","Connect through the company VPN","Turn off your firewall","Use a different browser"], correct:1, explanation:"A VPN encrypts your connection on networks you don't control." },
  { id:67, module:7, question:"Why is securing your home WiFi relevant to work security?", options:["It is not relevant, it only affects personal use","Home WiFi is an entry point to your devices and any work data on them","It only affects streaming quality","Home networks are always secure by default"], correct:1, explanation:"An insecure home network can expose devices that also hold work data." },
  { id:68, module:7, question:"What is one way to reduce visible information during a video call with confidential content?", options:["Turn off your camera entirely, always","Use a virtual background so your real surroundings are not visible","Sit closer to the camera","Mute your microphone only"], correct:1, explanation:"A virtual background hides potentially sensitive surroundings without disabling video." },
  { id:69, module:7, question:"What should you do if a confidential call is about to start and you are in a public place?", options:["Join anyway and hope no one is listening","Postpone briefly if possible, or move somewhere private before joining","Turn your screen brightness down only","Use headphones and continue as normal"], correct:1, explanation:"A short delay to find a private space is safer than exposing confidential content in public." },
  { id:70, module:7, question:"What is the underlying theme of remote work security in this module?", options:["Remote work should be avoided entirely","Public and home spaces should be treated as lower-trust environments requiring the same protections as the office","Only the IT department needs to worry about remote security","VPNs are optional if you trust the network"], correct:1, explanation:"Remote environments need the same default protections the office provides, applied deliberately." },

  // ── Module 8 — Mobile Device Security ──
  { id:71, module:8, question:"Why should a flashlight app requesting access to contacts, camera, microphone, and location be considered suspicious?", options:["All apps need these permissions to run","None of those permissions are needed for a flashlight app to function — turning on an LED requires no such access","Flashlight apps are always malware","Permissions do not matter on mobile devices"], correct:1, explanation:"A mismatch between requested permissions and app function is a major red flag." },
  { id:72, module:8, question:"How did client data end up in a competitor's pitch in this scenario?", options:["Isaac emailed it accidentally","The flashlight app harvested data from his phone using permissions it did not need","A colleague leaked it deliberately","The client shared it directly with the competitor"], correct:1, explanation:"The app used broad permissions granted at install to quietly harvest and transmit data." },
  { id:73, module:8, question:"What is the safest source for downloading mobile apps for work-related use?", options:["Any website offering a free download","Links shared in unsolicited text messages","Official app stores such as the platform's official app marketplace","Forums recommending free alternatives"], correct:2, explanation:"Official app stores have review processes that catch much malicious behaviour that third-party sites do not." },
  { id:74, module:8, question:"Why is remote wipe capability important on a device holding work data?", options:["It improves battery life","It allows IT to erase sensitive data if the device is lost or stolen, preventing unauthorised access","It speeds up app downloads","It is only useful for company-owned devices"], correct:1, explanation:"Remote wipe prevents a lost device from becoming an ongoing data exposure." },
  { id:75, module:8, question:"What should you do the moment you realise your work phone is lost or stolen?", options:["Wait a day to see if it turns up","Report it to IT immediately so it can be remotely locked or wiped","Only report it if it contained sensitive files","Change your email password and take no other action"], correct:1, explanation:"Immediate reporting gives IT the best chance to lock or wipe the device before data is accessed." },
  { id:76, module:8, question:"What permissions should a simple flashlight app reasonably need?", options:["Contacts, camera, microphone, and location","None of those — turning on an LED requires no special access","Only camera access","Only location access"], correct:1, explanation:"A flashlight app has no legitimate need for any of those permissions." },
  { id:77, module:8, question:"What is one sign that a mobile app may be malicious?", options:["It has a colourful icon","It requests permissions far beyond what its function requires","It is free to download","It has many reviews"], correct:1, explanation:"Excessive, mismatched permission requests are one of the clearest warning signs." },
  { id:78, module:8, question:"What should you do with app permissions after installation, not just at install time?", options:["Never revisit them","Periodically review and revoke unnecessary permissions","Grant any additional permission an app requests later","Only review them if the app crashes"], correct:1, explanation:"Regularly reviewing permissions catches apps that quietly request more access over time." },
  { id:79, module:8, question:"Why do mobile devices holding work data need the same scrutiny as a work laptop?", options:["They do not — mobile devices are inherently safer","They can access and store the same sensitive company data as a computer","Mobile devices cannot be hacked","Only laptops are covered by company security policy"], correct:1, explanation:"A phone holding work email, contacts, or files is just as much a target as a laptop." },
  { id:80, module:8, question:"What is the fastest way to limit damage from a lost work phone?", options:["Hope it is returned by a stranger","Have remote wipe enabled and report the loss to IT immediately","Wait for a new SIM card","Post about the loss on social media"], correct:1, explanation:"Remote wipe combined with immediate reporting is the fastest way to prevent data exposure." },

  // ── Module 9 — Cloud Security & Shadow IT ──
  { id:81, module:9, question:"Why did Stella's team start using the unapproved app?", options:["IT recommended it","The approved system felt too slow for large client assets, so the team found a faster workaround","It was required by a client","The app was free and had better branding"], correct:1, explanation:"A real productivity frustration led the team to adopt a tool without IT approval." },
  { id:82, module:9, question:"What is shadow IT?", options:["Any software with a dark mode","Technology used for work without approval or oversight from IT","A type of malware","An IT department's backup infrastructure"], correct:1, explanation:"Shadow IT specifically refers to tools adopted outside IT's knowledge or approval." },
  { id:83, module:9, question:"Why didn't IT respond when the unapproved app was breached?", options:["They chose not to respond","They had no idea the tool was being used to store client data, since it was never approved or disclosed","The breach did not affect the company","IT does not respond to any third-party breaches"], correct:1, explanation:"Because the tool was never disclosed, IT had no visibility to act on until it was too late." },
  { id:84, module:9, question:"What should you do instead of adopting an unapproved tool to solve a workflow problem?", options:["Use it quietly and hope it goes unnoticed","Request a solution or new tool through IT","Ask a client if it is acceptable","Use it only for non-client work"], correct:1, explanation:"Going through IT keeps the choice within a process that includes a security review." },
  { id:85, module:9, question:"What is the risk of uploading brand assets or contracts to a personal cloud account?", options:["There is no risk if the account has a strong password","Personal accounts lack the access controls, monitoring, and review that company-approved systems have","Personal accounts have unlimited storage so it is more efficient","It is only a risk for very large files"], correct:1, explanation:"Personal accounts fall completely outside company security oversight." },
  { id:86, module:9, question:"What should you do if you realise your team has already been using an unapproved tool for work data?", options:["Stop using it and say nothing further","Tell IT so they can assess any exposure and take appropriate action","Delete the account and consider the matter closed","Wait to see if a breach actually happens first"], correct:1, explanation:"Only IT can properly assess what data may already be at risk and respond appropriately." },
  { id:87, module:9, question:"What made the unapproved project management app risky, beyond the eventual breach?", options:["It was too expensive","It had no security review or IT oversight before client data was uploaded to it","It was difficult to use","It required a company email to sign up"], correct:1, explanation:"The lack of any security review meant risk was present from the very first upload." },
  { id:88, module:9, question:"Why is it important to ask IT before adopting any new app or service, even a free one?", options:["Free tools are always dangerous","It ensures the tool receives a security review before company data touches it","It slows down adoption unnecessarily","IT charges a fee for every new tool"], correct:1, explanation:"A quick check before adoption prevents the exact scenario that unfolded with Stella's team." },
  { id:89, module:9, question:"What eventually happened to the unapproved app's provider?", options:["It was acquired by the official vendor","It suffered a data breach exposing customer accounts, including file contents","It shut down voluntarily","It won an industry security award"], correct:1, explanation:"The breach exposed exactly the kind of data the team had uploaded without IT's knowledge." },
  { id:90, module:9, question:"What is the core lesson of the Cloud Security & Shadow IT module?", options:["Cloud tools should never be used for any purpose","Convenience gained by bypassing IT approval can become an invisible, undetectable breach later","Only large companies need to worry about shadow IT","Free tools are always safer than paid ones"], correct:1, explanation:"The convenience of an unapproved shortcut is paid for later, often at a much higher and invisible cost." },

  // ── Module 10 — Security Culture & Reporting ──
  { id:91, module:10, question:"Why did the employee who first noticed the suspicious access stay silent?", options:["They did not notice anything unusual","They did not want to cause trouble or wrongly accuse a colleague","They were told not to report it","They assumed it was already being monitored"], correct:1, explanation:"Reluctance to seem accusatory is exactly the hesitation this module addresses." },
  { id:92, module:10, question:"How long did the unauthorised access continue before it was detected?", options:["One day","One week","Three months, until an unrelated audit flagged the pattern","It was detected immediately"], correct:2, explanation:"The behaviour continued undetected for three months because no one who noticed it reported it." },
  { id:93, module:10, question:"What does reporting a concern actually mean, according to this module?", options:["Formally accusing a colleague of wrongdoing","Handing off a piece of information to people equipped to evaluate it properly","Guaranteeing that something wrong has happened","Something that should only be done with certainty"], correct:1, explanation:"Reporting surfaces information for proper review — it is not an accusation or a verdict." },
  { id:94, module:10, question:"What does the module say a false alarm costs, compared to a missed real threat?", options:["They cost the same amount","A false alarm costs a few minutes of someone's time; a missed one can cost months of undetected damage","False alarms are more costly than missed threats","Neither has any real cost"], correct:1, explanation:"The asymmetry is the whole point — reporting something that turns out to be nothing is cheap." },
  { id:95, module:10, question:"What is the central theme connecting all ten e-Safe training modules?", options:["Technology alone can prevent every attack","Every threat ultimately depends on someone being willing to notice and speak up","Only IT staff are responsible for security","Reporting is optional if you are not in a security role"], correct:1, explanation:"Across every topic, the training returns to the same point: people who notice and report are the last line of defence." },
  { id:96, module:10, question:"What is the central idea of 'security culture' as described in this module?", options:["Security is solely the responsibility of the IT department","Every employee shares responsibility for noticing and reporting concerns","Culture has no real impact on security outcomes","Security culture only matters for large organisations"], correct:1, explanation:"Security culture is built on shared responsibility across every employee, not just IT." },
  { id:97, module:10, question:"Why is it important not to assume someone else has already reported a concern?", options:["Reports are automatically duplicated by the system","If everyone assumes someone else will report it, no one does, and the issue goes unnoticed","Only one report is allowed per incident","IT prefers a single report at a time"], correct:1, explanation:"This exact assumption, held by several people, is what let the incident continue for months." },
  { id:98, module:10, question:"How should colleagues who report a concern in good faith be treated, even if it turns out to be nothing?", options:["Discouraged from reporting again","Supported — a false alarm is far cheaper than a missed real threat","Required to apologise for the false alarm","Reported to management for wasting time"], correct:1, explanation:"Supporting good-faith reports keeps people willing to speak up in the future." },
  { id:99, module:10, question:"What does having completed all ten modules qualify you to do next?", options:["Nothing further is required","Take the final quiz to earn your official certificate","Repeat all ten modules again","Wait for a manager's approval before continuing"], correct:1, explanation:"Completing all ten modules unlocks the final quiz, the last step before certification." },
  { id:100, module:10, question:"What single behaviour does this final module emphasise above all else?", options:["Installing more security software","Speaking up and reporting, even without certainty", "Avoiding all mention of colleagues' behaviour","Relying entirely on annual audits to catch problems"], correct:1, explanation:"Every module in this training ultimately depends on people being willing to notice and report." }
];

// Module names for topic labels
const QUIZ_MODULE_NAMES = {
  1: "Social Threats", 2: "Credentials & Access", 3: "Malware & Attacks",
  4: "Safe Habits & Devices", 5: "Data & Compliance", 6: "Insider Threats",
  7: "Remote Work Security", 8: "Mobile Device Security",
  9: "Cloud Security & Shadow IT", 10: "Security Culture & Reporting"
};


// ══════════════════════════════════════════════
// FINAL QUIZ LOGIC — 100 questions
// ══════════════════════════════════════════════
function initFinalQuiz(employee) {
  const quizIntroEl = document.getElementById('quizIntro');
  const startQuizBtn = document.getElementById('startQuizBtn');
  if (!quizIntroEl || !startQuizBtn) return;

  const TOTAL = QUIZ_QUESTIONS.length; // 100

  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let selectedOption = null;
  let results = [];

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz() {
    questions = shuffle(QUIZ_QUESTIONS);
    currentIndex = 0;
    score = 0;
    results = [];
    selectedOption = null;
    document.getElementById('quizIntro').style.display = 'none';
    document.getElementById('quizQuestion').style.display = 'block';
    renderQuestion();
  }

  function renderQuestion() {
    selectedOption = null;
    const q = questions[currentIndex];
    document.getElementById('qLabel').textContent = `Question ${currentIndex + 1} of ${TOTAL}`;
    document.getElementById('qTopic').textContent = QUIZ_MODULE_NAMES[q.module] || `Module ${q.module}`;
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('quizProgressFill').style.width = `${(currentIndex / TOTAL) * 100}%`;

    const submitBtn = document.getElementById('submitAnswerBtn');
    submitBtn.disabled = true;

    const optionsEl = document.getElementById('quizOptions');
    const shuffledOpts = q.options.map((text, i) => ({ text, origIndex: i }));
    optionsEl.innerHTML = shuffledOpts.map((opt) => `
      <div class="quiz-option" data-index="${opt.origIndex}">
        <div class="opt-radio"><i class="fi fi-tr-check"></i></div>
        <span>${opt.text}</span>
      </div>
    `).join('');

    optionsEl.querySelectorAll('.quiz-option').forEach(el => {
      el.addEventListener('click', () => {
        optionsEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        selectedOption = parseInt(el.dataset.index);
        submitBtn.disabled = false;
      });
    });
  }

  function submitAnswer() {
    if (selectedOption === null) return;
    const q = questions[currentIndex];
    const isCorrect = selectedOption === q.correct;
    if (isCorrect) score++;

    results.push({ question: q, selected: selectedOption, correct: isCorrect });

    document.getElementById('quizQuestion').style.display = 'none';
    document.getElementById('quizFeedback').style.display = 'block';

    const banner = document.getElementById('feedbackBanner');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackResult = document.getElementById('feedbackResult');

    if (isCorrect) {
      banner.className = 'quiz-feedback-banner correct';
      feedbackIcon.className = 'fi fi-tr-check';
      feedbackResult.textContent = 'Correct!';
    } else {
      banner.className = 'quiz-feedback-banner wrong';
      feedbackIcon.className = 'fi fi-tr-cross';
      feedbackResult.textContent = 'Incorrect';
    }

    document.getElementById('feedbackQuestion').textContent = q.question;
    document.getElementById('explanationHeading').textContent = isCorrect ? 'Why this is correct' : 'The correct answer';
    document.getElementById('explanationText').textContent = q.explanation;

    const feedbackOpts = document.getElementById('feedbackOptions');
    feedbackOpts.innerHTML = q.options.map((text, i) => {
      let cls = 'neutral';
      if (i === q.correct) cls = 'correct';
      else if (i === selectedOption && !isCorrect) cls = 'wrong';
      return `
        <div class="quiz-option ${cls}">
          <div class="opt-radio"><i class="fi fi-tr-check"></i></div>
          <span>${text}</span>
        </div>
      `;
    }).join('');

    const nextBtn = document.getElementById('nextQuestionBtn');
    nextBtn.textContent = currentIndex === TOTAL - 1 ? 'See my results' : 'Next question';
  }

  function nextQuestion() {
    currentIndex++;
    document.getElementById('quizFeedback').style.display = 'none';

    if (currentIndex >= TOTAL) {
      finishFinalQuiz();
    } else {
      document.getElementById('quizQuestion').style.display = 'block';
      renderQuestion();
    }
  }

  function finishFinalQuiz() {
    const pct = Math.round((score / TOTAL) * 100);
    const passed = pct >= 70;

    // Transient per-question breakdown for the results page — cleared
    // automatically at the end of the browser session.
    sessionStorage.setItem('esafe_final_quiz_results', JSON.stringify(results));

    db.collection('employees').doc(employee.uid).set({
      finalQuizScore: pct,
      finalQuizPassed: passed,
      certificateIssued: passed || employee.certificateIssued === true
    }, { merge: true }).catch(err => {
      console.error('Failed to save final quiz result:', err);
    }).finally(() => {
      window.location.href = 'results.html';
    });
  }

  startQuizBtn.addEventListener('click', startQuiz);
  document.getElementById('submitAnswerBtn').addEventListener('click', submitAnswer);
  document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
}


// ══════════════════════════════════════════════
// RESULTS PAGE
// ══════════════════════════════════════════════
function initResultsPage(employee) {
  const resultsHero = document.getElementById('resultsHero');
  if (!resultsHero) return;

  const TOTAL = QUIZ_QUESTIONS.length; // 100

  const sessionResults = JSON.parse(sessionStorage.getItem('esafe_final_quiz_results') || 'null');
  const hasFreshResults = Array.isArray(sessionResults) && sessionResults.length > 0;

  const score = hasFreshResults
    ? sessionResults.filter(r => r.correct).length
    : Math.round(employee.finalQuizScore || 0); // 100 Qs, 1% per question — exact inverse of the stored percentage
  const pct = hasFreshResults
    ? Math.round((score / TOTAL) * 100)
    : (employee.finalQuizScore || 0);
  const passed = hasFreshResults ? pct >= 70 : !!employee.finalQuizPassed;

  resultsHero.classList.add(passed ? 'pass' : 'fail');
  document.getElementById('resultsIcon').className = passed ? 'fi fi-tr-trophy-star' : 'fi fi-tr-face-disappointed';
  document.getElementById('resultsHeadline').textContent = passed ? 'You passed!' : 'Almost there!';
  document.getElementById('resultsScore').textContent = pct + '%';
  document.getElementById('resultsScoreSub').textContent = `${score} of ${TOTAL} correct`;

  const breakdownCard = document.getElementById('themeBreakdown')?.closest('.results-breakdown');

  if (hasFreshResults) {
    const breakdownEl = document.getElementById('themeBreakdown');
    const weakModules = [];

    for (let modNum = 1; modNum <= 10; modNum++) {
      const modQs = sessionResults.filter(r => r.question.module === modNum);
      if (modQs.length === 0) continue;
      const correct = modQs.filter(r => r.correct).length;
      const modPct = Math.round((correct / modQs.length) * 100);
      const cls = modPct >= 70 ? 'good' : modPct >= 50 ? 'warn' : 'bad';
      const name = QUIZ_MODULE_NAMES[modNum] || `Module ${modNum}`;

      if (modPct < 70) weakModules.push({ name, pct: modPct });

      breakdownEl.innerHTML += `
        <div class="theme-row">
          <div class="theme-row-top">
            <span>${name}</span>
            <span class="theme-pct ${cls}">${modPct}%</span>
          </div>
          <div class="theme-track">
            <div class="theme-fill ${cls}" style="width:${modPct}%"></div>
          </div>
        </div>
      `;
    }

    if (!passed && weakModules.length > 0) {
      document.getElementById('weakTopicsCard').style.display = 'block';
      document.getElementById('resultsEncouragement').style.display = 'block';
      const weakList = document.getElementById('weakTopicsList');
      weakModules.forEach(t => {
        weakList.innerHTML += `
          <div class="weak-topic-row">
            <span class="weak-topic-name">${t.name}</span>
            <span class="weak-topic-score">${t.pct}%</span>
            <a class="weak-topic-link" href="dashboard.html">Review modules</a>
          </div>
        `;
      });
    }
  } else if (breakdownCard) {
    // No per-question detail available (page opened directly rather than
    // right after taking the quiz) — hide the breakdown instead of
    // rendering it empty.
    breakdownCard.style.display = 'none';
  }

  const actionsEl = document.getElementById('resultsActions');
  if (passed) {
    actionsEl.innerHTML = `
      <a href="certificate.html" class="btn-primary">Get my certificate</a>
      <a href="dashboard.html" class="btn-outline">Back to dashboard</a>
    `;
  } else {
    actionsEl.innerHTML = `
      <a href="dashboard.html" class="btn-outline">Review modules</a>
      <a href="quiz.html" class="btn-primary">Retake quiz</a>
    `;
  }
}


// ══════════════════════════════════════════════
// CERTIFICATE PAGE
// ══════════════════════════════════════════════
function initCertificatePage(employee) {
  const certDoc = document.getElementById('certDoc');
  if (!certDoc) return;

  document.getElementById('certName').textContent = employee.fullName || 'Valued Employee';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('certDate').textContent = dateStr;

  document.getElementById('printCertBtn').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const W = 297;
    const H = 210;
    const name = employee.fullName || 'Valued Employee';

    doc.setFillColor(250, 251, 255);
    doc.rect(0, 0, W, H, 'F');

    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, W - 20, H - 20, 'S');

    doc.setLineWidth(0.3);
    doc.setDrawColor(26, 39, 68, 0.2);
    doc.rect(15, 15, W - 30, H - 30, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setCharSpace(3);
    doc.text('CISSY TECHNOLOGIES', W / 2, 32, { align: 'center' });
    doc.setCharSpace(0);

    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(26, 39, 68);
    doc.text('Certificate of Completion', W / 2, 55, { align: 'center' });

    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.3);
    doc.line(W / 2 - 60, 60, W / 2 + 60, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This certifies that', W / 2, 74, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(30);
    doc.setTextColor(26, 39, 68);
    doc.text(name, W / 2, 92, { align: 'center' });

    const nameWidth = doc.getTextWidth(name);
    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.4);
    doc.line(W / 2 - nameWidth / 2, 95, W / 2 + nameWidth / 2, 95);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('has successfully completed', W / 2, 108, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 39, 68);
    doc.text('e-Safe Cybersecurity Awareness Training', W / 2, 120, { align: 'center' });

    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.3);
    doc.line(55, 158, 115, 158);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 39, 68);
    doc.text('Cissy Technologies', 85, 163, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('ISSUING ORGANISATION', 85, 168, { align: 'center' });

    doc.setDrawColor(26, 39, 68);
    doc.line(182, 158, 242, 158);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 39, 68);
    doc.text(dateStr, 212, 163, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('DATE ISSUED', 212, 168, { align: 'center' });

    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.4);
    doc.circle(W / 2, 158, 14, 'S');
    doc.setLineWidth(0.2);
    doc.circle(W / 2, 158, 11, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(26, 39, 68);
    doc.text('e-SAFE', W / 2, 159, { align: 'center' });

    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`eSafe_Certificate_${safeName}.pdf`);
  });
}


// ══════════════════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════════════════
function initProfilePage(employee) {
  const profileCard = document.getElementById('profileCard');
  if (!profileCard) return;

  const initials = (employee.fullName || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('profileAvatar').textContent = initials || 'U';
  document.getElementById('profileName').textContent = employee.fullName || 'Employee';
  document.getElementById('profileDepartment').textContent = employee.department || 'Not specified';

  const completed = employee.completedModules || [];
  document.getElementById('profileModulesCompleted').textContent = `${completed.length}/10`;

  const scoreEl = document.getElementById('profileQuizScore');
  scoreEl.textContent = (typeof employee.finalQuizScore === 'number') ? `${employee.finalQuizScore}%` : 'Not yet taken';

  const certStatusEl = document.getElementById('profileCertStatus');
  const certActionEl = document.getElementById('profileCertAction');

  if (employee.finalQuizPassed) {
    certStatusEl.innerHTML = '<i class="fi fi-tr-check-circle" style="font-size:20px;color:#1D9E75"></i>';
    certActionEl.innerHTML = '<a href="certificate.html" class="btn-primary" style="margin-top:1rem"><i class="fi fi-tr-download"></i> Download Certificate</a>';
  } else {
    certStatusEl.innerHTML = '<i class="fi fi-tr-lock" style="font-size:20px;color:#9CA3AF"></i>';
    certActionEl.innerHTML = '';
  }

  const modulesListEl = document.getElementById('profileModulesList');
  if (modulesListEl) {
    if (completed.length === 0) {
      modulesListEl.innerHTML = '<li style="color:var(--text-3);font-size:13px;list-style:none">No modules completed yet.</li>';
    } else {
      modulesListEl.innerHTML = completed
        .slice()
        .sort((a, b) => a - b)
        .map(id => {
          const mod = MODULES_DATA.find(m => m.id === id);
          const name = mod ? mod.name : `Module ${id}`;
          return `<li><span class="step-num-box" style="border-color:#1D9E75;background:#E6FAF5"><i class="fi fi-tr-check" style="font-size:11px;color:#1D9E75"></i></span><span>${name}</span></li>`;
        }).join('');
    }
  }
}


// ══════════════════════════════════════════════
// ADMIN PAGE
// ══════════════════════════════════════════════
async function initAdminPage() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  let rows = [];

  try {
    const snap = await db.collection('employees').get();
    snap.forEach(doc => rows.push(doc.data()));

    const total = rows.length;
    const completedAll = rows.filter(r => (r.completedModules || []).length >= 10).length;
    const certsIssued = rows.filter(r => r.certificateIssued === true).length;
    const scored = rows.filter(r => typeof r.finalQuizScore === 'number');
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, r) => sum + r.finalQuizScore, 0) / scored.length)
      : 0;

    document.getElementById('adminStatTotal').textContent = total;
    document.getElementById('adminStatCompleted').textContent = completedAll;
    document.getElementById('adminStatCerts').textContent = certsIssued;
    document.getElementById('adminStatAvgScore').textContent = avgScore + '%';

    if (total === 0) {
      document.getElementById('adminEmptyState').style.display = 'block';
    } else {
      tbody.innerHTML = rows.map(r => {
        const completedCount = (r.completedModules || []).length;
        const completionBadge = completedCount >= 10
          ? '<span class="admin-badge good">All 10 complete</span>'
          : `<span class="admin-badge pending">${completedCount} of 10</span>`;
        const scoreText = typeof r.finalQuizScore === 'number' ? `${r.finalQuizScore}%` : 'Not taken';
        const certBadge = r.certificateIssued
          ? '<span class="admin-badge good">Issued</span>'
          : '<span class="admin-badge none">Pending</span>';
        const dateReg = formatAdminDate(r.registeredAt);

        return `
          <tr>
            <td>${sanitise(r.fullName || 'Unknown')}</td>
            <td>${sanitise(r.email || '')}</td>
            <td>${sanitise(r.department || 'Not specified')}</td>
            <td>${completionBadge}</td>
            <td>${scoreText}</td>
            <td>${certBadge}</td>
            <td>${dateReg}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load employee list:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:#DC2626">Failed to load employee data. Check the Firestore security rules and the browser console for details.</td></tr>`;
  }

  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportAdminCSV(rows));
  }
}

function formatAdminDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function csvEscape(value) {
  const str = String(value === undefined || value === null ? '' : value);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function exportAdminCSV(rows) {
  const headers = ['Name', 'Email', 'Department', 'Modules Completed', 'Quiz Score', 'Certificate Status', 'Date Registered'];
  const lines = [headers.join(',')];

  rows.forEach(r => {
    const completed = `${(r.completedModules || []).length} of 10`;
    const score = typeof r.finalQuizScore === 'number' ? `${r.finalQuizScore}%` : 'Not taken';
    const cert = r.certificateIssued ? 'Issued' : 'Pending';
    const dateReg = formatAdminDate(r.registeredAt);
    const fields = [r.fullName || '', r.email || '', r.department || '', completed, score, cert, dateReg];
    lines.push(fields.map(csvEscape).join(','));
  });

  const csv = lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `esafe_employees_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ══════════════════════════════════════════════
// RESOURCES PAGE
// ══════════════════════════════════════════════
const TOP_TIPS = [
  "Verify the sender's actual email address before clicking any link or replying.",
  "Never share your password or MFA code with anyone, including people claiming to be IT.",
  "Use a unique, strong password or passphrase for every account, stored in a password manager.",
  "Hover over links before clicking to check where they really go.",
  "Never plug in an unknown USB drive.",
  "Use the company VPN on any public or home WiFi when accessing work systems.",
  "Lock your screen every time you step away, even briefly.",
  "Only install software and apps from official, IT-approved sources.",
  "Store company data only in approved systems — never personal cloud storage or email.",
  "Report anything suspicious to IT Security immediately, even if you are not sure."
];

function initResourcesPage() {
  const quickRefList = document.getElementById('quickRefList');
  if (quickRefList) {
    quickRefList.innerHTML = TOP_TIPS.map((tip, i) => `
      <li><span class="step-num-box">${i + 1}</span><span>${tip}</span></li>`).join('');
  }

  const printBtn = document.getElementById('printQuickRefBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const downloadBtn = document.getElementById('downloadGuideBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;

      doc.setFillColor(250, 251, 255);
      doc.rect(0, 0, W, 297, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(26, 39, 68);
      doc.text('e-Safe Quick Reference Guide', W / 2, 22, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Cissy Technologies — Cybersecurity Awareness Training', W / 2, 29, { align: 'center' });

      doc.setDrawColor(26, 39, 68);
      doc.setLineWidth(0.3);
      doc.line(20, 34, W - 20, 34);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(26, 39, 68);
      doc.text('Top 10 Security Tips', 20, 46);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);
      let y = 55;
      TOP_TIPS.forEach((tip, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${tip}`, W - 40);
        doc.text(lines, 20, y);
        y += lines.length * 5.5 + 2.5;
      });

      y += 6;
      doc.setDrawColor(26, 39, 68);
      doc.line(20, y, W - 20, y);
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(26, 39, 68);
      doc.text('If You Suspect a Security Incident', 20, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);
      const incidentLines = [
        'Report it immediately, even if you are not sure it is a real threat.',
        'IT Security team: security@cissytechnologies.com',
        'Security hotline: +1 (800) 555-0199 (placeholder — replace with your real hotline)'
      ];
      incidentLines.forEach(line => {
        const wrapped = doc.splitTextToSize(line, W - 40);
        doc.text(wrapped, 20, y);
        y += wrapped.length * 5.5 + 3;
      });

      doc.save('eSafe_Quick_Reference_Guide.pdf');
    });
  }
}


// ══════════════════════════════════════════════
// MODULE DATA — 10 MODULES, 2 PARTS EACH
// Part 1 = story + key lesson + action steps
// Part 2 = 5 MCQs, 70% to pass, next module unlocks
// ══════════════════════════════════════════════
const MODULES_DATA = [
  {
    id: 1, name: "Social Threats", badge: "Module 1 of 10",
    story: {
      character: { name: "David Mensah", role: "Sales Executive", initials: "DM" },
      email: {
        from: "Bank Security <security@yourbank-support.co>",
        subject: "ALERT: Unauthorized Login Detected on Your Account",
        body: `Dear Customer,

We have detected a suspicious login attempt on your account from an unrecognized device. For your safety, we have temporarily locked your account.

Click the link below to verify your identity and unlock your account immediately.

UNLOCK MY ACCOUNT
http://account-verify.net/unlock

Thank you,
Bank Security Team`
      },
      scenarioTitle: "Three Attacks, One Pattern",
      paragraphs: [
        "David gets an email. The sender shows 'Bank Security' but the actual address is security@yourbank-support.co — not the bank's real domain. The link says 'UNLOCK MY ACCOUNT' but points to account-verify.net. This is phishing: a deceptive message designed to steal credentials by impersonating a trusted sender.",
        "Sarah gets a call from someone claiming to be Tom from IT Support. The caller knows her name, department, and references a recent company email — all gathered from the company intranet. He creates urgency: 'We've detected unusual activity and need to verify your identity right now.' This is social engineering — using psychological pressure, authority, and research to manipulate someone into revealing information.",
        "Ruth gets a text while travelling. 'URGENT: Your salary payment has been placed on hold. Verify here: cissy-payroll-verify.net'. The domain is fake, the urgency is manufactured, and the fear about pay is designed to make her act before she thinks. This is smishing — social engineering delivered via SMS.",
        "Three different channels. One common pattern: urgency, authority, and a fake link or identity. Phishing comes by email. Vishing by voice call. Smishing by text. The delivery method changes but the manipulation tactic is always the same."
      ],
      keyLesson: "Every social threat — phishing, vishing, smishing, social engineering — uses the same playbook: create urgency, claim authority, and provide a fake link or collect information before you have time to think. Slow down, verify the sender's real identity, and never click links or share credentials in response to unsolicited contact.",
      actionHeading: "What to do when you receive a suspicious message:",
      actionSteps: [
        "Check the sender's actual email address or phone number — not just the display name",
        "Hover over any links before clicking to check the real destination URL",
        "Never share credentials, MFA codes, or personal information in response to unsolicited contact",
        "Verify through official channels — call the company directly using a number you already have",
        "Report all suspicious emails, calls, and texts to IT immediately"
      ]
    },
    quiz: [
      { text: "An email arrives from 'security@yourbank-helpdesk.co' saying your account is locked. What is the most definitive technical indicator this is phishing?", options: ["The email creates urgency", "The greeting says 'Dear Customer'", "The sender domain does not match the bank's real domain", "The email was unexpected"], correct: 2, explanation: "The sender domain is the most definitive proof. 'yourbank-helpdesk.co' is a look-alike domain, not the bank's real domain. Urgency and generic greetings are red flags but can appear in legitimate emails too." },
      { text: "An IT caller asks you to confirm your employee ID and password to 'fix your account'. What should you do?", options: ["Give your employee ID but not your password", "Comply — IT needs this to help you", "End the call and contact IT through the official company directory", "Ask the caller to email you the request"], correct: 2, explanation: "Legitimate IT will never ask for your password over an unsolicited call. Always hang up and call IT back using a number you already have — not one the caller provides." },
      { text: "You receive a text saying your salary is on hold with a link to 'company-payroll-check.net'. What do you do?", options: ["Click the link — it mentions your salary so it must be real", "Ignore it completely", "Contact HR directly through official channels to verify", "Forward it to your manager and wait"], correct: 2, explanation: "Never click links in unexpected texts about financial matters. Always verify through official internal channels — call HR or check your payslip system directly." },
      { text: "Which best describes pretexting?", options: ["Sending fake emails with malicious attachments", "Researching a target and building a believable false identity to manipulate them", "Following someone through a secured door", "Installing malware on a victim's computer"], correct: 1, explanation: "Pretexting involves researching the target — their name, role, recent events — to make a fraudulent request seem legitimate and authoritative." },
      { text: "What is the shared pattern across phishing, vishing, and smishing attacks?", options: ["They all involve email", "They all use urgency, false authority, and a fake link or identity to manipulate action", "They all require the attacker to be nearby", "They only work against non-technical employees"], correct: 1, explanation: "Phishing (email), vishing (voice), and smishing (SMS) all use the same psychological formula: manufacture urgency, claim authority, and push the target to act before they can verify." }
    ]
  },
  {
    id: 2, name: "Credentials & Access", badge: "Module 2 of 10",
    story: {
      character: { name: "Emmanuel Kato", role: "Systems Analyst", initials: "EK" },
      email: {
        from: "SMS — Unknown number",
        subject: "Text message received",
        body: `Someone calls Emmanuel at 2am.

"Hi, this is IT Security. We've detected a login attempt on your account from Eastern Europe. I need you to read out your current verification code so we can lock the attacker out immediately."`
      },
      scenarioTitle: "Three Layers of Access Security",
      paragraphs: [
        "Peter used 'Daughter1990!' as his password for his work email, client portal, and personal bank. When an unrelated site was breached, attackers tried that exact combination on 200 other services. His work email was accessed within four hours. Password reuse turns one breach into many. A strong password is long, random, and unique — never reused across accounts. A passphrase like 'correct-horse-battery-staple' is 28 characters and far harder to crack than a short complex word.",
        "Fatima kept a notebook in her desk with all 14 of her work platform passwords written in plain text. A visitor photographed two pages during a fire drill. Three accounts were compromised by morning. A password manager solves this — it generates a unique strong password for every account and stores them all in an encrypted vault. You only need to remember one master password.",
        "Emmanuel's password was stolen in a credential stuffing attack. But when the attacker tried to log in, the system asked for a second factor — a time-limited code from Emmanuel's phone app. The attacker had the password but not the device. Login blocked. Then the phone rings. Someone claiming to be IT asks him to read out his current MFA code 'to lock out the attacker'. This is a real-time MFA phishing attack. The caller IS the attacker, using social engineering to steal the one thing blocking them."
      ],
      keyLesson: "Strong credentials need three things: a unique strong password (or passphrase) per account, a password manager to generate and store them, and MFA enabled on every account that supports it. Never share an MFA code with anyone — including people claiming to be IT. The code is yours alone.",
      actionHeading: "How to protect your credentials:",
      actionSteps: [
        "Use a unique password or passphrase for every single account — never reuse",
        "Use a company-approved password manager to generate and store credentials",
        "Enable MFA on every work account that supports it",
        "Use an authenticator app for MFA rather than SMS — it cannot be SIM-swapped",
        "Never share an MFA code with anyone, ever — hang up and report if someone asks"
      ]
    },
    quiz: [
      { text: "Which is the strongest password strategy?", options: ["One complex password used across all accounts", "A unique password per account stored in a password manager", "Your pet's name plus your birth year", "Writing passwords in a locked notebook"], correct: 1, explanation: "Unique passwords per account stored in a password manager is the gold standard. If one site is breached, no other account is at risk." },
      { text: "Peter's work account was compromised even though he did not share his password. How?", options: ["Someone guessed it by trying common words", "He reused the same password from a breached site — attackers tried it on his work account", "His computer had a virus that stole it", "Someone saw him type it"], correct: 1, explanation: "Credential stuffing attacks take stolen email/password pairs from one breach and automatically try them on hundreds of other services. Password reuse makes one breach cascade into many." },
      { text: "What is the main advantage of a password manager over writing passwords down?", options: ["It remembers passwords so you never need to log out", "It allows safe password sharing with colleagues", "It generates and stores credentials in an encrypted vault that cannot be photographed or physically stolen", "It automatically changes your passwords every month"], correct: 2, explanation: "A password manager encrypts all credentials. Unlike a notebook, encrypted data cannot be read even if someone accesses your device — they still need the master password." },
      { text: "An attacker has your correct username and password but MFA is enabled. What happens?", options: ["They can log in immediately with the credentials", "MFA makes passwords irrelevant entirely", "They still need the second factor from your physical device which they do not have", "They can reset your MFA by calling your phone provider"], correct: 2, explanation: "MFA requires something you know (password) AND something you have (your device). Without both, the attacker cannot complete login." },
      { text: "Someone calls claiming to be IT and asks for your current MFA code to lock out an attacker. What do you do?", options: ["Give the code — it expires in 30 seconds anyway so it is safe", "Give only the first three digits", "Refuse, hang up, and contact IT through official channels to report the call", "Ask them to email the request instead"], correct: 2, explanation: "This is a real-time MFA phishing attack. The caller is the attacker, using your code to complete the login they are currently attempting. MFA codes must never be shared with anyone." }
    ]
  },
  {
    id: 3, name: "Malware & Attacks", badge: "Module 3 of 10",
    story: {
      character: { name: "Brian Ochieng", role: "Finance Analyst", initials: "BO" },
      email: {
        from: "DHL Courier <delivery@dhl-parcels-tracking.net>",
        subject: "Your package could not be delivered — action required",
        body: `Dear Customer,

We attempted to deliver your package (Tracking: KE847291038) but were unable to complete delivery.

To reschedule, confirm your details within 24 hours or your package will be returned.

RESCHEDULE DELIVERY:
http://dhl-redelivery-confirm.net/track?id=847291

DHL Customer Services`
      },
      scenarioTitle: "Three Ways Malware Gets In",
      paragraphs: [
        "Brian clicks the link in what looks like a DHL courier email on Friday afternoon. The sender is 'delivery@dhl-parcels-tracking.net' — not dhl.com. The link points to 'dhl-redelivery-confirm.net' — also not dhl.com. The download runs silently over the weekend. On Monday, every file on his workstation is encrypted. A ransom demand appears. Three months of financial reports are gone. Ransomware enters through deceptive links. Before clicking anything, hover over the link and check the real destination URL. If the domain does not exactly match the company's official website, do not click.",
        "Stella needed a design tool for a client project. She found a free cracked version on an unofficial site. The installer contained a trojan — malware disguised as legitimate software. While Stella worked normally, the trojan recorded every keystroke and sent credentials to an attacker's server for two weeks before IT detected the outbound traffic. Free cracked software from unofficial sites is one of the most common malware delivery methods. Only install software from official, IT-approved sources.",
        "Janet found a USB drive in the car park labelled 'Staff Salary Q2 2026'. Curious, she plugged it into her work computer. The USB was planted — it auto-ran a script the moment it was connected, installing a remote access trojan. From Janet's machine, the attacker could see her screen, access shared drives, and move to other systems on the network. USB baiting uses curiosity as the exploit. The label is the attack. Never plug an unknown USB into any device."
      ],
      keyLesson: "Malware enters through three main routes: deceptive links in emails, unofficial software downloads, and physical devices like USB drives. The common thread is that the user has to take an action — click, download, or plug in. Pause before every one of those actions and verify the source is legitimate.",
      actionHeading: "How to protect against malware:",
      actionSteps: [
        "Hover over links before clicking — check the real destination URL matches the official domain",
        "Never click links or open attachments in unexpected emails even if they look official",
        "Only download software from official sources approved by IT",
        "Never plug an unknown USB drive into any device — work or personal",
        "Back up your work regularly so ransomware cannot permanently destroy your files",
        "Report any unusual system behaviour to IT immediately — do not investigate yourself"
      ]
    },
    quiz: [
      { text: "An email from 'dhl-parcels-tracking.net' asks you to click a link to reschedule a delivery. What is the most suspicious indicator?", options: ["The email creates urgency about a 24-hour deadline", "The sender domain is not dhl.com — it is a look-alike fake domain", "The email does not include your name", "The email arrived unexpectedly"], correct: 1, explanation: "The fake sender domain is the technical proof. DHL's real domain is dhl.com. 'dhl-parcels-tracking.net' is a look-alike domain registered by attackers to deliver malware." },
      { text: "Brian's files were encrypted by ransomware on Monday. What was his most critical mistake?", options: ["He was using a work computer for personal tasks", "He clicked a link in an unexpected email without checking the destination URL", "He did not have antivirus installed", "He opened the email outside of office hours"], correct: 1, explanation: "Clicking an unverified link in an unexpected email is the primary ransomware entry point. Always hover over links and verify the destination domain before clicking." },
      { text: "Stella downloaded a free cracked design tool and her credentials were stolen for two weeks before IT noticed. What type of malware was this?", options: ["Ransomware — it encrypted her files", "A worm — it spread across the network automatically", "A trojan — it disguised itself as legitimate software while secretly stealing data", "A virus — it corrupted her operating system"], correct: 2, explanation: "A trojan disguises itself as legitimate software. Unlike viruses it does not self-replicate — it relies on the user installing it, making deceptive download sites the primary delivery method." },
      { text: "Janet finds a USB labelled 'Staff Salary Q2 2026' in the car park. What should she do?", options: ["Plug it in to find out who it belongs to and return it", "Take it home and check it on a personal computer", "Hand it to IT or security without plugging it into any device", "Leave it where she found it"], correct: 2, explanation: "USB baiting exploits curiosity. The label is part of the attack — designed to make you want to plug it in. Hand unknown USB devices to IT who can examine them safely in isolation." },
      { text: "What is the most effective defence against permanently losing data to a ransomware attack?", options: ["Paying the ransom quickly to get the decryption key", "Keeping regular tested backups stored separately from your main system", "Turning off your computer when not in use", "Having antivirus software installed"], correct: 1, explanation: "Regular backups stored separately mean files can be restored without paying the attacker. Antivirus helps but is not guaranteed to catch all ransomware. Paying ransoms does not guarantee recovery and funds future attacks." }
    ]
  },
  {
    id: 4, name: "Safe Habits & Devices", badge: "Module 4 of 10",
    story: {
      character: { name: "Collins Oduya", role: "Business Development Officer", initials: "CO" },
      email: null,
      scenarioTitle: "Four Habits That Stop Attacks",
      paragraphs: [
        "Collins searched for the company banking portal and clicked the second result. The page looked identical to the real one. He entered his credentials. Nothing happened. He tried again on another browser. Both sets of credentials had been captured by a typosquatting site — a fake site at 'companybank-portal.net' instead of 'companybank.com'. Always type important URLs directly into the address bar or use saved bookmarks. Check that the domain is exactly right and that the connection uses HTTPS. One wrong character in a URL can land you on a fake site.",
        "Ruth connected to airport public WiFi to send a client proposal. Someone on the same network was running a packet-sniffing tool — capturing unencrypted data. The proposal, containing pricing and strategy, was intercepted before Ruth's meeting started. Public WiFi is unencrypted and shared with strangers. Always use the company VPN on public networks. If you cannot use a VPN, use your phone's mobile hotspot instead — mobile data is encrypted by the network.",
        "Isaac left his phone unlocked on a restaurant table. When he returned, it was gone. His work email, client app, and shared document folders were all immediately accessible. A fraudulent email was sent to a client before IT could remotely wipe the device. Lock your screen with a strong PIN or biometric. Set it to auto-lock after 30 seconds. And keep software updated — attackers exploit known vulnerabilities in outdated operating systems and apps within hours of a patch being released."
      ],
      keyLesson: "Safe daily habits are your strongest personal defence: type URLs directly, use a VPN on public WiFi, lock your screen, and keep software updated. These four habits stop the majority of opportunistic attacks before they begin.",
      actionHeading: "Four daily habits to follow:",
      actionSteps: [
        "Type important URLs directly or use bookmarks — never rely on search results for banking or work portals",
        "Use the company VPN on any public WiFi, or use your mobile hotspot instead",
        "Lock your screen every time you step away — even for two minutes",
        "Keep your operating system, apps, and software updated — apply patches promptly",
        "Report lost or stolen devices to IT immediately for remote wipe"
      ]
    },
    quiz: [
      { text: "Collins entered his credentials on a site he found through a search result that looked identical to his banking portal. What type of attack was this?", options: ["Brute force attack", "Credential stuffing", "Typosquatting — a fake look-alike website", "Session hijacking"], correct: 2, explanation: "Typosquatting involves registering domains that look almost identical to real ones. Finding important sites through search results instead of typing the URL directly increases the risk of landing on a fake." },
      { text: "What does HTTPS in a website URL confirm?", options: ["The website is owned by a legitimate organisation", "The connection between your browser and the site is encrypted in transit", "The site has been verified by the government", "The site is safe from malware"], correct: 1, explanation: "HTTPS encrypts the connection in transit but does not guarantee the site itself is legitimate. Fake sites can also use HTTPS. Always verify the full domain as well." },
      { text: "Ruth sent a confidential client proposal over airport public WiFi without a VPN. What happened?", options: ["Her email was blocked by the airport firewall", "The proposal was intercepted by someone on the same unencrypted network", "The file was too large to send over public WiFi", "Nothing — public WiFi is encrypted by default"], correct: 1, explanation: "Public WiFi is typically unencrypted. Anyone on the same network with basic tools can capture data being transmitted. A VPN encrypts your traffic, making it unreadable to others on the network." },
      { text: "Isaac left his unlocked phone on a restaurant table and it was stolen. What was the most immediate security risk?", options: ["The phone battery could be damaged", "The thief had immediate access to all work apps, email, and data on the device", "The phone's WiFi could be remotely accessed", "The phone could be infected by nearby Bluetooth devices"], correct: 1, explanation: "An unlocked device is an open door. Without a screen lock, anyone who picks it up has instant access to every app, email, and file on the device." },
      { text: "Why is it important to apply software updates and patches promptly?", options: ["Updates improve the look of the software interface", "Attackers exploit known vulnerabilities in outdated software — patches close those gaps", "Updates are required to keep the software licence active", "Older software runs slower over time"], correct: 1, explanation: "When a software vulnerability is discovered and patched, attackers immediately begin targeting unpatched systems. Applying updates quickly closes the window of exposure." }
    ]
  },
  {
    id: 5, name: "Data & Compliance", badge: "Module 5 of 10",
    story: {
      character: { name: "Esther Nakato", role: "Compliance Officer", initials: "EN" },
      email: null,
      scenarioTitle: "Data Has Rules — And Consequences",
      paragraphs: [
        "Miriam stored a client contract on her personal Google Drive so she could work from home over the weekend. Six weeks later, her personal email was compromised in a phishing attack. The attacker accessed her Google Drive and downloaded 18 documents including the contract. Company data must only be stored in company-approved systems — not personal cloud accounts, personal email, or USB drives. Personal accounts do not have the access logging, encryption standards, or security controls of company systems.",
        "A marketing team member noticed the client database contained contacts from a product purchased two years ago. Without checking with compliance, they used the list for a promotional campaign. Several clients complained they had not consented to marketing. A formal data protection complaint was filed. Personal data can only be used for the specific purpose it was collected for. Using it for anything else — even something helpful — without proper consent is a violation.",
        "Samuel noticed his computer was running slowly and saw unfamiliar processes in the task manager. He assumed it was a software update and waited three days before mentioning it to a colleague. By then, the attacker had moved laterally to two other systems. IT investigation confirmed the machine had been compromised. Had Samuel reported it immediately, the attacker's window would have been hours, not days. Report anything suspicious to IT the moment you notice it — even if you are not sure it is a real threat. IT would rather investigate a false alarm than miss a real attack."
      ],
      keyLesson: "Data protection has three rules: store it only in approved systems, use it only for the purpose it was collected for, and delete it when it is no longer needed. Incident reporting has one rule: report immediately. Every hour of delay gives an attacker more time.",
      actionHeading: "Data and compliance essentials:",
      actionSteps: [
        "Only store company and client data in company-approved systems — never personal cloud or email",
        "Only use personal data for the specific purpose it was collected and consented to",
        "Check with the compliance team before using client data in any new way",
        "Delete or anonymise personal data when it is no longer needed",
        "Report any suspicious activity to IT immediately — do not wait to be certain",
        "Document what you saw: when it happened, what you noticed, what you did"
      ]
    },
    quiz: [
      { text: "Miriam stored a client contract in her personal Google Drive for convenience. Why was this a security problem?", options: ["Google Drive does not support contract files", "Personal cloud accounts lack the access controls, logging, and encryption of company-approved systems", "File sizes are restricted on personal accounts", "Google Drive is blocked by the company firewall"], correct: 1, explanation: "Personal cloud storage does not meet company security standards. A breach of a personal account exposes company data — and unlike company systems, personal accounts have no IT oversight or monitoring." },
      { text: "A marketing team member sent promotional emails using a client list collected for a different purpose. What did they violate?", options: ["The company social media policy", "Data protection law — personal data can only be used for the purpose it was collected for", "The company email formatting guidelines", "The email platform's terms of service"], correct: 1, explanation: "Data protection law requires that personal data is used only for its stated, consented purpose. Using it for anything else — even something well-intentioned — is a compliance violation that can result in formal complaints and penalties." },
      { text: "A client contacts you asking for all their personal data to be deleted from your systems. What should you do?", options: ["Ignore it — data deletion is an IT task", "Delete what you personally have access to and let IT know", "Escalate to the compliance team to handle it through the correct process", "Tell the client that data cannot be deleted once collected"], correct: 2, explanation: "Data deletion or erasure requests have legal standing under data protection regulations. They must go through the compliance team to ensure complete, documented, and legally compliant deletion." },
      { text: "Samuel noticed unusual system behaviour but waited three days to report it. What was the result?", options: ["The issue resolved itself naturally over time", "The attacker had three extra days to move through the network undetected", "IT was able to gather more information from the delay", "The delayed report had no effect on the outcome"], correct: 1, explanation: "Every hour of delay in reporting gives an attacker more time to cause damage, steal data, or spread to other systems. Early reporting is one of the most effective ways to limit the impact of a breach." },
      { text: "You notice something unusual on your system but are not sure if it is a real threat. What should you do?", options: ["Investigate it yourself to confirm before calling IT", "Wait to see if it gets worse before reporting", "Report it to IT immediately even if you are not certain", "Ask a colleague if they have noticed the same thing"], correct: 2, explanation: "Always report suspicious activity immediately regardless of certainty. IT would rather investigate a false alarm than miss a real attack. You are not expected to diagnose the problem — just report what you observed." }
    ]
  },
  {
    id: 6, name: "Insider Threats", badge: "Module 6 of 10",
    story: {
      character: { name: "Nadia Okafor", role: "IT Manager", initials: "NO" },
      email: null,
      scenarioTitle: "The Last Night Before He Left",
      paragraphs: [
        "Tunde, a marketing employee, resigned and gave the standard two weeks' notice. On his final night, he downloaded 12,000 files from the client folder to a personal drive. No one had revoked his access early — his credentials stayed fully active for his entire notice period, exactly as company policy allowed.",
        "His access had never been narrowed to just his own work either. Like many employees, he had accumulated access to far more than his role needed over the years — client files well beyond his own accounts, shared drives from projects he had long since finished. Least privilege, the principle of only granting access someone actually needs, had quietly eroded.",
        "A colleague, Amara, noticed unusual overnight activity in the shared drive logs a few days before his last day. She hesitated to say anything — she didn't want to seem paranoid, or to get a colleague in trouble over what might be nothing. She mentioned it three days later. By then, the files had already left the building.",
        "Insider threats don't require a hacker breaking in. A departing employee with valid, unrevoked, overly broad access can do more damage in one night than most external attacks — and the only real defence is acting the moment a departure is known, keeping access tightly scoped, and treating hesitation to report as itself a risk."
      ],
      keyLesson: "Insider threats often involve no hacking at all — just valid credentials that were never narrowed or revoked in time. Two things stop this: applying least privilege continuously, not just at hire, and acting the moment a departure is confirmed rather than waiting for the last day. Reporting unusual colleague behaviour, even without certainty, closes the gap that let this go undetected.",
      actionHeading: "How to prevent and respond to insider risk:",
      actionSteps: [
        "Report departure dates to IT immediately so access can be reduced or revoked on a proper schedule",
        "Request access only to the systems and files your current role actually requires",
        "Report unusual file access or download activity by a colleague, even if you are not certain it is wrong",
        "Do not assume someone else has already reported it — report it yourself",
        "Remember that reporting a colleague is about protecting the company, not getting someone in trouble"
      ]
    },
    quiz: [
      { text: "Why was it possible for the departing employee to download 12,000 files on his last night?", options: ["His manager approved it", "His access was never revoked or reduced during his notice period", "He used a stolen password", "IT gave him temporary elevated access"], correct: 1, explanation: "His account retained its full, standard access for the entire notice period. Nothing was reduced or revoked early, so he could still reach everything he'd always had access to." },
      { text: "What is the principle of least privilege?", options: ["Giving every employee the same baseline access", "Giving people access only to what their specific role requires, nothing more", "Giving managers unrestricted access to all systems", "Reviewing access once per year"], correct: 1, explanation: "Least privilege means access is scoped tightly to what a role needs. It limits the damage any single compromised or departing account can do." },
      { text: "Amara noticed unusual file activity but waited three days to report it because she didn't want to seem paranoid. What was the consequence?", options: ["None — the files were already backed up", "By the time she reported it, the data had already left the building", "IT caught it anyway through routine monitoring", "Nothing, since insider threats are rare"], correct: 1, explanation: "The delay meant the exfiltration was already complete by the time anyone acted. Early reporting — even of something uncertain — is what actually prevents damage." },
      { text: "When should an employee's access be reduced after they resign?", options: ["Only on their literal last day", "As soon as the departure is confirmed, not held until the final day", "Only if they are being terminated for misconduct", "Access should never be changed during a notice period"], correct: 1, explanation: "Waiting until the last day leaves a wide window — the entire notice period — during which a departing employee retains full access. Reducing or monitoring access as soon as departure is confirmed closes that window." },
      { text: "What should you do if you notice a colleague accessing files that seem outside their normal role, even if you're not sure it's malicious?", options: ["Say nothing since you might be wrong", "Confront them directly yourself", "Report it — reporting is not an accusation, it is sharing information for proper review", "Wait for someone else to notice too"], correct: 2, explanation: "Reporting isn't an accusation — it's flagging something for someone qualified to assess. Waiting for certainty before reporting is exactly what allowed real insider incidents to go undetected for months." }
    ]
  },
  {
    id: 7, name: "Remote Work Security", badge: "Module 7 of 10",
    story: {
      character: { name: "Miriam Osei", role: "Legal Officer", initials: "MO" },
      email: null,
      scenarioTitle: "The Coffee Shop Call",
      paragraphs: [
        "Miriam is between meetings and stops at a coffee shop. A confidential client negotiation call starts in five minutes. She joins from her laptop, connected to the coffee shop's open WiFi, with her screen facing the room and no VPN active.",
        "Halfway through the call, sensitive contract terms are shared on screen. Anyone glancing over from a nearby table — or intercepting her unencrypted WiFi traffic — could see or capture it. She hadn't set a virtual background either, so her surroundings, including a folder visibly labelled with a client's name, are visible on camera too.",
        "This is remote work risk stacked three ways: an unsecured public network exposing her data in transit, a physically visible screen exposing it to anyone nearby, and an uncontrolled camera background revealing more than intended. None of it requires any hacking skill — just proximity or a glance.",
        "The fix isn't to avoid remote work — it's to build habits that make these risks disappear by default: VPN on any network you don't control, a seat with your back to a wall or a privacy screen, virtual backgrounds for any call with confidential content, and a waiting room so no one joins before you're ready."
      ],
      keyLesson: "Remote work multiplies where sensitive information can leak — public networks, visible screens, and camera backgrounds are all attack surfaces that require no hacking skill at all. Treat every public or home space as a lower-trust environment than the office and apply the same protections by default.",
      actionHeading: "Working securely outside the office:",
      actionSteps: [
        "Always connect through the company VPN before accessing work systems on any network you do not control",
        "Sit with your back to a wall or use a privacy screen when working on sensitive material in public",
        "Secure your home WiFi with a strong unique password and keep your router firmware updated",
        "Use a virtual background and enable the meeting waiting room for any call involving confidential information",
        "Never join or continue a confidential call from a public space if it can be postponed a few minutes"
      ]
    },
    quiz: [
      { text: "Miriam joined a confidential call from a coffee shop without a VPN. What is the primary risk of unsecured public WiFi?", options: ["It is slower than home internet", "Data travelling over the network can potentially be intercepted by others on the same network", "Public WiFi always contains a virus", "It only affects video quality"], correct: 1, explanation: "Unencrypted public networks let others nearby capture unprotected traffic." },
      { text: "What made Miriam's screen a risk during the call, separate from the network issue?", options: ["Her laptop battery was low", "The screen faced the room, so anyone nearby could see confidential contract terms", "She was using the wrong video app", "Her camera resolution was too high"], correct: 1, explanation: "Physical visibility is its own risk, independent of the network. A privacy screen or better seating would have prevented it." },
      { text: "Why does a virtual background matter for confidential video calls?", options: ["It looks more professional", "It prevents visible items in your surroundings — like labelled documents — from being seen by other participants", "It improves your internet speed", "It is required by law"], correct: 1, explanation: "A visible background can accidentally expose real information, like the client folder in Miriam's case." },
      { text: "What is the purpose of a meeting waiting room?", options: ["To make participants wait for no reason", "To ensure no one can join a confidential call before the host is ready and has verified attendees", "To improve call video quality", "To automatically record the meeting"], correct: 1, explanation: "A waiting room gives the host control over exactly who enters a call and when." },
      { text: "What is the best overall habit for handling confidential work outside the office?", options: ["Avoid remote work entirely", "Treat public and home spaces as lower-trust environments and apply VPN, screen privacy, and call hygiene by default", "Only worry about security if you notice something suspicious", "Use your personal phone hotspot instead of WiFi"], correct: 1, explanation: "The safest approach is to build these protections into your default routine rather than deciding case by case." }
    ]
  },
  {
    id: 8, name: "Mobile Device Security", badge: "Module 8 of 10",
    story: {
      character: { name: "Isaac Banda", role: "Operations Supervisor", initials: "IB" },
      email: null,
      scenarioTitle: "The Flashlight App",
      paragraphs: [
        "Isaac needed a flashlight app and downloaded the first free one he found. During installation, it asked for permission to access his contacts, camera, microphone, and location. He tapped 'Allow' on all of them without reading further — it was just a flashlight app, he thought, what could go wrong.",
        "The app worked fine. He forgot about the permissions entirely. Two weeks later, a client's pricing details and account information — data that only existed in his contacts and a few work notes on his phone — showed up almost verbatim in a competitor's pitch to the same client.",
        "IT's investigation traced it back to the flashlight app, which had no legitimate reason to need contacts, camera, microphone, or location access, but had been quietly harvesting and transmitting that data since the day it was installed. A flashlight app needs none of those permissions to turn on an LED.",
        "The lesson isn't just about flashlight apps — it's about permission awareness. Any app requesting access far beyond what its function requires is a red flag, and mobile devices holding work data need the same scrutiny as a work laptop."
      ],
      keyLesson: "A mobile app's requested permissions should match what it actually needs to function. Access to contacts, camera, microphone, or location for an app with no real reason to need them is one of the clearest signs of mobile malware — and it can leak data as damaging as any email-based attack.",
      actionHeading: "Protecting work data on mobile devices:",
      actionSteps: [
        "Check what permissions an app requests before installing, and question anything that doesn't match its function",
        "Only install apps from official app stores — never from third-party sites or unknown links",
        "Enable remote wipe on any device that holds work email, files, or contacts",
        "Report a lost or stolen device to IT immediately so it can be remotely locked or wiped",
        "Review and revoke unnecessary app permissions on your device periodically, not just at install time"
      ]
    },
    quiz: [
      { text: "Why should a flashlight app requesting access to contacts, camera, microphone, and location be considered suspicious?", options: ["All apps need these permissions to run", "None of those permissions are needed for a flashlight app to function — turning on an LED requires no such access", "Flashlight apps are always malware", "Permissions do not matter on mobile devices"], correct: 1, explanation: "A mismatch between requested permissions and app function is a major red flag." },
      { text: "How did client data end up in a competitor's pitch in this scenario?", options: ["Isaac emailed it accidentally", "The flashlight app harvested data from his phone using permissions it did not need", "A colleague leaked it deliberately", "The client shared it directly with the competitor"], correct: 1, explanation: "The app used the broad permissions Isaac granted at install to quietly access and transmit contacts and other data." },
      { text: "What is the safest source for downloading mobile apps for work-related use?", options: ["Any website offering a free download", "Links shared in unsolicited text messages", "Official app stores such as the platform's official app marketplace", "Forums recommending free alternatives"], correct: 2, explanation: "Official app stores have review processes that catch much malicious behaviour that third-party sites and unsolicited links bypass entirely." },
      { text: "Why is remote wipe capability important on a device holding work data?", options: ["It improves battery life", "It allows IT to erase sensitive data if the device is lost or stolen, preventing unauthorised access", "It speeds up app downloads", "It is only useful for company-owned devices"], correct: 1, explanation: "Remote wipe means a lost or stolen device cannot become a source of ongoing data exposure." },
      { text: "What should you do the moment you realise your work phone is lost or stolen?", options: ["Wait a day to see if it turns up", "Report it to IT immediately so it can be remotely locked or wiped", "Only report it if it contained sensitive files", "Change your email password and take no other action"], correct: 1, explanation: "Every minute of delay is a minute the device is exposed. Immediate reporting gives IT the best chance to lock or wipe it before data is accessed." }
    ]
  },
  {
    id: 9, name: "Cloud Security & Shadow IT", badge: "Module 9 of 10",
    story: {
      character: { name: "Stella Nakamura", role: "Graphic Designer", initials: "SN" },
      email: null,
      scenarioTitle: "The Faster Workaround",
      paragraphs: [
        "Stella's design team found the company's approved file-sharing system frustratingly slow for large client assets. Someone suggested a free project management app they'd used before — it was fast, easy to set up, and let them share files with a link in seconds. Within a week, the whole team was using it for client work, without telling IT.",
        "No one saw a problem. It felt like a small, sensible workaround for a real productivity issue. Client files, brand assets, and some contract drafts were uploaded and shared through the app over the following months.",
        "Three months later, the app's provider disclosed a data breach. Attackers had accessed customer accounts, including file contents. Cissy Technologies had no idea any client data had ever been stored there — the tool wasn't on IT's radar, had no security review, and no one to notify when the breach happened. This is shadow IT: technology used for work without approval or visibility, and its risk isn't apparent until something goes wrong.",
        "Approved tools go through security review, have monitored access, and IT knows to check on them when something like this happens. An unapproved tool has none of that — the convenience it offers up front is paid for later, often at a much higher cost."
      ],
      keyLesson: "Shadow IT — using tools for work without IT's knowledge or approval — removes the security review, monitoring, and incident response that approved systems have. Convenience today can become an invisible breach tomorrow, one that IT cannot even detect because they never knew the tool was in use.",
      actionHeading: "Choosing and requesting work tools safely:",
      actionSteps: [
        "Only use tools and platforms that have been approved by IT for handling company or client data",
        "If an approved tool is too slow or missing a feature you need, request a new tool through IT rather than finding a workaround",
        "Never upload client files, contracts, or brand assets to a personal or unapproved account",
        "Ask IT before your team adopts any new app or service, even a free one",
        "If you have already used an unapproved tool for work data, tell IT so they can assess and address any exposure"
      ]
    },
    quiz: [
      { text: "Why did Stella's team start using the unapproved app?", options: ["IT recommended it", "The approved system felt too slow for large client assets, so the team found a faster workaround", "It was required by a client", "The app was free and had better branding"], correct: 1, explanation: "A real productivity frustration led the team to adopt a tool without IT approval." },
      { text: "What is shadow IT?", options: ["Any software with a dark mode", "Technology used for work without approval or oversight from IT", "A type of malware", "An IT department's backup infrastructure"], correct: 1, explanation: "Shadow IT specifically refers to tools adopted outside IT's knowledge or approval — even when the intent is purely to be more productive." },
      { text: "Why didn't IT respond when the unapproved app was breached?", options: ["They chose not to respond", "They had no idea the tool was being used to store client data, since it was never approved or disclosed", "The breach did not affect the company", "IT does not respond to any third-party breaches"], correct: 1, explanation: "Because the tool was never approved or reported, IT had no visibility into it — meaning no monitoring and no way to know client data was exposed until the damage was already done." },
      { text: "What should you do if an approved company tool is too slow or missing a feature?", options: ["Find and adopt a faster unapproved alternative yourself", "Request the missing feature or a new tool through IT rather than working around it", "Continue struggling with the slow tool indefinitely", "Use your personal email instead"], correct: 1, explanation: "Requesting a solution through IT keeps the choice within a process that includes security review." },
      { text: "What is the safest thing to do if you realise you have already been using an unapproved tool for work data?", options: ["Say nothing and stop using it quietly", "Tell IT so they can assess the exposure and take appropriate action", "Delete your account on the tool and consider it resolved", "Only mention it if a breach is publicly announced"], correct: 1, explanation: "Only IT can properly assess what data may have been exposed and take the right follow-up action." }
    ]
  },
  {
    id: 10, name: "Security Culture & Reporting", badge: "Module 10 of 10",
    story: {
      character: { name: "Patricia Okonkwo", role: "Chief Operating Officer", initials: "PO" },
      email: null,
      scenarioTitle: "The Employee Who Said Nothing",
      paragraphs: [
        "An employee in the finance team, working late one evening, noticed a colleague from an unrelated department logged into files well outside their role — client account records they had no reason to touch. It seemed odd, but the employee didn't want to cause trouble or accuse a colleague of something that might have an innocent explanation. They said nothing.",
        "The access happened again. And again, on quiet, unremarkable nights, spread out enough that no single instance looked alarming. It continued for three months before an unrelated audit flagged the pattern. By then, the colleague had exfiltrated a significant volume of client data.",
        "Every person who noticed something odd during those three months — and there were several — had the same hesitation: not wanting to be wrong, not wanting to get a colleague in trouble, assuming someone else would say something. No one did, until the audit forced the issue.",
        "Security culture means closing that gap. It means every employee understands that reporting a concern is not an accusation — it is handing a small piece of information to people equipped to evaluate it properly. A false alarm costs a few minutes of someone's time. A missed one, as this case showed, can cost three months of undetected data theft."
      ],
      keyLesson: "The single most powerful defence in any organisation is a workforce that reports what it notices, without fear of being wrong or of appearing to accuse a colleague. Every module in this training has covered a different threat — but all of them depend on someone, somewhere, being willing to speak up.",
      actionHeading: "Building a reporting culture:",
      actionSteps: [
        "Report anything that seems unusual, even if you are not certain it means anything",
        "Remember that reporting is not accusing — you are handing off information, not making a judgement",
        "Report through official channels, not gossip or assumptions about what is happening",
        "Never assume someone else has already reported it",
        "Support colleagues who report in good faith, even when a concern turns out to be nothing"
      ],
      congratsMessage: "Congratulations — you have completed all 10 e-Safe training modules. You now have the knowledge to recognise and respond to the threats covered across this training. The final quiz is next: pass it to earn your official certificate."
    },
    quiz: [
      { text: "Why did the employee who first noticed the suspicious access stay silent?", options: ["They did not notice anything unusual", "They did not want to cause trouble or wrongly accuse a colleague", "They were told not to report it", "They assumed it was already being monitored"], correct: 1, explanation: "This exact hesitation is what let the incident continue undetected." },
      { text: "How long did the unauthorised access continue before it was detected?", options: ["One day", "One week", "Three months, until an unrelated audit flagged the pattern", "It was detected immediately"], correct: 2, explanation: "The behaviour continued undetected for three months because everyone who noticed something odd chose not to report it." },
      { text: "What does reporting a concern actually mean, according to this module?", options: ["Formally accusing a colleague of wrongdoing", "Handing off a piece of information to people equipped to evaluate it properly", "Guaranteeing that something wrong has happened", "Something that should only be done with certainty"], correct: 1, explanation: "Reporting is not an accusation or a verdict — it is simply surfacing information so the right people can assess it." },
      { text: "What does the module say a false alarm costs, compared to a missed real threat?", options: ["They cost the same amount", "A false alarm costs a few minutes of someone's time; a missed one can cost months of undetected damage", "False alarms are more costly than missed threats", "Neither has any real cost"], correct: 1, explanation: "The asymmetry is the whole point — reporting something that turns out to be nothing is cheap, while staying silent about something real can be extremely costly." },
      { text: "What is the central theme connecting all ten e-Safe training modules?", options: ["Technology alone can prevent every attack", "Every threat ultimately depends on someone being willing to notice and speak up", "Only IT staff are responsible for security", "Reporting is optional if you are not in a security role"], correct: 1, explanation: "Across phishing, insider threats, mobile security, and every other topic, the training consistently returns to one point: people who notice and report are the last and most powerful line of defence." }
    ]
  }
];

// ══════════════════════════════════════════════
// MODULE PAGE LOGIC — 2-PART FLOW
// URL: module.html?id=1        → Part 1 (story)
// URL: module.html?id=1&quiz=1 → Part 2 (MCQs)
// ══════════════════════════════════════════════
function initModulePage(employee) {
  const moduleTitleEl = document.getElementById('moduleTitle');
  if (!moduleTitleEl) return;

  const mParams = new URLSearchParams(window.location.search);
  const mId = parseInt(mParams.get('id')) || 1;
  const showQuiz = mParams.get('quiz') === '1';

  const mod = MODULES_DATA.find(m => m.id === mId);
  if (!mod) { window.location.href = 'dashboard.html'; return; }

  document.getElementById('moduleBadge').textContent = mod.badge;

  // ── PART 1 — STORY ──
  if (!showQuiz) {
    document.getElementById('partLabel').textContent = 'Part 1 of 2 — Learning';
    document.getElementById('modProgressPct').textContent = '50%';
    document.getElementById('modProgressFill').style.width = '50%';
    document.getElementById('moduleTitle').textContent = mod.name;

    const s = mod.story;
    document.getElementById('charAvatar').textContent = s.character.initials;
    document.getElementById('charName').textContent = s.character.name;
    document.getElementById('charRole').textContent = s.character.role;
    document.getElementById('scenarioTitle').textContent = s.scenarioTitle;
    document.getElementById('scenarioBody').innerHTML = s.paragraphs.map(p => `<p>${p}</p>`).join('');
    document.getElementById('keyLessonText').textContent = s.keyLesson;
    document.getElementById('actionStepsHeading').textContent = s.actionHeading;
    document.getElementById('actionStepsList').innerHTML = s.actionSteps.map((step, i) => `
      <li><span class="step-num-box">${i + 1}</span><span>${step}</span></li>`).join('');

    if (s.email) {
      document.getElementById('scenarioEmail').style.display = 'block';
      document.getElementById('emailFrom').textContent = s.email.from;
      document.getElementById('emailSubject').textContent = s.email.subject;
      document.getElementById('emailBody').textContent = s.email.body;
    }

    if (s.congratsMessage) {
      const congratsCard = document.getElementById('congratsCard');
      if (congratsCard) {
        congratsCard.style.display = 'flex';
        document.getElementById('congratsText').textContent = s.congratsMessage;
      }
    }

    document.getElementById('continueToQuizBtn').addEventListener('click', () => {
      window.location.href = `module.html?id=${mId}&quiz=1`;
    });

  // ── PART 2 — QUIZ ──
  } else {
    document.getElementById('part1Section').style.display = 'none';
    document.getElementById('part2Section').style.display = 'block';
    document.getElementById('partLabel').textContent = 'Part 2 of 2 — Quiz';
    document.getElementById('modProgressPct').textContent = '100%';
    document.getElementById('modProgressFill').style.width = '100%';
    document.getElementById('moduleTitle').textContent = mod.name + ' — Quiz';

    let qIndex = 0, qScore = 0, qSelected = null;
    const questions = [...mod.quiz].sort(() => Math.random() - 0.5);

    function renderQuestion() {
      qSelected = null;
      const q = questions[qIndex];
      document.getElementById('qLabel').textContent = `Question ${qIndex + 1} of 5`;
      document.getElementById('qTopic').textContent = mod.name;
      document.getElementById('quizProgressFill').style.width = `${(qIndex / 5) * 100}%`;
      document.getElementById('questionText').textContent = q.text;
      document.getElementById('submitBtn').disabled = true;

      const opts = document.getElementById('quizOptions');
      opts.innerHTML = q.options.map((o, i) => `
        <div class="quiz-option" data-i="${i}">
          <div class="opt-radio"><i class="fi fi-tr-check"></i></div>
          <span>${o}</span>
        </div>`).join('');

      opts.querySelectorAll('.quiz-option').forEach(el => {
        el.addEventListener('click', () => {
          opts.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
          el.classList.add('selected');
          qSelected = parseInt(el.dataset.i);
          document.getElementById('submitBtn').disabled = false;
        });
      });

      document.getElementById('quizIntroCard').style.display = 'none';
      document.getElementById('activeQuestion').style.display = 'block';
      document.getElementById('questionFeedback').style.display = 'none';
      document.getElementById('quizResult').style.display = 'none';
    }

    document.getElementById('startQuizBtn').addEventListener('click', renderQuestion);

    document.getElementById('submitBtn').addEventListener('click', () => {
      if (qSelected === null) return;
      const q = questions[qIndex];
      const correct = qSelected === q.correct;
      if (correct) qScore++;

      document.getElementById('activeQuestion').style.display = 'none';
      document.getElementById('questionFeedback').style.display = 'block';

      const banner = document.getElementById('feedbackBanner');
      banner.className = 'quiz-feedback-banner ' + (correct ? 'correct' : 'wrong');
      document.getElementById('feedbackIcon').className = correct ? 'fi fi-tr-check' : 'fi fi-tr-cross';
      document.getElementById('feedbackResult').textContent = correct ? 'Correct!' : 'Incorrect';
      document.getElementById('feedbackQuestion').textContent = q.text;
      document.getElementById('explanationText').textContent = q.explanation;

      document.getElementById('feedbackOptions').innerHTML = q.options.map((o, i) => {
        let cls = 'neutral';
        if (i === q.correct) cls = 'correct';
        else if (i === qSelected && !correct) cls = 'wrong';
        return `<div class="quiz-option ${cls}">
          <div class="opt-radio"><i class="fi fi-tr-check"></i></div>
          <span>${o}</span>
        </div>`;
      }).join('');

      document.getElementById('nextBtn').textContent = qIndex === 4 ? 'See results' : 'Next question';
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      qIndex++;
      if (qIndex >= 5) {
        document.getElementById('questionFeedback').style.display = 'none';
        document.getElementById('quizResult').style.display = 'block';

        const pct = Math.round((qScore / 5) * 100);
        const passed = pct >= 70;
        const hero = document.getElementById('resultHero');
        hero.className = 'results-hero ' + (passed ? 'pass' : 'fail');
        document.getElementById('resultIcon').className = passed ? 'fi fi-tr-trophy-star' : 'fi fi-tr-refresh';
        document.getElementById('resultHeadline').textContent = passed ? 'Module passed!' : 'Not quite — try again';
        document.getElementById('resultScore').textContent = pct + '%';
        document.getElementById('resultSub').textContent = `${qScore} of 5 correct`;

        const actions = document.getElementById('resultActions');
        if (passed) {
          const completed = employee.completedModules || [];
          if (!completed.includes(mId)) {
            completed.push(mId);
            employee.completedModules = completed;
            db.collection('employees').doc(employee.uid).set({ completedModules: completed }, { merge: true })
              .catch(err => console.error('Failed to save module progress:', err));
          }

          const nextMod = MODULES_DATA.find(m => m.id === mId + 1);
          actions.innerHTML = nextMod
            ? `<a href="module.html?id=${mId + 1}" class="btn-primary">Next: ${nextMod.name} &rarr;</a>
               <a href="dashboard.html" class="btn-outline" style="margin-top:10px;display:block;text-align:center;padding:13px">Back to dashboard</a>`
            : `<a href="quiz.html" class="btn-primary">Take the final quiz &rarr;</a>
               <a href="dashboard.html" class="btn-outline" style="margin-top:10px;display:block;text-align:center;padding:13px">Back to dashboard</a>`;
        } else {
          actions.innerHTML = `
            <a href="module.html?id=${mId}" class="btn-outline">Review module again</a>
            <a href="module.html?id=${mId}&quiz=1" class="btn-primary" style="margin-top:10px;display:block;text-align:center;padding:13px">Retake quiz &rarr;</a>`;
        }
      } else {
        document.getElementById('questionFeedback').style.display = 'none';
        renderQuestion();
      }
    });
  }
}
