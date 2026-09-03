// ═══════════════════════════════════════════════
// OrbIsa — Formulario de contacto (conectado a Formspree)
// ═══════════════════════════════════════════════

// 👇👇👇 REEMPLAZA ESTO con tu endpoint real de Formspree 👇👇👇
// Lo encuentras en tu dashboard de Formspree, tiene esta forma:
// https://formspree.io/f/xxxxxxxx
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xqpkbybn';
// 👆👆👆 REEMPLAZA ESTO con tu endpoint real de Formspree 👆👆👆

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const card = document.getElementById('contactFormCard');
  const successBlock = document.getElementById('contactSuccess');
  const errorBlock = document.getElementById('contactError');
  const submitBtn = document.getElementById('contactSubmitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    errorBlock.classList.remove('active');
    errorBlock.textContent = '';

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Enviando...';

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        card.classList.add('is-success');
        successBlock.classList.add('active');
        form.reset();
      } else {
        const data = await response.json().catch(() => null);
        const message = data?.errors?.[0]?.message
          || 'No se pudo enviar el mensaje. Intenta de nuevo en unos minutos.';
        errorBlock.textContent = message;
        errorBlock.classList.add('active');
      }
    } catch (err) {
      // Falla de red, endpoint mal configurado, sin conexión, etc.
      errorBlock.textContent = 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.';
      errorBlock.classList.add('active');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Enviar mensaje';
    }
  });
});