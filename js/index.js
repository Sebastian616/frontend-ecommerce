// FitHer — interacciones mínimas (menú móvil + scroll reveal)

document.addEventListener('DOMContentLoaded', () => {

  // Menú hamburguesa (mobile)
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // Resalta el link activo del pill-nav según la sección visible
  const sections = document.querySelectorAll('main .canvas-section[id], section.flow-section[id]');
  const navLinks = document.querySelectorAll('.pill-nav a, .mobile-nav a');

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(section => navObserver.observe(section));
  }

  // ═══════ CART MODAL ═══════
  const cartTrigger = document.getElementById('cartTrigger');
  const cartModal = document.getElementById('cartModal');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  const cartContinue = document.getElementById('cartContinue');
  const cartCountBadge = document.getElementById('cartCount');
  const cartModalCount = document.querySelector('.cart-modal-count');
  const cartSubtotalValue = document.querySelector('.cart-subtotal-value');
  const cartItemsWrap = document.querySelector('.cart-items');

  const openCart = () => {
    cartModal.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeCart = () => {
    cartModal.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  const parsePrice = (text) => Number(text.replace(/[^0-9]/g, ''));
  const formatPrice = (n) => '$' + n.toLocaleString('es-CO') + ' COP';

  const recalcCart = () => {
    const items = cartItemsWrap ? cartItemsWrap.querySelectorAll('.cart-item') : [];
    let totalQty = 0;
    let subtotal = 0;

    items.forEach(item => {
      const qty = Number(item.querySelector('.cart-item-qty span').textContent);
      const unitPrice = parsePrice(item.querySelector('.cart-item-price').dataset.unit
        || item.querySelector('.cart-item-price').textContent);
      totalQty += qty;
      subtotal += qty * unitPrice;
    });

    if (cartCountBadge) cartCountBadge.textContent = totalQty;
    if (cartModalCount) cartModalCount.textContent = `(${totalQty})`;
    if (cartSubtotalValue) cartSubtotalValue.textContent = formatPrice(subtotal);

    if (cartItemsWrap && items.length === 0) {
      cartItemsWrap.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p>Tu carrito está vacío</p>
        </div>`;
    }
  };

  if (cartTrigger && cartModal && cartOverlay) {
    // Guarda el precio unitario original de cada producto para recalcular bien
    cartItemsWrap.querySelectorAll('.cart-item-price').forEach(priceEl => {
      priceEl.dataset.unit = priceEl.textContent;
    });

    cartTrigger.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    if (cartContinue) cartContinue.addEventListener('click', closeCart);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cartModal.classList.contains('open')) closeCart();
    });

    cartItemsWrap.addEventListener('click', (e) => {
      const qtyBtn = e.target.closest('.qty-btn');
      const removeBtn = e.target.closest('.cart-item-remove');

      if (qtyBtn) {
        const item = qtyBtn.closest('.cart-item');
        const qtySpan = item.querySelector('.cart-item-qty span');
        let qty = Number(qtySpan.textContent);
        const isPlus = qtyBtn.textContent.trim() === '+';
        qty = isPlus ? qty + 1 : Math.max(1, qty - 1);
        qtySpan.textContent = qty;
        recalcCart();
      }

      if (removeBtn) {
        const item = removeBtn.closest('.cart-item');
        item.classList.add('removing');
        setTimeout(() => {
          item.remove();
          recalcCart();
        }, 350);
      }
    });

    recalcCart();
  }

});