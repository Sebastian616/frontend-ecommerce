// ═══════════════════════════════════════════════
// OrbIsa — Vista de Tienda / Catálogo
// Ahora consume la API (requiere js/api.js cargado antes).
// ═══════════════════════════════════════════════

const heartIconSVG = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const starIconSVG = `<svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>`;
const cartIconSVG = `<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
const emptyCartIconSVG = `<svg viewBox="0 0 24 24"><path d="M9 2h6l1 5-2 4h-4L8 8zM9 14h6l1 7H8z"/></svg>`;
const zoomIconSVG = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;

let productsCache = [];

// Los datos vienen de la API: se escapan antes de usarlos en innerHTML
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Convierte un producto de la API al formato que usa esta vista
function mapProduct(p) {
  return {
    id: p.id,
    name: p.nombre,
    price: Number(p.precioBase),
    images: p.imagenes || [],
    variantes: (p.variantes || []).map((v) => ({
      id: v.id,
      color: v.color.nombre,
      talla: v.talla.nombre,
      stock: v.stock,
      price: v.precio != null ? Number(v.precio) : Number(p.precioBase),
    })),
  };
}

// Trae todo el catálogo (la API entrega máx. 50 por página)
async function loadProducts() {
  const all = [];
  let page = 1, total = 0;
  do {
    const res = await Api.productos({ page, limit: 50 });
    all.push(...res.data);
    total = res.total;
    page++;
  } while (all.length < total);
  return all.map(mapProduct);
}

function formatProductPrice(n) {
  return '$' + Number(n).toLocaleString('es-CO') + ' COP';
}

function getProductImages(product) {
  return Array.isArray(product.images) ? product.images : [];
}

function renderProductCard(product) {
  const images = getProductImages(product);
  const thumb = images[0] || '';
  const hayStock = product.variantes.some((v) => v.stock > 0);
  const badge = !hayStock ? `<span class="product-badge-new">Agotado</span>` : '';

  const zoomBtn = images.length
    ? `<button type="button" class="product-zoom-btn" aria-label="Ver fotos de ${esc(product.name)}">${zoomIconSVG}</button>`
    : '';

  return `
    <div class="product-card reveal visible" data-id="${product.id}">
      <div class="product-card-media" data-id="${product.id}" role="button" tabindex="0" aria-label="Ver fotos de ${esc(product.name)}">
        <img src="${esc(thumb)}" alt="${esc(product.name)}" loading="lazy">
        ${badge}
        <div class="product-wish" aria-label="Agregar a favoritos">${heartIconSVG}</div>
        ${zoomBtn}
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${esc(product.name)}</div>
        <div class="product-card-footer">
          <span class="product-card-price">${formatProductPrice(product.price)}</span>
          <button class="product-cart-btn" data-id="${product.id}" aria-label="Agregar al carrito" ${hayStock ? '' : 'disabled'}>${cartIconSVG}</button>
        </div>
      </div>
    </div>`;
}

function renderMessage(title, text, withHome = true) {
  return `
    <div class="shop-empty">
      ${emptyCartIconSVG}
      <h3>${title}</h3>
      <p>${text}</p>
      ${withHome ? '<a href="index.html" class="cta-link">Volver al inicio</a>' : ''}
    </div>`;
}

async function renderShop() {
  const grid = document.getElementById('shopGrid');
  const countLabel = document.getElementById('shopCount');
  if (!grid) return;

  grid.classList.add('is-empty');
  grid.innerHTML = renderMessage('Cargando catálogo…', 'Un momento por favor.', false);

  try {
    productsCache = await loadProducts();
  } catch (e) {
    console.error(e);
    grid.innerHTML = renderMessage('No pudimos cargar los productos',
      'Revisa tu conexión e inténtalo de nuevo en unos segundos.');
    if (countLabel) countLabel.textContent = '';
    return;
  }

  if (productsCache.length === 0) {
    grid.innerHTML = renderMessage('Todavía no hay productos',
      'Estamos preparando el catálogo. Vuelve pronto para ver las novedades.');
  } else {
    grid.classList.remove('is-empty');
    grid.innerHTML = productsCache.map(renderProductCard).join('');
  }

  if (countLabel) {
    const n = productsCache.length;
    countLabel.textContent = n === 0 ? '' : `${n} ${n === 1 ? 'producto' : 'productos'}`;
  }
}

// ═══════════════════════════════════════════════
// MODAL DE FOTOS (carrusel de Bootstrap)
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
      <img src="${esc(src)}" class="d-block w-100" alt="${esc(product.name)} — foto ${i + 1}">
    </div>`).join('');

  const hasMultiple = images.length > 1;
  modalEl.querySelectorAll('.carousel-control-prev, .carousel-control-next')
    .forEach((el) => el.classList.toggle('d-none', !hasMultiple));

  if (indicators) {
    indicators.innerHTML = hasMultiple
      ? images.map((_, i) => `
          <button type="button" data-bs-target="#productCarousel" data-bs-slide-to="${i}"
            class="${i === 0 ? 'active' : ''}" aria-current="${i === 0 ? 'true' : 'false'}"
            aria-label="Foto ${i + 1}"></button>`).join('')
      : '';
  }
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// ═══════════════════════════════════════════════
// AGREGAR AL CARRITO (elige color/talla y llama a la API)
// ═══════════════════════════════════════════════
async function addToCart(product) {
  if (!Api.isLogged()) return askLogin(); // viene de cart.js

  const disponibles = product.variantes.filter((v) => v.stock > 0);
  if (!disponibles.length) return Swal.fire({ icon: 'info', title: 'Producto agotado' });

  let variante = disponibles[0];
  if (disponibles.length > 1) {
    const options = Object.fromEntries(disponibles.map((v) =>
      [v.id, `${v.color} · ${v.talla}${v.stock <= 3 ? ` (quedan ${v.stock})` : ''}`]));
    const { value, isConfirmed } = await Swal.fire({
      title: product.name,
      input: 'select', inputOptions: options, inputPlaceholder: 'Elige color y talla',
      showCancelButton: true, confirmButtonText: 'Agregar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#E23789',
      inputValidator: (v) => (!v ? 'Selecciona una opción' : undefined),
    });
    if (!isConfirmed) return;
    variante = disponibles.find((v) => String(v.id) === String(value));
  }

  // cart.js: una sola petición y actualiza el carrito con la respuesta
  return addVariantToCart(variante.id, product.name);
}

function findProduct(id) {
  return productsCache.find((p) => String(p.id) === String(id));
}

function handleGridClick(e) {
  if (e.target.closest('.product-wish')) return;

  const cartBtn = e.target.closest('.product-cart-btn');
  if (cartBtn) {
    const p = findProduct(cartBtn.dataset.id);
    if (p) addToCart(p);
    return;
  }

  const mediaEl = e.target.closest('.product-card-media');
  if (!mediaEl) return;
  const p = findProduct(mediaEl.dataset.id);
  if (p) openProductModal(p);
}

function handleGridKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const mediaEl = e.target.closest('.product-card-media');
  if (!mediaEl) return;
  e.preventDefault();
  const p = findProduct(mediaEl.dataset.id);
  if (p) openProductModal(p);
}

document.addEventListener('DOMContentLoaded', () => {
  renderShop();
  const grid = document.getElementById('shopGrid');
  if (grid) {
    grid.addEventListener('click', handleGridClick);
    grid.addEventListener('keydown', handleGridKeydown);
  }
});