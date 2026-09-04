// ═══════════════════════════════════════════════
// OrbIsa — Página de login / registro
// ═══════════════════════════════════════════════

function getRedirectTarget() {
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  // Solo permitimos redirigir a páginas del mismo sitio (evita open-redirect)
  if (redirect && /^[a-zA-Z0-9_-]+\.html$/.test(redirect)) return redirect;
  return 'index.html';
}

function showAuthError(message) {
  const el = document.getElementById('authError');
  el.textContent = message;
  el.classList.add('active');
}

function clearAuthError() {
  const el = document.getElementById('authError');
  el.classList.remove('active');
  el.textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  // Si ya hay sesión activa, no tiene sentido mostrar el login
  const session = getSession();
  if (session) {
    location.replace(session.role === 'admin' ? 'admin.html' : getRedirectTarget());
    return;
  }

  // ── Tabs ──
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = { login: document.getElementById('loginForm'), register: document.getElementById('registerForm') };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      Object.values(forms).forEach(f => f.classList.remove('active'));
      forms[tab.dataset.tab].classList.add('active');
      clearAuthError();
    });
  });

  // ── Login ──
  forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const result = await loginUser({ username, password });

    if (!result.ok) {
      showAuthError(result.error);
      return;
    }

    location.href = result.role === 'admin' ? 'admin.html' : getRedirectTarget();
  });

  // ── Registro ──
  forms.register.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;

    if (password !== confirm) {
      showAuthError('Las contraseñas no coinciden.');
      return;
    }

    const result = await registerUser({ name, email, password });

    if (!result.ok) {
      showAuthError(result.error);
      return;
    }

    location.href = getRedirectTarget();
  });
});