// ═══════════════════════════════════════════════
// OrbIsa — Vista de Tienda / Catálogo
// Renderiza los productos guardados en localStorage
// bajo la clave PRODUCTS_STORAGE_KEY.
//
// Formato esperado en localStorage (array de objetos):
// [
//   {
//     "id": "top-deportivo-breeze",   // único, usado por el carrito
//     "name": "Top deportivo Breeze",
//     "price": 89000,                 // número, sin formatear
//     "images": [                     // una o varias fotos — la primera es la miniatura
//       "img/top-breeze-1.jpg",
//       "img/top-breeze-2.jpg"
//     ],
//     "badge": "Nuevo",               // opcional
//     "rating": 4.5,                  // opcional
//     "reviews": 128                  // opcional
//   },
//   ...
// ]
//
// Compatibilidad: si un producto viejo solo tiene "image" (string)
// en vez de "images" (array), igual funciona — se muestra como
// una sola foto sin controles de carrusel.
// ═══════════════════════════════════════════════

const PRODUCTS_STORAGE_KEY = 'orbisa_products';

const heartIconSVG = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const starIconSVG = `<svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>`;
const cartIconSVG = `<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
const emptyCartIconSVG = `<svg viewBox="0 0 24 24"><path d="M9 2h6l1 5-2 4h-4L8 8zM9 14h6l1 7H8z"/></svg>`;
const zoomIconSVG = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;

// Guarda el último catálogo renderizado para poder buscar
// un producto por id cuando se hace click en su foto.
let productsCache = [];

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

// Devuelve siempre un array de fotos, sin importar si el producto
// se guardó con "images" (array) o con el "image" (string) viejo.
function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length) return product.images;
  if (product.image) return [product.image];
  return [];
}

function renderProductCard(product) {
  const images = getProductImages(product);
  const thumb = images[0] || '';

  const badge = product.badge
    ? `<span class="product-badge-new">${product.badge}</span>`
    : '';

  const rating = (product.rating || product.reviews)
    ? `<div class="product-card-rating">${starIconSVG} ${product.rating ?? ''} ${product.reviews ? `(${product.reviews})` : ''}</div>`
    : '';

  const zoomBtn = images.length
    ? `<button type="button" class="product-zoom-btn" aria-label="Ver fotos de ${product.name}">${zoomIconSVG}</button>`
    : '';

  return `
    <div class="product-card reveal visible" data-id="${product.id}">
      <div class="product-card-media" data-id="${product.id}" role="button" tabindex="0" aria-label="Ver fotos de ${product.name}">
        <img src="${thumb}" alt="${product.name}" loading="lazy">
        ${badge}
        <div class="product-wish" aria-label="Agregar a favoritos">${heartIconSVG}</div>
        ${zoomBtn}
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
  productsCache = products;

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

// ═══════════════════════════════════════════════
// MODAL DE FOTOS (carrusel de Bootstrap)
// Requiere que productos.html tenga el markup del
// #productModal y que Bootstrap JS esté cargado.
// ═══════════════════════════════════════════════

function openProductModal(product) {
  const images = getProductImages(product);
  if (!images.length) return;

  const modalEl = document.getElementById('productModal');
  const titleEl = document.getElementById('productModalLabel');
  const inner = document.getElementById('productCarouselInner');
  const indicators = document.getElementById('productCarouselIndicators');
  if (!modalEl || !titleEl || !inner) return;

  titleEl.textContent = product.name;

  inner.innerHTML = images.map((src, i) => `
    <div class="carousel-item ${i === 0 ? 'active' : ''}">
      <img src="${src}" class="d-block w-100" alt="${product.name} — foto ${i + 1}">
    </div>`).join('');

  const hasMultiple = images.length > 1;

  modalEl.querySelectorAll('.carousel-control-prev, .carousel-control-next')
    .forEach(el => el.classList.toggle('d-none', !hasMultiple));

  if (indicators) {
    indicators.innerHTML = hasMultiple
      ? images.map((_, i) => `
          <button type="button" data-bs-target="#productCarousel" data-bs-slide-to="${i}"
            class="${i === 0 ? 'active' : ''}" aria-current="${i === 0 ? 'true' : 'false'}"
            aria-label="Foto ${i + 1}"></button>`).join('')
      : '';
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

function handleGridClick(e) {
  if (e.target.closest('.product-wish') || e.target.closest('.product-cart-btn')) return;
  const mediaEl = e.target.closest('.product-card-media');
  if (!mediaEl) return;
  const product = productsCache.find(p => String(p.id) === mediaEl.dataset.id);
  if (product) openProductModal(product);
}

function handleGridKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const mediaEl = e.target.closest('.product-card-media');
  if (!mediaEl) return;
  e.preventDefault();
  const product = productsCache.find(p => String(p.id) === mediaEl.dataset.id);
  if (product) openProductModal(product);
}

// Primer render al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  renderShop();
  const grid = document.getElementById('shopGrid');
  if (grid) {
    grid.addEventListener('click', handleGridClick);
    grid.addEventListener('keydown', handleGridKeydown);
  }
});

// Si el catálogo cambia en OTRA pestaña (por ejemplo, un panel admin
// abierto en paralelo), esta vista se actualiza sola sin recargar.
window.addEventListener('storage', (e) => {
  if (e.key === PRODUCTS_STORAGE_KEY) renderShop();
});