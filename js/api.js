// ═══════════════════════════════════════════════
// OrbIsa — Cliente de la API
// Cárgalo ANTES de auth.js, cart.js y products.js
// ═══════════════════════════════════════════════

// La URL se configura en js/config.js
const API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || 'http://localhost:3000/api';
const TOKEN_KEY = 'orbisa_token';

const Api = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  logout:   () => localStorage.removeItem(TOKEN_KEY),
  isLogged: () => !!localStorage.getItem(TOKEN_KEY),

  async request(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Api.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && token) Api.logout(); // token vencido
    if (!res.ok) {
      const err = new Error(data.error || 'Error de conexión');
      err.status = res.status;
      err.details = data.detalles;
      throw err;
    }
    return data;
  },

  // ---- Auth
  async login(email, password) {
    const d = await Api.request('/auth/login', { method: 'POST', body: { email, password } });
    Api.setToken(d.token);
    return d.usuario;
  },
  async registro(nombre, email, password) {
    const d = await Api.request('/auth/registro', { method: 'POST', body: { nombre, email, password } });
    Api.setToken(d.token);
    return d.usuario;
  },

  // ---- Catálogo
  productos: (params = {}) => Api.request('/productos?' + new URLSearchParams(params)),
  producto:  (id) => Api.request(`/productos/${id}`),

  // ---- Carrito
  carrito:        () => Api.request('/me/carrito'),
  agregarAlCarrito: (varianteId, cantidad = 1) =>
    Api.request('/me/carrito/items', { method: 'POST', body: { varianteId, cantidad } }),
  cambiarCantidad: (varianteId, cantidad) =>
    Api.request(`/me/carrito/items/${varianteId}`, { method: 'PATCH', body: { cantidad } }),
  quitarDelCarrito: (varianteId) =>
    Api.request(`/me/carrito/items/${varianteId}`, { method: 'DELETE' }),

  // ---- Direcciones, cupones y órdenes
  direcciones:    () => Api.request('/me/direcciones'),
  crearDireccion: (d) => Api.request('/me/direcciones', { method: 'POST', body: d }),
  validarCupon:   (codigo) => Api.request('/cupones/validar', { method: 'POST', body: { codigo } }),
  crearOrden:     (direccionId, cuponCodigo, metodo) =>
    Api.request('/ordenes', { method: 'POST', body: { direccionId, cuponCodigo, metodo } }),
  misOrdenes:     () => Api.request('/ordenes'),
  cancelarOrden:  (id) => Api.request(`/ordenes/${id}/cancelar`, { method: 'POST' }),
};