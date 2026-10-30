const navbar = `
<nav class="pill-nav" aria-label="Navegación principal">
  <a href="index.html#hero">Inicio</a>
  <a href="productos.html">Tienda</a>
  <a href="nosotros.html">Nosotros</a>
  <a href="contacto.html">Contacto</a>
  <span class="nav-account" id="navAccount"></span>
  <button class="mini-cart cart-open-btn" id="cartTrigger" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
    <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    <span class="cart-count">0</span>
  </button>
</nav>
`;

document.getElementById("navbar").innerHTML = navbar;

// Resalta el link activo según la página actual (index.html vs productos.html)
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.pill-nav a, .mobile-nav a').forEach(link => {
  const linkPage = link.getAttribute('href').split('#')[0] || 'index.html';
  if (linkPage === currentPage) link.classList.add('active');
});

// ── Estado de sesión (requiere que auth.js esté cargado antes que este script) ──
if (typeof getSession === 'function') {
  const session = getSession();
  const isAdminUser = !!session && session.role === 'admin';
  const firstName = session ? String(session.name || '').split(' ')[0] : '';

  // Crea un <a> usando textContent (el nombre nunca se interpreta como HTML)
  function makeLink({ href, text, id, className }) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (id) a.id = id;
    if (className) a.className = className;
    return a;
  }

  // Los enlaces que dependen de la sesión, en orden
  function accountLinks(suffix = '') {
    if (!session) return [makeLink({ href: 'login.html', text: 'Iniciar sesión' })];
    const links = [];
    if (isAdminUser) links.push(makeLink({ href: 'admin.html', text: 'Panel admin', className: 'nav-admin' }));
    links.push(makeLink({ href: 'mis-pedidos.html', text: 'Mis pedidos' }));
    links.push(makeLink({ href: '#', text: `Salir (${firstName})`, id: `navLogout${suffix}` }));
    return links;
  }

  // Pill-nav (desktop)
  const accountSlot = document.getElementById('navAccount');
  if (accountSlot) accountLinks().forEach(a => accountSlot.appendChild(a));

  // Menú móvil — se inserta antes del botón de carrito, si existe
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileCartBtn = document.getElementById('cartTriggerMobile');
  if (mobileNav && mobileCartBtn) {
    accountLinks('Mobile').forEach(a => mobileNav.insertBefore(a, mobileCartBtn));
  }

  [document.getElementById('navLogout'), document.getElementById('navLogoutMobile')]
    .filter(Boolean)
    .forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); logout(); }));
}