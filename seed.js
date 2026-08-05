// ============================================================
// ADMIN USE ONLY — DELETE THIS FILE (and seed.html) AFTER SEEDING
// ============================================================
// Writes 10 demo user records directly into Realtime Database under
// users/{key} using firebase.database().ref(...).set(). No Firebase Auth
// accounts are created — these are display-only records for the admin
// dashboard demo. Each seed user has a key derived from their email, so
// re-running this page is safe: it simply overwrites the same 10
// records rather than creating duplicates.
//
// Requires an active admin session in this browser (sign in at
// signin.html as ADMIN_EMAIL first) — see the security rules in
// firebase-config.js, which only allow writes to other users' records
// while signed in as the admin account.
// ============================================================

const ALL_10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const HALFWAY = [1, 2, 3, 4, 5];

function keyFromEmail(email) {
  // Realtime Database keys cannot contain '.', '#', '$', '[', ']', or '/'.
  return email.replace(/[.#$\[\]/]/g, '_');
}

const SEED_USERS = [
  // 3 completed all 10 modules and passed the final quiz — certified
  {
    fullName: 'Grace Adeyemi', email: 'grace.adeyemi@cissytechnologies.com', department: 'IT',
    registeredAt: '2026-06-02', completedModules: ALL_10, quizScore: 88, quizPassed: true, certificateIssued: true
  },
  {
    fullName: 'Michael Owusu', email: 'michael.owusu@cissytechnologies.com', department: 'Finance',
    registeredAt: '2026-06-05', completedModules: ALL_10, quizScore: 92, quizPassed: true, certificateIssued: true
  },
  {
    fullName: 'Esther Boakye', email: 'esther.boakye@cissytechnologies.com', department: 'Operations',
    registeredAt: '2026-06-09', completedModules: ALL_10, quizScore: 76, quizPassed: true, certificateIssued: true
  },
  // 2 completed all modules but have not taken the final quiz
  {
    fullName: 'Linda Boateng', email: 'linda.boateng@cissytechnologies.com', department: 'HR',
    registeredAt: '2026-06-12', completedModules: ALL_10, quizScore: null, quizPassed: false, certificateIssued: false
  },
  {
    fullName: 'Samuel Appiah', email: 'samuel.appiah@cissytechnologies.com', department: 'Sales',
    registeredAt: '2026-06-16', completedModules: ALL_10, quizScore: null, quizPassed: false, certificateIssued: false
  },
  // 3 halfway through, around module 5
  {
    fullName: 'Patricia Mensah', email: 'patricia.mensah@cissytechnologies.com', department: 'Legal',
    registeredAt: '2026-06-20', completedModules: HALFWAY, quizScore: null, quizPassed: false, certificateIssued: false
  },
  {
    fullName: 'Daniel Osei', email: 'daniel.osei@cissytechnologies.com', department: 'IT',
    registeredAt: '2026-06-24', completedModules: HALFWAY, quizScore: null, quizPassed: false, certificateIssued: false
  },
  {
    fullName: 'Victor Amankwah', email: 'victor.amankwah@cissytechnologies.com', department: 'Finance',
    registeredAt: '2026-06-28', completedModules: HALFWAY, quizScore: null, quizPassed: false, certificateIssued: false
  },
  // 1 just registered, has not started
  {
    fullName: 'Ruth Asante', email: 'ruth.asante@cissytechnologies.com', department: 'Operations',
    registeredAt: '2026-07-05', completedModules: [], quizScore: null, quizPassed: false, certificateIssued: false
  },
  // 1 failed the final quiz
  {
    fullName: 'Kwabena Darko', email: 'kwabena.darko@cissytechnologies.com', department: 'HR',
    registeredAt: '2026-07-10', completedModules: ALL_10, quizScore: 58, quizPassed: false, certificateIssued: false
  }
];

function describeStatus(user) {
  const doneCount = user.completedModules.length;
  if (doneCount === 0) {
    return { label: 'Not started', cls: 'none' };
  }
  if (doneCount < 10) {
    return { label: `${doneCount} of 10 modules`, cls: 'pending' };
  }
  if (typeof user.quizScore !== 'number') {
    return { label: 'All 10 modules · Final quiz not taken', cls: 'pending' };
  }
  if (user.quizPassed) {
    return { label: `All 10 modules · Passed final quiz (${user.quizScore}%) · Certified`, cls: 'good' };
  }
  return { label: `All 10 modules · Failed final quiz (${user.quizScore}%)`, cls: 'none' };
}

async function seedUser(user) {
  const key = keyFromEmail(user.email);
  await db.ref('users/' + key).set({
    fullName: user.fullName,
    email: user.email,
    department: user.department,
    registeredAt: user.registeredAt,
    completedModules: user.completedModules,
    quizScore: user.quizScore,
    quizPassed: user.quizPassed,
    certificateIssued: user.certificateIssued
  });
}

async function runSeed() {
  const statusLine = document.getElementById('seedStatusLine');
  const statusText = document.getElementById('seedStatusText');
  const resultsEl = document.getElementById('seedResults');
  const reseedBtn = document.getElementById('reseedBtn');

  statusLine.style.display = 'flex';
  resultsEl.style.display = 'none';
  reseedBtn.style.display = 'none';

  const added = [];
  const failed = [];

  for (let i = 0; i < SEED_USERS.length; i++) {
    const user = SEED_USERS[i];
    statusText.textContent = `Seeding ${i + 1} of ${SEED_USERS.length}: ${user.fullName}…`;
    try {
      await seedUser(user);
      added.push(user);
    } catch (err) {
      console.error('Failed to seed', user.email, err);
      failed.push({ user, err });
    }
  }

  statusLine.style.display = 'none';
  resultsEl.style.display = 'block';

  let html = '';

  if (added.length > 0) {
    html += `<h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:.75rem">
      ${added.length} user${added.length === 1 ? '' : 's'} added</h3>`;
    html += added.map(user => {
      const status = describeStatus(user);
      return `
        <div class="seed-employee-row">
          <div>
            <div class="seed-employee-name">${user.fullName}</div>
            <div class="seed-employee-meta">${user.email} &middot; ${user.department}</div>
          </div>
          <div class="seed-employee-status">
            <span class="admin-badge ${status.cls}">${status.label}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (failed.length > 0) {
    html += `<h3 style="font-size:15px;font-weight:700;color:#DC2626;margin:1.25rem 0 .75rem">
      ${failed.length} failed — check the browser console</h3>`;
    html += failed.map(f => `
      <div class="seed-employee-row">
        <div>
          <div class="seed-employee-name">${f.user.fullName}</div>
          <div class="seed-employee-meta">${f.user.email}</div>
        </div>
        <div class="seed-employee-status">
          <span class="admin-badge none">${(f.err && f.err.code) || (f.err && f.err.message) || 'Error'}</span>
        </div>
      </div>
    `).join('');

    if (failed.some(f => f.err && f.err.code === 'PERMISSION_DENIED')) {
      html += `<p style="font-size:13px;color:#DC2626;margin-top:1rem;line-height:1.6">
        Permission denied — you must be signed in as the admin account
        (${ADMIN_EMAIL}) in this browser for these writes to succeed. Go to
        <a href="signin.html" style="color:#DC2626;text-decoration:underline">signin.html</a>,
        sign in as admin, then reload this page.
      </p>`;
    }
  }

  if (added.length > 0 && failed.length === 0) {
    html += `<p style="font-size:13px;color:var(--text-2);margin-top:1.25rem;line-height:1.6">
      Done. Go to <a href="admin.html" style="color:var(--navy);text-decoration:underline">admin.html</a>
      to see them in the table. <strong>Delete seed.html and seed.js now.</strong>
    </p>`;
  }

  resultsEl.innerHTML = html;
  reseedBtn.style.display = 'block';
}

document.getElementById('reseedBtn').addEventListener('click', runSeed);

// Runs automatically on page load, as requested — re-opening this
// page simply re-seeds the same 10 records (safe, see seedUser above).
runSeed();
