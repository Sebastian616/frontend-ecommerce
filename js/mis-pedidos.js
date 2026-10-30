// ═══════════════════════════════════════════════
// OrbIsa — Mis pedidos (vista del cliente)
// Requiere: config.js, api.js, auth.js (y cart.js para las instrucciones de pago)
// ═══════════════════════════════════════════════
(function () {
  // Solo usuarios con sesión; si no, va a login y vuelve aquí
  if (!requireAuth()) return;

  const STATUS = {
    PENDIENTE: { label: 'Pendiente de pago', cls: 'is-pending' },
    PAGADA:    { label: 'Pagado',            cls: 'is-paid' },
    ENVIADA:   { label: 'En camino',         cls: 'is-shipped' },
    ENTREGADA: { label: 'Entregado',         cls: 'is-delivered' },
    CANCELADA: { label: 'Cancelado',         cls: 'is-cancelled' },
  };
  const FLOW = [
    ['PENDIENTE', 'Pedido'], ['PAGADA', 'Pagado'], ['ENVIADA', 'En camino'], ['ENTREGADA', 'Entregado'],
  ];
  const FILTERS = [
    ['TODAS', 'Todos'], ['PENDIENTE', 'Pendientes'], ['PAGADA', 'Pagados'],
    ['ENVIADA', 'En camino'], ['ENTREGADA', 'Entregados'], ['CANCELADA', 'Cancelados'],
  ];
  const PAY_METHOD = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' };
  const PAY_STATE = { PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado', REEMBOLSADO: 'Reembolsado' };

  const listEl = document.getElementById('ordersList');
  const filtersEl = document.getElementById('ordersFilters');
  const countEl = document.getElementById('ordersCount');

  let orders = [];
  let filter = 'TODAS';
  const openIds = new Set(); // detalles abiertos (se conservan al re-renderizar)

  // ── helpers ──
  const h = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO') + ' COP';
  const fecha = (iso) => new Date(iso).toLocaleString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // ── render ──
  function message(title, text, action = '') {
    return `<div class="orders-message"><h3>${h(title)}</h3><p>${h(text)}</p>${action}</div>`;
  }

  function renderFilters() {
    const counts = { TODAS: orders.length };
    orders.forEach((o) => { counts[o.estado] = (counts[o.estado] || 0) + 1; });
    filtersEl.innerHTML = FILTERS.map(([key, label]) => `
      <button type="button" class="orders-filter ${key === filter ? 'active' : ''}" data-filter="${key}">
        ${h(label)}${counts[key] ? ` (${counts[key]})` : ''}
      </button>`).join('');
  }

  function renderSteps(estado) {
    if (estado === 'CANCELADA') return '';
    const current = FLOW.findIndex(([k]) => k === estado);
    return `<ol class="order-steps">${FLOW.map(([, label], i) =>
      `<li class="order-step ${i <= current ? 'done' : ''}">${h(label)}</li>`).join('')}</ol>`;
  }

  function renderItem(d) {
    const img = d.variante?.producto?.imagenes?.[0] || '';
    const meta = [d.variante?.color?.nombre, d.variante?.talla?.nombre].filter(Boolean).join(' / ');
    return `
      <li class="order-item">
        ${img ? `<img src="${h(img)}" alt="" loading="lazy">` : '<img alt="">'}
        <div class="order-item-info">
          <div class="order-item-name">${h(d.nombreProducto)}</div>
          <div class="order-item-meta">${meta ? h(meta) + ' · ' : ''}${d.cantidad} × ${money(d.precioUnitario)}</div>
        </div>
        <div class="order-item-price">${money(d.subtotal)}</div>
      </li>`;
  }

  function renderDetail(o) {
    const pago = o.pagos?.[0];
    const dir = o.direccion;
    const cupon = o.cupones?.[0]?.cupon?.codigo;
    const descuento = Number(o.descuento || 0);
    const envio = Number(o.envio || 0);

    // Instrucciones de pago (vienen de cart.js) mientras el pedido siga pendiente
    const howto = o.estado === 'PENDIENTE' && pago && typeof paymentInstructionsHTML === 'function'
      && PAY_METHOD[pago.metodo] && pago.metodo !== 'TARJETA'
      ? `<div class="order-howto">${paymentInstructionsHTML(pago.metodo)}
           <p><small>Usa <b>${h(o.numero)}</b> como referencia.</small></p></div>`
      : '';

    const cancel = o.estado === 'PENDIENTE'
      ? `<div class="order-actions"><button type="button" class="order-cancel" data-cancel="${o.id}">Cancelar pedido</button></div>`
      : '';

    return `
      ${renderSteps(o.estado)}
      <ul class="order-items">${(o.detalles || []).map(renderItem).join('')}</ul>
      <div class="order-meta">
        <div>
          <h4>Envío a</h4>
          ${dir ? `${h(dir.nombre)}<br>${h(dir.linea1)}${dir.linea2 ? ', ' + h(dir.linea2) : ''}<br>${h(dir.ciudad)}, ${h(dir.departamento)}` : '—'}
        </div>
        <div>
          <h4>Pago</h4>
          ${pago ? `${h(PAY_METHOD[pago.metodo] || pago.metodo)} · ${h(PAY_STATE[pago.estado] || pago.estado)}` : '—'}
          ${cupon ? `<br><small>Cupón: ${h(cupon)}</small>` : ''}
        </div>
      </div>
      <div class="order-totals">
        <div><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
        ${descuento > 0 ? `<div><span>Descuento</span><span>−${money(descuento)}</span></div>` : ''}
        <div><span>Envío</span><span>${envio === 0 ? 'Gratis' : money(envio)}</span></div>
        <div class="grand"><span>Total</span><span>${money(o.total)}</span></div>
      </div>
      ${howto}${cancel}`;
  }

  function renderOrder(o) {
    const st = STATUS[o.estado] || { label: o.estado, cls: '' };
    const items = o.detalles || [];
    const units = items.reduce((s, d) => s + d.cantidad, 0);
    const thumbs = items.slice(0, 4).map((d) => {
      const img = d.variante?.producto?.imagenes?.[0];
      return img ? `<img src="${h(img)}" alt="" loading="lazy">` : '<img alt="">';
    }).join('');
    const more = items.length > 4 ? `<span class="order-thumb-more">+${items.length - 4}</span>` : '';
    const isOpen = openIds.has(o.id);

    return `
      <article class="order-card" data-id="${o.id}">
        <header class="order-head">
          <div>
            <div class="order-num">${h(o.numero)}</div>
            <div class="order-date">${h(fecha(o.creadoEn))}</div>
          </div>
          <span class="order-status ${st.cls}">${h(st.label)}</span>
        </header>
        <div class="order-thumbs">${thumbs}${more}</div>
        <div class="order-summary">
          <span>${units} ${units === 1 ? 'producto' : 'productos'}</span>
          <b>${money(o.total)}</b>
        </div>
        <button type="button" class="order-toggle" data-toggle="${o.id}" aria-expanded="${isOpen}">
          ${isOpen ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
        <div class="order-detail" ${isOpen ? '' : 'hidden'}>${renderDetail(o)}</div>
      </article>`;
  }

  function render() {
    renderFilters();
    countEl.textContent = orders.length
      ? `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}` : '';

    if (orders.length === 0) {
      listEl.innerHTML = message('Aún no tienes pedidos',
        'Cuando compres algo, lo verás aquí.', '<a href="productos.html">Ir a la tienda</a>');
      return;
    }
    const visible = filter === 'TODAS' ? orders : orders.filter((o) => o.estado === filter);
    listEl.innerHTML = visible.length
      ? visible.map(renderOrder).join('')
      : message('Sin resultados', 'No tienes pedidos con este estado.');
  }

  // ── datos ──
  async function load() {
    listEl.innerHTML = message('Cargando tus pedidos…', 'Un momento por favor.');
    try {
      orders = await Api.misOrdenes();
      render();
    } catch (err) {
      console.error(err);
      if (err.status === 401) return requireAuth();
      listEl.innerHTML = message('No pudimos cargar tus pedidos',
        'Revisa tu conexión e inténtalo de nuevo.', '<button type="button" data-retry>Reintentar</button>');
    }
  }

  async function cancelOrder(id, btn) {
    const o = orders.find((x) => x.id === id);
    const r = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar este pedido?',
      text: `${o ? o.numero : 'Pedido'} se cancelará y los productos volverán al inventario.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantenerlo',
      confirmButtonColor: '#c0392b',
    });
    if (!r.isConfirmed) return;

    btn.disabled = true;
    try {
      await Api.cancelarOrden(id);
      await load();
      Swal.fire({ icon: 'success', title: 'Pedido cancelado', timer: 1800, showConfirmButton: false });
    } catch (err) {
      btn.disabled = false;
      Swal.fire({ icon: 'error', title: 'No se pudo cancelar', text: err.message, confirmButtonColor: '#E23789' });
    }
  }

  // ── eventos ──
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { filter = f.dataset.filter; render(); return; }

    const t = e.target.closest('[data-toggle]');
    if (t) {
      const id = Number(t.dataset.toggle);
      openIds.has(id) ? openIds.delete(id) : openIds.add(id);
      const card = t.closest('.order-card');
      const open = openIds.has(id);
      card.querySelector('.order-detail').hidden = !open;
      t.setAttribute('aria-expanded', open);
      t.textContent = open ? 'Ocultar detalle' : 'Ver detalle';
      return;
    }

    const c = e.target.closest('[data-cancel]');
    if (c) { cancelOrder(Number(c.dataset.cancel), c); return; }

    if (e.target.closest('[data-retry]')) load();
  });

  load();
})();