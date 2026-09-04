// ═══════════════════════════════════════════════
// OrbIsa — Topbar del panel de administración
// Reutilizable entre admin.html, pedidos.html, y
// cualquier otra vista admin que se agregue después.
// ═══════════════════════════════════════════════

const adminTopbar = `
<div class="admin-topbar">
  <div class="admin-brand">
    <img src="./img/logotransparente.png" alt="">
    Orb<em>Isa</em>
  </div>
  <span class="admin-topbar-tag">Panel de administración</span>
  <nav class="admin-topbar-links">
    <a href="admin.html">Productos</a>
    <a href="pedidos.html">Pedidos</a>
    <a href="index.html">Ver sitio</a>
    <a href="#" id="adminLogout">Cerrar sesión</a>
  </nav>
</div>
`;

document.getElementById('adminNav').innerHTML = adminTopbar;

// Resalta el link activo según la página actual
const currentAdminPage = location.pathname.split('/').pop() || 'admin.html';
document.querySelectorAll('.admin-topbar-links a').forEach(link => {
  if (link.getAttribute('href') === currentAdminPage) link.classList.add('active');
});

document.getElementById('adminLogout').addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});