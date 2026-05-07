import './ProductCard.css';
import type { Product } from '../data/productsService';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  formatMoney: (amount: number) => string;
}

export default function ProductCard({ product, onAddToCart, formatMoney }: ProductCardProps) {
  return (
    <div className="product-card">
      <div className="product-card__image-wrapper">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-card__image"
        />
        {product.badge && (
          <span className="product-card__badge">{product.badge}</span>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__price">{formatMoney(product.price)}</span>
          <button
            className="product-card__add-btn"
            onClick={() => onAddToCart(product)}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
