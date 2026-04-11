'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, Heart, ArrowRight, Package, CheckCircle, Tag, Ticket, XCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { validateCoupon } from '@/lib/api';

// Group cart items by category emoji prefix or first word
function getGroup(name: string): string {
  const lower = name.toLowerCase();
  if (/(laptop|notebook|macbook)/i.test(lower)) return '💻 Laptops';
  if (/(phone|iphone|samsung|pixel)/i.test(lower)) return '📱 Phones';
  if (/(headphone|earphone|speaker|airpod|earbud|audio)/i.test(lower)) return '🎧 Audio';
  if (/(tablet|ipad)/i.test(lower)) return '🖥️ Tablets';
  if (/(watch|band|fitbit|wearable)/i.test(lower)) return '⌚ Wearables';
  if (/(monitor|display|screen)/i.test(lower)) return '🖵 Monitors';
  return '🔧 Accesorios';
}

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart, appliedCoupon, applyCoupon, discountAmount, finalTotal } = useCart();
  const { format: formatPrice } = useCurrency();
  const [checkedOff, setCheckedOff] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const toggleCheck = (id: string) =>
    setCheckedOff(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const shipping = total >= 99 ? 0 : 9.99;
  const grandTotal = finalTotal + shipping;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const coupon = await validateCoupon(couponCode, total);
      applyCoupon(coupon);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  // Group by category (skill pattern: categorized list view)
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const g = getGroup(item.name);
    acc[g] = [...(acc[g] || []), item];
    return acc;
  }, {});

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-3">Tu carrito está vacío</h2>
        <p className="text-slate-400 mb-8">Explora nuestro catálogo y agrega productos.</p>
        <Link href="/products" className="btn-primary inline-flex">
          Ver Productos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-teal-300" /> Carrito
          </h1>
          <p className="text-sm text-slate-500 mt-1">{itemCount} {itemCount === 1 ? 'producto' : 'productos'} · {Object.keys(groups).length} {Object.keys(groups).length === 1 ? 'categoría' : 'categorías'}</p>
        </div>
        <button onClick={clearCart} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Vaciar todo
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items — categorized (skill pattern) */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groups).map(([group, groupItems]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">{group}</span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-slate-600">{groupItems.length} item{groupItems.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {groupItems.map(item => {
                  const isChecked = checkedOff.has(item.id);
                  return (
                    <div key={item.id}
                      className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${isChecked ? 'bg-white/[0.01] border-white/[0.04] opacity-50' : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.12]'}`}>
                      {/* Check-off (skill pattern) */}
                      <button onClick={() => toggleCheck(item.id)} title="Marcar como revisado"
                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-green-500 border-green-500' : 'border-slate-700 hover:border-teal-400'}`}>
                        {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>

                      {/* Image */}
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                        {item.image?.startsWith('http') ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{item.image || '📦'}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm leading-snug ${isChecked ? 'line-through text-slate-500' : 'text-white'}`}>{item.name}</div>
                        <div className="text-teal-300 text-sm font-bold mt-0.5">{formatPrice(item.price)}</div>
                      </div>

                      {/* Qty controls (inline edit — skill pattern) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-colors">
                          <Minus className="w-3 h-3 text-slate-400" />
                        </button>
                        <span className="w-6 text-center text-sm font-mono text-white">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-colors">
                          <Plus className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-white font-semibold text-sm w-16 text-right shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </div>

                      {/* Delete */}
                      <button onClick={() => removeItem(item.id)}
                        className="shrink-0 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Checked-off indicator */}
          {checkedOff.size > 0 && (
            <p className="text-xs text-slate-600 text-center">
              {checkedOff.size} producto{checkedOff.size > 1 ? 's' : ''} marcado{checkedOff.size > 1 ? 's' : ''} — se incluirán en el pago
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="card p-6 space-y-4 sticky top-20">
            <h3 className="font-display font-bold text-white text-lg">Resumen del Pedido</h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Cupón ({appliedCoupon.code})
                    <button onClick={() => applyCoupon(null)} className="text-slate-500 hover:text-red-400">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Envío</span>
                <span className={shipping === 0 ? 'text-green-400' : 'text-white'}>
                  {shipping === 0 ? '✓ Gratis' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && total > 0 && (
                <p className="text-[11px] text-slate-600">
                  Agrega {formatPrice(Math.max(0, 99 - total))} más para envío gratis
                </p>
              )}
            </div>

            <div className="h-px bg-white/[0.06]" />

            <div className="flex justify-between font-bold text-white">
              <span>Total</span>
              <span className="text-xl text-teal-300">{formatPrice(grandTotal)}</span>
            </div>

            {/* Coupon input */}
            {!appliedCoupon && (
              <form onSubmit={handleApplyCoupon} className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="Código de cupón"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-teal-400/50 transition-all uppercase"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                    />
                  </div>
                  <button 
                    disabled={couponLoading || !couponCode}
                    className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-all">
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-400 mt-2 ml-1">{couponError}</p>}
              </form>
            )}

            <Link href="/checkout" className="btn-primary w-full text-center block py-3.5 text-base font-semibold shadow-xl shadow-teal-900/30">
              Proceder al Pago <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              {[
                { icon: '🔒', label: 'Stripe SSL' },
                { icon: '↩️', label: '30 días dev.' },
                { icon: '📦', label: 'Envío gratis' },
              ].map(t => (
                <div key={t.label} className="text-[10px] text-slate-600">
                  <div className="text-base mb-0.5">{t.icon}</div>{t.label}
                </div>
              ))}
            </div>

            <Link href="/products" className="block text-center text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Seguir comprando
            </Link>
          </div>

          {/* Product suggestions teaser */}
          <div className="card p-4 border-teal-500/10">
            <div className="flex items-center gap-2 text-xs text-teal-300 mb-3">
              <Tag className="w-3.5 h-3.5" /> También te puede interesar
            </div>
            <Link href="/products" className="btn-ghost text-xs w-full justify-center py-2">
              Ver más productos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
