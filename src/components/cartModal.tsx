import { useState } from 'react'

function Footer() {
  const [count, setCount] = useState(0)

  return (
    <>
        <div className="cart-overlay" id="cartOverlay"></div>
    <aside className="cart-modal" id="cartModal" role="dialog" aria-modal="true" aria-labelledby="cartModalTitle">
        <div className="cart-modal-header">
            <h2 id="cartModalTitle">Tu carrito <span className="cart-modal-count">(0)</span></h2>
            <button className="cart-close" id="cartClose" aria-label="Cerrar carrito">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        <div className="cart-items" id="cartItemsWrap"></div>

        <div className="cart-footer">
            <div className="cart-subtotal-row">
            <span>Subtotal</span>
            <span className="cart-subtotal-value">$0 COP</span>
            </div>
            <p className="cart-shipping-note">Envío gratis en compras superiores a $100.000 COP 🎉</p>
            <button className="btn-pill cart-checkout" id="cartCheckoutBtn">Finalizar compra
            <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
            </button>
            <button className="cta-link cta-link--dark cart-continue" id="cartContinue">Seguir comprando</button>
        </div>
    </aside>
    </>
  )
}

export default Footer
