import type { Product } from "../../../types/product.types";

interface Props {
    product: Product;
}

export default function ProductCard({
    product
}: Props) {

    return (
        <div className="product-card reveal">
            <div className="product-card-media">
                <img src="https://res.cloudinary.com/veflwk46/image/upload/v1788389968/conjuntoAmarillo.jpg" alt="Top deportivo Breeze" loading="lazy"/>
                <span className="product-badge-new">{product.badge}</span>
                <div className="product-wish"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
            </div>
            <div className="product-card-body">
                <div className="product-card-name">{product.name}</div>
                <div className="product-card-rating">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
                4.5 (128){/*Ver la vuelta con las estrellas*/}
                </div>
                <div className="product-card-footer">
                <span className="product-card-price">{product.price}</span>
                <button className="product-cart-btn" aria-label="Agregar al carrito"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>
                </div>
            </div>
        </div>
    );
}