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

  // Pill-nav (desktop)
  const accountSlot = document.getElementById('navAccount');
  if (accountSlot) {
    accountSlot.innerHTML = session
      ? `<a href="#" id="navLogout">Salir (${session.name.split(' ')[0]})</a>`
      : `<a href="login.html">Iniciar sesión</a>`;
  }

  // Menú móvil — se inserta antes del botón de carrito, si existe
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileCartBtn = document.getElementById('cartTriggerMobile');
  if (mobileNav && mobileCartBtn) {
    const mobileLink = document.createElement('a');
    mobileLink.href = session ? '#' : 'login.html';
    mobileLink.id = session ? 'navLogoutMobile' : '';
    mobileLink.textContent = session ? `Salir (${session.name.split(' ')[0]})` : 'Iniciar sesión';
    mobileNav.insertBefore(mobileLink, mobileCartBtn);
  }

  [document.getElementById('navLogout'), document.getElementById('navLogoutMobile')]
    .filter(Boolean)
    .forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); logout(); }));
}
// <nav class="pill-nav" aria-label="Navegación principal">
//   <a href="index.html#hero">Inicio</a>
//   <a href="productos.html">Tienda</a>
//   <a href="nosotros.html">Nosotros</a>
//   <a href="contacto.html">Contacto</a>
//   <button class="mini-cart cart-open-btn" id="cartTrigger" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
//     <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
//     <span class="cart-count">0</span>
//   </button>
// </nav>