'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { getToken } from '@/lib/api';
import {
  DollarSign, CreditCard, CheckCircle, Clock, XCircle,
  ArrowUpRight, TrendingUp, BarChart2, RefreshCw,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',  color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20' },
  processing: { label: 'Procesando', color: 'text-blue-400 bg-blue-400/10 border-blue-500/20' },
  shipped:    { label: 'Enviado',    color: 'text-teal-400 bg-teal-400/10 border-teal-500/20' },
  delivered:  { label: 'Entregado',  color: 'text-green-400 bg-green-400/10 border-green-500/20' },
  cancelled:  { label: 'Cancelado',  color: 'text-red-400 bg-red-400/10 border-red-500/20' },
};

const METHOD_META: Record<string, { label: string; color: string; dot: string }> = {
  stripe:           { label: 'Stripe',         color: 'text-[#635bff] bg-[#635bff]/10 border-[#635bff]/30', dot: 'bg-[#635bff]' },
  webpay:           { label: 'WebPay',          color: 'text-red-400 bg-red-400/10 border-red-500/20',       dot: 'bg-red-400' },
  card_simulated:   { label: 'Tarjeta (demo)',  color: 'text-gray-400 bg-gray-400/10 border-gray-500/20',    dot: 'bg-gray-400' },
};

function getMethodMeta(method: string) {
  return METHOD_META[method] ?? { label: method || 'Desconocido', color: 'text-gray-400 bg-gray-400/10 border-gray-500/20', dot: 'bg-gray-400' };
}

export default function AdminPayments() {
  const router = useRouter();
  const token = getToken();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'stripe' | 'webpay' | 'card_simulated'>('all');

  const [fetchError, setFetchError] = useState('');

  const fetchOrders = async () => {
    if (!token) { router.push('/admin/login'); return; }
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError('Error al cargar transacciones. Verifica tu conexión.');
      console.error('fetchOrders error:', err);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchOrders(); }, []);

  // ── Computed stats ──────────────────────────────────────────────────────
  const paid = orders.filter(o => o.status !== 'pending' && o.status !== 'cancelled');
  const pending = orders.filter(o => o.status === 'pending');
  const cancelled = orders.filter(o => o.status === 'cancelled');

  const totalRevenue = paid.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const stripeOrders = paid.filter(o => o.paymentMethod === 'stripe');
  const webpayOrders = paid.filter(o => o.paymentMethod === 'webpay');
  const stripeRevenue = stripeOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const webpayRevenue = webpayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  // Revenue by last 7 days
  const now = Date.now();
  const DAY = 86_400_000;
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const start = now - (6 - i) * DAY;
    const end = start + DAY;
    return {
      label: new Date(start).toLocaleDateString('es', { weekday: 'short' }),
      stripe: stripeOrders
        .filter(o => { const d = new Date(o.createdAt).getTime(); return d >= start && d < end; })
        .reduce((s, o) => s + (o.totalAmount || 0), 0),
      webpay: webpayOrders
        .filter(o => { const d = new Date(o.createdAt).getTime(); return d >= start && d < end; })
        .reduce((s, o) => s + (o.totalAmount || 0), 0),
    };
  });
  const maxDaily = Math.max(...dailyData.map(d => d.stripe + d.webpay), 1);

  // Filtered orders list
  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.paymentMethod === filter);

  return (
    <AdminLayout title="Pagos">
      <div className="space-y-6">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Ingresos Totales', value: `$${totalRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20',
            },
            {
              label: 'Via Stripe', value: `$${stripeRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: CreditCard, color: 'text-[#635bff]', bg: 'bg-[#635bff]/10 border-[#635bff]/20',
            },
            {
              label: 'Via WebPay', value: `$${webpayRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: CreditCard, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20',
            },
            {
              label: 'Órdenes Pagadas', value: paid.length,
              icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
            },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card p-5">
                <div className={`inline-flex p-2.5 rounded-xl border ${c.bg} ${c.color} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-white">{c.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* ── Revenue chart ── */}
          <div className="lg:col-span-3 card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-400" /> Ingresos últimos 7 días
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#635bff]" /> Stripe</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> WebPay</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {dailyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: '100px' }}>
                    {d.stripe > 0 && (
                      <div
                        className="w-full rounded-sm bg-[#635bff]/70 min-h-[3px]"
                        style={{ height: `${Math.max((d.stripe / maxDaily) * 100, 3)}%` }}
                        title={`Stripe $${d.stripe.toFixed(2)}`}
                      />
                    )}
                    {d.webpay > 0 && (
                      <div
                        className="w-full rounded-sm bg-red-400/70 min-h-[3px]"
                        style={{ height: `${Math.max((d.webpay / maxDaily) * 100, 3)}%` }}
                        title={`WebPay $${d.webpay.toFixed(2)}`}
                      />
                    )}
                    {d.stripe === 0 && d.webpay === 0 && (
                      <div className="w-full rounded-sm bg-white/5 h-full" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Status summary ── */}
          <div className="lg:col-span-2 card p-5 space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" /> Resumen de Estado
            </h3>
            {[
              { label: 'Pagadas / procesando', count: paid.length, color: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
              { label: 'Pendientes de pago', count: pending.length, color: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
              { label: 'Canceladas', count: cancelled.length, color: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm">
                <div className={`flex items-center gap-2 ${s.color}`}>{s.icon} {s.label}</div>
                <span className={`font-bold ${s.color}`}>{s.count}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <BarChart2 className="w-4 h-4" /> Tasa de éxito
              </div>
              <span className="font-bold text-white">
                {orders.length > 0 ? Math.round((paid.length / orders.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Transactions table ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-400" /> Transacciones
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={fetchOrders} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors" title="Actualizar">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1">
                {(['all', 'stripe', 'webpay', 'card_simulated'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {f === 'all' ? 'Todos' : getMethodMeta(f).label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-10 text-red-400 text-sm">⚠️ {fetchError}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay transacciones para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-white/[0.06]">
                    <th className="pb-3 font-medium">Orden</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Método</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-right">Fecha</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.slice(0, 50).map((order: any) => {
                    const methodMeta = getMethodMeta(order.paymentMethod);
                    const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: 'text-gray-400 bg-gray-400/10 border-gray-500/20' };
                    return (
                      <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-mono text-xs text-gray-400">
                          #{(order._id || '').slice(-8).toUpperCase()}
                        </td>
                        <td className="py-3 text-gray-300">
                          {order.shippingAddress?.name || order.user?.name || '—'}
                        </td>
                        <td className="py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${methodMeta.color}`}>
                            {methodMeta.label}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-white font-medium">
                          ${(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 text-right text-gray-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('es-CL')}
                        </td>
                        <td className="py-3 text-right">
                          <Link href="/admin/orders" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors inline-flex">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
