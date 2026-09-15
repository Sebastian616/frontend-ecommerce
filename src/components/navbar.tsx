import { useState } from 'react'

function Navbar() {
  const [count, setCount] = useState(0)

  return (
    <>
        <nav className="pill-nav" aria-label="Navegación principal">
            <a href="/">Inicio</a>
            <a href="/productos">Tienda</a>
            <a href="/nosotros">Nosotros</a>
            <a href="/contacto">Contacto</a>
            <span className="nav-account" id="navAccount"></span>
            <button className="mini-cart cart-open-btn" id="cartTrigger" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
                <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span className="cart-count">0</span>
            </button>
        </nav>
    </>
  )
}

export default Navbar
