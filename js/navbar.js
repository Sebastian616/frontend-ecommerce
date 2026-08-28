const navbar = `
<nav class="pill-nav" aria-label="Navegación principal">
  <a href="#hero" class="active">Inicio</a>
  <a href="#categorias">Tienda</a>
  <a href="#productos">Colecciones</a>
  <a href="#promo">Nosotros</a>
  <a href="#newsletter">Contacto</a>
  <button class="mini-cart" id="cartTrigger" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
  <svg>...</svg>
  <span id="cartCount">3</span>
  </button>

</nav>
`

document.getElementById("navbar").innerHTML = navbar