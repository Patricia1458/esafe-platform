// ============================================================
// ADMIN USE ONLY — DELETE THIS FILE (and seed.html) AFTER SEEDING
// ============================================================
// Standalone by design: not loaded by any other page, not subject
// to the app's auth guard in main.js. Talks to Firebase directly.
// ============================================================

const SEED_PASSWORD = 'CissySeed#2026';
document.getElementById('seedPasswordDisplay').textContent = SEED_PASSWORD;

const SEED_EMPLOYEES = [
  // 2 fully complete + certified
  {
    fullName: 'Grace Adeyemi', email: 'grace.adeyemi@cissytechnologies.com', department: 'IT',
    registeredAt: '2026-06-02T09:15:00.000Z',
    completedModules: [1, 2, 3, 4, 5], finalQuizScore: 84, finalQuizPassed: true, certificateIssued: true
  },
  {
    fullName: 'Michael Owusu', email: 'michael.owusu@cissytechnologies.com', department: 'Finance',
    registeredAt: '2026-06-09T14:40:00.000Z',
    completedModules: [1, 2, 3, 4, 5], finalQuizScore: 92, finalQuizPassed: true, certificateIssued: true
  },
  // 2 all modules done, final quiz not yet taken
  {
    fullName: 'Linda Boateng', email: 'linda.boateng@cissytechnologies.com', department: 'Operations',
    registeredAt: '2026-06-16T10:05:00.000Z',
    completedModules: [1, 2, 3, 4, 5], finalQuizScore: null, finalQuizPassed: false, certificateIssued: false
  },
  {
    fullName: 'Samuel Appiah', email: 'samuel.appiah@cissytechnologies.com', department: 'HR',
    registeredAt: '2026-06-23T11:30:00.000Z',
    completedModules: [1, 2, 3, 4, 5], finalQuizScore: null, finalQuizPassed: false, certificateIssued: false
  },
  // 2 halfway through, around module 3
  {
    fullName: 'Patricia Mensah', email: 'patricia.mensah@cissytechnologies.com', department: 'Sales',
    registeredAt: '2026-07-01T08:50:00.000Z',
    completedModules: [1, 2, 3], finalQuizScore: null, finalQuizPassed: false, certificateIssued: false
  },
  {
    fullName: 'Daniel Osei', email: 'daniel.osei@cissytechnologies.com', department: 'Legal',
    registeredAt: '2026-07-07T16:20:00.000Z',
    completedModules: [1, 2, 3], finalQuizScore: null, finalQuizPassed: false, certificateIssued: false
  },
  // 1 just registered, nothing started
  {
    fullName: 'Ruth Asante', email: 'ruth.asante@cissytechnologies.com', department: 'IT',
    registeredAt: '2026-07-14T09:00:00.000Z',
    completedModules: [], finalQuizScore: null, finalQuizPassed: false, certificateIssued: false
  },
  // 1 failed the final quiz
  {
    fullName: 'Kwabena Darko', email: 'kwabena.darko@cissytechnologies.com', department: 'Finance',
    registeredAt: '2026-06-28T13:10:00.000Z',
    completedModules: [1, 2, 3, 4, 5], finalQuizScore: 58, finalQuizPassed: false, certificateIssued: false
  }
];

function describeStatus(emp) {
  const doneCount = emp.completedModules.length;
  if (doneCount === 0) {
    return { label: 'Not started', cls: 'none' };
  }
  if (doneCount < 5) {
    return { label: `${doneCount} of 5 modules`, cls: 'pending' };
  }
  if (typeof emp.finalQuizScore !== 'number') {
    return { label: 'All 5 modules · Final quiz not taken', cls: 'pending' };
  }
  if (emp.finalQuizPassed) {
    return { label: `All 5 modules · Passed final quiz (${emp.finalQuizScore}%) · Certified`, cls: 'good' };
  }
  return { label: `All 5 modules · Failed final quiz (${emp.finalQuizScore}%)`, cls: 'none' };
}

async function seedEmployee(emp) {
  let uid;
  try {
    const cred = await auth.createUserWithEmailAndPassword(emp.email, SEED_PASSWORD);
    uid = cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      // Already seeded in a previous run — sign in as them so we can
      // overwrite their Firestore doc with the same demo data (safe to re-run).
      const cred = await auth.signInWithEmailAndPassword(emp.email, SEED_PASSWORD);
      uid = cred.user.uid;
    } else {
      throw err;
    }
  }

  await db.collection('employees').doc(uid).set({
    fullName: emp.fullName,
    email: emp.email,
    department: emp.department,
    registeredAt: emp.registeredAt,
    completedModules: emp.completedModules,
    finalQuizScore: emp.finalQuizScore,
    finalQuizPassed: emp.finalQuizPassed,
    certificateIssued: emp.certificateIssued
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

  for (let i = 0; i < SEED_EMPLOYEES.length; i++) {
    const emp = SEED_EMPLOYEES[i];
    statusText.textContent = `Seeding ${i + 1} of ${SEED_EMPLOYEES.length}: ${emp.fullName}…`;
    try {
      await seedEmployee(emp);
      added.push(emp);
    } catch (err) {
      console.error('Failed to seed', emp.email, err);
      failed.push({ emp, err });
    }
  }

  try { await auth.signOut(); } catch (e) { /* already signed out */ }

  statusLine.style.display = 'none';
  resultsEl.style.display = 'block';

  let html = '';

  if (added.length > 0) {
    html += `<h3 style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:.75rem">
      ${added.length} employee${added.length === 1 ? '' : 's'} added</h3>`;
    html += added.map(emp => {
      const status = describeStatus(emp);
      return `
        <div class="seed-employee-row">
          <div>
            <div class="seed-employee-name">${emp.fullName}</div>
            <div class="seed-employee-meta">${emp.email} &middot; ${emp.department}</div>
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
          <div class="seed-employee-name">${f.emp.fullName}</div>
          <div class="seed-employee-meta">${f.emp.email}</div>
        </div>
        <div class="seed-employee-status">
          <span class="admin-badge none">${(f.err && f.err.code) || 'Error'}</span>
        </div>
      </div>
    `).join('');
  }

  if (added.length > 0 && failed.length === 0) {
    html += `<p style="font-size:13px;color:var(--text-2);margin-top:1.25rem;line-height:1.6">
      Done. You have been signed out. Go to
      <a href="signin.html" style="color:var(--navy);text-decoration:underline">signin.html</a>
      and sign in with your own admin account to view admin.html, or use the shared
      password above with any email listed to demo the employee view.
      <strong>Delete seed.html and seed.js now.</strong>
    </p>`;
  }

  resultsEl.innerHTML = html;
  reseedBtn.style.display = 'block';
}

document.getElementById('reseedBtn').addEventListener('click', runSeed);

// Runs automatically on page load, as requested — re-opening this
// page simply re-seeds the same 8 accounts (safe, see seedEmployee above).
runSeed();
