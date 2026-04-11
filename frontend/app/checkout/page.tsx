'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Lock, CreditCard, Truck, CheckCircle, ArrowRight, Tag, Check, X } from 'lucide-react';
import { validateCoupon } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Step = 'form' | 'processing' | 'success';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<Step>('form');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    street: '', city: '', region: '', postal: '', country: 'Chile',
    card: '', expiry: '', cvv: '',
  });

  // ── Coupon state ─────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; type: string; discount: number; discountAmount: number;
  } | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const data = await validateCoupon(couponInput.trim(), total + (total >= 99 ? 0 : 9.99));
      setAppliedCoupon(data);
      setCouponInput('');
    } catch (e: unknown) {
      setCouponError(e instanceof Error ? e.message : 'Cupón inválido');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponError(''); };

  const shipping = total >= 99 ? 0 : 9.99;
  const subtotalWithShipping = total + shipping;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotalWithShipping - discountAmount);
  const [stripeLoading, setStripeLoading] = useState(false);

  // ── Stripe Checkout: save order then redirect to Stripe ──────────────
  const handleStripeCheckout = async () => {
    if (items.length === 0 || !form.name || !form.email) {
      alert('Por favor completa nombre y email antes de pagar con Stripe.');
      return;
    }
    setStripeLoading(true);
    try {
      let token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      if (!token) {
        const res = await fetch(`${API}/api/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: `guest_${Date.now()}` }),
        });
        if (res.ok) { const d = await res.json(); token = d.token; localStorage.setItem('userToken', token!); }
      }
      // 1. Create order in DB (status = pending)
      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ product: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
          shippingAddress: { name: form.name, street: form.street, city: form.city, region: form.region, postal: form.postal, country: form.country, phone: form.phone },
          paymentMethod: 'stripe',
          totalAmount: finalTotal,
          discountAmount: discountAmount || 0,
          couponCode: appliedCoupon?.code,
        }),
      });
      const order = await orderRes.json();
      // 2. Create Stripe Checkout Session
      const sessionRes = await fetch(`${API}/api/stripe/checkout-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })), orderId: order._id }),
      });
      const { url } = await sessionRes.json();
      if (url) { clearCart(); window.location.href = url; }
      else throw new Error('No Stripe URL returned');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error con Stripe');
      setStripeLoading(false);
    }
  };

  // ── WebPay Checkout: save order then redirect to WebPay ──────────────
  const handleWebpayCheckout = async () => {
    if (items.length === 0 || !form.name || !form.email || !form.street || !form.city) {
      alert('Por favor completa todos los datos de contacto y envío antes de pagar con WebPay.');
      return;
    }
    setStripeLoading(true);
    try {
      let token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      if (!token) {
        const res = await fetch(`${API}/api/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: `guest_${Date.now()}` }),
        });
        if (res.ok) { const d = await res.json(); token = d.token; localStorage.setItem('userToken', token!); }
      }
      
      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ product: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
          shippingAddress: { name: form.name, street: form.street, city: form.city, region: form.region, postal: form.postal, country: form.country, phone: form.phone },
          paymentMethod: 'webpay',
          totalAmount: finalTotal,
          discountAmount: discountAmount || 0,
          couponCode: appliedCoupon?.code,
        }),
      });
      const order = await orderRes.json();
      
      const tbkRes = await fetch(`${API}/api/transbank/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ totalAmount: finalTotal, orderId: order._id }),
      });
      const { url, token: tbkToken } = await tbkRes.json();
      
      if (url && tbkToken) {
        clearCart();
        const f = document.createElement('form');
        f.method = 'POST'; f.action = url;
        const i = document.createElement('input');
        i.type = 'hidden'; i.name = 'token_ws'; i.value = tbkToken;
        f.appendChild(i); document.body.appendChild(f);
        f.submit();
      } else throw new Error('No Transbank URL returned');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error con WebPay');
      setStripeLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, opts: { type?: string; placeholder?: string; maxLength?: number; mono?: boolean } = {}) => (
    <div key={key}>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <input
        required type={opts.type || 'text'} placeholder={opts.placeholder || ''} maxLength={opts.maxLength}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-teal-500 focus:outline-none transition-colors ${opts.mono ? 'font-mono' : ''}`}
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setStep('processing'); setError('');

    try {
      // 1. Register guest user or get token from localStorage
      let token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');

      // 2. If no token, register a guest account with the email
      if (!token) {
        const regRes = await fetch(`${API}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: `guest_${Date.now()}`, // temp password for guest
          }),
        });
        if (regRes.ok) {
          const regData = await regRes.json();
          token = regData.token;
          localStorage.setItem('userToken', token!);
        } else {
          // Try login if already registered
          const loginRes = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email, password: form.card.slice(-4) }),
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            token = loginData.token;
            localStorage.setItem('userToken', token!);
          }
        }
      }

      // 3. Create the order in MongoDB
      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ product: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
          shippingAddress: { name: form.name, street: form.street, city: form.city, region: form.region, postal: form.postal, country: form.country, phone: form.phone },
          paymentMethod: 'card_simulated',
          totalAmount: finalTotal,
          discountAmount: discountAmount || 0,
          couponCode: appliedCoupon?.code,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || 'Error al crear la orden');
      }

      const order = await orderRes.json();
      setOrderId(order._id || 'ORD-' + Date.now());
      clearCart();
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setStep('form');
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-3">¡Orden Confirmada!</h1>
        <p className="text-gray-400 mb-2">Tu orden fue procesada y guardada exitosamente.</p>
        {orderId && <p className="text-xs text-gray-600 font-mono mb-6">ID: {orderId}</p>}
        <p className="text-sm text-gray-500 mb-8">Recibirás un correo de confirmación con los detalles del envío.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/')} className="btn-primary">Ir al inicio <ArrowRight className="w-4 h-4" /></button>
          <button onClick={() => router.push('/products')} className="btn-ghost">Seguir comprando</button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-8" />
        <h1 className="text-2xl font-bold text-white mb-3">Procesando pago...</h1>
        <p className="text-gray-400">Guardando tu orden en la base de datos.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-gray-400 mb-4">Tu carrito está vacío.</p>
        <button onClick={() => router.push('/products')} className="btn-primary">Ver Productos</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
        <Lock className="w-6 h-6 text-green-400" /> Checkout Seguro
      </h1>
      <p className="text-sm text-gray-500 mb-8">Tu información está protegida con cifrado SSL</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {/* Shipping */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Truck className="w-4 h-4 text-teal-400" /> Información de Envío</h2>
            <div className="grid grid-cols-2 gap-4">
              {field('Nombre completo', 'name', { placeholder: 'Ricardo Sanhueza' })}
              {field('Email', 'email', { type: 'email', placeholder: 'correo@email.com' })}
            </div>
            {field('Teléfono', 'phone', { placeholder: '+56 9 1234 5678' })}
            {field('Dirección', 'street', { placeholder: 'Av. O\'Higgins 1234, Dpto 5' })}
            <div className="grid grid-cols-2 gap-4">
              {field('Ciudad', 'city', { placeholder: 'Concepción' })}
              {field('Región', 'region', { placeholder: 'Biobío' })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('Código Postal', 'postal', { placeholder: '4030000' })}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">País</label>
                <select value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none">
                  {['Chile', 'Argentina', 'Colombia', 'México', 'Perú', 'España'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-teal-400" /> Datos de Pago</h2>
            {field('Número de tarjeta', 'card', { placeholder: '4242 4242 4242 4242', maxLength: 19, mono: true })}
            <div className="grid grid-cols-2 gap-4">
              {field('Expiración', 'expiry', { placeholder: 'MM/AA', maxLength: 5, mono: true })}
              {field('CVV', 'cvv', { placeholder: '123', maxLength: 4, mono: true })}
            </div>
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Usa <span className="font-mono text-gray-500">4242 4242 4242 4242</span> para probar (modo test)
            </p>
          </div>

          {error && <div className="card p-4 text-red-400 text-sm border-red-500/20 bg-red-500/5">{error}</div>}

          <button type="submit" className="btn-primary w-full py-4 text-base shadow-2xl shadow-teal-900/40">
            <Lock className="w-4 h-4" /> Confirmar Orden — ${finalTotal.toFixed(2)}
          </button>
        </form>

        {/* Order Summary */}
        <div className="card p-6 space-y-4 h-fit sticky top-20">
          <h3 className="font-semibold text-white">Tu Orden</h3>
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image?.startsWith('http') ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span>{item.image || '📦'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs truncate">{item.name}</div>
                  <div className="text-gray-500 text-xs">×{item.quantity}</div>
                </div>
                <div className="text-white font-mono text-xs shrink-0">${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="h-px bg-white/[0.06]" />
          {/* ── Coupon ── */}
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="font-mono font-bold">{appliedCoupon.code}</span>
                <span className="text-green-500/80 text-xs">
                  {appliedCoupon.type === 'percentage' ? `-${appliedCoupon.discount}%` : `-$${appliedCoupon.discount}`}
                </span>
              </div>
              <button onClick={removeCoupon} className="text-gray-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="CÓDIGO DE DESCUENTO"
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-gray-600 font-mono focus:border-teal-500 focus:outline-none uppercase"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-teal-600/80 hover:bg-teal-600 text-white transition-colors disabled:opacity-50"
                >
                  {couponLoading ? <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> : 'Aplicar'}
                </button>
              </div>
              {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
            </div>
          )}
          <div className="h-px bg-white/[0.06]" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Envío</span><span className={shipping === 0 ? 'text-green-400' : ''}>{shipping === 0 ? 'Gratis' : `$${shipping}`}</span></div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-400"><span>Descuento</span><span>-${discountAmount.toFixed(2)}</span></div>
            )}
          </div>
          <div className="flex justify-between font-bold text-white">
            <span>Total</span><span className="text-teal-400 text-lg">${finalTotal.toFixed(2)}</span>
          </div>
          <div className="space-y-3 mt-4">
            {/* Stripe Checkout */}
            <button onClick={handleStripeCheckout} disabled={stripeLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#635bff] hover:bg-[#4f46e5] text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#635bff]/30 disabled:opacity-60">
              {stripeLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>💳 Pagar con Stripe</>}
            </button>
            
            {/* WebPay Checkout */}
            <button onClick={handleWebpayCheckout} disabled={stripeLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#ed1c24] hover:bg-[#c20b12] text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#ed1c24]/30 disabled:opacity-60">
              {stripeLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>🇨🇱 Pagar con WebPay</>}
            </button>
          </div>
          <div className="flex items-center gap-3 text-gray-600 text-xs">
            <div className="flex-1 h-px bg-white/[0.05]" />o continúa con el formulario<div className="flex-1 h-px bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {['🔒 SSL', '↩️ 30d', '📦 Rápido'].map(t => (
              <div key={t} className="text-[10px] text-gray-600">{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
