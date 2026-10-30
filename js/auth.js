// ═══════════════════════════════════════════════
// OrbIsa — Sesión de usuario (conectada a la API)
// Requiere js/api.js cargado antes.
// Mantiene las mismas funciones que usa login.js:
//   getSession(), loginUser(), registerUser()
// ═══════════════════════════════════════════════

const AUTH_SESSION_KEY = 'orbisa_session'; // mismo nombre que tu versión anterior

// Lee la fecha de vencimiento del JWT (sin verificar firma: eso lo hace el servidor)
function tokenExpirado(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function saveSession(usuario) {
  const session = {
    id: usuario.id,
    name: usuario.nombre,
    email: usuario.email,
    role: usuario.rol === 'ADMIN' ? 'admin' : 'customer', // mismos roles que antes
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

// Devuelve { id, name, email, role } o null si no hay sesión válida
function getSession() {
  const token = Api.getToken();
  if (!token || tokenExpirado(token)) {
    clearSession();
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  Api.logout();
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

function isAdmin() {
  const session = getSession();
  return !!session && session.role === 'admin';
}

// Cierra sesión y vuelve al inicio
function logoutUser(redirect = 'index.html') {
  clearSession();
  location.href = redirect;
}
const logout = logoutUser; // alias por si tu navbar usa este nombre

// Para páginas que exigen sesión: requireAuth() al inicio del script
function requireAuth() {
  const s = getSession();
  if (!s) {
    const page = location.pathname.split('/').pop() || 'index.html';
    location.replace(`login.html?redirect=${encodeURIComponent(page)}`);
  }
  return s;
}

function mensajeDeError(e, esRegistro) {
  if (e.status === 401) return 'Correo o contraseña incorrectos.';
  if (e.status === 409 && esRegistro) return 'Ya existe una cuenta con ese correo.';
  if (e.status === 400 && e.details) {
    const campos = Object.keys(e.details);
    if (campos.includes('email')) return 'Escribe un correo válido.';
    if (campos.includes('password')) return 'La contraseña debe tener al menos 8 caracteres.';
    if (campos.includes('nombre')) return 'El nombre debe tener al menos 2 caracteres.';
  }
  if (e instanceof TypeError) return 'No pudimos conectar con el servidor. Inténtalo de nuevo.';
  return e.message || 'Ocurrió un error. Inténtalo de nuevo.';
}

// ── Login: { username } es el correo ──
async function loginUser({ username, password }) {
  try {
    const usuario = await Api.login(username.trim(), password);
    const s = saveSession(usuario);
    return { ok: true, role: s.role };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e, false) };
  }
}

// ── Registro ──
async function registerUser({ name, email, password }) {
  try {
    const usuario = await Api.registro(name.trim(), email.trim(), password);
    const s = saveSession({ ...usuario, rol: 'CLIENTE' });
    return { ok: true, role: s.role };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e, true) };
  }
}