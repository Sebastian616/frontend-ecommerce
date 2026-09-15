import { useState } from 'react'
import '../assets/css/index.css'
import '../assets/css/navbar.css'
import '../assets/css/footer.css'
import '../assets/css/cart.css'
import '../assets/css/nosotros.css'
import logoPng from '../assets/logotransparente.png'
import designerPng from '../assets/Designer.png'
import designer2Png from '../assets/Designer (1).png'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

function AboutUsPage() {
  //const [count, setCount] = useState(0)

  return (
    <>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500;1,600&family=Manrope:wght@200;300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>

        {/* ═══════ ANNOUNCEMENT BAR ═══════ */}
        <div className="announce-bar">🚚 Envío gratis en compras superiores a $100.000 COP</div>

        {/* ═══════ BRAND MARK ═══════ */}
        <div className="brand-mark" aria-hidden="true">
            <img src={logoPng} alt=""/>
            Orb<em>Isa</em>
        </div>

        {/* ═══════ FLOATING PILL NAV ═══════ */}
        <Navbar/>

        {/* ═══════ MOBILE ═══════ */}
        <button className="hamburger" aria-label="Abrir menú"><span></span><span></span><span></span></button>
        <nav className="mobile-nav" aria-label="Navegación móvil">
        <a href="./index.html" className="active">Inicio</a>
        <a href="./productos.html">Tienda</a>
        <a href="./nosotros.html">Nosotros</a>
        <a href="./contacto.html">Contacto</a>
        <button className="mobile-cart-btn cart-open-btn" id="cartTriggerMobile" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
        <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        Ver carrito
        <span className="cart-count">0</span>
        </button>
        </nav>
        <main>

        {/* ═══════ ENCABEZADO ═══════ */}
        <section className="about-header">
            <div className="about-eyebrow">Nuestra historia</div>
            <h1 className="about-title">Movimiento, actitud<br/>y <em>propósito</em></h1>
            <p className="about-subtitle">OrbIsa nace de la pasión por el deporte y el deseo de que cada persona se sienta cómoda, fuerte y segura en su propia piel.</p>
        </section>

        {/* ═══════ HISTORIA ═══════ */}
        <section className="about-story">
            <div className="about-story-image">
            <img src={designerPng} alt="Equipo OrbIsa" loading="lazy"/>
            </div>
            <div className="about-story-content">
            <div className="about-kicker">Desde el comienzo</div>
            <h2>Ropa deportiva hecha para <em>toda la familia</em></h2>
            <p>OrbIsa comenzó como un pequeño proyecto con una idea clara: crear prendas deportivas que combinaran calidad, comodidad y diseño, sin importar la edad ni el cuerpo de quien las usara.</p>
            <p>Hoy trabajamos con hombres, mujeres y niños que buscan sentirse bien mientras se mueven, entrenan o simplemente disfrutan del día a día. Cada colección se diseña pensando en la libertad de movimiento y en la confianza que da vestir algo hecho con intención.</p>
            </div>
        </section>

        {/* ═══════ CIFRAS ═══════ */}
        <section className="about-stats">
            <div className="about-stats-grid">
            <div className="about-stat">
                <div className="about-stat-number" data-count="5000" data-suffix="+">0</div>
                <div className="about-stat-label">Clientas felices</div>
            </div>
            <div className="about-stat">
                <div className="about-stat-number" data-count="120" data-suffix="+">0</div>
                <div className="about-stat-label">Diseños creados</div>
            </div>
            <div className="about-stat">
                <div className="about-stat-number" data-count="4" data-suffix="">0</div>
                <div className="about-stat-label">Años de trayectoria</div>
            </div>
            <div className="about-stat">
                <div className="about-stat-number" data-count="98" data-suffix="%">0</div>
                <div className="about-stat-label">Satisfacción garantizada</div>
            </div>
            </div>
        </section>

        {/* ═══════ VALORES ═══════ */}
        <section className="about-values">
            <div className="about-values-header">
            <h2 className="about-values-title">Lo que nos <em>mueve</em></h2>
            <p className="about-values-subtitle">Tres principios que guían cada prenda que creamos.</p>
            </div>
            <div className="about-values-grid">
            <div className="about-value-card">
                <div className="about-value-icon">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <h3>Pasión</h3>
                <p>Diseñamos cada prenda con dedicación, pensando en cómo se siente al usarla, no solo en cómo se ve.</p>
            </div>
            <div className="about-value-card">
                <div className="about-value-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6z"/></svg>
                </div>
                <h3>Calidad</h3>
                <p>Seleccionamos telas y confecciones que resisten el movimiento y acompañan tu ritmo día a día.</p>
            </div>
            <div className="about-value-card">
                <div className="about-value-icon">
                <svg viewBox="0 0 24 24"><path d="M16 3H1v13h15M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <h3>Cercanía</h3>
                <p>Escuchamos a nuestra comunidad y crecemos junto a ella, con envíos rápidos y atención genuina.</p>
            </div>
            </div>
        </section>

        {/* ═══════ CTA FINAL ═══════ */}
        <section className="about-cta">
            <h2>Sé parte de <em>OrbIsa</em></h2>
            <p>Descubre nuestra colección y encuentra las prendas que te acompañarán en cada movimiento.</p>
            <a href="./productos.html" className="btn-pill">Ver colección
            <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
            </a>
        </section>

        </main>

        {/* FOOTER */}
        <Footer/>

        {/* archivos */}
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script src="./js/auth.js"></script>
        <script src="./js/navbar.js"></script>
        <script src="./js/footer.js"></script>
        <script src="./js/cart.js"></script>
        <script src="./js/nosotros.js"></script>
        <script src="/js/index.js"></script>
    </>
  )
}

export default AboutUsPage
