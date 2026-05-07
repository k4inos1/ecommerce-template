import { useState, useMemo } from 'react';
import './ProductList.css';
import ProductCard from './ProductCard';
import type { Product } from '../data/productsService';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  formatMoney: (amount: number) => string;
}

export default function ProductList({ products, onAddToCart, formatMoney }: ProductListProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <section className="product-list" id="menu">
      <h2 className="product-list__title">Nuestro Menú</h2>
      
      {categories.length > 1 && (
        <div className="product-list__categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? 'Todos' : category}
            </button>
          ))}
        </div>
      )}

      <div className="product-list__grid">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            formatMoney={formatMoney}
          />
        ))}
      </div>
    </section>
  );
}
