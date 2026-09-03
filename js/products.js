// ═══════════════════════════════════════════════
// OrbIsa — Vista de Tienda / Catálogo
// Renderiza los productos guardados en localStorage
// bajo la clave PRODUCTS_STORAGE_KEY.
//
// Por ahora esa clave puede no existir todavía (por
// eso se muestra el estado vacío) — en cuanto guardes
// productos ahí desde donde sea (un panel admin, un
// formulario, un seed manual, etc.) esta vista los
// mostrará automáticamente en cada carga de página.
//
// Formato esperado en localStorage (array de objetos):
// [
//   {
//     "id": "top-deportivo-breeze",   // único, usado por el carrito
//     "name": "Top deportivo Breeze",
//     "price": 89000,                 // número, sin formatear
//     "image": "img/fither-product-01.jpg",
//     "badge": "Nuevo",               // opcional
//     "rating": 4.5,                  // opcional
//     "reviews": 128                  // opcional
//   },
//   ...
// ]
// ═══════════════════════════════════════════════

const PRODUCTS_STORAGE_KEY = 'orbisa_products';

const heartIconSVG = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const starIconSVG = `<svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>`;
const cartIconSVG = `<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
const emptyCartIconSVG = `<svg viewBox="0 0 24 24"><path d="M9 2h6l1 5-2 4h-4L8 8zM9 14h6l1 7H8z"/></svg>`;

function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('No se pudo leer el catálogo guardado.', e);
    return [];
  }
}

function formatProductPrice(n) {
  return '$' + Number(n).toLocaleString('es-CO') + ' COP';
}

function renderProductCard(product) {
  const badge = product.badge
    ? `<span class="product-badge-new">${product.badge}</span>`
    : '';

  const rating = (product.rating || product.reviews)
    ? `<div class="product-card-rating">${starIconSVG} ${product.rating ?? ''} ${product.reviews ? `(${product.reviews})` : ''}</div>`
    : '';

  return `
    <div class="product-card reveal visible" data-id="${product.id}">
      <div class="product-card-media">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${badge}
        <div class="product-wish" aria-label="Agregar a favoritos">${heartIconSVG}</div>
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${product.name}</div>
        ${rating}
        <div class="product-card-footer">
          <span class="product-card-price">${formatProductPrice(product.price)}</span>
          <button class="product-cart-btn" aria-label="Agregar al carrito">${cartIconSVG}</button>
        </div>
      </div>
    </div>`;
}

function renderEmptyState() {
  return `
    <div class="shop-empty">
      ${emptyCartIconSVG}
      <h3>Todavía no hay productos</h3>
      <p>Estamos preparando el catálogo. Vuelve pronto para ver las novedades.</p>
      <a href="index.html" class="cta-link">Volver al inicio</a>
    </div>`;
}

function renderShop() {
  const grid = document.getElementById('shopGrid');
  const countLabel = document.getElementById('shopCount');
  if (!grid) return;

  const products = loadProducts();

  if (products.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('is-empty');
    grid.insertAdjacentHTML('beforeend', renderEmptyState());
  } else {
    grid.classList.remove('is-empty');
    grid.innerHTML = products.map(renderProductCard).join('');
  }

  if (countLabel) {
    countLabel.textContent = products.length === 0
      ? ''
      : `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`;
  }
}

// Primer render al cargar la página
document.addEventListener('DOMContentLoaded', renderShop);

// Si el catálogo cambia en OTRA pestaña (por ejemplo, un panel admin
// abierto en paralelo), esta vista se actualiza sola sin recargar.
window.addEventListener('storage', (e) => {
  if (e.key === PRODUCTS_STORAGE_KEY) renderShop();
});