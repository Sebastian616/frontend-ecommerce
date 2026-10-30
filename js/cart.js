// ═══════════════════════════════════════════════
// OrbIsa — Carrito conectado a la API
// - El carrito vive en el servidor (/me/carrito), por usuario.
// - Se agrega por VARIANTE (color + talla), no por producto.
// - "Finalizar compra" crea una orden real (/ordenes). Sin pasarela de pago por ahora.
// Requiere cargar antes: SweetAlert2, config.js, api.js
// ═══════════════════════════════════════════════

const FREE_SHIPPING_MIN = 100000;

// Campos del formulario de nueva dirección. Si tu API usa otros nombres, cámbialos aquí.
const ADDRESS_FIELDS = [
  { key: 'nombre',       label: 'Nombre de quien recibe',          required: true },
  { key: 'telefono',     label: 'Teléfono',                        required: true, type: 'tel' },
  { key: 'direccion',    label: 'Dirección (calle, número, apto)', required: true },
  { key: 'ciudad',       label: 'Ciudad',                          required: true },
  { key: 'departamento', label: 'Departamento',                    required: false },
];

// Métodos de pago. "TARJETA" queda visible pero deshabilitada hasta tener pasarela:
// cuando la implementes, pon enabled: true y agrega el valor al enum del backend.
const PAYMENT_METHODS = [
  { id: 'EFECTIVO',      label: 'Efectivo',      hint: 'Pagas al recibir tu pedido',            enabled: true  },
  { id: 'TRANSFERENCIA', label: 'Transferencia', hint: 'Transfieres y confirmamos tu pedido',   enabled: true  },
  { id: 'TARJETA',       label: 'Tarjeta',       hint: 'Próximamente',                          enabled: false },
];

// Datos para pagos por transferencia. Completa los que quieras mostrar al cliente;
// los que dejes vacíos no se muestran. Si todos están vacíos se avisa que se enviarán después.
const TRANSFER_INFO = {
  banco: '',
  tipoCuenta: '',
  numero: '',
  titular: '',
  nota: '',   // ej: "Envíanos el comprobante por WhatsApp al 300 000 0000"
};

// Texto que ve el cliente al crear el pedido según el método
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

  <div class="cart-ship" id="cartShip" style="--p:0">
    <div class="ship-msg" id="cartShipMsg"></div>
    <div class="ship-track">
      <div class="ship-road"><div class="ship-road-fill"></div></div>
      <div class="ship-truck">
        <svg viewBox="0 0 64 40" aria-hidden="true">
          <rect class="truck-cargo" x="2" y="5" width="38" height="24" rx="3"/>
          <rect class="truck-fill" x="3" y="6" width="36" height="22" rx="2"/>
          <path class="truck-cab" d="M42 12h11l9 10v7H42z"/>
          <circle class="truck-wheel" cx="15" cy="32" r="5"/>
          <circle class="truck-wheel" cx="50" cy="32" r="5"/>
        </svg>
      </div>
    </div>
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

// Camión: se llena y avanza según el subtotal; con FREE_SHIPPING_MIN el envío es gratis
function updateShippingBar(subtotal) {
  const ship = document.getElementById('cartShip');
  const msg = document.getElementById('cartShipMsg');
  if (!ship || !msg) return;

  const p = Math.max(0, Math.min(1, subtotal / FREE_SHIPPING_MIN));
  const free = subtotal >= FREE_SHIPPING_MIN;
  ship.style.setProperty('--p', p);
  ship.classList.toggle('is-free', free);

  if (free) {
    msg.innerHTML = '🎉 <b>¡Tu envío es gratis!</b>';
  } else if (subtotal <= 0) {
    msg.innerHTML = `Agrega productos y llega a <b>${formatPrice(FREE_SHIPPING_MIN)}</b> para envío gratis`;
  } else {
    msg.innerHTML = `Te faltan <b>${formatPrice(FREE_SHIPPING_MIN - subtotal)}</b> para el envío gratis`;
  }
}

let cartItems = [];   // carrito normalizado (viene del servidor)
let cartBusy = false; // evita dobles clics mientras hay una petición en curso

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
  if (Array.isArray(err.details) && err.details.length) {
    msg += '\n' + err.details.map((d) => {
      if (typeof d === 'string') return d;
      const path = Array.isArray(d.path) ? d.path.join('.') : '';
      return (path ? path + ': ' : '') + (d.message || JSON.stringify(d));
    }).join('\n');
  }
  return Swal.fire({ icon: 'error', title: fallback, text: msg, confirmButtonColor: '#E23789' });
}

// ═══════════════════════════════════════════════
// NORMALIZAR LA RESPUESTA DE /me/carrito
// Si tu API devuelve otra forma, ajusta SOLO esta función.
// Se espera algo como: { items: [{ cantidad, variante: { id, stock, precio, color, talla, producto } }] }
// ═══════════════════════════════════════════════

function normalizeCart(data) {
  const raw = Array.isArray(data) ? data : (data?.items || data?.lineas || []);
  return raw.map((it) => {
    const v = it.variante || it;
    const prod = v.producto || it.producto || {};
    const imgs = Array.isArray(prod.imagenes) ? prod.imagenes : [];
    const first = imgs[0];
    return {
      id: it.varianteId ?? v.id,                       // id de la VARIANTE
      name: prod.nombre || it.nombre || 'Producto',
      image: typeof first === 'string' ? first : (first?.url || ''),
      variant: [v.color?.nombre, v.talla?.nombre].filter(Boolean).join(' / '),
      price: Number(v.precio ?? it.precioUnitario ?? it.precio ?? prod.precioBase ?? 0),
      qty: Number(it.cantidad ?? it.qty ?? 1),
      stock: v.stock ?? null,
    };
  });
}

async function refreshCart() {
  if (!Api.isLogged()) {
    cartItems = [];
  } else {
    try {
      cartItems = normalizeCart(await Api.carrito());
    } catch (err) {
      console.warn('No se pudo cargar el carrito', err);
      if (err.status === 401) cartItems = [];
    }
  }
  renderCart();
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

  if (cartItems.length === 0) {
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
  updateShippingBar(subtotal);
}

// ═══════════════════════════════════════════════
// AGREGAR AL CARRITO (por producto → se elige variante)
// Cualquier botón con class "product-cart-btn" y data-product-id sirve.
// ═══════════════════════════════════════════════

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

async function addProductToCart(productId) {
  if (!Api.isLogged()) return askLogin();
  if (cartBusy) return;
  cartBusy = true;
  try {
    const product = await Api.producto(productId);
    const variants = (product.variantes || []).filter((v) => v.stock > 0);

    if (variants.length === 0) {
      Swal.fire({ icon: 'info', title: 'Agotado', text: 'Este producto no tiene stock por ahora.', confirmButtonColor: '#E23789' });
      return;
    }

    const variant = variants.length === 1 ? variants[0] : await pickVariant(product, variants);
    if (!variant) return;

    await Api.agregarAlCarrito(variant.id, 1);
    await refreshCart();
    bumpCartBadge();
    toast('success', `${product.nombre} agregado`, 'Se sumó al carrito correctamente');
  } catch (err) {
    apiError(err, 'No se pudo agregar al carrito');
  } finally {
    cartBusy = false;
  }
}

// Agrega una variante ya elegida (la usan páginas con su propio selector, como productos.html).
// Formas admitidas: addVariantToCart(varianteId, cantidad) | addVariantToCart(variante, cantidad)
//                   | addVariantToCart(producto, variante, cantidad)
async function addVariantToCart(a, b, c) {
  let varianteId;
  let cantidad = 1;
  let nombre = '';

  if (a && typeof a === 'object' && Array.isArray(a.variantes) && b && typeof b === 'object') {
    nombre = a.nombre || '';
    varianteId = b.id;
    cantidad = Number(c) || 1;
  } else if (a && typeof a === 'object') {
    varianteId = a.id;
    cantidad = Number(b) || 1;
  } else {
    varianteId = a;
    cantidad = Number(b) || 1;
  }

  if (!Number.isInteger(Number(varianteId)) || Number(varianteId) <= 0) {
    console.error('addVariantToCart: no llegó un id de variante válido', { a, b, c });
    return apiError(new Error('No se pudo identificar la variante seleccionada'), 'No se pudo agregar al carrito');
  }
  if (!Api.isLogged()) return askLogin();
  if (cartBusy) return false;

  cartBusy = true;
  try {
    await Api.agregarAlCarrito(Number(varianteId), Math.max(1, Math.floor(cantidad)));
    await refreshCart();
    bumpCartBadge();
    toast('success', nombre ? `${nombre} agregado` : 'Producto agregado', 'Se sumó al carrito correctamente');
    return true;
  } catch (err) {
    apiError(err, 'No se pudo agregar al carrito');
    return false;
  } finally {
    cartBusy = false;
  }
}

// ═══════════════════════════════════════════════
// CAMBIAR CANTIDAD / ELIMINAR
// ═══════════════════════════════════════════════

async function changeQty(id, delta) {
  if (cartBusy) return;
  const item = cartItems.find((i) => String(i.id) === String(id));
  if (!item) return;

  const next = item.qty + delta;
  if (next < 1) return;
  if (item.stock != null && next > item.stock) {
    toast('warning', 'Stock limitado', `Solo hay ${item.stock} disponibles`);
    return;
  }

  cartBusy = true;
  try {
    await Api.cambiarCantidad(item.id, next);
    await refreshCart();
  } catch (err) {
    apiError(err, 'No se pudo cambiar la cantidad');
    await refreshCart();
  } finally {
    cartBusy = false;
  }
}

async function removeItem(id) {
  if (cartBusy) return;
  cartBusy = true;
  try {
    await Api.quitarDelCarrito(id);
    await refreshCart();
  } catch (err) {
    apiError(err, 'No se pudo quitar el producto');
    await refreshCart();
  } finally {
    cartBusy = false;
  }
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
  const main = d.direccion || d.linea1 || d.calle || '';
  return [main, d.ciudad].filter(Boolean).join(', ') || `Dirección #${d.id}`;
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
        let msg = err.message || 'No se pudo guardar la dirección';
        if (Array.isArray(err.details) && err.details.length) {
          msg += ': ' + err.details.map((d) => d.message || d).join(', ');
        }
        Swal.showValidationMessage(msg);
        return false;
      }
    },
  });
  if (!res.isConfirmed) return null;
  return res.value?.id ?? res.value?.direccion?.id ?? null;
}

async function handleCheckout() {
  if (!Api.isLogged()) return askLogin();
  if (cartItems.length === 0) return;
  if (cartBusy) return;

  closeCart(); // para que los diálogos se vean por encima

  let addresses = [];
  try {
    const d = await Api.direcciones();
    addresses = Array.isArray(d) ? d : (d?.data || d?.direcciones || []);
  } catch (err) {
    return apiError(err, 'No se pudieron cargar tus direcciones');
  }

  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const selectStyle = 'width:100%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:10px;border:1px solid #ddd;font:inherit';

  const step = await Swal.fire({
    title: 'Confirmar pedido',
    html: `
      <p style="margin:0 0 12px">${totalQty} ${totalQty === 1 ? 'producto' : 'productos'} · <b>${formatPrice(subtotal)}</b>
      ${subtotal >= FREE_SHIPPING_MIN ? '<br><small>Envío gratis 🎉</small>' : ''}</p>
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

  cartBusy = true;
  Swal.fire({ title: 'Creando tu pedido…', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    const orden = await Api.crearOrden(Number(direccionId), step.value.code || undefined, step.value.pay);
    await refreshCart();

    const ordenId = orden?.id ?? orden?.numero ?? '';
    const ordenTotal = orden?.total != null ? ` · Total: <b>${formatPrice(Number(orden.total))}</b>` : '';
    const r = await Swal.fire({
      icon: 'success',
      title: '¡Pedido creado!',
      html: `Número de pedido: <b>#${esc(ordenId)}</b>${ordenTotal}${paymentInstructionsHTML(step.value.pay)}`,
      showCancelButton: true,
      confirmButtonText: 'Ver mis pedidos',
      cancelButtonText: 'Seguir comprando',
      confirmButtonColor: '#E23789',
    });
    if (r.isConfirmed) location.href = 'pedidos.html';
  } catch (err) {
    await apiError(err, 'No se pudo crear el pedido');
    await refreshCart();
  } finally {
    cartBusy = false;
  }
}

// ═══════════════════════════════════════════════
// EVENTOS (delegados en document)
// ═══════════════════════════════════════════════

document.addEventListener('click', (e) => {
  if (e.target.closest('.cart-open-btn')) { openCart(); refreshCart(); return; }
  if (e.target.closest('#cartClose')) { closeCart(); return; }
  if (e.target.closest('#cartOverlay')) { closeCart(); return; }
  if (e.target.closest('#cartContinue')) { closeCart(); return; }
  if (e.target.closest('#cartCheckoutBtn')) { handleCheckout(); return; }

  const addBtn = e.target.closest('.product-cart-btn');
  if (addBtn) {
    const productId = addBtn.dataset.productId;
    if (productId) addProductToCart(productId);
    return;
  }

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
    itemEl.classList.add('removing');
    setTimeout(() => removeItem(itemEl.dataset.id), 300);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('cartModal')?.classList.contains('open')) {
    closeCart();
  }
});

// Disponibles para otras páginas (productos.html, login, etc.)
window.refreshCart = refreshCart;
window.addProductToCart = addProductToCart;
window.addVariantToCart = addVariantToCart;

// Primer render: carga el carrito del servidor si hay sesión
renderCart();
refreshCart();