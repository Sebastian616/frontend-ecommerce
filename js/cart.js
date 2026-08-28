// ═══════════════════════════════════════════════
// FitHer / OrbIsa — Carrito (componente reutilizable)
// - Se autoinyecta en el <body>.
// - Empieza SIEMPRE vacío salvo que ya haya datos
//   guardados en localStorage de una visita anterior.
// - Los botones .product-cart-btn de las tarjetas de
//   producto agregan al carrito automáticamente
//   (lee nombre, precio e imagen de la propia tarjeta).
// - Todo se persiste en localStorage.
// ═══════════════════════════════════════════════

const CART_STORAGE_KEY = 'fither_cart';

// ── Modal shell (sin productos hardcodeados — se renderizan desde los datos) ──
const cartModalHTML = `
<div class="cart-overlay" id="cartOverlay"></div>
<aside class="cart-modal" id="cartModal" role="dialog" aria-modal="true" aria-labelledby="cartModalTitle">
  <div class="cart-modal-header">
    <h2 id="cartModalTitle">Tu carrito <span class="cart-modal-count">(0)</span></h2>
    <button class="cart-close" id="cartClose" aria-label="Cerrar carrito">
      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <div class="cart-items" id="cartItemsWrap"></div>

  <div class="cart-footer">
    <div class="cart-subtotal-row">
      <span>Subtotal</span>
      <span class="cart-subtotal-value">$0 COP</span>
    </div>
    <p class="cart-shipping-note">Envío gratis en compras superiores a $100.000 COP 🎉</p>
    <button class="btn-pill cart-checkout">Finalizar compra
      <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
    </button>
    <button class="cta-link cta-link--dark cart-continue" id="cartContinue">Seguir comprando</button>
  </div>
</aside>
`;

const removeIconSVG = `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;

// 1. Inyecta el modal en el body si aún no existe
if (!document.getElementById('cartModal')) {
  document.body.insertAdjacentHTML('beforeend', cartModalHTML);
}

// ═══════════════════════════════════════════════
// PERSISTENCIA (localStorage)
// ═══════════════════════════════════════════════

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // Si el dato guardado está corrupto, arrancamos limpio en vez de romper la página
    console.warn('No se pudo leer el carrito guardado, se reinicia vacío.', e);
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('No se pudo guardar el carrito en localStorage.', e);
  }
}

let cartItems = loadCart(); // ← vacío ([]) a menos que haya algo guardado antes

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const parsePrice = (text) => Number(String(text).replace(/[^0-9]/g, ''));
const formatPrice = (n) => '$' + n.toLocaleString('es-CO') + ' COP';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function openCart() {
  document.getElementById('cartModal')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartModal')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function bumpCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  badge.classList.remove('bump'); // reinicia la animación si ya estaba corriendo
  void badge.offsetWidth; // fuerza reflow para poder reiniciar la animación
  badge.classList.add('bump');
}

// ═══════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════

function renderCartItem(item) {
  return `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
        <div class="cart-item-qty">
          <button class="qty-btn" aria-label="Restar">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" aria-label="Sumar">+</button>
        </div>
      </div>
      <div class="cart-item-side">
        <span class="cart-item-price">${formatPrice(item.price * item.qty)}</span>
        <button class="cart-item-remove" aria-label="Eliminar producto">${removeIconSVG}</button>
      </div>
    </div>`;
}

function renderCart() {
  const wrap = document.getElementById('cartItemsWrap');
  if (!wrap) return;

  if (cartItems.length === 0) {
    wrap.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Tu carrito está vacío</p>
      </div>`;
  } else {
    wrap.innerHTML = cartItems.map(renderCartItem).join('');
  }

  const totalQty = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  const cartCountBadge = document.getElementById('cartCount');
  const cartModalCount = document.querySelector('.cart-modal-count');
  const cartSubtotalValue = document.querySelector('.cart-subtotal-value');

  if (cartCountBadge) cartCountBadge.textContent = totalQty;
  if (cartModalCount) cartModalCount.textContent = `(${totalQty})`;
  if (cartSubtotalValue) cartSubtotalValue.textContent = formatPrice(subtotal);
}

// ═══════════════════════════════════════════════
// MUTACIONES (todas guardan en localStorage + re-renderizan)
// ═══════════════════════════════════════════════

function addItem(product) {
  const existing = cartItems.find(i => i.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cartItems.push({ ...product, qty: 1 });
  }
  saveCart(cartItems);
  renderCart();
}

function changeQty(id, delta) {
  const item = cartItems.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cartItems);
  renderCart();
}

function removeItem(id) {
  cartItems = cartItems.filter(i => i.id !== id);
  saveCart(cartItems);
  renderCart();
}

// ═══════════════════════════════════════════════
// EVENTOS (delegados en document — funcionan sin
// importar cuándo se inyecten navbar/productos)
// ═══════════════════════════════════════════════

document.addEventListener('click', (e) => {

  // Abrir / cerrar el modal
  if (e.target.closest('#cartTrigger')) { openCart(); return; }
  if (e.target.closest('#cartClose')) { closeCart(); return; }
  if (e.target.closest('#cartOverlay')) { closeCart(); return; }
  if (e.target.closest('#cartContinue')) { closeCart(); return; }

  // Agregar producto desde una tarjeta (.product-card) del catálogo
  const addBtn = e.target.closest('.product-cart-btn');
  if (addBtn) {
    const card = addBtn.closest('.product-card');
    if (!card) return;

    const name = card.querySelector('.product-card-name')?.textContent.trim() || 'Producto';
    const priceText = card.querySelector('.product-card-price')?.textContent || '0';
    const image = card.querySelector('.product-card-media img')?.getAttribute('src') || '';

    addItem({
      id: slugify(name),
      name,
      price: parsePrice(priceText),
      image,
      variant: ''
    });

    bumpCartBadge(); // feedback visual sin bloquear la navegación
    return;
  }

  // Sumar / restar cantidad dentro del modal
  const qtyBtn = e.target.closest('.qty-btn');
  if (qtyBtn) {
    const itemEl = qtyBtn.closest('.cart-item');
    const isPlus = qtyBtn.textContent.trim() === '+';
    changeQty(itemEl.dataset.id, isPlus ? 1 : -1);
    return;
  }

  // Eliminar producto del modal
  const removeBtn = e.target.closest('.cart-item-remove');
  if (removeBtn) {
    const itemEl = removeBtn.closest('.cart-item');
    itemEl.classList.add('removing');
    setTimeout(() => removeItem(itemEl.dataset.id), 300);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('cartModal')?.classList.contains('open')) {
    closeCart();
  }
});

// 2. Primer render — refleja lo guardado en localStorage (o vacío si no hay nada)
renderCart();