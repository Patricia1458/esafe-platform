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


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SECURITY UTILITIES
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

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

function safeGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Storage error:", key);
  }
}

function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email) && email.length <= 254;
}

function isValidName(name) {
  const pattern = /^[a-zA-Z\s'\-\.]{2,100}$/;
  return pattern.test(name.trim());
}


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

    // Validate full name using secure isValidName check
    if (!isValidName(fullName.value)) {
      showError(fullName, 'fullNameError');
      isValid = false;
    } else {
      clearError(fullName, 'fullNameError');
    }

    // Validate email using secure isValidEmail check
    if (!isValidEmail(workEmail.value.trim())) {
      showError(workEmail, 'workEmailError');
      isValid = false;
    } else {
      clearError(workEmail, 'workEmailError');
    }

    if (!isValid) return;

    // Sanitise all inputs before saving to localStorage
    const userData = {
      fullName: sanitise(fullName.value),
      workEmail: sanitise(workEmail.value),
      department: sanitise(department.value) || 'Not specified',
      registeredAt: new Date().toISOString()
    };
    safeSet('esafe_user', userData);

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

  const DASH_MODULES = [
    { num: 1, name: "Social Threats",        icon: "fi fi-tr-shield-exclamation",  desc: "Phishing, social engineering, vishing & smishing" },
    { num: 2, name: "Credentials & Access",  icon: "fi fi-tr-lock",                desc: "Passwords, password managers & two-factor authentication" },
    { num: 3, name: "Malware & Attacks",     icon: "fi fi-tr-virus",               desc: "Ransomware, trojans, USB risks & man-in-the-middle" },
    { num: 4, name: "Safe Habits & Devices", icon: "fi fi-tr-globe-shield",        desc: "Safe browsing, public WiFi, device security & updates" },
    { num: 5, name: "Data & Compliance",     icon: "fi fi-ts-compliance-document", desc: "Data privacy, cloud storage, incident reporting & compliance" },
  ];

  // Load user
  const userData = safeGet('esafe_user') || { fullName: 'Learner' };
  const firstName = userData.fullName.split(' ')[0];
  document.getElementById('welcomeTitle').textContent = `Welcome back, ${firstName}!`;
  const initials = userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) avatarEl.textContent = initials || 'U';

  // Seed empty progress on first visit
  if (localStorage.getItem('esafe_completed_modules') === null) {
    safeSet('esafe_completed_modules', []);
  }

  function renderDashboard() {
    const completed = safeGet('esafe_completed_modules') || [];
    const completedCount = completed.length;
    const remainingCount = 5 - completedCount;
    const pct = Math.round((completedCount / 5) * 100);
    const allDone = completedCount === 5;
    const quizPassed = localStorage.getItem('esafe_quiz_passed') === 'true';

    // Progress bar
    document.getElementById('progressPct').textContent = pct + '%';
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('welcomeBadge').textContent = `${completedCount} of 5 modules completed`;
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
      certSub.textContent = 'Pass 50 questions at 70% to earn your certificate';
      certIconEl.className = 'fi fi-tr-document-signed';
      certAction.innerHTML = '<a href="quiz.html" class="btn-primary" style="padding:10px 20px">Start final quiz</a>';
    } else {
      certTitle.textContent = 'Certificate Locked';
      certSub.textContent = 'Complete all 5 modules and pass the final quiz to unlock';
    }

    // Module grid
    modulesGrid.innerHTML = '';
    DASH_MODULES.forEach(mod => {
      const isDone = completed.includes(mod.num);
      // Active = first uncompleted module
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

  function isDoneAny(completed) { return completed.length > 0; }

  renderDashboard();
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


// ═══════════════════════════════════════════════
// RESULTS PAGE
// ═══════════════════════════════════════════════
const resultsHero = document.getElementById('resultsHero');

if (resultsHero) {

  // User avatar
  const resUserRaw = localStorage.getItem('esafe_user');
  const resUser = resUserRaw ? JSON.parse(resUserRaw) : { fullName: 'Guest' };
  const resInitials = resUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const resAvatarEl = document.getElementById('userAvatar');
  if (resAvatarEl) resAvatarEl.textContent = resInitials || 'U';

  // Load score + results
  const score = parseInt(localStorage.getItem('esafe_quiz_score') || '0');
  const results = JSON.parse(localStorage.getItem('esafe_quiz_results') || '[]');
  const pct = Math.round((score / 50) * 100);
  const passed = pct >= 70;

  // Hero state
  resultsHero.classList.add(passed ? 'pass' : 'fail');
  document.getElementById('resultsIcon').className = passed ? 'fi fi-tr-trophy-star' : 'fi fi-tr-face-disappointed';
  document.getElementById('resultsHeadline').textContent = passed ? 'You passed!' : 'Almost there!';
  document.getElementById('resultsScore').textContent = pct + '%';
  document.getElementById('resultsScoreSub').textContent = `${score} of 50 correct`;

  // Theme breakdown
  const themes = [
    { name: 'Social Threats',       modules: [2,3,7] },
    { name: 'Credentials & Access', modules: [4,5,6] },
    { name: 'Malware & Attacks',    modules: [9,10,19] },
    { name: 'Safe Habits & Devices',modules: [11,12,13,15,16] },
    { name: 'Data & Compliance',    modules: [1,8,14,17,18,20] },
  ];

  const breakdownEl = document.getElementById('themeBreakdown');
  const weakThemes = [];

  themes.forEach(theme => {
    const themeQs = results.filter(r => theme.modules.includes(r.question.module));
    if (themeQs.length === 0) return;
    const correct = themeQs.filter(r => r.correct).length;
    const themePct = Math.round((correct / themeQs.length) * 100);
    const cls = themePct >= 70 ? 'good' : themePct >= 50 ? 'warn' : 'bad';

    if (themePct < 70) weakThemes.push({ name: theme.name, pct: themePct, modules: theme.modules });

    breakdownEl.innerHTML += `
      <div class="theme-row">
        <div class="theme-row-top">
          <span>${theme.name}</span>
          <span class="theme-pct ${cls}">${themePct}%</span>
        </div>
        <div class="theme-track">
          <div class="theme-fill ${cls}" style="width:${themePct}%"></div>
        </div>
      </div>
    `;
  });

  // Weak topics (fail state)
  if (!passed && weakThemes.length > 0) {
    document.getElementById('weakTopicsCard').style.display = 'block';
    document.getElementById('resultsEncouragement').style.display = 'block';
    const weakList = document.getElementById('weakTopicsList');
    weakThemes.forEach(t => {
      weakList.innerHTML += `
        <div class="weak-topic-row">
          <span class="weak-topic-name">${t.name}</span>
          <span class="weak-topic-score">${t.pct}%</span>
          <a class="weak-topic-link" href="dashboard.html">Review modules</a>
        </div>
      `;
    });
  }

  // Action buttons
  const actionsEl = document.getElementById('resultsActions');
  if (passed) {
    // Save pass status so certificate page can confirm
    localStorage.setItem('esafe_quiz_passed', 'true');
    actionsEl.innerHTML = `
      <a href="certificate.html" class="btn-primary">Get my certificate</a>
      <a href="dashboard.html" class="btn-outline">Back to dashboard</a>
    `;
  } else {
    localStorage.setItem('esafe_quiz_passed', 'false');
    actionsEl.innerHTML = `
      <a href="dashboard.html" class="btn-outline">Review modules</a>
      <a href="quiz.html" class="btn-primary">Retake quiz</a>
    `;
  }
}


// ═══════════════════════════════════════════════
// CERTIFICATE PAGE
// ═══════════════════════════════════════════════
const certDoc = document.getElementById('certDoc');

if (certDoc) {

  // Load user data
  const certUserRaw = localStorage.getItem('esafe_user');
  const certUser = certUserRaw ? JSON.parse(certUserRaw) : { fullName: 'Valued Employee' };

  // Set name + date
  document.getElementById('certName').textContent = certUser.fullName;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('certDate').textContent = dateStr;

  // User avatar
  const certInitials = certUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const certAvatarEl = document.getElementById('userAvatar');
  if (certAvatarEl) certAvatarEl.textContent = certInitials || 'U';

  // ── PRINT ──
  document.getElementById('printCertBtn').addEventListener('click', () => {
    window.print();
  });

  // ── DOWNLOAD PDF ──
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const W = 297; // A4 landscape width
    const H = 210; // A4 landscape height
    const name = certUser.fullName;

    // Background
    doc.setFillColor(250, 251, 255);
    doc.rect(0, 0, W, H, 'F');

    // Outer border
    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, W - 20, H - 20, 'S');

    // Inner border
    doc.setLineWidth(0.3);
    doc.setDrawColor(26, 39, 68, 0.2);
    doc.rect(15, 15, W - 30, H - 30, 'S');

    // Organisation name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setCharSpace(3);
    doc.text('CISSY TECHNOLOGIES', W / 2, 32, { align: 'center' });
    doc.setCharSpace(0);

    // Certificate title
    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(26, 39, 68);
    doc.text('Certificate of Completion', W / 2, 55, { align: 'center' });

    // Divider
    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.3);
    doc.line(W / 2 - 60, 60, W / 2 + 60, 60);

    // "This certifies that"
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This certifies that', W / 2, 74, { align: 'center' });

    // Recipient name
    doc.setFont('times', 'italic');
    doc.setFontSize(30);
    doc.setTextColor(26, 39, 68);
    doc.text(name, W / 2, 92, { align: 'center' });

    // Name underline
    const nameWidth = doc.getTextWidth(name);
    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.4);
    doc.line(W / 2 - nameWidth / 2, 95, W / 2 + nameWidth / 2, 95);

    // "has successfully completed"
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('has successfully completed', W / 2, 108, { align: 'center' });

    // Course name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 39, 68);
    doc.text('e-Safe Cybersecurity Awareness Training', W / 2, 120, { align: 'center' });

    // Bottom signature lines
    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.3);
    // Left line
    doc.line(55, 158, 115, 158);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 39, 68);
    doc.text('Cissy Technologies', 85, 163, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('ISSUING ORGANISATION', 85, 168, { align: 'center' });

    // Right line — date
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

    // Center seal circle
    doc.setDrawColor(26, 39, 68);
    doc.setLineWidth(0.4);
    doc.circle(W / 2, 158, 14, 'S');
    doc.setLineWidth(0.2);
    doc.circle(W / 2, 158, 11, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(26, 39, 68);
    doc.text('e-SAFE', W / 2, 159, { align: 'center' });

    // Save
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`eSafe_Certificate_${safeName}.pdf`);
  });
}


// ═══════════════════════════════════════════════
// MODULE DATA — 5 MODULES, 2 PARTS EACH
// Part 1 = story + key lesson + action steps
// Part 2 = 5 MCQs, 70% to pass, next module unlocks
// ═══════════════════════════════════════════════
const MODULES_DATA = [
  {
    id: 1, name: "Social Threats", badge: "Module 1 of 5",
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
    id: 2, name: "Credentials & Access", badge: "Module 2 of 5",
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
    id: 3, name: "Malware & Attacks", badge: "Module 3 of 5",
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
    id: 4, name: "Safe Habits & Devices", badge: "Module 4 of 5",
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
    id: 5, name: "Data & Compliance", badge: "Module 5 of 5",
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
  }
];

// ═══════════════════════════════════════════════
// MODULE PAGE LOGIC — 2-PART FLOW
// URL: module.html?id=1        → Part 1 (story)
// URL: module.html?id=1&quiz=1 → Part 2 (MCQs)
// ═══════════════════════════════════════════════
const moduleTitleEl2 = document.getElementById('moduleTitle');
if (moduleTitleEl2) {

  // User avatar
  const mUser = safeGet('esafe_user') || { fullName: 'Guest' };
  const mInitials = mUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const mAvatar = document.getElementById('userAvatar');
  if (mAvatar) mAvatar.textContent = mInitials || 'U';

  // Parse URL
  const mParams = new URLSearchParams(window.location.search);
  const mId = parseInt(mParams.get('id')) || 1;
  const showQuiz = mParams.get('quiz') === '1';

  const mod = MODULES_DATA.find(m => m.id === mId);
  if (!mod) { window.location.href = 'dashboard.html'; }

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

    // Optional email
    if (s.email) {
      document.getElementById('scenarioEmail').style.display = 'block';
      document.getElementById('emailFrom').textContent = s.email.from;
      document.getElementById('emailSubject').textContent = s.email.subject;
      document.getElementById('emailBody').textContent = s.email.body;
    }

    // Continue → Part 2
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

      // Highlight options
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
        // Show final result
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
          // Save progress
          let done = safeGet('esafe_completed_modules') || [];
          if (!done.includes(mId)) { done.push(mId); safeSet('esafe_completed_modules', done); }
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
