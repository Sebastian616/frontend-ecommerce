// ═══════════════════════════════════════════════
// OrbIsa — Página "Nosotros"
// Anima los números de la sección de cifras cuando
// entran en pantalla (cuenta desde 0 hasta el valor
// indicado en el atributo data-count).
// ═══════════════════════════════════════════════

function animateCount(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cúbico
    const value = Math.round(target * eased);
    el.textContent = value.toLocaleString('es-CO') + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => {
  const statEls = document.querySelectorAll('[data-count]');
  if (!statEls.length) return;

  if (!('IntersectionObserver' in window)) {
    statEls.forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  statEls.forEach(el => observer.observe(el));
});