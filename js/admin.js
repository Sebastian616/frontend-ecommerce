// ═══════════════════════════════════════════════
// OrbIsa — Panel de administración de productos
// Conectado a la API (catalogo.js). Requiere: config.js, api.js
// ═══════════════════════════════════════════════

const PAGE_LIMIT = 20;

let editingId = null;
let productsCache = [];
let categorias = [];
let colores = [];
let tallas = [];
let page = 1;
let total = 0;
let statusFilter = '';   // '' = todos, 'true' = activos, 'false' = desactivados
let isSaving = false;
let slugTouched = false;

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugify(text) {
  return String(text).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatPrice(n) {
  return '$' + Number(n).toLocaleString('es-CO') + ' COP';
}

function showToast(message) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

function handleApiError(err, fallback) {
  console.error(err);
  if (err.status === 401) {
    // Limpiamos también la sesión local para que login.html no nos devuelva aquí en bucle
    localStorage.removeItem('orbisa_session');
    Swal.fire({ icon: 'warning', title: 'Sesión vencida', text: 'Inicia sesión de nuevo.' })
      .then(() => location.replace('login.html'));
    return;
  }
  if (err.status === 403) {
    Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'Tu cuenta no puede administrar productos.' })
      .then(() => location.replace('index.html'));
    return;
  }
  let msg = err.message || fallback;
  if (Array.isArray(err.details) && err.details.length) {
    msg += '\n' + err.details.map((d) => {
      if (typeof d === 'string') return d;
      const path = Array.isArray(d.path) ? d.path.join('.') : '';
      return (path ? path + ': ' : '') + (d.message || JSON.stringify(d));
    }).join('\n');
  }
  Swal.fire({ icon: 'error', title: fallback, text: msg });
}

function confirmDialog(title, text, confirmText) {
  return Swal.fire({
    title, text, icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e23789',
  }).then((r) => r.isConfirmed);
}

function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.nombre,
    slug: p.slug,
    description: p.descripcion || '',
    price: Number(p.precioBase),          // Prisma Decimal llega como string
    categoriaId: p.categoriaId,
    activo: p.activo !== false,
    images: Array.isArray(p.imagenes) ? p.imagenes : [],
    variantes: Array.isArray(p.variantes) ? p.variantes : [],
  };
}

function categoryName(id) {
  return categorias.find((c) => c.id === id)?.nombre || null;
}

// Arma el listado indentado a partir de la lista plana (usa padreId, sin límite de niveles)
function categoryOptions() {
  const byParent = new Map();
  categorias.forEach((c) => {
    const k = c.padreId ?? 0;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(c);
  });
  const out = [];
  const walk = (parent, depth) => (byParent.get(parent) || []).forEach((c) => {
    out.push({ id: c.id, label: '— '.repeat(depth) + c.nombre });
    walk(c.id, depth + 1);
  });
  walk(0, 0);
  return out;
}

// ═══════════════════════════════════════════════
// CARGA DE DATOS
// ═══════════════════════════════════════════════

async function loadLookups() {
  try {
    [categorias, colores, tallas] = await Promise.all([
      Api.categorias(), Api.colores(), Api.tallas(),
    ]);
  } catch (err) {
    handleApiError(err, 'No se pudieron cargar categorías, colores y tallas');
  }

  renderCategorySelect();
}

function renderCategorySelect(selectedId) {
  const sel = document.getElementById('fieldCategory');
  const current = selectedId ?? sel.value;
  sel.innerHTML = '<option value="">Selecciona…</option>' +
    categoryOptions().map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('');
  if (current) sel.value = String(current);
}

async function loadProducts(p = page) {
  const listEl = document.getElementById('adminList');
  if (listEl) listEl.innerHTML = '<div class="admin-empty"><p>Cargando catálogo…</p></div>';

  try {
    const params = { page: p, limit: PAGE_LIMIT };
    if (statusFilter) params.activo = statusFilter;
    const res = await Api.adminProductos(params);
    if (res.data.length === 0 && p > 1) return loadProducts(p - 1);
    page = res.page;
    total = res.total;
    productsCache = res.data.map(normalizeProduct);
  } catch (err) {
    productsCache = [];
    total = 0;
    handleApiError(err, 'No se pudo cargar el catálogo');
  }
  renderAdminList();
  renderPager();
  refreshExistingVariants();
}

// ═══════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════

const trashIconSVG = `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
const editIconSVG = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const emptyBoxIconSVG = `<svg viewBox="0 0 24 24"><path d="M21 8 12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>`;

function renderAdminList() {
  const listEl = document.getElementById('adminList');
  const countEl = document.getElementById('adminCount');
  if (!listEl) return;

  if (countEl) {
    const label = statusFilter === 'true' ? 'activo' : statusFilter === 'false' ? 'desactivado' : 'guardado';
    countEl.textContent = total === 0
      ? 'Sin productos'
      : `${total} ${total === 1 ? 'producto' : 'productos'} ${label}${total === 1 ? '' : 's'}`;
  }

  if (productsCache.length === 0) {
    listEl.innerHTML = `
      <div class="admin-empty">
        ${emptyBoxIconSVG}
        <p>${statusFilter ? 'No hay productos con este filtro.' : 'Aún no has agregado productos.<br>Usa el formulario de la izquierda para crear el primero.'}</p>
      </div>`;
    return;
  }

  listEl.innerHTML = productsCache.map((p) => {
    const thumb = p.images[0] || '';
    const activeVariants = p.variantes.filter((v) => v.activo !== false);
    const stock = activeVariants.reduce((s, v) => s + (v.stock || 0), 0);
    const meta = [
      p.activo ? null : 'Desactivado',
      categoryName(p.categoriaId),
      `${activeVariants.length} ${activeVariants.length === 1 ? 'variante' : 'variantes'}`,
      `stock ${stock}`,
      p.images.length > 1 ? `${p.images.length} fotos` : null,
    ].filter(Boolean).join(' · ');
    const lastAction = p.activo
      ? `<button class="admin-icon-btn danger admin-delete-btn" aria-label="Desactivar producto" title="Desactivar">${trashIconSVG}</button>`
      : `<button class="admin-icon-btn admin-activate-btn" aria-label="Reactivar producto" title="Reactivar">↺</button>`;
    return `
    <div class="admin-row ${p.activo ? '' : 'is-inactive'}" data-id="${esc(p.id)}">
      <img class="admin-row-thumb" src="${esc(thumb)}" alt="${esc(p.name)}" onerror="this.style.visibility='hidden'">
      <div class="admin-row-info">
        <div class="admin-row-name">${esc(p.name)}</div>
        <div class="admin-row-meta">${esc(meta)}</div>
      </div>
      <div class="admin-row-price">${formatPrice(p.price)}</div>
      <div class="admin-row-actions">
        <button class="admin-icon-btn admin-edit-btn" aria-label="Editar producto" title="Editar">${editIconSVG}</button>
        ${lastAction}
      </div>
    </div>`;
  }).join('');
}

function renderPager() {
  const el = document.getElementById('adminPager');
  if (!el) return;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Anterior</button>
    <span>Página ${page} de ${totalPages}</span>
    <button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>Siguiente</button>`;
}

// ═══════════════════════════════════════════════
// VARIANTES
// ═══════════════════════════════════════════════

function optionsHtml(items, placeholder) {
  return `<option value="">${placeholder}</option>` +
    items.map((i) => `<option value="${esc(i.id)}">${esc(i.nombre)}</option>`).join('');
}

function addVariantRow() {
  const row = document.createElement('div');
  row.className = 'admin-variant-row';
  row.innerHTML = `
    <select class="v-color">${optionsHtml(colores, 'Color')}</select>
    <select class="v-talla">${optionsHtml(tallas, 'Talla')}</select>
    <input type="text" class="v-sku" placeholder="SKU">
    <input type="number" class="v-stock" placeholder="Stock" min="0" value="0">
    <input type="number" class="v-precio" placeholder="Precio (opcional)" min="1">
    <button type="button" class="admin-image-remove" aria-label="Quitar variante">&times;</button>`;
  row.querySelector('.admin-image-remove').addEventListener('click', () => row.remove());
  document.getElementById('variantRows').appendChild(row);
}

function readVariantRows() {
  return Array.from(document.querySelectorAll('#variantRows .admin-variant-row')).map((el) => {
    const precio = el.querySelector('.v-precio').value;
    return {
      el,
      data: {
        colorId: Number(el.querySelector('.v-color').value),
        tallaId: Number(el.querySelector('.v-talla').value),
        sku: el.querySelector('.v-sku').value.trim(),
        stock: Math.max(0, parseInt(el.querySelector('.v-stock').value, 10) || 0),
        ...(precio ? { precio: Number(precio) } : {}),
      },
    };
  });
}

function renderExistingVariants(product) {
  const box = document.getElementById('existingVariants');
  if (!product || product.variantes.length === 0) { box.innerHTML = ''; return; }
  box.innerHTML = product.variantes.map((v) => {
    const on = v.activo !== false;
    return `
    <div class="admin-variant-existing ${on ? '' : 'is-inactive'}" data-vid="${esc(v.id)}">
      <span>${esc(v.color?.nombre)} / ${esc(v.talla?.nombre)} · SKU ${esc(v.sku)} · stock ${esc(v.stock)}${on ? '' : ' · desactivada'}</span>
      <span class="admin-variant-actions">
        ${on ? '<button type="button" data-act="stock">+ Stock</button>' : ''}
        <button type="button" data-act="toggle">${on ? 'Desactivar' : 'Reactivar'}</button>
      </span>
    </div>`;
  }).join('');
}

// Re-pinta las variantes del producto en edición tras recargar la lista
function refreshExistingVariants() {
  if (!editingId) return;
  const p = productsCache.find((x) => String(x.id) === String(editingId));
  if (p) renderExistingVariants(p);
}

async function handleVariantAction(e) {
  const btn = e.target.closest('button[data-act]');
  const rowEl = e.target.closest('[data-vid]');
  if (!btn || !rowEl || !editingId) return;

  const prod = productsCache.find((x) => String(x.id) === String(editingId));
  const variant = prod && prod.variantes.find((v) => String(v.id) === rowEl.dataset.vid);
  if (!variant) return;

  try {
    if (btn.dataset.act === 'stock') {
      const { value, isConfirmed } = await Swal.fire({
        title: 'Ingresar stock',
        text: `${variant.color?.nombre || ''} / ${variant.talla?.nombre || ''} · stock actual ${variant.stock}`,
        input: 'number',
        inputAttributes: { min: 1, step: 1 },
        inputPlaceholder: 'Unidades a sumar',
        showCancelButton: true,
        confirmButtonText: 'Sumar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e23789',
        inputValidator: (v) => (!Number.isInteger(Number(v)) || Number(v) < 1) ? 'Ingresa un entero mayor a 0' : null,
      });
      if (!isConfirmed) return;
      await Api.actualizarVariante(variant.id, { agregarStock: Number(value) });
      showToast('Stock actualizado');
    } else if (btn.dataset.act === 'toggle') {
      const next = variant.activo === false;
      if (!next) {
        const ok = await confirmDialog(
          '¿Desactivar esta variante?',
          'Los clientes dejarán de poder comprarla.',
          'Sí, desactivar'
        );
        if (!ok) return;
      }
      await Api.actualizarVariante(variant.id, { activo: next });
      showToast(next ? 'Variante reactivada' : 'Variante desactivada');
    }
    await loadProducts(page);
  } catch (err) {
    handleApiError(err, 'No se pudo actualizar la variante');
  }
}

// ═══════════════════════════════════════════════
// FORMULARIO
// ═══════════════════════════════════════════════

function resetForm() {
  document.getElementById('productForm').reset();
  window.setProductImageUrls([]);
  document.getElementById('variantRows').innerHTML = '';
  renderExistingVariants(null);
  editingId = null;
  slugTouched = false;
  document.getElementById('editingBanner').classList.remove('active');
  document.getElementById('submitBtnLabel').textContent = 'Guardar producto';
}

function enterEditMode(product) {
  editingId = product.id;
  slugTouched = true;
  document.getElementById('editingBanner').classList.add('active');
  document.getElementById('editingBannerText').textContent = `Editando "${product.name}"`;
  document.getElementById('submitBtnLabel').textContent = 'Guardar cambios';
}

function startEditing(id) {
  const p = productsCache.find((x) => String(x.id) === String(id));
  if (!p) return;

  document.getElementById('fieldName').value = p.name;
  document.getElementById('fieldSlug').value = p.slug;
  document.getElementById('fieldPrice').value = p.price;
  document.getElementById('fieldCategory').value = String(p.categoriaId);
  document.getElementById('fieldDescription').value = p.description;
  window.setProductImageUrls(p.images);
  document.getElementById('variantRows').innerHTML = '';
  renderExistingVariants(p);
  enterEditMode(p);

  document.getElementById('fieldName').focus();
  document.getElementById('adminFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function setProductActive(id, activo) {
  const p = productsCache.find((x) => String(x.id) === String(id));
  if (!p) return;

  if (!activo) {
    const ok = await confirmDialog(
      `¿Desactivar "${p.name}"?`,
      'Dejará de mostrarse en la tienda. Los pedidos anteriores no se afectan y podrás reactivarlo.',
      'Sí, desactivar'
    );
    if (!ok) return;
  }

  try {
    await Api.actualizarProducto(p.id, { activo });
    showToast(activo ? 'Producto reactivado' : 'Producto desactivado');
    if (!activo && String(editingId) === String(id)) resetForm();
    await loadProducts(page);
  } catch (err) {
    handleApiError(err, activo ? 'No se pudo reactivar el producto' : 'No se pudo desactivar el producto');
  }
}

function setSaving(state) {
  isSaving = state;
  const btn = document.querySelector('#productForm button[type="submit"]');
  if (btn) btn.disabled = state;
  document.getElementById('submitBtnLabel').textContent = state
    ? 'Guardando…'
    : (editingId ? 'Guardar cambios' : 'Guardar producto');
}

async function handleSubmit(e) {
  e.preventDefault();
  if (isSaving) return;

  const nombre = document.getElementById('fieldName').value.trim();
  const slug = document.getElementById('fieldSlug').value.trim() || slugify(nombre);
  const precioBase = Number(document.getElementById('fieldPrice').value);
  const categoriaId = Number(document.getElementById('fieldCategory').value);
  const descripcion = document.getElementById('fieldDescription').value.trim();
  const imagenes = window.getProductImageUrls();

  if (!nombre || !slug || !precioBase || precioBase <= 0 || !categoriaId) {
    showToast('Nombre, precio y categoría son obligatorios');
    return;
  }

  const variantRows = readVariantRows();
  if (variantRows.some((v) => !v.data.colorId || !v.data.tallaId || !v.data.sku)) {
    showToast('Cada variante necesita color, talla y SKU');
    return;
  }

  const payload = {
    categoriaId, nombre, slug, precioBase, imagenes,
    ...(descripcion ? { descripcion } : {}),
  };

  const wasCreate = !editingId;
  setSaving(true);
  let productId = editingId;
  try {
    if (wasCreate) {
      const created = await Api.crearProducto(payload);
      productId = created.id;
    } else {
      await Api.actualizarProducto(editingId, payload);
    }
  } catch (err) {
    handleApiError(err, 'No se pudo guardar el producto');
    setSaving(false);
    return;
  }

  // Variantes nuevas, una por una (cada una es un POST aparte)
  for (const row of variantRows) {
    try {
      await Api.crearVariante(productId, row.data);
      row.el.remove(); // ya creada: la quitamos para no duplicarla si hay que reintentar
    } catch (err) {
      // El producto ya existe: pasamos a modo edición con las variantes que faltan
      statusFilter = '';
      document.getElementById('statusFilter').value = '';
      await loadProducts(wasCreate ? 1 : page);
      const prod = productsCache.find((x) => String(x.id) === String(productId));
      if (prod) { enterEditMode(prod); renderExistingVariants(prod); }
      setSaving(false);
      handleApiError(err, `El producto se guardó, pero falló la variante ${row.data.sku}`);
      return;
    }
  }

  showToast(wasCreate ? 'Producto agregado' : 'Producto actualizado');
  setSaving(false);
  resetForm();
  if (wasCreate) {
    // Los nuevos salen primero (orden por fecha): volvemos a la página 1 y quitamos el filtro
    statusFilter = '';
    document.getElementById('statusFilter').value = '';
  }
  await loadProducts(wasCreate ? 1 : page);
}

// ═══════════════════════════════════════════════
// CREAR CATEGORÍAS, COLORES Y TALLAS
// ═══════════════════════════════════════════════

const DIALOG_INPUT = 'width:100%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:10px;border:1px solid #ddd;font:inherit';

// Error dentro de un diálogo: sesión/permisos se manejan como siempre; el resto se muestra en el propio diálogo
function dialogFail(err, fallback) {
  if (err.status === 401 || err.status === 403) {
    Swal.close();
    handleApiError(err, fallback);
    return false;
  }
  let msg = err.message || fallback;
  if (Array.isArray(err.details) && err.details.length) {
    msg += ': ' + err.details.map((d) => (typeof d === 'string' ? d : d.message || JSON.stringify(d))).join(', ');
  }
  Swal.showValidationMessage(msg);
  return false;
}

const norm = (t) => String(t).trim().toLowerCase();

function dialogBase(title, html, confirmText) {
  return {
    title, html,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e23789',
    focusConfirm: false,
  };
}

async function createCategoryFlow() {
  const opts = categoryOptions();
  const res = await Swal.fire({
    ...dialogBase('Nueva categoría', `
      <input id="swCatName" class="swal2-input" placeholder="Nombre (ej: Leggings) *" style="${DIALOG_INPUT}">
      <input id="swCatSlug" class="swal2-input" placeholder="Slug (url)" style="${DIALOG_INPUT}">
      <select id="swCatParent" style="${DIALOG_INPUT}">
        <option value="">Sin categoría padre</option>
        ${opts.map((o) => `<option value="${esc(o.id)}">${esc(o.label)}</option>`).join('')}
      </select>`, 'Crear categoría'),
    didOpen: () => {
      const n = document.getElementById('swCatName');
      const sl = document.getElementById('swCatSlug');
      let touched = false;
      n.addEventListener('input', () => { if (!touched) sl.value = slugify(n.value); });
      sl.addEventListener('input', () => { touched = true; });
      n.focus();
    },
    preConfirm: async () => {
      const nombre = document.getElementById('swCatName').value.trim();
      const slug = slugify(document.getElementById('swCatSlug').value) || slugify(nombre);
      const padre = document.getElementById('swCatParent').value;
      if (!nombre) { Swal.showValidationMessage('Escribe el nombre de la categoría'); return false; }
      if (categorias.some((c) => c.slug === slug)) {
        Swal.showValidationMessage('Ya existe una categoría con ese slug'); return false;
      }
      try {
        return await Api.crearCategoria({ nombre, slug, ...(padre ? { padreId: Number(padre) } : {}) });
      } catch (err) { return dialogFail(err, 'No se pudo crear la categoría'); }
    },
  });
  if (!res.isConfirmed) return;

  try { categorias = await Api.categorias(); } catch (e) { categorias.push(res.value); }
  renderCategorySelect(res.value.id); // la deja seleccionada en el formulario
  showToast('Categoría creada');
}

async function createColorFlow() {
  const res = await Swal.fire({
    ...dialogBase('Nuevo color', `
      <input id="swColorName" class="swal2-input" placeholder="Nombre (ej: Rosa palo) *" style="${DIALOG_INPUT}">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px">
        <label for="swColorHex" style="font-size:14px">Tono</label>
        <input id="swColorHex" type="color" value="#e23789" style="width:60px;height:40px;border:none;background:none;padding:0;cursor:pointer">
      </div>`, 'Crear color'),
    didOpen: () => document.getElementById('swColorName').focus(),
    preConfirm: async () => {
      const nombre = document.getElementById('swColorName').value.trim();
      const hex = document.getElementById('swColorHex').value;
      if (!nombre) { Swal.showValidationMessage('Escribe el nombre del color'); return false; }
      if (colores.some((c) => norm(c.nombre) === norm(nombre))) {
        Swal.showValidationMessage('Ya existe un color con ese nombre'); return false;
      }
      try {
        return await Api.crearColor({ nombre, hex });
      } catch (err) { return dialogFail(err, 'No se pudo crear el color'); }
    },
  });
  if (!res.isConfirmed) return;

  try { colores = await Api.colores(); } catch (e) { colores.push(res.value); }
  refreshVariantSelects({ colorId: res.value.id });
  showToast('Color creado');
}

async function createSizeFlow() {
  const nextOrden = tallas.reduce((m, t) => Math.max(m, Number(t.orden) || 0), 0) + 1;
  const res = await Swal.fire({
    ...dialogBase('Nueva talla', `
      <input id="swSizeName" class="swal2-input" placeholder="Nombre (ej: XL, 38, Única) *" style="${DIALOG_INPUT}">
      <input id="swSizeOrder" class="swal2-input" type="number" min="0" step="1" value="${nextOrden}" style="${DIALOG_INPUT}">
      <small style="opacity:.7">El orden define la posición en la lista (XS = 1, S = 2, M = 3…)</small>`, 'Crear talla'),
    didOpen: () => document.getElementById('swSizeName').focus(),
    preConfirm: async () => {
      const nombre = document.getElementById('swSizeName').value.trim();
      const orden = parseInt(document.getElementById('swSizeOrder').value, 10);
      if (!nombre) { Swal.showValidationMessage('Escribe el nombre de la talla'); return false; }
      if (!Number.isInteger(orden) || orden < 0) {
        Swal.showValidationMessage('El orden debe ser un número entero'); return false;
      }
      if (tallas.some((t) => norm(t.nombre) === norm(nombre))) {
        Swal.showValidationMessage('Ya existe una talla con ese nombre'); return false;
      }
      try {
        return await Api.crearTalla({ nombre, orden });
      } catch (err) { return dialogFail(err, 'No se pudo crear la talla'); }
    },
  });
  if (!res.isConfirmed) return;

  try { tallas = await Api.tallas(); } catch (e) { tallas.push(res.value); }
  refreshVariantSelects({ tallaId: res.value.id });
  showToast('Talla creada');
}

// Vuelve a llenar los desplegables de las filas de variantes ya abiertas, conservando lo elegido.
// Si se pasa colorId/tallaId, lo selecciona en la última fila cuando esa casilla está vacía.
function refreshVariantSelects(pick = {}) {
  const rows = Array.from(document.querySelectorAll('#variantRows .admin-variant-row'));
  rows.forEach((row) => {
    const c = row.querySelector('.v-color');
    const t = row.querySelector('.v-talla');
    const cv = c.value;
    const tv = t.value;
    c.innerHTML = optionsHtml(colores, 'Color');
    t.innerHTML = optionsHtml(tallas, 'Talla');
    c.value = cv;
    t.value = tv;
  });
  const last = rows[rows.length - 1];
  if (!last) return;
  if (pick.colorId && !last.querySelector('.v-color').value) last.querySelector('.v-color').value = String(pick.colorId);
  if (pick.tallaId && !last.querySelector('.v-talla').value) last.querySelector('.v-talla').value = String(pick.tallaId);
}

// ═══════════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('productForm').addEventListener('submit', handleSubmit);
  document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
  document.getElementById('addVariantBtn').addEventListener('click', addVariantRow);
  document.getElementById('existingVariants').addEventListener('click', handleVariantAction);

  const nameInput = document.getElementById('fieldName');
  const slugInput = document.getElementById('fieldSlug');
  nameInput.addEventListener('input', () => {
    if (!slugTouched) slugInput.value = slugify(nameInput.value);
  });
  slugInput.addEventListener('input', () => { slugTouched = true; });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    statusFilter = e.target.value;
    loadProducts(1);
  });

  document.getElementById('adminList').addEventListener('click', (e) => {
    const row = e.target.closest('.admin-row');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest('.admin-edit-btn')) startEditing(id);
    if (e.target.closest('.admin-delete-btn')) setProductActive(id, false);
    if (e.target.closest('.admin-activate-btn')) setProductActive(id, true);
  });

  document.getElementById('adminPager').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (btn && !btn.disabled) loadProducts(Number(btn.dataset.page));
  });

  document.getElementById('addCategoryBtn').addEventListener('click', createCategoryFlow);
  document.getElementById('addColorBtn').addEventListener('click', createColorFlow);
  document.getElementById('addSizeBtn').addEventListener('click', createSizeFlow);

  await loadLookups();
  await loadProducts(1);
});