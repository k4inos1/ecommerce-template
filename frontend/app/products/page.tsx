'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, SlidersHorizontal, Star, X, Check, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const CATEGORIES = ['All', 'Laptops', 'Phones', 'Audio', 'Tablets', 'Wearables', 'Monitors', 'Accessories'];
const EMOJI: Record<string, string> = { Laptops: '💻', Phones: '📱', Audio: '🎧', Tablets: '🖥️', Wearables: '⌚', Monitors: '🖵', Accessories: '🔧' };
const PRICE_PRESETS = [
  { label: '< $100', min: '', max: '100' },
  { label: '$100–500', min: '100', max: '500' },
  { label: '> $500', min: '500', max: '' },
];

interface Product { _id: string; name: string; price: number; image: string; category: string; description: string; stock: number }

function ProductsContent() {
  const { addItem } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const { format: formatPrice } = useCurrency();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'All');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState(params.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('max') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const debouncedMin = useDebounce(minPrice, 500);
  const debouncedMax = useDebounce(maxPrice, 500);

  const hasActiveFilters = minPrice !== '' || maxPrice !== '' || category !== 'All';

  const clearPriceFilters = () => { setMinPrice(''); setMaxPrice(''); };
  const clearAllFilters = () => { setSearch(''); setCategory('All'); clearPriceFilters(); setSort('newest'); };

  useEffect(() => {
    setLoading(true); setError('');
    const q = new URLSearchParams();
    if (debouncedSearch) q.set('search', debouncedSearch);
    if (category !== 'All') q.set('category', category);
    if (debouncedMin) q.set('minPrice', debouncedMin);
    if (debouncedMax) q.set('maxPrice', debouncedMax);
    q.set('limit', '24');

    fetch(`${API}/api/products?${q}`)
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar productos');
        return r.json();
      })
      .then(d => { setProducts(d.products || []); setTotal(d.total || 0); })
      .catch((err) => setError(err.message || 'No se pudo conectar al servidor.'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, debouncedMin, debouncedMax]);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return 0;
  });

  const handleAdd = (p: Product) => {
    addItem({ id: p._id, name: p.name, price: p.price, image: p.image || EMOJI[p.category] || '📦' });
    setAdded(p._id);
    setTimeout(() => setAdded(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-bold text-teal-200 uppercase tracking-widest mb-4">
            Catálogo Completo
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-black text-white">Explora la Tecnología</h1>
          <p className="text-slate-400 mt-2 text-lg">Encuentra los gadgets más innovadores con envío express.</p>
        </div>
        {!loading && (
          <div className="text-sm font-mono text-slate-500 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            {total} resultados
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="¿Qué estás buscando hoy?"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none transition-all shadow-inner" 
            />
          </div>
          
          <div className="flex gap-3">
            {/* Filters toggle */}
            <button 
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border text-sm font-bold transition-all ${showFilters || (minPrice || maxPrice) ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:text-white hover:border-white/20'}`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            
            {/* Sort */}
            <select 
              value={sort} 
              onChange={e => setSort(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 text-sm font-bold text-slate-300 focus:border-teal-400 focus:outline-none cursor-pointer hover:border-white/20 transition-all appearance-none pr-10 relative">
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button 
              key={c} 
              onClick={() => setCategory(c)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${category === c ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-900/40' : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:text-white hover:border-white/20'}`}>
              {c}
            </button>
          ))}
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Limpiar Todo
            </button>
          )}
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <div className="card p-6 border-teal-500/20 bg-teal-500/[0.02] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="flex-1 w-full">
                <p className="text-xs text-slate-500 uppercase font-black tracking-[0.2em] mb-4">Rango de precio</p>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input
                      type="number" 
                      min="0" 
                      placeholder="Mínimo"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-teal-400/50 outline-none transition-all"
                    />
                  </div>
                  <span className="text-slate-600 shrink-0 font-bold">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input
                      type="number" 
                      min="0" 
                      placeholder="Máximo"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-teal-400/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {PRICE_PRESETS.map(r => (
                  <button 
                    key={r.label} 
                    onClick={() => { setMinPrice(r.min); setMaxPrice(r.max); }}
                    className={`whitespace-nowrap px-5 py-3 rounded-xl text-xs font-bold border transition-all ${minPrice === r.min && maxPrice === r.max ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="card p-5 text-red-400 text-sm border-red-500/20 bg-red-500/5 mb-8 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        {error}
      </div>}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="aspect-square rounded-2xl bg-white/[0.03] mb-6" />
              <div className="h-2.5 bg-white/[0.03] rounded-full mb-3 w-1/3" />
              <div className="h-4 bg-white/[0.03] rounded-full mb-4 w-3/4" />
              <div className="flex justify-between items-center">
                <div className="h-6 bg-white/[0.03] rounded-full w-1/4" />
                <div className="h-9 w-9 bg-white/[0.03] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
          <div className="card py-32 text-center bg-white/[0.01] border-white/[0.05]">
          <div className="text-6xl mb-6 grayscale opacity-20">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sin resultados exactos</h2>
          <p className="text-slate-500 max-w-sm mx-auto px-6">
            Intenta ajustando los filtros o buscando un término más general.
          </p>
          <button onClick={clearAllFilters} className="mt-8 text-teal-300 font-bold hover:text-teal-200 transition-colors uppercase tracking-widest text-xs">
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {sorted.map(p => (
              <div key={p._id} className="card group hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-200 flex flex-col">
                <Link href={`/products/${p._id}`} className="flex flex-col flex-1 p-4">
                {/* Image */}
                <div className="aspect-square rounded-xl bg-white/[0.03] overflow-hidden flex items-center justify-center mb-4">
                  {p.image?.startsWith('http') ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-4xl">{EMOJI[p.category] || '📦'}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
                  <span>{p.category}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                </div>
                <div className="font-medium text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-teal-200 transition-colors">{p.name}</div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-teal-300 font-bold text-lg">{formatPrice(p.price)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {p.stock > 0 ? `${p.stock} disp.` : 'Agotado'}
                  </span>
                </div>
              </Link>
              <div className="p-3 pt-0 flex gap-2">
                <button onClick={() => handleAdd(p)} disabled={p.stock === 0}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${added === p._id ? 'bg-green-600 text-white' : p.stock === 0 ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-900/30'}`}>
                  {added === p._id ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar</>}
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); toggleWishlist(p._id); }}
                  className={`p-2.5 rounded-xl border transition-all ${isInWishlist(p._id) ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' : 'border-white/10 text-slate-500 hover:text-pink-400 hover:border-pink-500/30'}`}
                  title={isInWishlist(p._id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(p._id) ? 'fill-pink-400' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center py-48 gap-4">
      <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">Sincronizando catálogo...</p>
    </div>}>
      <ProductsContent />
    </Suspense>
  );
}
