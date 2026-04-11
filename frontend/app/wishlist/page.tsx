'use client';

import { useWishlist } from '@/context/WishlistContext';
import { ProductCard } from '@/components/ui/ProductCard';
import { Heart, ShoppingCart, ArrowRight, PackageOpen } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlistItems, loading } = useWishlist();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Cargando tus favoritos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 lg:py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4">
            <Heart className="w-3 h-3 fill-current" /> Tu Selección
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-black text-white">Mis Favoritos</h1>
          <p className="text-gray-400 mt-2 text-lg">Los productos que más te gustan, guardados en un solo lugar.</p>
        </div>
        
        {wishlistItems.length > 0 && (
          <div className="text-sm text-gray-500 font-medium">
            Mostrando <span className="text-white font-bold">{wishlistItems.length}</span> productos
          </div>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="card p-12 md:p-20 text-center bg-white/[0.02] border-white/[0.05]">
          <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.07] rounded-3xl flex items-center justify-center mx-auto mb-8">
            <PackageOpen className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Tu lista está vacía</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-10 leading-relaxed">
            Parece que aún no has guardado ningún producto. ¡Explora nuestro catálogo y encuentra algo increíble!
          </p>
          <Link href="/products" className="btn-primary px-8 py-4 inline-flex items-center gap-2">
            Ver catálogo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((p) => (
            <ProductCard key={p._id} p={p} />
          ))}
        </div>
      )}

      {/* ── Suggested Section ────────────────────────────────── */}
      {wishlistItems.length > 0 && wishlistItems.length < 4 && (
        <div className="mt-24 p-8 rounded-3xl bg-teal-600/5 border border-teal-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">¿Buscas algo más?</h3>
              <p className="text-gray-400 text-sm">Sigue explorando nuestras categorías más populares.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/products?category=Audio" className="btn-ghost text-xs px-5 py-2.5">Audio</Link>
              <Link href="/products?category=Laptops" className="btn-ghost text-xs px-5 py-2.5">Laptops</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
