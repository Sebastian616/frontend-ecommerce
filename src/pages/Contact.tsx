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
import AnnouncementBar from '../components/announcementBar'
import BrandMark from '../components/brandMark'

function ContactPage() {
  //const [count, setCount] = useState(0)

  return (
    <>
        {/* ═══════ ANNOUNCEMENT BAR ═══════ */}
        <AnnouncementBar/>

        {/* ═══════ BRAND MARK ═══════ */}
        <BrandMark/>

        {/* ═══════ FLOATING PILL NAV ═══════ */}
        <Navbar/>

        {/* ═══════ MOBILE ═══════ */}
        <button className="hamburger" aria-label="Abrir menú"><span></span><span></span><span></span></button>
        <nav className="mobile-nav" aria-label="Navegación móvil">
        <a href="/index" className="active">Inicio</a>
        <a href="/productos">Tienda</a>
        <a href="/nosotros">Nosotros</a>
        <a href="/contacto">Contacto</a>
        <button className="mobile-cart-btn cart-open-btn" id="cartTriggerMobile" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
        <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        Ver carrito
        <span className="cart-count">0</span>
        </button>
        </nav>

        {/* ═══════ HEADER ═══════ */}
        <header className="contact-header">
        <div className="contact-eyebrow">Estamos para ayudarte</div>
        <h1 className="contact-title">Hablemos <em>de moda</em></h1>
        <p className="contact-subtitle">¿Dudas sobre tallas, envíos o un pedido? Escríbenos y te respondemos lo antes posible.</p>
        </header>

        {/* ═══════ FORM + INFO ═══════ */}
        <section className="contact-layout">

        <div className="contact-form-card" id="contactFormCard">
            <form id="contactForm" action="https://formspree.io/f/xqpkbybn" method="POST">
            <input type="hidden" name="_subject" value="Nuevo mensaje de contacto — OrbIsa"/>
            <div className="contact-field-row">
                <div className="contact-field">
                <label htmlFor="contactName">Nombre *</label>
                <input type="text" id="contactName" name="name" placeholder="Tu nombre" required/>
                </div>
                <div className="contact-field">
                <label htmlFor="contactEmail">Correo *</label>
                <input type="email" id="contactEmail" name="email" placeholder="tu@correo.com" required/>
                </div>
            </div>

            <div className="contact-field">
                <label htmlFor="contactSubject">Asunto</label>
                <input type="text" id="contactSubject" name="subject" placeholder="¿En qué te podemos ayudar?"/>
            </div>

            <div className="contact-field">
                <label htmlFor="contactMessage">Mensaje *</label>
                <textarea id="contactMessage" name="message" placeholder="Cuéntanos los detalles..." required></textarea>
            </div>

            <button type="submit" className="btn-pill contact-submit" id="contactSubmitBtn">
                <span>Enviar mensaje</span>
                <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
            </button>

            <p className="contact-form-note">Al enviar este formulario aceptas que te contactemos por correo respecto a tu consulta.</p>
            </form>

            <div className="contact-success" id="contactSuccess">
            <div className="contact-success-icon">
                <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h3>¡Mensaje enviado!</h3>
            <p>Gracias por escribirnos. Nuestro equipo te responderá dentro de las próximas 24 horas hábiles.</p>
            </div>

            <p className="contact-form-error" id="contactError"></p>
        </div>

        <div className="contact-info-card">
            <div className="contact-info-title">Otras formas de contactarnos</div>
            <p className="contact-info-text">Elige el canal que prefieras — respondemos rápido en todos.</p>

            <ul className="contact-info-list">
            <li className="contact-info-item">
                <div className="contact-info-icon">
                <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>
                </div>
                <div>
                <div className="contact-info-label">Correo</div>
                <div className="contact-info-value"><a href="mailto:hola@orbisa.com">hola@orbisa.com</a></div>
                </div>
            </li>
            <li className="contact-info-item">
                <div className="contact-info-icon">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                <div className="contact-info-label">Teléfono</div>
                <div className="contact-info-value"><a href="tel:+573001234567">+57 300 123 4567</a></div>
                </div>
            </li>
            <li className="contact-info-item">
                <div className="contact-info-icon">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                <div className="contact-info-label">Dirección</div>
                <div className="contact-info-value">Medellín, Colombia</div>
                </div>
            </li>
            </ul>

            <div className="contact-hours">
            <div className="contact-hours-row"><span>Lunes – Viernes</span><span>9:00 AM – 6:00 PM</span></div>
            <div className="contact-hours-row"><span>Sábados</span><span>10:00 AM – 2:00 PM</span></div>
            <div className="contact-hours-row"><span>Domingos</span><span>Cerrado</span></div>
            </div>

            <div className="contact-social">
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
            <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></a>
            </div>
        </div>

        </section>

        {/* ═══════ FOOTER ═══════ */}
        <Footer/>

        <script src="./js/auth.js"></script>
        <script src="./js/navbar.js"></script>
        <script src="./js/footer.js"></script>
        <script src="./js/cart.js"></script>
        <script src="./js/contacto.js"></script>
        <script src="./js/index.js"></script>
    </>
  )
}

export default ContactPage
