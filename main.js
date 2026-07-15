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
    2: {
      name: "Recognizing Phishing Attacks",
      character: { name: "David Mensah", role: "Sales Executive", initials: "DM" },
      dialogue: "I almost clicked it. The email looked exactly like it came from our CEO — same name, same signature, everything. Only the email address gave it away.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Urgent Email",
      paragraphs: [
        "David receives an email marked URGENT from what appears to be the CEO of Cissy Technologies. It asks him to click a link and approve a wire transfer before end of day. The logo, font, and signature all look identical to official company emails.",
        "David almost clicks — but something makes him pause. He looks more carefully at the sender address. Instead of ceo@cissytechnologies.com, it reads ceo@cissytechnol0gies.com. The letter 'o' has been replaced with a zero.",
        "He reports it to IT immediately. The same email had been sent to 12 other employees that day."
      ],
      keyLesson: "Always check the sender's actual email address, not just the display name. Attackers craft emails that look identical to real ones — the address is usually where the deception breaks down.",
      actionHeading: "What David did right:",
      actionSteps: [
        "Paused before clicking even under urgency pressure",
        "Inspected the full sender email address carefully",
        "Reported the suspicious email to IT immediately"
      ]
    },
    3: {
      name: "Email Security Best Practices",
      character: { name: "Grace Abiodun", role: "HR Manager", initials: "GA" },
      dialogue: "Someone sent me a spreadsheet labelled 'Staff Salary Review 2026'. I opened it without thinking. My computer started acting strangely within minutes.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Tempting Attachment",
      paragraphs: [
        "Grace receives an email from an unfamiliar address with the subject line: 'Confidential — Staff Salary Review 2026.xlsx'. Curiosity gets the better of her and she opens the attachment without verifying the sender.",
        "Immediately, her screen flickers. A macro runs in the background. She has unknowingly installed a keylogger that will record every password she types for the next 48 hours.",
        "The damage could have been avoided. The sender's domain was not a Cissy Technologies address, and the email had no prior thread or context to explain why it was sent to her."
      ],
      keyLesson: "Never open attachments from unknown senders — even if the filename looks official or interesting. Verify the sender first. If you were not expecting a file, treat it as suspicious.",
      actionHeading: "Best practices to follow:",
      actionSteps: [
        "Never open attachments from senders you do not recognise",
        "Verify unexpected files by contacting the sender through a separate channel",
        "Report suspicious emails to IT before opening anything"
      ]
    },
    4: {
      name: "Strong Password Creation",
      character: { name: "Peter Ssali", role: "Accounts Officer", initials: "PS" },
      dialogue: "My password was my daughter's name and birth year. I used it for everything — work email, the client portal, even my personal bank. I thought it was fine until it wasn't.",
      scenarioTag: "Scenario",
      scenarioTitle: "One Password, Many Problems",
      paragraphs: [
        "Peter had been using the same password for three years across all his work and personal accounts. It was easy to remember — his daughter's name followed by her birth year.",
        "A data breach at an unrelated website exposed his email and password combination. Attackers used automated tools to try that same password on dozens of other services. Within hours, they had accessed his work email.",
        "The breach exposed confidential client communications and cost the company two weeks of IT remediation work."
      ],
      keyLesson: "A strong password is long, random, and unique to each account. Never reuse passwords across services. Use a passphrase of four or more unrelated words if you need something memorable.",
      actionHeading: "How to create strong passwords:",
      actionSteps: [
        "Use at least 12 characters mixing letters, numbers, and symbols",
        "Never reuse the same password across multiple accounts",
        "Use a passphrase — four random unrelated words are stronger than one short complex word"
      ]
    },
    5: {
      name: "Password Managers",
      character: { name: "Fatima Bello", role: "Project Coordinator", initials: "FB" },
      dialogue: "I used to write my passwords in a notebook. My colleague told me about password managers and honestly it changed everything — I only need to remember one master password now.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Notebook Problem",
      paragraphs: [
        "Fatima managed access to 14 different work platforms. Her solution was a small notebook in her desk drawer, filled with usernames and passwords written in plain text.",
        "During a fire drill, her desk was left unattended. A visitor photographed two pages before anyone noticed. Three accounts were compromised by the following morning.",
        "A password manager would have stored all 14 credentials in an encrypted vault — accessible only with one strong master password and a second verification step."
      ],
      keyLesson: "A password manager encrypts and stores all your credentials securely. You only need to remember one strong master password. It is far safer than notebooks, sticky notes, or browser-saved passwords.",
      actionHeading: "Getting started with a password manager:",
      actionSteps: [
        "Ask IT about the company-approved password manager",
        "Let it generate strong, unique passwords for every account",
        "Never write passwords in plain text — on paper or in unencrypted files"
      ]
    },
    6: {
      name: "Two-Factor Authentication",
      character: { name: "Emmanuel Kato", role: "Systems Analyst", initials: "EK" },
      dialogue: "Someone had my password. I got a login notification from a city I have never visited. But they could not get in because of the second factor. MFA saved my account.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Login From Abroad",
      paragraphs: [
        "Emmanuel receives a notification at 2am: a login attempt on his work account from a location in Eastern Europe. His password had been exposed in a credential stuffing attack months earlier.",
        "The attacker had the correct username and password. But when the system prompted for the second factor — a code from Emmanuel's phone app — the attacker had nothing. The login was blocked.",
        "Emmanuel reset his password the next morning. Because MFA was enabled, no data was accessed and no damage was done."
      ],
      keyLesson: "Two-factor authentication means an attacker needs both your password AND your physical device to log in. Even if your password is stolen, MFA stops the breach before it starts.",
      actionHeading: "Setting up MFA correctly:",
      actionSteps: [
        "Enable MFA on every work account that supports it",
        "Use an authenticator app rather than SMS — it is more secure",
        "Never share your authentication code with anyone, including IT staff"
      ]
    },
    8: {
      name: "Protecting Personal Data",
      character: { name: "Amina Diallo", role: "Customer Relations Officer", initials: "AD" },
      dialogue: "A client called us angry. Their personal details had appeared in a public forum. We traced it back to a spreadsheet that had been shared with the wrong permissions.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Shared Spreadsheet",
      paragraphs: [
        "Amina was preparing a client report and shared a spreadsheet via a cloud link. She set the permissions to 'Anyone with the link can view' for convenience, intending to fix it later.",
        "She forgot. The link was forwarded across three organisations before anyone noticed. The spreadsheet contained names, phone numbers, and email addresses of over 200 clients.",
        "A data protection complaint was filed. The company faced a formal investigation and reputational damage that took months to recover from."
      ],
      keyLesson: "Personal data must be shared only with the specific people who need it, with the minimum permissions required. 'Anyone with the link' is never an appropriate setting for client data.",
      actionHeading: "How to share data safely:",
      actionSteps: [
        "Always set file sharing to specific named recipients only",
        "Review and remove access once it is no longer needed",
        "Never share client data through personal email or public links"
      ]
    },
    9: {
      name: "Ransomware Prevention",
      character: { name: "Brian Ochieng", role: "Finance Analyst", initials: "BO" },
      dialogue: "I came in on Monday morning and my screen said all my files were encrypted. There was a demand for payment. Three months of work — just gone.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Monday Morning Message",
      paragraphs: [
        "Brian had clicked a link in an email the previous Friday that appeared to come from a courier company about a package delivery. The link downloaded a file that ran silently in the background over the weekend.",
        "By Monday, every file on his workstation had been encrypted by ransomware. A message demanded payment in cryptocurrency within 72 hours in exchange for the decryption key.",
        "Because Brian had no recent backup, and the company policy was to never pay ransoms, three months of financial reports were unrecoverable."
      ],
      keyLesson: "Ransomware enters through phishing links, infected downloads, and unpatched systems. Regular backups and cautious clicking are your two strongest defences.",
      actionHeading: "How to protect against ransomware:",
      actionSteps: [
        "Never click links in unexpected emails — verify the sender first",
        "Back up your work regularly to an approved company backup system",
        "Report unusual system behaviour to IT immediately — do not wait"
      ]
    },
    10: {
      name: "Malware Detection",
      character: { name: "Stella Nakamura", role: "Graphic Designer", initials: "SN" },
      dialogue: "I downloaded what I thought was a free design plugin. My antivirus flagged it later. IT told me it had already been sending data from my machine for two weeks.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Free Plugin",
      paragraphs: [
        "Stella needed a specific design tool for a client project. She found what appeared to be a free version on an unofficial website and downloaded the installer without checking the source.",
        "The installer contained a trojan — a piece of malicious software that disguised itself as a legitimate program. It ran quietly in the background, harvesting login credentials and sending them to an external server.",
        "IT detected unusual outbound traffic during a routine check two weeks later. By then, several credentials had been compromised and needed to be reset across multiple systems."
      ],
      keyLesson: "Only download software from official, approved sources. Free versions of paid tools from unofficial sites are among the most common malware delivery methods.",
      actionHeading: "How to avoid malware:",
      actionSteps: [
        "Only install software approved by IT or from official verified sources",
        "Never disable antivirus software even temporarily",
        "If your system behaves unusually, report it to IT immediately"
      ]
    },
    11: {
      name: "Safe Web Browsing",
      character: { name: "Collins Oduya", role: "Business Development Officer", initials: "CO" },
      dialogue: "I clicked on a search result that looked legitimate. The URL was almost right — just one extra letter. The page looked exactly like our banking portal.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Almost-Right URL",
      paragraphs: [
        "Collins was searching for the company's banking portal and clicked on the second result in the search engine. The page that loaded looked identical to the real portal — same logo, same layout, same colour scheme.",
        "He entered his credentials. Nothing happened. He assumed there was a technical issue and tried again on a different browser — this time on the real site.",
        "Both sets of credentials had been captured by the fake site. His account was accessed within the hour and a fraudulent transaction was initiated."
      ],
      keyLesson: "Always type important URLs directly into the browser address bar rather than clicking search results. Check for HTTPS and look carefully at the full domain before entering any credentials.",
      actionHeading: "Safe browsing habits:",
      actionSteps: [
        "Type URLs for important sites directly rather than searching for them",
        "Check for HTTPS and verify the full domain name before logging in",
        "Bookmark frequently used work portals to avoid typosquatting sites"
      ]
    },
    12: {
      name: "Public WiFi Security",
      character: { name: "Ruth Kamau", role: "Field Sales Representative", initials: "RK" },
      dialogue: "I was at the airport and connected to the free WiFi to send a quick client proposal. I did not think anything of it. Someone on the same network intercepted it.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Airport Connection",
      paragraphs: [
        "Ruth was travelling for a client meeting and connected to the airport's free public WiFi. She needed to send a proposal document and log in to the company's client management system.",
        "What Ruth did not know was that another person on the same network was running a packet-sniffing tool — software that captures unencrypted data passing through the network.",
        "The proposal, which contained pricing and client strategy information, was intercepted. A competitor received the information before Ruth's meeting even started."
      ],
      keyLesson: "Public WiFi is unencrypted and shared with strangers. Never access sensitive work systems on public WiFi without a VPN. When in doubt, use your mobile data instead.",
      actionHeading: "Staying safe on public networks:",
      actionSteps: [
        "Always use the company VPN when connecting to work systems on public WiFi",
        "Avoid accessing sensitive accounts — email, banking, client portals — on public networks",
        "Use your phone's mobile hotspot as a safer alternative to public WiFi"
      ]
    },
    13: {
      name: "Mobile Device Security",
      character: { name: "Isaac Banda", role: "Operations Supervisor", initials: "IB" },
      dialogue: "I left my phone on the table at a restaurant. Someone picked it up. It had no PIN. By the time I realised, my work email had been accessed and a message sent to a client.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Unlocked Phone",
      paragraphs: [
        "Isaac stepped away from his table at a restaurant for a few minutes, leaving his phone face-down but unlocked. When he returned, it was gone.",
        "Because the phone had no screen lock, the person who took it had immediate access to Isaac's work email, the company's client management app, and several shared document folders.",
        "A fraudulent email was sent to a key client before IT could remotely wipe the device. The client relationship took months to repair."
      ],
      keyLesson: "Your mobile device is a gateway to company systems. It must be locked with a strong PIN or biometric at all times, and set to auto-lock after a short period of inactivity.",
      actionHeading: "Mobile device security basics:",
      actionSteps: [
        "Enable a strong PIN, password, or biometric lock on your device",
        "Set your phone to auto-lock after 30 seconds or less of inactivity",
        "Report lost or stolen work devices to IT immediately for remote wipe"
      ]
    },
    14: {
      name: "Cloud Storage Safety",
      character: { name: "Miriam Osei", role: "Legal Officer", initials: "MO" },
      dialogue: "I stored a contract on my personal Google Drive so I could work from home. I did not realise personal cloud storage is not encrypted the same way our company systems are.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Personal Drive",
      paragraphs: [
        "Miriam needed to work on a contract over the weekend and uploaded it to her personal Google Drive for easy access. She did not think it was a problem — the document was not going anywhere.",
        "Her personal email account was compromised six weeks later in a phishing attack. The attacker accessed her Google Drive and downloaded 18 documents, including the contract with sensitive client and commercial terms.",
        "The company's approved cloud storage had version control, access logging, and encryption. Her personal account had none of those protections."
      ],
      keyLesson: "Company documents must only be stored in company-approved cloud systems. Personal cloud storage accounts do not meet the security standards required for work data.",
      actionHeading: "Cloud storage rules:",
      actionSteps: [
        "Only store work documents in company-approved cloud platforms",
        "Never copy work files to personal Google Drive, Dropbox, or similar services",
        "If you need remote access to work files, ask IT to set it up securely"
      ]
    },
    15: {
      name: "Data Backup Strategies",
      character: { name: "Kwame Asante", role: "Research Officer", initials: "KA" },
      dialogue: "My laptop hard drive failed completely. Three years of research data — gone overnight. I had never run a backup because I kept thinking I would do it later.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Failed Drive",
      paragraphs: [
        "Kwame's laptop showed signs of slowing down for weeks before the hard drive finally failed completely. He had been meaning to back up his files but kept postponing it.",
        "When IT examined the drive, it was unrecoverable. Kwame lost three years of research notes, interview transcripts, and analysis documents. None of it existed anywhere else.",
        "The project deadline could not be met. The company had to renegotiate the contract with the client at significant cost."
      ],
      keyLesson: "Data that only exists in one place does not truly exist. Back up your work regularly to the company-approved backup system. Do not wait until something goes wrong.",
      actionHeading: "Backup best practices:",
      actionSteps: [
        "Back up important files to the company's approved backup system at least weekly",
        "Do not rely solely on your local hard drive for critical documents",
        "Test your backups occasionally to ensure files can actually be restored"
      ]
    },
    16: {
      name: "Physical Security",
      character: { name: "Janet Mwangi", role: "Receptionist", initials: "JM" },
      dialogue: "A man followed an employee through the security door without badging in. He walked straight to the server room. We had never thought about tailgating as a real threat.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Open Door",
      paragraphs: [
        "A well-dressed visitor arrived at Cissy Technologies' offices during a busy morning. When a staff member opened the security door after badging in, the visitor followed closely behind without swiping their own badge.",
        "The visitor walked confidently through the office, spent ten minutes near the server room, and left before anyone questioned him. A USB drive was later found plugged into a server port.",
        "The USB contained malware. The physical breach caused the same damage as a remote cyberattack — and it happened because one door was held open out of politeness."
      ],
      keyLesson: "Physical security is cybersecurity. Never hold secure doors open for people you do not recognise, regardless of how official they appear. Everyone must badge in separately.",
      actionHeading: "Physical security habits:",
      actionSteps: [
        "Never allow anyone to follow you through a secured door without their own badge",
        "Challenge or report unfamiliar individuals in restricted areas",
        "Never leave your workstation unlocked and unattended, even briefly"
      ]
    },
    17: {
      name: "Incident Reporting",
      character: { name: "Samuel Mwenda", role: "Software Developer", initials: "SM" },
      dialogue: "I noticed strange processes running on my machine and thought maybe it was just a software update. I waited three days before mentioning it. By then the attacker had moved laterally to two other systems.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Three-Day Delay",
      paragraphs: [
        "Samuel noticed his computer was running unusually slowly and saw unfamiliar processes in the task manager. He assumed it was a routine system update and continued working.",
        "Three days later, when the issue persisted, he finally mentioned it to a colleague. IT was called in and discovered that his machine had been compromised and used as a launchpad to probe two other systems on the network.",
        "Had Samuel reported it immediately, the attacker's window would have been hours, not days. Early reporting is one of the most powerful tools against a breach."
      ],
      keyLesson: "Report anything suspicious immediately — even if you are not sure it is a real threat. It is far better to report something that turns out to be nothing than to stay silent and allow a real attack to spread.",
      actionHeading: "When and how to report:",
      actionSteps: [
        "Report suspicious activity to IT the moment you notice it — do not wait",
        "Do not try to investigate or fix the issue yourself",
        "Document what you saw: time, what happened, and what you did"
      ]
    },
    18: {
      name: "Privacy & Compliance",
      character: { name: "Esther Nakato", role: "Compliance Officer", initials: "EN" },
      dialogue: "We received a complaint from a client because their data was used for a purpose they had not consented to. A well-meaning colleague thought they were being helpful. They were not.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Helpful Colleague",
      paragraphs: [
        "A member of Cissy Technologies' marketing team noticed that the client database contained contact details for people who had purchased a product two years earlier. Without checking with the compliance team, they used the list to send a promotional campaign.",
        "Several clients complained that they had not consented to marketing communications. One filed a formal data protection complaint with the relevant authority.",
        "The team member had meant no harm. But consent is specific — permission to store data for one purpose does not mean permission to use it for another."
      ],
      keyLesson: "Personal data can only be used for the specific purpose it was collected for. Using client data for any other purpose — even a helpful one — without proper consent is a compliance violation.",
      actionHeading: "Privacy compliance basics:",
      actionSteps: [
        "Only use client data for the purpose it was collected and consented to",
        "Check with the compliance team before using any client data in a new way",
        "Delete or anonymise personal data when it is no longer needed"
      ]
    },
    19: {
      name: "Advanced Threats",
      character: { name: "Derek Otieno", role: "Network Administrator", initials: "DO" },
      dialogue: "The attacker had been in our network for 47 days before we detected them. They were quiet, patient, and methodical. It was not a smash-and-grab — it was a long game.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Silent Intruder",
      paragraphs: [
        "Derek's network monitoring tool flagged an unusual pattern: small amounts of data leaving the network at 3am every few days. It had been happening for over six weeks.",
        "Investigation revealed that an attacker had gained entry through a phishing email and spent 47 days quietly mapping the network, identifying high-value assets, and slowly exfiltrating sensitive project files.",
        "This type of attack — called an Advanced Persistent Threat — is designed to go unnoticed for as long as possible. The attacker's goal was not to cause immediate visible damage but to steal information over time."
      ],
      keyLesson: "Advanced attacks are slow and silent. Regular security monitoring, strong access controls, and prompt incident reporting are the main defences against attackers who play the long game.",
      actionHeading: "Defending against advanced threats:",
      actionSteps: [
        "Report any unusual system behaviour to IT regardless of how minor it seems",
        "Follow the principle of least privilege — only access systems your role requires",
        "Be suspicious of any unexpected changes to files, settings, or access permissions"
      ]
    },
    20: {
      name: "Security Culture",
      character: { name: "Patricia Okonkwo", role: "Chief Operating Officer", initials: "PO" },
      dialogue: "Security culture is not about rules and policies. It is about every single person in this organisation choosing to do the right thing even when no one is watching.",
      scenarioTag: "Scenario",
      scenarioTitle: "The Final Lesson",
      paragraphs: [
        "Cissy Technologies conducted an internal phishing simulation — a controlled test where fake phishing emails were sent to all staff to measure awareness. Over 60 percent of employees clicked the link in the first simulation.",
        "After the e-Safe training programme was completed, the same simulation was run again. This time, fewer than 8 percent clicked. Those who did reported it to IT within the hour.",
        "The difference was not technology or policy. It was knowledge, awareness, and a shared sense of responsibility. Security culture is what happens when every person understands that they are the last line of defence."
      ],
      keyLesson: "You have now completed all 20 modules. Security is not a one-time event — it is a daily habit. Share what you have learned, stay alert, and report anything suspicious. Congratulations.",
      actionHeading: "Carrying this forward:",
      actionSteps: [
        "Apply what you have learned every day — in emails, passwords, and physical spaces",
        "Share knowledge with colleagues — a more aware team is a safer team",
        "Stay updated: cybersecurity threats evolve, and so should your awareness"
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


// ═══════════════════════════════════════════════
// QUIZ DATA — 50 QUESTIONS
// ═══════════════════════════════════════════════
const QUIZ_QUESTIONS = [
  { id:1, module:1, question:"Who is responsible for cybersecurity at Cissy Technologies?", options:["Only the IT department","Only senior management","Every employee in the organisation","Only employees with system access"], correct:2, explanation:"Cybersecurity is everyone's responsibility. Every employee's daily decisions directly affect the organisation's security." },
  { id:2, module:1, question:"Why do attackers target employees rather than just technical systems?", options:["Employees are easier to find online","People are often the easiest way into an organisation","Technical systems are too expensive to attack","Employees always have admin access"], correct:1, explanation:"People are frequently targeted because human error — clicking a bad link, sharing a password — is often easier to exploit than breaking through technical defences." },
  { id:3, module:2, question:"You receive an urgent email from your CEO asking you to approve a wire transfer immediately. What should you do first?", options:["Approve it — it came from the CEO","Click the link to review the details","Check the sender's actual email address carefully","Forward it to your whole team"], correct:2, explanation:"Always verify the sender's actual email address, not just the display name. Attackers spoof display names to look like executives." },
  { id:4, module:2, question:"Which of the following is the most reliable way to verify a suspicious email is legitimate?", options:["Check if the email has the company logo","Contact the sender through a separate channel like a phone call","Look for spelling mistakes in the email body","Check if the email has an unsubscribe link"], correct:1, explanation:"Contacting the sender through a separate, verified channel is the most reliable way to confirm whether a suspicious communication is genuine." },
  { id:5, module:2, question:"An email address reads 'ceo@cissytechnol0gies.com' using a zero instead of the letter 'o'. This is an example of:", options:["A formatting error by the email provider","A typosquatting attack","An internal company alias","An email forwarding address"], correct:1, explanation:"Typosquatting involves registering domain names that look almost identical to real ones, with subtle character substitutions." },
  { id:6, module:3, question:"You receive an email with an attachment labelled 'Salary Review 2026' from an address you don't recognise. What should you do?", options:["Open it — the filename looks official","Save it first, then open it later","Delete it and report it to IT","Forward it to HR to check"], correct:2, explanation:"Never open attachments from unrecognised senders. Report suspicious emails to IT before taking any action." },
  { id:7, module:3, question:"What does a keylogger do?", options:["Locks your keyboard remotely","Records every keystroke you type, including passwords","Manages your login credentials securely","Blocks unauthorised keyboard access"], correct:1, explanation:"A keylogger is malware that silently records everything you type — including usernames and passwords — and sends the data to an attacker." },
  { id:8, module:4, question:"Which of the following is the strongest password?", options:["Password123","James1990","correct-horse-battery-staple","P@ss!"], correct:2, explanation:"A passphrase of four or more random unrelated words is longer and harder to crack than short complex passwords. Length is one of the most important factors in password strength." },
  { id:9, module:4, question:"Peter used the same password on a work system and an unrelated website. The website was breached. What is the attacker most likely to do next?", options:["Nothing — they only have access to the breached website","Try the same credentials on other services including work systems","Sell the password but not use it themselves","Contact Peter to warn him"], correct:1, explanation:"Credential stuffing attacks automatically try stolen username and password combinations across multiple services." },
  { id:10, module:4, question:"How often should you change your password if there is no known breach?", options:["Every week","Every day","Only when there is a reason to believe it has been compromised","Every month regardless"], correct:2, explanation:"Current guidance recommends changing passwords when there is a known or suspected compromise rather than on a fixed schedule." },
  { id:11, module:5, question:"What is the main advantage of using a password manager?", options:["It remembers passwords so you never need to change them","It allows you to use the same password everywhere safely","It generates and stores unique strong passwords for every account","It shares your passwords securely with your team"], correct:2, explanation:"A password manager generates strong, unique passwords for every account and stores them in an encrypted vault." },
  { id:12, module:5, question:"Fatima wrote her passwords in a notebook in her desk. Why is this a security risk?", options:["Notebooks are illegal in secure workplaces","Physical documents with credentials can be photographed or stolen","Handwriting is easy to forge","Notebooks cannot store complex passwords"], correct:1, explanation:"Written passwords are physical credentials. They can be photographed, stolen, or read by anyone who accesses the physical space." },
  { id:13, module:6, question:"An attacker has stolen Emmanuel's correct username and password. Why were they still unable to log in?", options:["The account was already logged in elsewhere","The system blocked the login due to location","Two-factor authentication required a code from his phone","The password had already expired"], correct:2, explanation:"MFA requires a second factor — typically a time-sensitive code on a physical device — that the attacker cannot access even with the correct password." },
  { id:14, module:6, question:"Someone calls claiming to be from IT and asks for your current MFA code. What should you do?", options:["Give them the code — IT needs it to help you","Give them the code but change your password after","Refuse — MFA codes should never be shared with anyone","Give them the code and report it later"], correct:2, explanation:"MFA codes must never be shared with anyone — including people claiming to be IT support." },
  { id:15, module:7, question:"A caller claiming to be from IT asks Sarah for her employee ID to 'fix a security issue'. What is the best response?", options:["Provide it — IT needs the information to help","Politely end the call and contact IT through official channels","Ask the caller to email the request instead","Provide only partial information to be safe"], correct:1, explanation:"Legitimate IT support will never request sensitive information over an unsolicited call. Always verify by calling IT through the official company directory." },
  { id:16, module:7, question:"What makes social engineering attacks particularly effective?", options:["They use advanced hacking tools","They exploit human psychology rather than technical vulnerabilities","They are impossible to detect","They always involve email"], correct:1, explanation:"Social engineering exploits trust, authority, urgency, and fear — psychological triggers that bypass normal caution." },
  { id:17, module:7, question:"An attacker gathers publicly available information about you before calling. This technique is called:", options:["Phishing","Pretexting","Baiting","Tailgating"], correct:1, explanation:"Pretexting involves researching a target to build a believable false identity. Knowing your name and department makes a fraudulent call far more convincing." },
  { id:18, module:8, question:"Amina shared a client spreadsheet with 'Anyone with the link can view'. What is the main risk?", options:["The file may be too large to open","The link can be forwarded to anyone, exposing the data widely","Google Drive does not support spreadsheets","The clients may see each other's data within the file"], correct:1, explanation:"Open sharing links can be forwarded indefinitely. Client data must only be shared with specific named individuals who need it." },
  { id:19, module:8, question:"What is the principle of minimum necessary access when sharing data?", options:["Share data with as many people as possible for transparency","Only share data with people who genuinely need it for their role","Give everyone access and trust them to use it responsibly","Share data freely within the company but not externally"], correct:1, explanation:"The minimum necessary access principle means data is only shared with people who have a legitimate need for it." },
  { id:20, module:9, question:"Brian clicked a link in a fake courier email and ransomware encrypted all his files. What was the most critical mistake?", options:["He used a work computer for personal emails","He clicked a link in an unexpected email without verifying it","He did not have antivirus software installed","He opened the email at the wrong time of day"], correct:1, explanation:"Clicking links in unexpected emails is one of the most common ransomware entry points. Always verify the sender before clicking." },
  { id:21, module:9, question:"What is the most effective defence against losing data to a ransomware attack?", options:["Paying the ransom quickly","Keeping regular, tested backups in a separate location","Turning off your computer when not in use","Using a VPN at all times"], correct:1, explanation:"Regular backups stored separately from the main system mean ransomware cannot permanently destroy your data." },
  { id:22, module:10, question:"Stella downloaded a free design plugin from an unofficial website. What type of malware did it contain?", options:["Ransomware","A trojan","Spyware","A worm"], correct:1, explanation:"A trojan disguises itself as legitimate software. Once installed, it performs malicious actions while appearing to be a normal application." },
  { id:23, module:10, question:"Which of the following is the safest source for downloading software for work use?", options:["Any website with good reviews","The first result in a search engine","Official vendor websites or IT-approved sources only","Free download aggregator sites"], correct:2, explanation:"Only download software from official sources or platforms approved by your IT department." },
  { id:24, module:11, question:"Collins entered his credentials on a site that looked identical to his banking portal but was found through a search result. What type of attack was this?", options:["Brute force attack","Credential stuffing","Typosquatting / fake website attack","Session hijacking"], correct:2, explanation:"Attackers create fake websites that look identical to real ones. Finding important sites through search results increases the risk of landing on a fake." },
  { id:25, module:11, question:"What does HTTPS in a website's URL indicate?", options:["The website is owned by a trusted company","The connection between your browser and the site is encrypted","The site has been verified by the government","The site is free from malware"], correct:1, explanation:"HTTPS means the connection is encrypted in transit. However, it does not guarantee the site is legitimate — fake sites can also use HTTPS." },
  { id:26, module:11, question:"What is the safest way to access an important work portal?", options:["Search for it using a search engine each time","Click a link from an email","Type the URL directly or use a saved bookmark","Ask a colleague to send you the link"], correct:2, explanation:"Typing the URL directly or using a saved bookmark eliminates the risk of landing on a typosquatted site." },
  { id:27, module:12, question:"Ruth sent a client proposal over airport public WiFi without a VPN. What happened?", options:["Her email was blocked by the airport firewall","The proposal was intercepted by someone on the same network","The file was too large to send over public WiFi","Nothing — public WiFi is encrypted by default"], correct:1, explanation:"Public WiFi is typically unencrypted. Anyone on the same network can capture data being transmitted." },
  { id:28, module:12, question:"What is the safest alternative to using public WiFi for sensitive work tasks?", options:["Using incognito mode in your browser","Using your phone's mobile data as a hotspot","Connecting to any available password-protected WiFi","Disabling WiFi and working offline"], correct:1, explanation:"Your phone's mobile data connection is encrypted by the mobile network and is significantly safer than public WiFi." },
  { id:29, module:13, question:"Isaac left his unlocked phone on a restaurant table. What was the immediate security risk?", options:["The phone battery could be damaged","Anyone who picked it up had full access to his work apps and email","The phone's WiFi could be accessed remotely","The phone could be infected by nearby devices"], correct:1, explanation:"An unlocked phone is an open door. Without a screen lock, anyone who picks it up has immediate access to email, apps, and company data." },
  { id:30, module:13, question:"What should you do immediately if your work phone or laptop is lost or stolen?", options:["Wait to see if it turns up before taking action","Report it to IT immediately so the device can be remotely wiped","Change your passwords from another device the next day","Post about it on social media to help find it"], correct:1, explanation:"Report lost or stolen devices to IT immediately so remote wipe can erase sensitive data before an attacker accesses it." },
  { id:31, module:14, question:"Miriam stored a client contract in her personal Google Drive for convenience. Why was this a security problem?", options:["Google Drive does not support PDF files","Personal cloud accounts lack the encryption and access controls of company systems","File sizes are restricted on personal accounts","Google Drive is blocked by the company firewall"], correct:1, explanation:"Personal cloud storage accounts do not have the access logging, encryption standards, or security controls of company-approved systems." },
  { id:32, module:14, question:"Which of the following is an acceptable way to access work files remotely?", options:["Copy them to a personal Dropbox","Email them to your personal Gmail","Use the company-approved VPN and remote access system","Upload them to a free file sharing website temporarily"], correct:2, explanation:"Company-approved remote access systems are designed to be secure. Personal cloud services do not meet the required security standards." },
  { id:33, module:15, question:"Kwame lost three years of research data when his hard drive failed. What was the root cause?", options:["He was using an outdated operating system","He had no backup of his files outside his local hard drive","His antivirus deleted the files by mistake","He had not saved the files properly"], correct:1, explanation:"Data that only exists in one place is always at risk. A failed hard drive can permanently destroy anything that has not been backed up." },
  { id:34, module:15, question:"How often should you back up important work files?", options:["Once a year during the annual IT review","Only when you remember to","Regularly — at least weekly, or whenever significant work is done","Only before going on leave"], correct:2, explanation:"Regular backups minimise how much work you could lose in the event of a failure. Important work should be backed up frequently." },
  { id:35, module:16, question:"An unfamiliar visitor followed a staff member through a secured door without badging in. This is called:", options:["Spoofing","Tailgating","Shoulder surfing","Dumpster diving"], correct:1, explanation:"Tailgating is when an unauthorised person follows an authorised person through a secured access point, bypassing physical security entirely." },
  { id:36, module:16, question:"A well-dressed stranger is walking confidently through a restricted area of the office. What should you do?", options:["Assume they are a visitor who has already been checked in","Politely challenge them or report them to security immediately","Follow them to see where they are going","Ignore it — they look like they belong"], correct:1, explanation:"Confidence and professional appearance are often used to bypass physical security checks. Always challenge or report unfamiliar individuals in restricted areas." },
  { id:37, module:17, question:"Samuel noticed unusual processes on his computer but waited three days before reporting it. What was the consequence?", options:["The issue resolved itself naturally","The attacker had three extra days to move through the network","IT was able to fix it more quickly with more information","The delayed report had no effect on the outcome"], correct:1, explanation:"Every hour of delay in reporting gives an attacker more time to cause damage or spread to other systems." },
  { id:38, module:17, question:"You notice something unusual on your system but are not sure if it is a real threat. What should you do?", options:["Investigate it yourself to confirm before bothering IT","Wait to see if it gets worse before reporting","Report it to IT immediately — even if you are not certain","Ask a colleague if they have noticed the same thing first"], correct:2, explanation:"It is always better to report something that turns out to be nothing than to stay silent about a real threat." },
  { id:39, module:18, question:"A marketing team member sent promotional emails to clients using data collected for a different purpose. What rule did they violate?", options:["The company social media policy","Data privacy law — data can only be used for the purpose it was collected for","The company email formatting guidelines","The terms of service of the email platform"], correct:1, explanation:"Data protection law requires that personal data is only used for the specific purpose for which it was collected." },
  { id:40, module:18, question:"A client requests that their personal data be deleted from your systems. What should you do?", options:["Ignore it — data deletion is an IT task","Delete what you can find and let IT know","Escalate to the compliance team to handle it properly","Tell the client the data cannot be deleted once collected"], correct:2, explanation:"Data deletion requests have legal weight and must be handled through the proper compliance process to ensure full and documented deletion." },
  { id:41, module:19, question:"Derek discovered that an attacker had been quietly inside the network for 47 days. This type of attack is known as:", options:["A denial-of-service attack","A brute force attack","An Advanced Persistent Threat (APT)","A zero-day exploit"], correct:2, explanation:"An Advanced Persistent Threat (APT) is a long-term targeted attack where an intruder remains undetected for an extended period while gathering information." },
  { id:42, module:19, question:"An APT attacker is inside the network. What is their most likely primary goal?", options:["To crash all systems immediately","To demand ransom as quickly as possible","To quietly steal data over time without being detected","To lock employees out of their accounts"], correct:2, explanation:"APT attackers are motivated by long-term intelligence gathering. Their goal is to stay hidden while extracting valuable data over weeks or months." },
  { id:43, module:19, question:"Which behaviour is the most effective early warning sign of an APT?", options:["A system running slightly slower than normal","Small, unusual amounts of data leaving the network at odd hours","Employees receiving more spam than usual","Software updates happening automatically"], correct:1, explanation:"Slow, small data exfiltration at unusual hours is a classic APT indicator. Regular monitoring is key to catching these attacks early." },
  { id:44, module:20, question:"After completing e-Safe training, phishing click-through rates dropped from 60% to 8%. What does this demonstrate?", options:["Employees were already too busy to click emails","Better spam filters were installed during the programme","Training and awareness directly improve security behaviour","The simulated emails became easier to spot over time"], correct:2, explanation:"Measurable improvements in behaviour following training demonstrate that security culture change is achievable through awareness and education." },
  { id:45, module:20, question:"A colleague receives a suspicious email but does not want to bother IT with 'probably nothing'. What should you tell them?", options:["They are right — only report things you are sure about","IT would rather investigate and find nothing than miss a real threat","They should delete it and not mention it","They should ask their manager to decide"], correct:1, explanation:"Security culture means everyone feels empowered to report suspicious activity. No concern is too small — IT will always investigate." },
  { id:46, module:3, question:"You receive an email asking you to Reply All to confirm your attendance at a meeting. The sender is unknown. What should you do?", options:["Reply All immediately so you are not missed","Reply only to the original sender to be polite","Do not reply — verify the sender before taking any action","Forward it to your manager and wait for instructions"], correct:2, explanation:"Replying to emails from unknown senders confirms your address is active and can expose you to further attacks." },
  { id:47, module:6, question:"Which is more secure for two-factor authentication: SMS text messages or an authenticator app?", options:["SMS — because it uses your registered phone number","An authenticator app — it is not vulnerable to SIM-swapping attacks","They are equally secure","SMS — because it leaves a record with the phone company"], correct:1, explanation:"SMS-based MFA can be compromised through SIM-swapping. Authenticator apps generate codes locally and are not vulnerable to this." },
  { id:48, module:9, question:"Your organisation's policy is to never pay ransoms. Why is this the correct approach?", options:["It is too expensive and insurance will not cover it","Paying does not guarantee data recovery and funds future attacks","Ransomware attackers always return the data anyway","Paying ransom is illegal in most countries"], correct:1, explanation:"Paying a ransom does not guarantee the attacker will decrypt your files, and it funds criminal operations. Restore from clean backups instead." },
  { id:49, module:1, question:"Which of the following best describes a security-first culture?", options:["Only using company-approved devices","Every person in the organisation treating security as their own responsibility","Having the largest possible IT security team","Installing the most expensive security software available"], correct:1, explanation:"A security-first culture means every individual understands their responsibility and acts accordingly. Culture drives security more than technology alone." },
  { id:50, module:16, question:"You are leaving your workstation briefly to get coffee. What should you do?", options:["Leave it logged in — you will be back in two minutes","Lock your screen before stepping away","Log out completely and restart the computer","Close only the most sensitive applications"], correct:1, explanation:"Always lock your screen when stepping away from your workstation — even briefly. This prevents unauthorised access to open files and sessions." }
];

// Module names for topic labels
const QUIZ_MODULE_NAMES = {
  1:"Cybersecurity Intro", 2:"Phishing Attacks", 3:"Email Security",
  4:"Password Creation", 5:"Password Managers", 6:"Two-Factor Auth",
  7:"Social Engineering", 8:"Personal Data", 9:"Ransomware",
  10:"Malware Detection", 11:"Safe Browsing", 12:"Public WiFi",
  13:"Mobile Security", 14:"Cloud Storage", 15:"Data Backup",
  16:"Physical Security", 17:"Incident Reporting", 18:"Privacy & Compliance",
  19:"Advanced Threats", 20:"Security Culture"
};

// ═══════════════════════════════════════════════
// QUIZ LOGIC
// ═══════════════════════════════════════════════
const startQuizBtn = document.getElementById('startQuizBtn');

if (startQuizBtn) {
  // User avatar
  const quizUserRaw = localStorage.getItem('esafe_user');
  const quizUser = quizUserRaw ? JSON.parse(quizUserRaw) : { fullName: "Guest" };
  const quizInitials = quizUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const quizAvatarEl = document.getElementById('userAvatar');
  if (quizAvatarEl) quizAvatarEl.textContent = quizInitials || 'U';

  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let selectedOption = null;
  let results = [];

  // Shuffle helper
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
    document.getElementById('qLabel').textContent = `Question ${currentIndex + 1} of 50`;
    document.getElementById('qTopic').textContent = QUIZ_MODULE_NAMES[q.module] || `Module ${q.module}`;
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('quizProgressFill').style.width = `${(currentIndex / 50) * 100}%`;

    const submitBtn = document.getElementById('submitAnswerBtn');
    submitBtn.disabled = true;

    // Render options
    const optionsEl = document.getElementById('quizOptions');
    const shuffledOpts = q.options.map((text, i) => ({ text, origIndex: i }));
    optionsEl.innerHTML = shuffledOpts.map((opt, i) => `
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

    // Show feedback screen
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

    // Render options with correct/wrong highlights
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

    // Last question
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (currentIndex === 49) {
      nextBtn.textContent = 'See my results';
    } else {
      nextBtn.textContent = 'Next question';
    }
  }

  function nextQuestion() {
    currentIndex++;
    document.getElementById('quizFeedback').style.display = 'none';

    if (currentIndex >= 50) {
      // Save results and go to results page
      localStorage.setItem('esafe_quiz_score', score);
      localStorage.setItem('esafe_quiz_results', JSON.stringify(results));
      window.location.href = 'results.html';
    } else {
      document.getElementById('quizQuestion').style.display = 'block';
      renderQuestion();
    }
  }

  startQuizBtn.addEventListener('click', startQuiz);
  document.getElementById('submitAnswerBtn').addEventListener('click', submitAnswer);
  document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
}
