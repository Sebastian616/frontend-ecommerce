const navbar = `
<nav class="pill-nav" aria-label="Navegación principal">
  <a href="#hero" class="active">Inicio</a>
  <a href="#categorias">Tienda</a>
  <a href="#productos">Colecciones</a>
  <a href="#promo">Nosotros</a>
  <a href="#newsletter">Contacto</a>
  <button class="mini-cart cart-open-btn" id="cartTrigger" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
    <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    <span class="cart-count">0</span>
  </button>
</nav>
`;

document.getElementById("navbar").innerHTML = navbar;