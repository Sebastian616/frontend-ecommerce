import '../../../assets/css/products.css'
import '../../../assets/css/contacto.css'
import '../../../assets/css/footer.css'
import '../../../assets/css/index.css'
import '../../../assets/css/productModal.css'
import '../../../assets/css/cart.css'
import '../../../assets/css/navbar.css'
import '../../../assets/css/shop.css'
import logoPng from '../../../assets/logotransparente.png'
import Navbar from '../../../components/navbar'
import Footer from '../../../components/footer'

import { useEffect, useState } from "react";

import ProductCard
    from "../components/ProductCard";

import { getProducts }
    from "../services/productService";

import type { Product }
    from "../../../types/product.types";

import { useAuth }
    from "../../auth/context/AuthContext";

export default function ProductPage() {
  const [products, setProducts] =
        useState<Product[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const { logout } = useAuth();

    useEffect(() => {

        const loadProducts = async () => {

            try {

                const data = await getProducts();

                setProducts(data);

            } catch (error) {

                console.error(error);

                setError(
                    "No se pudieron cargar los productos."
                );

            } finally {

                setLoading(false);
            }
        };

        loadProducts();

    }, []);

    if (loading) {
        return <p>Cargando productos...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

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
        <a href="index.html#hero">Inicio</a>
        <a href="productos.html" className="active">Tienda</a>
        <a href="index.html#productos">Colecciones</a>
        <a href="index.html#promo">Nosotros</a>
        <a href="index.html#newsletter">Contacto</a>
        <button className="mobile-cart-btn cart-open-btn" id="cartTriggerMobile" aria-label="Abrir carrito de compras" aria-haspopup="dialog" aria-controls="cartModal">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Ver carrito
          <span className="cart-count">0</span>
        </button>
      </nav>

      {/* ═══════ SHOP HEADER ═══════ */}
      <header className="shop-header">
        <div className="shop-eyebrow">Catálogo completo</div>
        <h1 className="shop-title">Todos los productos</h1>
        <div className="shop-count" id="shopCount"></div>
      </header>

      {/* ═══════ SHOP GRID ═══════ */}
      <section className="flow-section products" aria-live="polite">
        <div className="products-grid" id="shopGrid">
          {/*products.map((product) => (

                    <ProductCard
                        key={product.id}
                        product={product}
                    />

                ))*/}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <Footer/>

      {/* ═══════ MODAL DE FOTOS DEL PRODUCTO ═══════ */}
      <div className="modal fade" id="productModal" tabIndex={-1} aria-labelledby="productModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="productModalLabel">Producto</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
              <div id="productCarousel" className="carousel slide" data-bs-ride="false">
                <div className="carousel-indicators" id="productCarouselIndicators"></div>
                <div className="carousel-inner" id="productCarouselInner"></div>
                <button className="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
      <script src="./js/auth.js"></script>
      <script src="./js/navbar.js"></script>
      <script src="./js/footer.js"></script>
      <script src="./js/cart.js"></script>
      <script src="./js/products.js"></script>
      <script src="./js/index.js"></script>
    </>
  )
}