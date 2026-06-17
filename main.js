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


// ═══════════════
// REGISTER FORM
// ════════════════
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
