// ═══════════════════════════════════════════════
// OrbIsa — Autenticación (100% localStorage)
//
// ⚠️ IMPORTANTE: esto NO es seguridad real de servidor.
// Cualquiera con acceso a las devtools del navegador puede
// leer este archivo, ver ADMIN_PASSWORD, o editar localStorage
// a mano para simular una sesión de admin. Sirve para bloquear
// el acceso casual (un cliente normal no debería poder entrar
// al panel ni comprar sin cuenta), pero NO reemplaza un backend
// con autenticación real si este sitio se publica de verdad.
// ═══════════════════════════════════════════════

const AUTH_USERS_KEY = 'orbisa_users';
const AUTH_SESSION_KEY = 'orbisa_session';

// Credenciales fijas del admin — solo válidas en este entorno de demo.
// En un proyecto real esto vive en un backend, nunca en JS del cliente.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Orb1sa#Adm2026!Secure';

// ── Hash de contraseñas con SHA-256 (Web Crypto API, nativa del navegador) ──
// Evita guardar contraseñas en texto plano en localStorage.
async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Usuarios registrados ──
function loadUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('No se pudieron leer los usuarios registrados.', e);
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

// ── Sesión activa ──
function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

function isAdmin() {
  const session = getSession();
  return !!session && session.role === 'admin';
}

// ── Registro ──
// Devuelve { ok: true } o { ok: false, error: '...' }
async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === ADMIN_USERNAME) {
    return { ok: false, error: 'Ese correo no está disponible.' };
  }

  const users = loadUsers();
  if (users.some(u => u.email === normalizedEmail)) {
    return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
  }

  const passwordHash = await hashPassword(password);
  users.push({ name: name.trim(), email: normalizedEmail, passwordHash });
  saveUsers(users);

  setSession({ name: name.trim(), email: normalizedEmail, role: 'customer' });
  return { ok: true };
}

// ── Login ──
// Devuelve { ok: true, role: 'admin'|'customer' } o { ok: false, error: '...' }
async function loginUser({ username, password }) {
  const normalized = username.trim().toLowerCase();

  // Admin — chequeo fijo, independiente de la lista de usuarios registrados
  if (normalized === ADMIN_USERNAME) {
    if (password === ADMIN_PASSWORD) {
      setSession({ name: 'Administrador', email: ADMIN_USERNAME, role: 'admin' });
      return { ok: true, role: 'admin' };
    }
    return { ok: false, error: 'Usuario o contraseña incorrectos.' };
  }

  // Cliente registrado
  const users = loadUsers();
  const user = users.find(u => u.email === normalized);
  if (!user) return { ok: false, error: 'Usuario o contraseña incorrectos.' };

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    return { ok: false, error: 'Usuario o contraseña incorrectos.' };
  }

  setSession({ name: user.name, email: user.email, role: 'customer' });
  return { ok: true, role: 'customer' };
}

function logout() {
  clearSession();
  location.href = 'index.html';
}