// ═══════════════════════════════════════════════
// OrbIsa — Vista de Pedidos (panel admin)
// Lee los pedidos guardados por cart.js al hacer
// checkout, bajo la clave 'orbisa_orders'.
// ═══════════════════════════════════════════════

const ORDERS_KEY = 'orbisa_orders';
const ORDER_STATUSES = ['Nuevo', 'En proceso', 'Enviado', 'Entregado', 'Cancelado'];

function loadOrdersList() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('No se pudieron leer los pedidos.', e);
    return [];
  }
}

function saveOrdersList(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('No se pudo guardar el cambio en el pedido.', e);
  }
}

function formatOrderPrice(n) {
  return '$' + Number(n).toLocaleString('es-CO') + ' COP';
}

function formatOrderDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const trashSVG = `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
const emptyOrdersSVG = `<svg viewBox="0 0 24 24"><path d="M16 3H1v13h15M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;

function renderOrderItem(item) {
  return `
    <div class="order-item-row">
      <img class="order-item-thumb" src="${item.image || ''}" alt="${item.name}" onerror="this.style.visibility='hidden'">
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-meta">${item.variant ? item.variant + ' · ' : ''}Cant. ${item.qty}</div>
      </div>
      <div class="order-item-subtotal">${formatOrderPrice(item.price * item.qty)}</div>
    </div>`;
}

function renderStatusOptions(current) {
  return ORDER_STATUSES.map(s =>
    `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`
  ).join('');
}

function renderOrderCard(order) {
  return `
    <div class="order-card" data-id="${order.id}">
      <div class="order-card-header">
        <div>
          <div class="order-id">${order.id}</div>
          <div class="order-date">${formatOrderDate(order.date)}</div>
        </div>
        <span class="order-status-badge" data-status="${order.status}">${order.status}</span>
      </div>

      <div class="order-items">
        ${order.items.map(renderOrderItem).join('')}
      </div>

      <div class="order-card-footer">
        <div class="order-total">Total: ${formatOrderPrice(order.total)}</div>
        <div class="order-actions">
          <select class="order-status-select" aria-label="Cambiar estado del pedido">
            ${renderStatusOptions(order.status)}
          </select>
          <button class="order-delete-btn" aria-label="Eliminar pedido">${trashSVG}</button>
        </div>
      </div>
    </div>`;
}

function renderOrdersPage() {
  const listEl = document.getElementById('ordersList');
  const countEl = document.getElementById('ordersCount');
  if (!listEl) return;

  const orders = loadOrdersList();

  if (countEl) {
    countEl.textContent = orders.length === 0
      ? 'Sin pedidos todavía'
      : `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}`;
  }

  if (orders.length === 0) {
    listEl.innerHTML = `
      <div class="orders-empty">
        ${emptyOrdersSVG}
        <h3>Todavía no hay pedidos</h3>
        <p>En cuanto alguien finalice una compra desde el carrito de la tienda, aparecerá aquí automáticamente.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = orders.map(renderOrderCard).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderOrdersPage();

  const listEl = document.getElementById('ordersList');
  if (!listEl) return;

  // Cambiar estado de un pedido
  listEl.addEventListener('change', (e) => {
    const select = e.target.closest('.order-status-select');
    if (!select) return;

    const card = select.closest('.order-card');
    const id = card.dataset.id;
    const orders = loadOrdersList();
    const order = orders.find(o => o.id === id);
    if (!order) return;

    order.status = select.value;
    saveOrdersList(orders);

    const badge = card.querySelector('.order-status-badge');
    badge.textContent = order.status;
    badge.dataset.status = order.status;
  });

  // Eliminar un pedido
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-delete-btn');
    if (!btn) return;

    const card = btn.closest('.order-card');
    const id = card.dataset.id;

    const confirmed = confirm(`¿Eliminar el pedido ${id}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const orders = loadOrdersList().filter(o => o.id !== id);
    saveOrdersList(orders);
    renderOrdersPage();
  });
});

// Si se crea un pedido nuevo desde otra pestaña (la tienda abierta en
// paralelo), esta vista se actualiza sola.
window.addEventListener('storage', (e) => {
  if (e.key === ORDERS_KEY) renderOrdersPage();
});