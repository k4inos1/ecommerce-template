'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Clock, CheckCircle, Truck, XCircle, AlertCircle,
  ArrowLeft, MapPin, CreditCard, ShoppingBag,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pendiente',  color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { label: 'Procesando', color: 'text-blue-400 bg-blue-400/10 border-blue-500/20',       icon: <AlertCircle className="w-3.5 h-3.5" /> },
  shipped:    { label: 'En camino',  color: 'text-teal-400 bg-teal-400/10 border-teal-500/20',  icon: <Truck className="w-3.5 h-3.5" /> },
  delivered:  { label: 'Entregado',  color: 'text-green-400 bg-green-400/10 border-green-500/20',    icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled:  { label: 'Cancelado',  color: 'text-red-400 bg-red-400/10 border-red-500/20',          icon: <XCircle className="w-3.5 h-3.5" /> },
};

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

const PAYMENT_LABELS: Record<string, string> = {
  stripe: 'Tarjeta (Stripe)',
  transbank: 'WebPay (Transbank)',
  webpay: 'WebPay (Transbank)',
  card: 'Tarjeta de crédito/débito',
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    if (!token) { router.push(`/login?return=/orders/${id}`); return; }

    fetch(`${API}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (r.status === 401) { router.push(`/login?return=/orders/${id}`); return null; }
        if (r.status === 403) { setError('No tienes acceso a esta orden.'); return null; }
        if (r.status === 404) { setError('Orden no encontrada.'); return null; }
        if (!r.ok) { setError('Error al cargar la orden.'); return null; }
        return r.json();
      })
      .then(d => { if (d) setOrder(d); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
        <Link href="/mis-ordenes" className="btn-primary mt-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver a mis órdenes
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const statusIdx = STATUS_ORDER.indexOf(order.status);
  const shortId = String(order._id).slice(-8).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Back */}
      <Link href="/mis-ordenes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Mis Órdenes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Package className="w-6 h-6 text-teal-400" />
            Orden #{shortId}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border font-medium ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      {order.status !== 'cancelled' && statusIdx >= 0 && (
        <div className="card p-6 mb-4">
          <p className="text-xs text-gray-500 uppercase font-mono mb-4">Estado del envío</p>
          <div className="flex items-center">
            {STATUS_ORDER.map((s, i) => {
              const done = i <= statusIdx;
              const active = i === statusIdx;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-teal-500 border-teal-500' : 'bg-transparent border-gray-700'}`}>
                      {done && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-[10px] whitespace-nowrap ${active ? 'text-teal-400 font-semibold' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                      {STATUS_CONFIG[s]?.label}
                    </span>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < statusIdx ? 'bg-teal-500' : 'bg-gray-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="card p-6 mb-4">
        <p className="text-xs text-gray-500 uppercase font-mono mb-4 flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5" /> Productos
        </p>
        <div className="space-y-3">
          {(order.items || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {item.image?.startsWith('http')
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <span className="text-xl">📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
              </div>
              <p className="text-sm font-mono text-white shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-1.5">
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white font-mono">${((order.totalAmount || 0) + (order.discountAmount || 0)).toFixed(2)}</span>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Descuento {order.couponCode && `(${order.couponCode})`}</span>
              <span className="text-green-400 font-mono">-${(order.discountAmount || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1">
            <span className="text-gray-300">Total</span>
            <span className="text-teal-400 font-mono">${(order.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {order.shippingAddress && (
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase font-mono mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Dirección de envío
            </p>
            <p className="text-sm text-white">{order.shippingAddress.name}</p>
            <p className="text-sm text-gray-400">{order.shippingAddress.street}</p>
            <p className="text-sm text-gray-400">{order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ''}</p>
            <p className="text-sm text-gray-400">{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && <p className="text-sm text-gray-400">{order.shippingAddress.phone}</p>}
          </div>
        )}

        <div className="card p-5">
          <p className="text-xs text-gray-500 uppercase font-mono mb-3 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" /> Pago
          </p>
          <p className="text-sm text-white">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || 'No especificado'}</p>
          {order.stripeSessionId && (
            <p className="text-xs text-gray-600 mt-1 font-mono truncate">Stripe: {order.stripeSessionId}</p>
          )}
          {order.webpayToken && (
            <p className="text-xs text-gray-600 mt-1 font-mono truncate">WebPay: {order.webpayToken}</p>
          )}
        </div>
      </div>
    </div>
  );
}
