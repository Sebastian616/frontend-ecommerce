import { useState } from 'react'
import '../assets/css/index.css'
import '../assets/css/categories.css'
import '../assets/css/footer.css'
import '../assets/css/hero.css'
import '../assets/css/index.css'
import '../assets/css/navbar.css'
import '../assets/css/newsletter.css'
import '../assets/css/products.css'
import '../assets/css/promo.css'
import '../assets/css/cart.css'
import logoPng from '../assets/logotransparente.png'
import designerPng from '../assets/Designer.png'
import designer2Png from '../assets/Designer (1).png'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

function PagesIndex() {
  //const [count, setCount] = useState(0)

  return (
    <>
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
        {/* ═══════ THE CANVAS ═══════ */}
        <main>

        {/* SECTION 1: HERO */}
        <section className="canvas-section hero" id="hero">
            <div className="hero-content">
            <div className="hero-eyebrow">Colección 2026</div>
            <h1 className="hero-title">Ropa deportiva<br/>que <em>te inspira</em></h1>
            <p className="hero-desc">Comodidad, estilo y confianza en cada movimiento. Diseñada para acompañarte del gimnasio a la calle.</p>
            <div className="hero-cta">
                <a href="#productos" className="btn-pill">Ver colección
                <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
                </a>
            </div>
            </div>
            <div className="hero-image">
            <img src={designerPng} alt="" loading="eager"/>
            <div className="hero-image-tag">Primavera / Verano 2026</div>
            </div>
        </section>

        {/* SECTION 4: PROMO BANNER */}
        <section className="canvas-section promo" id="promo">
            <div className="promo-image-zone">
            <img src={designer2Png} alt="" loading="lazy"/>
            </div>
            <div className="promo-info">
            <div className="promo-badge reveal">Nuestra filosofía</div>
            <h2 className="promo-title reveal">Tu mejor versión<br/><em>en movimiento</em></h2>
            <ul className="promo-list reveal">
                <li><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Diseños modernos</li>
                <li><svg viewBox="0 0 24 24"><path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6z"/></svg>Alta calidad</li>
                <li><svg viewBox="0 0 24 24"><path d="M16 3H1v13h15M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>Envíos rápidos</li>
            </ul>
            <a href="#productos" className="cta-link reveal">Explorar colecciones</a>
            </div>
        </section>

        {/* SECTION 5: NEWSLETTER */}
        <section className="canvas-section newsletter" id="newsletter">
            <div className="newsletter-bg-shape" aria-hidden="true"></div>
            <div className="newsletter-content reveal">
            <div className="newsletter-icon">
                <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>
            </div>
            <h2 className="newsletter-title">Suscríbete y recibe<br/>ofertas exclusivas</h2>
            <p className="newsletter-caption">Sé la primera en enterarte de nuestras novedades, lanzamientos y promociones especiales.</p>
            {/*<form className="newsletter-form" onSubmit="return false;">
                <input type="email" placeholder="Tu correo electrónico" required/>
                <button type="submit" className="btn-pill">Suscribirse</button>
            </form>*/}
            </div>
        </section>
        </main>

        {/* SECTION 2: CATEGORIES (flow, non-sticky) */}
        <section className="flow-section categories" id="categorias">
        <div className="categories-track">
            <a className="category-item" href="#productos">
            <div className="category-circle"><svg viewBox="0 0 24 24"><path d="M8 4 5 7v3h3v10h8V10h3V7l-3-3-3 2h-2z"/></svg></div>
            <span className="category-label">Top deportivo</span>
            </a>
            <a className="category-item" href="#productos">
            <div className="category-circle"><svg viewBox="0 0 24 24"><path d="M8 2h8l1 9-2 11h-2l-1-9-1 9H9L7 11z"/></svg></div>
            <span className="category-label">Leggings</span>
            </a>
            <a className="category-item" href="#productos">
            <div className="category-circle"><svg viewBox="0 0 24 24"><path d="M6 4 3 7l2 3 2-1v11h10V9l2 1 2-3-3-3-3 2h-4z"/></svg></div>
            <span className="category-label">Chaquetas</span>
            </a>
            <a className="category-item" href="#productos">
            <div className="category-circle"><svg viewBox="0 0 24 24"><path d="M4 8h16l-2 4 2 4H4l2-4z"/></svg></div>
            <span className="category-label">Shorts</span>
            </a>
            <a className="category-item" href="#productos">
            <div className="category-circle"><svg viewBox="0 0 24 24"><path d="M9 3h6l1 5-2 4h-4L8 8zM9 14h6l1 7H8z"/></svg></div>
            <span className="category-label">Conjuntos</span>
            </a>
            <a className="category-item" href="#productos">
            <div className="category-circle"><svg viewBox="0 0 24 24"><path d="M9 2h6v3H9zM8 5h8l1 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8z"/></svg></div>
            <span className="category-label">Accesorios</span>
            </a>
        </div>
        </section>

        {/* SECTION 3: FEATURED PRODUCTS (flow, non-sticky) */}
        <section className="flow-section products" id="productos">
        <div className="products-header reveal">
            <h2 className="products-title">Productos destacados</h2>
            <a href="#" className="cta-link">Ver todos</a>
        </div>
        <div className="products-grid">

            <div className="product-card reveal">
                <div className="product-card-media">
                    <img src="https://res.cloudinary.com/veflwk46/image/upload/v1788389968/conjuntoAmarillo.jpg" alt="Top deportivo Breeze" loading="lazy"/>
                    <span className="product-badge-new">Nuevo</span>
                    <div className="product-wish"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
                </div>
                <div className="product-card-body">
                    <div className="product-card-name">Conjunto Deportivo con Falda</div>
                    <div className="product-card-rating">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
                    4.5 (128)
                    </div>
                    <div className="product-card-footer">
                    <span className="product-card-price">$89.000 COP</span>
                    <button className="product-cart-btn" aria-label="Agregar al carrito"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>
                    </div>
                </div>
            </div>

            <div className="product-card reveal">
            <div className="product-card-media">
                <img src="https://res.cloudinary.com/veflwk46/image/upload/v1788389270/conjuntoDeportivoBeige.jpg" alt="Leggings Fit" loading="lazy"/>
                <div className="product-wish"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
            </div>
            <div className="product-card-body">
                <div className="product-card-name">Conjunto Fit Beige</div>
                <div className="product-card-rating">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
                4.5 (96)
                </div>
                <div className="product-card-footer">
                <span className="product-card-price">$109.000 COP</span>
                <button className="product-cart-btn" aria-label="Agregar al carrito"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>
                </div>
            </div>
            </div>

            <div className="product-card reveal">
            <div className="product-card-media">
                <img src="https://res.cloudinary.com/veflwk46/image/upload/v1788389444/conjuntoBlancoNegro.jpg" alt="Conjunto Active" loading="lazy"/>
                <div className="product-wish"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
            </div>
            <div className="product-card-body">
                <div className="product-card-name">Conjunto Leggins Top </div>
                <div className="product-card-rating">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
                4.5 (74)
                </div>
                <div className="product-card-footer">
                <span className="product-card-price">$149.000 COP</span>
                <button className="product-cart-btn" aria-label="Agregar al carrito"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>
                </div>
            </div>
            </div>

            <div className="product-card reveal">
            <div className="product-card-media">
                <img src="https://res.cloudinary.com/veflwk46/image/upload/v1788389835/conjuntoAmarilloF.jpg" alt="Short deportivo" loading="lazy"/>
                <div className="product-wish"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
            </div>
            <div className="product-card-body">
                <div className="product-card-name">Conjunto Leggins Top Deportivo</div>
                <div className="product-card-rating">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
                4.5 (53)
                </div>
                <div className="product-card-footer">
                <span className="product-card-price">$79.000 COP</span>
                <button className="product-cart-btn" aria-label="Agregar al carrito"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>
                </div>
            </div>
            </div>

        </div>
        </section>

        {/* FOOTER */}
            <Footer/>
        {/* archivos */}
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script src="./js/auth.js"></script>
        <script src="./js/navbar.js"></script>
        <script src="./js/footer.js"></script>
        <script src="./js/index.js"></script>
        <script src="./js/cart.js"></script>
    </>
  )
}

export default PagesIndex
