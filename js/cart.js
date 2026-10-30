// ═══════════════════════════════════════════════
// OrbIsa — Carrito conectado a la API
// - El carrito vive en el servidor (/me/carrito), por usuario.
// - Se agrega por VARIANTE (color + talla), no por producto.
// - "Finalizar compra" crea una orden real (/ordenes). Sin pasarela de pago por ahora.
// - RÁPIDO: cada operación usa la respuesta del servidor (sin pedir el carrito otra vez)
//   y los cambios de cantidad / eliminar se ven al instante (optimistas).
// Requiere cargar antes: SweetAlert2, config.js, api.js
// ═══════════════════════════════════════════════

const FREE_SHIPPING_MIN = 100000;
const SHIPPING_COST = 10000; // Debe coincidir con COSTO_ENVIO / ENVIO_GRATIS_DESDE del backend (.env)

// Campos de la nueva dirección (coinciden con lo que exige la API)
const ADDRESS_FIELDS = [
  { key: 'nombre',       label: 'Nombre de quien recibe',   required: true },
  { key: 'telefono',     label: 'Teléfono',                 required: true, type: 'tel' },
  { key: 'linea1',       label: 'Dirección (calle y número)', required: true },
  { key: 'linea2',       label: 'Apto, barrio, referencias', required: false },
  { key: 'ciudad',       label: 'Ciudad',                   required: true },
  { key: 'departamento', label: 'Departamento',             required: true },
];

// "TARJETA" queda visible pero deshabilitada hasta tener pasarela de pago.
const PAYMENT_METHODS = [
  { id: 'EFECTIVO',      label: 'Efectivo',      hint: 'Pagas al recibir tu pedido',          enabled: true  },
  { id: 'TRANSFERENCIA', label: 'Transferencia', hint: 'Transfieres y confirmamos tu pedido', enabled: true  },
  { id: 'TARJETA',       label: 'Tarjeta',       hint: 'Próximamente',                        enabled: false },
];

// Datos para pagos por transferencia (los vacíos no se muestran)
const TRANSFER_INFO = {
  banco: '',
  tipoCuenta: '',
  numero: '',
  titular: '',
  nota: '',   // ej: "Envíanos el comprobante por WhatsApp al 300 000 0000"
};

const PAYMENT_INSTRUCTIONS = {
  EFECTIVO: 'Pagarás en efectivo cuando recibas tu pedido.',
  TRANSFERENCIA: 'Realiza la transferencia y usa tu número de pedido como referencia.',
};

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
    <button class="btn-pill cart-checkout" id="cartCheckoutBtn">Finalizar compra
      <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
    </button>
    <button class="cta-link cta-link--dark cart-continue" id="cartContinue">Seguir comprando</button>
  </div>
</aside>
`;

const removeIconSVG = `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;

if (!document.getElementById('cartModal')) {
  document.body.insertAdjacentHTML('beforeend', cartModalHTML);
}

let cartItems = [];          // carrito normalizado (copia del servidor)
let cartLoading = Api.isLogged(); // true hasta la primera respuesta
let lastSync = 0;            // última vez que sincronizamos con el servidor
let addBusy = false;         // evita doble clic al agregar
let pending = 0;             // operaciones de cantidad/eliminar en curso
let failed = false;
let chain = Promise.resolve(); // cola: las operaciones se envían en orden

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const formatPrice = (n) => '$' + Number(n || 0).toLocaleString('es-CO') + ' COP';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
  document.querySelectorAll('.cart-count').forEach((badge) => {
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  });
}

function toast(icon, title, text) {
  if (typeof Swal === 'undefined') return;
  Swal.fire({
    toast: true, position: 'top-end', showConfirmButton: false,
    timer: 2200, timerProgressBar: true,
    icon, iconColor: '#E23789', title, text,
    background: '#FFF6FA', color: '#241233',
    customClass: { popup: 'fither-toast' },
  });
}

function askLogin() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  return Swal.fire({
    icon: 'info',
    title: 'Inicia sesión',
    text: 'Necesitas una cuenta para comprar.',
    showCancelButton: true,
    confirmButtonText: 'Ir a iniciar sesión',
    cancelButtonText: 'Ahora no',
    confirmButtonColor: '#E23789',
  }).then((r) => {
    if (r.isConfirmed) location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
  });
}

function apiError(err, fallback) {
  console.error(err);
  if (err.status === 401) return askLogin();
  let msg = err.message || fallback;
  if (err.details && typeof err.details === 'object') {
    const lines = Array.isArray(err.details)
      ? err.details.map((d) => (typeof d === 'string' ? d : d.message || JSON.stringify(d)))
      : Object.entries(err.details).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`);
    if (lines.length) msg += '\n' + lines.join('\n');
  }
  return Swal.fire({ icon: 'error', title: fallback, text: msg, confirmButtonColor: '#E23789' });
}

// ═══════════════════════════════════════════════
// ESTADO DEL CARRITO
// El servidor ya manda precioUnitario / subtotal calculados: aquí NO se adivinan precios.
// ═══════════════════════════════════════════════

function normalizeCart(data) {
  const raw = Array.isArray(data) ? data : (data?.items || []);
  return raw.map((it) => {
    const v = it.variante || {};
    const prod = v.producto || {};
    const imgs = Array.isArray(prod.imagenes) ? prod.imagenes : [];
    const first = imgs[0];
    return {
      id: it.varianteId ?? v.id,                         // id de la VARIANTE
      name: prod.nombre || 'Producto',
      image: typeof first === 'string' ? first : (first?.url || ''),
      variant: [v.color?.nombre, v.talla?.nombre].filter(Boolean).join(' / '),
      price: Number(it.precioUnitario ?? v.precio ?? prod.precioBase ?? 0),
      qty: Number(it.cantidad ?? 1),
      stock: v.stock ?? null,
    };
  });
}

function applyCart(data) {
  cartItems = normalizeCart(data);
  cartLoading = false;
  lastSync = Date.now();
  renderCart();
}

async function refreshCart() {
  if (!Api.isLogged()) {
    cartItems = [];
    cartLoading = false;
    renderCart();
    return;
  }
  try {
    applyCart(await Api.carrito());
  } catch (err) {
    console.warn('No se pudo cargar el carrito', err);
    if (err.status === 401) cartItems = [];
    cartLoading = false;
    renderCart();
  }
}

// Envía una operación al servidor SIN bloquear la pantalla.
// Van en cola (en orden) y solo la última aplica la respuesta del servidor.
function syncOp(requestFn, errorMsg) {
  pending++;
  chain = chain.then(async () => {
    try {
      const data = await requestFn();
      if (pending === 1) applyCart(data);
    } catch (err) {
      failed = true;
      apiError(err, errorMsg);
    } finally {
      pending--;
      if (pending === 0 && failed) { failed = false; await refreshCart(); } // vuelve a la verdad del servidor
    }
  });
  return chain;
}

// ═══════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════

function renderCartItem(item) {
  return `
    <div class="cart-item" data-id="${esc(item.id)}">
      <img src="${esc(item.image)}" alt="${esc(item.name)}">
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        ${item.variant ? `<div class="cart-item-variant">${esc(item.variant)}</div>` : ''}
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

  if (cartLoading && cartItems.length === 0) {
    wrap.innerHTML = `<div class="cart-empty"><p>Cargando tu carrito…</p></div>`;
  } else if (cartItems.length === 0) {
    const msg = Api.isLogged() ? 'Tu carrito está vacío' : 'Inicia sesión para ver tu carrito';
    wrap.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>${msg}</p>
      </div>`;
  } else {
    wrap.innerHTML = cartItems.map(renderCartItem).join('');
  }

  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  document.querySelectorAll('.cart-count').forEach((b) => { b.textContent = totalQty; });
  const countEl = document.querySelector('.cart-modal-count');
  const subEl = document.querySelector('.cart-subtotal-value');
  if (countEl) countEl.textContent = `(${totalQty})`;
  if (subEl) subEl.textContent = formatPrice(subtotal);
}

// ═══════════════════════════════════════════════
// AGREGAR AL CARRITO
// ═══════════════════════════════════════════════

// Agrega una variante ya elegida (la usa products.js). Una sola petición.
async function addVariantToCart(varianteId, productName = 'Producto') {
  if (!Api.isLogged()) return askLogin();
  if (addBusy) return;
  addBusy = true;
  try {
    const data = await Api.agregarAlCarrito(Number(varianteId), 1);
    if (pending === 0) applyCart(data);
    else { await chain; await refreshCart(); }
    bumpCartBadge();
    toast('success', `${productName} agregado`, 'Se sumó al carrito correctamente');
  } catch (err) {
    apiError(err, 'No se pudo agregar al carrito');
  } finally {
    addBusy = false;
  }
}

function variantLabel(v) {
  const base = [v.color?.nombre, v.talla?.nombre].filter(Boolean).join(' / ') || v.sku;
  return v.stock <= 3 ? `${base} (quedan ${v.stock})` : base;
}

async function pickVariant(product, variants) {
  const options = new Map(variants.map((v) => [String(v.id), variantLabel(v)]));
  const { value, isConfirmed } = await Swal.fire({
    title: product.nombre,
    text: 'Elige color y talla',
    input: 'select',
    inputOptions: options,
    inputPlaceholder: 'Selecciona una opción',
    inputValidator: (v) => (v ? null : 'Elige una opción'),
    showCancelButton: true,
    confirmButtonText: 'Agregar al carrito',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#E23789',
  });
  return isConfirmed ? variants.find((v) => String(v.id) === String(value)) : null;
}

// Para botones con data-product-id (páginas que no tienen las variantes cargadas)
async function addProductToCart(productId) {
  if (!Api.isLogged()) return askLogin();
  if (addBusy) return;
  try {
    const product = await Api.producto(productId);
    const variants = (product.variantes || []).filter((v) => v.stock > 0);
    if (variants.length === 0) {
      Swal.fire({ icon: 'info', title: 'Agotado', text: 'Este producto no tiene stock por ahora.', confirmButtonColor: '#E23789' });
      return;
    }
    const variant = variants.length === 1 ? variants[0] : await pickVariant(product, variants);
    if (variant) await addVariantToCart(variant.id, product.nombre);
  } catch (err) {
    apiError(err, 'No se pudo agregar al carrito');
  }
}

// ═══════════════════════════════════════════════
// CAMBIAR CANTIDAD / ELIMINAR  (se ven al instante)
// ═══════════════════════════════════════════════

function changeQty(id, delta) {
  const item = cartItems.find((i) => String(i.id) === String(id));
  if (!item) return;

  const next = item.qty + delta;
  if (next < 1) return;
  if (item.stock != null && next > item.stock) {
    toast('warning', 'Stock limitado', `Solo hay ${item.stock} disponibles`);
    return;
  }

  item.qty = next;   // cambio inmediato en pantalla
  renderCart();
  syncOp(() => Api.cambiarCantidad(item.id, next), 'No se pudo cambiar la cantidad');
}

function removeItem(id) {
  cartItems = cartItems.filter((i) => String(i.id) !== String(id)); // desaparece ya
  renderCart();
  syncOp(() => Api.quitarDelCarrito(id), 'No se pudo quitar el producto');
}

// ═══════════════════════════════════════════════
// CHECKOUT → crea la orden en la API (sin pasarela de pago)
// ═══════════════════════════════════════════════

function paymentOptionsHTML() {
  const firstEnabled = PAYMENT_METHODS.findIndex((m) => m.enabled);
  return PAYMENT_METHODS.map((m, i) => `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin:6px 0;border:1px solid #ddd;border-radius:12px;text-align:left;${m.enabled ? 'cursor:pointer' : 'opacity:.5;cursor:not-allowed'}">
      <input type="radio" name="swPay" value="${esc(m.id)}" ${m.enabled ? '' : 'disabled'} ${i === firstEnabled ? 'checked' : ''}>
      <span><b>${esc(m.label)}</b><br><small>${esc(m.hint)}</small></span>
    </label>`).join('');
}

function paymentInstructionsHTML(method) {
  let html = `<p style="margin:12px 0 0">${esc(PAYMENT_INSTRUCTIONS[method] || '')}</p>`;
  if (method === 'TRANSFERENCIA') {
    const rows = [
      ['Banco', TRANSFER_INFO.banco],
      ['Tipo de cuenta', TRANSFER_INFO.tipoCuenta],
      ['Número', TRANSFER_INFO.numero],
      ['Titular', TRANSFER_INFO.titular],
    ].filter(([, v]) => v);
    if (rows.length) {
      html += `<div style="margin-top:10px;padding:10px 12px;border:1px dashed #E23789;border-radius:12px;text-align:left">
        ${rows.map(([k, v]) => `<div><small>${esc(k)}</small> <b>${esc(v)}</b></div>`).join('')}
      </div>`;
      if (TRANSFER_INFO.nota) html += `<p style="margin:8px 0 0"><small>${esc(TRANSFER_INFO.nota)}</small></p>`;
    } else {
      html += '<p style="margin:8px 0 0"><small>Te compartiremos los datos de la cuenta para completar la transferencia.</small></p>';
    }
  }
  return html;
}

function addressLabel(d) {
  return [d.linea1, d.ciudad].filter(Boolean).join(', ') || `Dirección #${d.id}`;
}

async function createAddressFlow() {
  const html = ADDRESS_FIELDS.map((f) => `
    <input id="addr_${f.key}" class="swal2-input" type="${f.type || 'text'}"
           placeholder="${esc(f.label)}${f.required ? ' *' : ''}" style="margin:6px 0;width:100%;box-sizing:border-box">`
  ).join('');

  const res = await Swal.fire({
    title: 'Nueva dirección de envío',
    html,
    showCancelButton: true,
    confirmButtonText: 'Guardar y continuar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#E23789',
    focusConfirm: false,
    preConfirm: async () => {
      const data = {};
      for (const f of ADDRESS_FIELDS) {
        const val = document.getElementById('addr_' + f.key).value.trim();
        if (f.required && !val) { Swal.showValidationMessage(`Falta: ${f.label}`); return false; }
        if (val) data[f.key] = val;
      }
      try {
        return await Api.crearDireccion(data);
      } catch (err) {
        Swal.showValidationMessage(err.message || 'No se pudo guardar la dirección');
        return false;
      }
    },
  });
  if (!res.isConfirmed) return null;
  return res.value?.id ?? null;
}

async function handleCheckout() {
  if (!Api.isLogged()) return askLogin();
  await chain;                       // espera cambios de cantidad pendientes
  if (cartItems.length === 0) return;

  closeCart();

  let addresses = [];
  try {
    const d = await Api.direcciones();
    addresses = Array.isArray(d) ? d : (d?.data || []);
  } catch (err) {
    return apiError(err, 'No se pudieron cargar tus direcciones');
  }

  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  const selectStyle = 'width:100%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:10px;border:1px solid #ddd;font:inherit';

  const step = await Swal.fire({
    title: 'Confirmar pedido',
    html: `
      <div style="text-align:left;margin:0 0 12px;line-height:1.7">
        <div>${totalQty} ${totalQty === 1 ? 'producto' : 'productos'} · Subtotal: <b>${formatPrice(subtotal)}</b></div>
        <div>Envío: <b>${shipping === 0 ? 'Gratis 🎉' : formatPrice(shipping)}</b></div>
        <div>Total estimado: <b>${formatPrice(subtotal + shipping)}</b></div>
        <small>Si usas un cupón, el descuento se aplica al confirmar.</small>
      </div>
      <select id="swAddress" style="${selectStyle}">
        ${addresses.map((a) => `<option value="${esc(a.id)}">${esc(addressLabel(a))}</option>`).join('')}
        <option value="new">+ Nueva dirección</option>
      </select>
      <input id="swCoupon" class="swal2-input" placeholder="Cupón (opcional)" style="${selectStyle}">
      <div style="margin-top:10px;text-align:left"><b style="font-size:14px">Método de pago</b>${paymentOptionsHTML()}</div>`,
    showCancelButton: true,
    confirmButtonText: 'Confirmar pedido',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#E23789',
    focusConfirm: false,
    preConfirm: async () => {
      const addr = document.getElementById('swAddress').value;
      const code = document.getElementById('swCoupon').value.trim();
      const pay = document.querySelector('input[name="swPay"]:checked')?.value;
      if (!pay) { Swal.showValidationMessage('Elige un método de pago'); return false; }
      if (code) {
        try { await Api.validarCupon(code); }
        catch (err) { Swal.showValidationMessage(err.message || 'Cupón no válido'); return false; }
      }
      return { addr, code, pay };
    },
  });
  if (!step.isConfirmed) return;

  let direccionId = step.value.addr;
  if (direccionId === 'new') {
    direccionId = await createAddressFlow();
    if (!direccionId) return;
  }

  Swal.fire({ title: 'Creando tu pedido…', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    const orden = await Api.crearOrden(Number(direccionId), step.value.code || undefined, step.value.pay);
    cartItems = [];            // la orden vació el carrito en el servidor
    renderCart();

    const num = (x) => Number(x || 0);
    const resumen = `
      <div style="text-align:left;margin-top:8px;line-height:1.7">
        <div>Subtotal: ${formatPrice(num(orden.subtotal))}</div>
        ${num(orden.descuento) > 0 ? `<div>Descuento: −${formatPrice(num(orden.descuento))}</div>` : ''}
        <div>Envío: ${num(orden.envio) === 0 ? 'Gratis' : formatPrice(num(orden.envio))}</div>
        <div>Total: <b>${formatPrice(num(orden.total))}</b></div>
      </div>`;

    const r = await Swal.fire({
      icon: 'success',
      title: '¡Pedido creado!',
      html: `Número de pedido: <b>${esc(orden.numero ?? '#' + orden.id)}</b>${resumen}${paymentInstructionsHTML(step.value.pay)}`,
      showCancelButton: true,
      confirmButtonText: 'Ver mis pedidos',
      cancelButtonText: 'Seguir comprando',
      confirmButtonColor: '#E23789',
    });
    if (r.isConfirmed) location.href = 'mis-pedidos.html';
  } catch (err) {
    await apiError(err, 'No se pudo crear el pedido');
    await refreshCart();
  }
}

// ═══════════════════════════════════════════════
// EVENTOS (delegados en document)
// ═══════════════════════════════════════════════

document.addEventListener('click', (e) => {
  if (e.target.closest('.cart-open-btn')) {
    openCart();
    if (Date.now() - lastSync > 30000) refreshCart(); // solo si los datos están viejos
    return;
  }
  if (e.target.closest('#cartClose')) { closeCart(); return; }
  if (e.target.closest('#cartOverlay')) { closeCart(); return; }
  if (e.target.closest('#cartContinue')) { closeCart(); return; }
  if (e.target.closest('#cartCheckoutBtn')) { handleCheckout(); return; }

  const addBtn = e.target.closest('.product-cart-btn[data-product-id]');
  if (addBtn) { addProductToCart(addBtn.dataset.productId); return; }

  const qtyBtn = e.target.closest('.qty-btn');
  if (qtyBtn) {
    const itemEl = qtyBtn.closest('.cart-item');
    const isPlus = qtyBtn.textContent.trim() === '+';
    changeQty(itemEl.dataset.id, isPlus ? 1 : -1);
    return;
  }

  const removeBtn = e.target.closest('.cart-item-remove');
  if (removeBtn) {
    const itemEl = removeBtn.closest('.cart-item');
    const id = itemEl.dataset.id;
    itemEl.classList.add('removing');
    setTimeout(() => removeItem(id), 180);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('cartModal')?.classList.contains('open')) {
    closeCart();
  }
});

window.addEventListener('cart:updated', () => refreshCart());

// Disponibles para otras páginas
window.refreshCart = refreshCart;
window.addProductToCart = addProductToCart;
window.addVariantToCart = addVariantToCart;

// Primer render: carga el carrito del servidor si hay sesión
renderCart();
refreshCart();