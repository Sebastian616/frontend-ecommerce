// ═══════════════════════════════════════════════
// OrbIsa — Panel de administración de productos
// Lee y escribe en la MISMA clave de localStorage
// que consume productos.html (js/product.js):
// 'orbisa_products'
// ═══════════════════════════════════════════════

const ADMIN_PRODUCTS_KEY = 'orbisa_products';

let editingId = null; // null = creando nuevo, string = editando ese id

// ── Helpers (nombres únicos para no chocar con cart.js si algún día
//    se cargan juntos en la misma página) ──
function adminLoadProducts() {
  try {
    const raw = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('No se pudo leer el catálogo guardado.', e);
    return [];
  }
}

function adminSaveProducts(products) {
  try {
    localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('No se pudo guardar el catálogo.', e);
  }
}

function adminSlugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function adminFormatPrice(n) {
  return '$' + Number(n).toLocaleString('es-CO') + ' COP';
}

// Devuelve siempre un array de fotos, sin importar si el producto
// se guardó con "images" (array nuevo) o con el "image" (string viejo).
function adminGetProductImages(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

function showToast(message) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ═══════════════════════════════════════════════
// RENDER DE LA LISTA
// ═══════════════════════════════════════════════

const trashIconSVG = `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
const editIconSVG = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const emptyBoxIconSVG = `<svg viewBox="0 0 24 24"><path d="M21 8 12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>`;

function renderAdminList() {
  const listEl = document.getElementById('adminList');
  const countEl = document.getElementById('adminCount');
  if (!listEl) return;

  const products = adminLoadProducts();

  if (countEl) {
    countEl.textContent = products.length === 0
      ? 'Sin productos aún'
      : `${products.length} ${products.length === 1 ? 'producto guardado' : 'productos guardados'}`;
  }

  if (products.length === 0) {
    listEl.innerHTML = `
      <div class="admin-empty">
        ${emptyBoxIconSVG}
        <p>Aún no has agregado productos.<br>Usa el formulario de la izquierda para crear el primero.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = products.map(p => {
    const images = adminGetProductImages(p);
    const thumb = images[0] || '';
    const photoCount = images.length > 1 ? ` · ${images.length} fotos` : '';
    return `
    <div class="admin-row" data-id="${p.id}">
      <img class="admin-row-thumb" src="${thumb}" alt="${p.name}" onerror="this.style.visibility='hidden'">
      <div class="admin-row-info">
        <div class="admin-row-name">${p.name}</div>
        <div class="admin-row-meta">${p.badge ? p.badge + ' · ' : ''}${p.rating ? `★ ${p.rating}${p.reviews ? ` (${p.reviews})` : ''}` : 'Sin reseñas'}${photoCount}</div>
      </div>
      <div class="admin-row-price">${adminFormatPrice(p.price)}</div>
      <div class="admin-row-actions">
        <button class="admin-icon-btn admin-edit-btn" aria-label="Editar producto">${editIconSVG}</button>
        <button class="admin-icon-btn danger admin-delete-btn" aria-label="Eliminar producto">${trashIconSVG}</button>
      </div>
    </div>
  `;
  }).join('');
}

// ═══════════════════════════════════════════════
// FORMULARIO
// ═══════════════════════════════════════════════

function fillFormWithProduct(p) {
  document.getElementById('fieldName').value = p.name || '';
  document.getElementById('fieldPrice').value = p.price ?? '';
  document.getElementById('fieldBadge').value = p.badge || '';
  document.getElementById('fieldRating').value = p.rating ?? '';
  document.getElementById('fieldReviews').value = p.reviews ?? '';

  if (typeof window.setProductImageUrls === 'function') {
    window.setProductImageUrls(adminGetProductImages(p));
  }
}

function resetForm() {
  document.getElementById('productForm').reset();
  if (typeof window.setProductImageUrls === 'function') {
    window.setProductImageUrls([]);
  }
  editingId = null;
  document.getElementById('editingBanner').classList.remove('active');
  document.getElementById('submitBtnLabel').textContent = 'Guardar producto';
}

function startEditing(id) {
  const product = adminLoadProducts().find(p => p.id === id);
  if (!product) return;

  editingId = id;
  fillFormWithProduct(product);

  const banner = document.getElementById('editingBanner');
  banner.classList.add('active');
  document.getElementById('editingBannerText').textContent = `Editando "${product.name}"`;
  document.getElementById('submitBtnLabel').textContent = 'Guardar cambios';

  document.getElementById('fieldName').focus();
  document.getElementById('adminFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteProduct(id) {
  const products = adminLoadProducts();
  const product = products.find(p => p.id === id);
  if (!product) return;

  const confirmed = confirm(`¿Eliminar "${product.name}" del catálogo? Esta acción no se puede deshacer.`);
  if (!confirmed) return;

  const updated = products.filter(p => p.id !== id);
  adminSaveProducts(updated);
  renderAdminList();
  showToast('Producto eliminado');

  if (editingId === id) resetForm();
}

function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('fieldName').value.trim();
  const price = Number(document.getElementById('fieldPrice').value);
  const images = typeof window.getProductImageUrls === 'function'
    ? window.getProductImageUrls()
    : [];
  const badge = document.getElementById('fieldBadge').value.trim();
  const ratingRaw = document.getElementById('fieldRating').value;
  const reviewsRaw = document.getElementById('fieldReviews').value;

  if (!name || !price || price <= 0) {
    showToast('Nombre y precio son obligatorios');
    return;
  }

  const products = adminLoadProducts();

  const productData = {
    id: editingId || adminSlugify(name),
    name,
    price,
    images,
    ...(badge ? { badge } : {}),
    ...(ratingRaw ? { rating: Number(ratingRaw) } : {}),
    ...(reviewsRaw ? { reviews: Number(reviewsRaw) } : {}),
  };

  if (editingId) {
    // Actualizar producto existente
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) products[idx] = productData;
    adminSaveProducts(products);
    showToast('Producto actualizado');
  } else {
    // Crear nuevo — evita duplicar el mismo id (mismo nombre)
    if (products.some(p => p.id === productData.id)) {
      showToast('Ya existe un producto con ese nombre');
      return;
    }
    products.push(productData);
    adminSaveProducts(products);
    showToast('Producto agregado');
  }

  resetForm();
  renderAdminList();
}

function clearAllProducts() {
  const products = adminLoadProducts();
  if (products.length === 0) return;

  const confirmed = confirm('¿Vaciar TODO el catálogo? Esto eliminará todos los productos guardados.');
  if (!confirmed) return;

  adminSaveProducts([]);
  resetForm();
  renderAdminList();
  showToast('Catálogo vaciado');
}

// ═══════════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  renderAdminList();

  document.getElementById('productForm').addEventListener('submit', handleSubmit);
  document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllProducts);

  document.getElementById('adminList').addEventListener('click', (e) => {
    const row = e.target.closest('.admin-row');
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.closest('.admin-edit-btn')) startEditing(id);
    if (e.target.closest('.admin-delete-btn')) deleteProduct(id);
  });
});

// Si se agregan/quitan productos desde otra pestaña, refleja el cambio aquí también
window.addEventListener('storage', (e) => {
  if (e.key === ADMIN_PRODUCTS_KEY) renderAdminList();
});