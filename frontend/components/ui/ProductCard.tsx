'use client';

import Link from 'next/link';
import { Heart, ShoppingCart, Zap, Star } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useState } from 'react';

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
}

const EMOJI: Record<string, string> = { Laptops: '💻', Phones: '📱', Audio: '🎧', Tablets: '🖥️', Wearables: '⌚', Monitors: '🖵', Accessories: '🔧' };

export function ProductCard({ p }: { p: Product }) {
  const { toggle, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const { format: formatPrice } = useCurrency();
  const [adding, setAdding] = useState(false);
  
  const inWishlist = isInWishlist(p._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addItem({ id: p._id, name: p.name, price: p.price, image: p.image || EMOJI[p.category] || '📦' });
    setTimeout(() => setAdding(false), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(p._id);
  };

  return (
    <Link href={`/products/${p._id}`}
      className="card p-4 group hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 relative overflow-hidden bg-white/[0.015]">
      
      {/* Wishlist Toggle overlay on top-right */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${inWishlist ? 'bg-pink-600/20 border-pink-500/30 text-pink-400 shadow-lg shadow-pink-900/20' : 'bg-white/5 border-white/10 text-slate-400 opacity-0 group-hover:opacity-100'}`}>
        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : 'group-hover:scale-110'} transition-transform`} />
      </button>

      {/* Visual background effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/8 rounded-full blur-[40px] pointer-events-none group-hover:bg-teal-500/15 transition-colors" />

      {/* Product visual area */}
      <div className="aspect-square rounded-xl bg-white/[0.03] overflow-hidden flex items-center justify-center relative">
        {p.image?.startsWith('http') ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{p.image || EMOJI[p.category] || '📦'}</span>
        )}
        
        {/* Rapid availability pill */}
        <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 shadow-lg">
          <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-400' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{p.stock > 5 ? 'En Stock' : p.stock > 0 ? 'Últimos' : 'Agotado'}</span>
        </div>
      </div>

      {/* Info area */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">
          <span>{p.category}</span>
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
            <span className="text-slate-300">4.9</span>
          </div>
        </div>
        <div className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:text-teal-200 transition-colors min-h-[2.5rem]">{p.name}</div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-teal-300 font-bold text-lg leading-none">{formatPrice(p.price)}</span>
          <span className="text-[9px] text-slate-500 font-medium">IVA incluido</span>
        </div>
        
        <button 
          onClick={handleAddToCart}
          disabled={p.stock === 0}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${adding ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/20' : p.stock > 0 ? 'bg-teal-500/10 border-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-white hover:shadow-lg hover:shadow-teal-900/40' : 'bg-white/5 border-white/10 text-slate-700 cursor-not-allowed'}`}>
          <ShoppingCart className={`w-4 h-4 ${adding ? 'animate-bounce' : ''}`} />
        </button>
      </div>
    </Link>
  );
}
