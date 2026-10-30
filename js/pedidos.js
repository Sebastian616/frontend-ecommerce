// ═══════════════════════════════════════════════
// OrbIsa — Pedidos (panel admin) conectado a la API
// Solo para administradores. Requiere: SweetAlert2, config.js, api.js
// ═══════════════════════════════════════════════

// ── Guardia de acceso (mejora de UX; la seguridad real está en el backend:
//    GET /ordenes?todas=1 y los PATCH solo responden a rol ADMIN) ──
(function guard() {
  try {
    const token = localStorage.getItem('orbisa_token');
    const session = JSON.parse(localStorage.getItem('orbisa_session') || 'null');
    if (!token || !session) { location.replace('login.html'); return; }
    if (session.role !== 'admin') location.replace('index.html');
  } catch (e) {
    location.replace('login.html');
  }
})();

let ordersCache = [];
let busy = false;

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatOrderPrice(n) {
  return '$' + Number(n || 0).toLocaleString('es-CO') + ' COP';
}

function formatOrderDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function toast(icon, title) {
  Swal.fire({
    toast: true, position: 'top-end', showConfirmButton: false,
    timer: 2200, timerProgressBar: true, icon, title,
  });
}

function handleApiError(err, fallback) {
  console.error(err);
  if (err.status === 401) {
    localStorage.removeItem('orbisa_session');
    Swal.fire({ icon: 'warning', title: 'Sesión vencida', text: 'Inicia sesión de nuevo.' })
      .then(() => location.replace('login.html'));
    return;
  }
  if (err.status === 403) {
    Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'Solo los administradores pueden ver los pedidos.' })
      .then(() => location.replace('index.html'));
    return;
  }
  let msg = err.message || fallback;
  if (Array.isArray(err.details) && err.details.length) {
    msg += '\n' + err.details.map((d) => (typeof d === 'string' ? d : d.message || JSON.stringify(d))).join('\n');
  }
  Swal.fire({ icon: 'error', title: fallback, text: msg });
}

function confirmDialog(title, text, confirmText) {
  return Swal.fire({
    title, text, icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Volver',
    confirmButtonColor: '#e23789',
  }).then((r) => r.isConfirmed);
}

function injectStyles() {
  if (document.getElementById('pedidosExtraStyles')) return;
  const st = document.createElement('style');
  st.id = 'pedidosExtraStyles';
  st.textContent = `
    .order-meta { display: grid; gap: 2px; font-size: 13px; opacity: .8; padding: 8px 0; }
    .order-action-btn {
      border: none; border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 600;
      cursor: pointer; background: var(--pink, #e23789); color: #fff;
    }
    .order-action-btn.secondary { background: var(--blush-mid, #f4e9ef); color: var(--plum, #241233); }
    .order-action-btn:disabled { opacity: .5; cursor: default; }
    .order-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  `;
  document.head.appendChild(st);
}

// ═══════════════════════════════════════════════
// NORMALIZAR LA RESPUESTA DE GET /ordenes?todas=1
// Si tu API usa otros nombres de campo (detalles, dirección…), ajusta SOLO aquí.
// ═══════════════════════════════════════════════

const METODO_LABELS = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' };

function normalizeOrder(o) {
  const items = (o.detalles || []).map((d) => {
    const v = d.variante || {};
    const prod = v.producto || d.producto || {};
    const imgs = Array.isArray(prod.imagenes) ? prod.imagenes : [];
    return {
      name: d.nombre || d.nombreProducto || d.productoNombre || prod.nombre || 'Producto',
      image: d.imagen || (typeof imgs[0] === 'string' ? imgs[0] : ''),
      variant: d.descripcionVariante || [v.color?.nombre, v.talla?.nombre].filter(Boolean).join(' / '),
      price: Number(d.precioUnitario ?? d.precioUnit ?? d.precio ?? 0),
      qty: Number(d.cantidad ?? 1),
    };
  });

  const buyer = o.comprador || o.usuario;
  const metodo = String(o.metodoPago || o.metodo || o.pagos?.[0]?.metodo || '').toUpperCase();
  const a = o.direccion || {};
  const addr = [
    a.nombre,
    [a.direccion || a.linea1, a.ciudad].filter(Boolean).join(', '),
    a.telefono,
  ].filter(Boolean).join(' · ');

  return {
    id: o.id,
    date: o.creadoEn,
    estado: String(o.estado || '').toUpperCase(),
    items,
    total: o.total != null ? Number(o.total) : items.reduce((s, i) => s + i.price * i.qty, 0),
    metodo: METODO_LABELS[metodo] || metodo,
    buyer: buyer ? `${buyer.nombre || ''}${buyer.email ? ` (${buyer.email})` : ''}`.trim() : '',
    addr,
  };
}

// Etiqueta visible + valor para data-status (reutiliza los colores de tu CSS actual)
function statusInfo(estado) {
  if (estado.startsWith('CANCEL')) return { label: 'Cancelado', css: 'Cancelado' };
  if (estado === 'PAGADA')    return { label: 'Pagado',    css: 'En proceso' };
  if (estado === 'ENVIADA')   return { label: 'Enviado',   css: 'Enviado' };
  if (estado === 'ENTREGADA') return { label: 'Entregado', css: 'Entregado' };
  return { label: 'Pendiente de pago', css: 'Nuevo' };
}

// Acciones disponibles según el estado (respetan las transiciones del backend)
function actionsFor(order) {
  const e = order.estado;
  if (e.startsWith('CANCEL') || e === 'ENTREGADA') return [];
  if (e === 'ENVIADA') return [{ act: 'entregada', label: 'Marcar entregado' }];
  if (e === 'PAGADA') return [
    { act: 'enviada', label: 'Marcar enviado' },
    { act: 'cancelar', label: 'Cancelar', secondary: true },
  ];
  return [
    { act: 'pagar', label: 'Confirmar pago' },
    { act: 'cancelar', label: 'Cancelar', secondary: true },
  ];
}

// ═══════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════

const emptyOrdersSVG = `<svg viewBox="0 0 24 24"><path d="M16 3H1v13h15M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;

function renderOrderItem(item) {
  return `
    <div class="order-item-row">
      <img class="order-item-thumb" src="${esc(item.image)}" alt="${esc(item.name)}" onerror="this.style.visibility='hidden'">
      <div class="order-item-info">
        <div class="order-item-name">${esc(item.name)}</div>
        <div class="order-item-meta">${item.variant ? esc(item.variant) + ' · ' : ''}Cant. ${item.qty}</div>
      </div>
      <div class="order-item-subtotal">${formatOrderPrice(item.price * item.qty)}</div>
    </div>`;
}

function renderOrderCard(order) {
  const st = statusInfo(order.estado);
  const meta = [
    order.buyer && `Cliente: ${order.buyer}`,
    order.addr && `Envío: ${order.addr}`,
    order.metodo && `Pago: ${order.metodo}`,
  ].filter(Boolean).map((l) => `<div>${esc(l)}</div>`).join('');

  const actions = actionsFor(order).map((a) =>
    `<button type="button" class="order-action-btn ${a.secondary ? 'secondary' : ''}" data-act="${a.act}">${esc(a.label)}</button>`
  ).join('');

  return `
    <div class="order-card" data-id="${esc(order.id)}">
      <div class="order-card-header">
        <div>
          <div class="order-id">#${esc(order.id)}</div>
          <div class="order-date">${esc(formatOrderDate(order.date))}</div>
        </div>
        <span class="order-status-badge" data-status="${esc(st.css)}">${esc(st.label)}</span>
      </div>

      ${meta ? `<div class="order-meta">${meta}</div>` : ''}

      <div class="order-items">
        ${order.items.map(renderOrderItem).join('')}
      </div>

      <div class="order-card-footer">
        <div class="order-total">Total: ${formatOrderPrice(order.total)}</div>
        <div class="order-actions">${actions}</div>
      </div>
    </div>`;
}

function renderOrdersPage() {
  const listEl = document.getElementById('ordersList');
  const countEl = document.getElementById('ordersCount');
  if (!listEl) return;

  if (countEl) {
    countEl.textContent = ordersCache.length === 0
      ? 'Sin pedidos todavía'
      : `${ordersCache.length} ${ordersCache.length === 1 ? 'pedido' : 'pedidos'}`;
  }

  if (ordersCache.length === 0) {
    listEl.innerHTML = `
      <div class="orders-empty">
        ${emptyOrdersSVG}
        <h3>Todavía no hay pedidos</h3>
        <p>En cuanto alguien finalice una compra desde el carrito de la tienda, aparecerá aquí.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = ordersCache.map(renderOrderCard).join('');
}

// ═══════════════════════════════════════════════
// CARGA Y ACCIONES
// ═══════════════════════════════════════════════

async function loadOrders() {
  try {
    const data = await Api.ordenesAdmin();
    const arr = Array.isArray(data) ? data : (data?.data || data?.ordenes || []);
    ordersCache = arr.map(normalizeOrder);
  } catch (err) {
    ordersCache = [];
    handleApiError(err, 'No se pudieron cargar los pedidos');
  }
  renderOrdersPage();
}

async function runAction(id, act) {
  const order = ordersCache.find((o) => String(o.id) === String(id));
  if (!order || busy) return;

  try {
    if (act === 'pagar') {
      const ok = await confirmDialog(
        `¿Confirmar el pago del pedido #${order.id}?`,
        `${order.metodo ? 'Método: ' + order.metodo + '. ' : ''}Total ${formatOrderPrice(order.total)}.`,
        'Sí, confirmar pago'
      );
      if (!ok) return;
      busy = true;
      await Api.confirmarPagoOrden(order.id);
      toast('success', 'Pago confirmado');
    } else if (act === 'enviada' || act === 'entregada') {
      busy = true;
      await Api.cambiarEstadoOrden(order.id, act.toUpperCase());
      toast('success', act === 'enviada' ? 'Marcado como enviado' : 'Marcado como entregado');
    } else if (act === 'cancelar') {
      const ok = await confirmDialog(
        `¿Cancelar el pedido #${order.id}?`,
        'Se devolverá el stock de los productos.',
        'Sí, cancelar pedido'
      );
      if (!ok) return;
      busy = true;
      await Api.cancelarOrden(order.id);
      toast('success', 'Pedido cancelado');
    }
    await loadOrders();
  } catch (err) {
    handleApiError(err, 'No se pudo actualizar el pedido');
    await loadOrders();
  } finally {
    busy = false;
  }
}

// ═══════════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  loadOrders();

  const listEl = document.getElementById('ordersList');
  if (!listEl) return;

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-action-btn');
    if (!btn) return;
    runAction(btn.closest('.order-card').dataset.id, btn.dataset.act);
  });

  // Al volver a esta pestaña, refresca para ver pedidos nuevos
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !busy) loadOrders();
  });
});