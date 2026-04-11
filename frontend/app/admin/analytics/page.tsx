'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { getToken } from '@/lib/api';
import { TrendingUp, ShoppingBag, DollarSign, Users, Package } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', processing: '#3b82f6', shipped: '#6366f1', delivered: '#22c55e', cancelled: '#ef4444',
};

function MiniBarChart({ data, color = '#6366f1' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full" style={{ height: `${(d.value / max) * 100}%`, minHeight: '4px', background: d.value > 0 ? color : 'rgba(255,255,255,0.04)', borderRadius: '4px 4px 0 0', transition: 'all 0.3s' }}>
            {d.value > 0 && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                {typeof d.value === 'number' && d.value > 100 ? `$${d.value.toFixed(0)}` : d.value}
              </div>
            )}
          </div>
          <div className="text-[9px] text-gray-600 capitalize">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-32 text-gray-600 text-sm">Sin datos</div>;

  let offset = 0;
  const r = 40, cx = 60, cy = 60, stroke = 16;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const el = (
            <circle key={i} r={r} cx={cx} cy={cy} fill="none" stroke={seg.color}
              strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ} style={{ transition: 'stroke-dasharray 0.5s' }} />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" fontSize="9">órdenes</text>
      </svg>
      <div className="space-y-2">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-gray-400">{s.label}</span>
            <span className="text-white font-mono ml-auto">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const token = getToken();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/orders`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/products/admin/all`, { headers: h }).then(r => r.json()),
    ]).then(([ord, prod]) => {
      setOrders(Array.isArray(ord) ? ord : []);
      setProducts((prod.products || []));
    }).finally(() => setLoading(false));
  }, [token]);

  // Revenue last 14 days
  const now = Date.now(); const DAY = 86400000;
  const daily14 = Array.from({ length: 14 }, (_, i) => {
    const s = now - (13 - i) * DAY, e = s + DAY;
    return {
      label: new Date(s).toLocaleDateString('es', { weekday: 'short' }).slice(0, 2),
      value: orders.filter(o => { const d = new Date(o.createdAt).getTime(); return d >= s && d < e; })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
  });

  // Orders by status
  const byStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => ({
    label: { pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' }[s]!,
    value: orders.filter(o => o.status === s).length,
    color: STATUS_COLORS[s],
  }));

  // Top categories by order items
  const catRevenue: Record<string, { revenue: number; count: number }> = {};
  orders.forEach(o => (o.items || []).forEach((item: any) => {
    const cat = item.category || 'Otros';
    if (!catRevenue[cat]) catRevenue[cat] = { revenue: 0, count: 0 };
    catRevenue[cat].revenue += item.price * item.quantity;
    catRevenue[cat].count += item.quantity;
  }));

  // Orders last 7 weeks (count)
  const weekly7 = Array.from({ length: 7 }, (_, i) => {
    const s = now - (6 - i) * 7 * DAY, e = s + 7 * DAY;
    return { label: `S${i + 1}`, value: orders.filter(o => { const d = new Date(o.createdAt).getTime(); return d >= s && d < e; }).length };
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avgOrder = orders.length ? totalRevenue / orders.length : 0;
  const publishedProducts = products.filter(p => p.published).length;

  return (
    <AdminLayout title="Analytics">
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue Total', value: `$${totalRevenue.toLocaleString('es', { maximumFractionDigits: 0 })}`, sub: 'acumulado', icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
              { label: 'Órdenes', value: orders.length, sub: `${byStatus[0].value} pendientes`, icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'Ticket Promedio', value: `$${avgOrder.toFixed(2)}`, sub: 'por orden', icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
              { label: 'Productos', value: `${publishedProducts} / ${products.length}`, sub: 'publicados', icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            ].map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="card p-5">
                  <div className={`inline-flex p-2.5 rounded-xl border ${c.bg} ${c.color} mb-4`}><Icon className="w-5 h-5" /></div>
                  <div className="text-2xl font-bold text-white">{c.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{c.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Revenue 14-day + Orders by week */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <div className="section-label mb-1">Revenue</div>
              <div className="text-sm text-gray-400 mb-5">Últimos 14 días</div>
              <MiniBarChart data={daily14} color="url(#grad)" />
              {/* SVG gradient definition (hidden) */}
              <svg width="0" height="0"><defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient></defs></svg>
              {totalRevenue === 0 && <p className="text-xs text-gray-600 text-center mt-2">Las ventas aparecerán aquí cuando proceses órdenes</p>}
            </div>

            <div className="card p-5">
              <div className="section-label mb-1">Órdenes</div>
              <div className="text-sm text-gray-400 mb-5">Últimas 7 semanas</div>
              <MiniBarChart data={weekly7} color="#22c55e" />
            </div>
          </div>

          {/* Status donut + top products */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <div className="section-label mb-4">Órdenes por Estado</div>
              <DonutChart segments={byStatus} />
            </div>

            <div className="card p-5">
              <div className="section-label mb-4">Productos más vendidos</div>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-600">Sin datos de ventas aún</p>
              ) : (() => {
                const itemSales: Record<string, { name: string; qty: number; revenue: number }> = {};
                orders.forEach(o => (o.items || []).forEach((item: any) => {
                  const k = item.name;
                  if (!itemSales[k]) itemSales[k] = { name: k, qty: 0, revenue: 0 };
                  itemSales[k].qty += item.quantity;
                  itemSales[k].revenue += item.price * item.quantity;
                }));
                const sorted = Object.values(itemSales).sort((a, b) => b.qty - a.qty).slice(0, 5);
                const maxQty = sorted[0]?.qty || 1;
                return (
                  <div className="space-y-3">
                    {sorted.map((p, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span className="truncate mr-2">{p.name}</span>
                          <span className="text-white shrink-0">{p.qty} uds</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%`, background: 'linear-gradient(to right, #4f46e5, #818cf8)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
