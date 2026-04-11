'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { getToken } from '@/lib/api';
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20', icon: <Clock className="w-3 h-3" /> },
  processing: { label: 'Procesando',  color: 'text-blue-400 bg-blue-400/10 border-blue-500/20',       icon: <AlertCircle className="w-3 h-3" /> },
  shipped:    { label: 'Enviado',     color: 'text-teal-400 bg-teal-400/10 border-teal-500/20',  icon: <ArrowUpRight className="w-3 h-3" /> },
  delivered:  { label: 'Entregado',   color: 'text-green-400 bg-green-400/10 border-green-500/20',    icon: <CheckCircle className="w-3 h-3" /> },
  cancelled:  { label: 'Cancelado',   color: 'text-red-400 bg-red-400/10 border-red-500/20',          icon: <XCircle className="w-3 h-3" /> },
};

export default function Dashboard() {
  const router = useRouter();
  const token = getToken();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any>({ total: 0, published: 0 });
  const [loading, setLoading] = useState(true);

  const authH = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    const fetchData = async () => {
      try {
        const [ordRes, prodRes] = await Promise.all([
          fetch(`${API}/api/orders`, { headers: authH }),
          fetch(`${API}/api/products/admin/all`, { headers: authH }),
        ]);
        if (ordRes.status === 401 || prodRes.status === 401) { router.push('/admin/login'); return; }
        const [ordData, prodData] = await Promise.all([ordRes.json(), prodRes.json()]);
        setOrders(Array.isArray(ordData) ? ordData : []);
        setProducts({ total: prodData.total || 0, published: (prodData.products || []).filter((p: any) => p.published).length });
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  const revenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pending = orders.filter(o => o.status === 'pending').length;
  const recent = orders.slice(0, 8);

  // Revenue by last 7 days
  const now = Date.now();
  const DAY = 86400000;
  const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * DAY;
    const dayEnd = dayStart + DAY;
    return {
      label: new Date(dayStart).toLocaleDateString('es', { weekday: 'short' }),
      value: orders.filter(o => {
        const d = new Date(o.createdAt).getTime();
        return d >= dayStart && d < dayEnd;
      }).reduce((s, o) => s + (o.totalAmount || 0), 0),
    };
  });
  const maxRevenue = Math.max(...dailyRevenue.map(d => d.value), 1);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue Total', value: `$${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', href: '/admin/orders' },
              { label: 'Órdenes', value: orders.length, icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', href: '/admin/orders' },
              { label: 'Pendientes', value: pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', href: '/admin/orders' },
              { label: 'Productos', value: `${products.published}/${products.total}`, icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', href: '/admin/products' },
            ].map(c => {
              const Icon = c.icon;
              return (
                <Link key={c.label} href={c.href} className="card p-5 hover:border-white/10 transition-colors group">
                  <div className={`inline-flex p-2.5 rounded-xl border ${c.bg} ${c.color} mb-4`}><Icon className="w-5 h-5" /></div>
                  <div className="text-2xl font-bold text-white">{c.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-between">
                    {c.label} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Revenue Chart + Recent Orders */}
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Mini Bar Chart */}
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="section-label">Revenue</div>
                  <div className="text-lg font-bold text-white">${revenue.toLocaleString()}</div>
                </div>
                <div className="text-xs text-gray-600">Últimos 7 días</div>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {dailyRevenue.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full rounded-t-lg transition-all relative group"
                      style={{ height: `${(d.value / maxRevenue) * 100}%`, minHeight: '4px', background: d.value > 0 ? 'linear-gradient(to top, #4f46e5, #818cf8)' : 'rgba(255,255,255,0.05)' }}>
                      {d.value > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          ${d.value.toFixed(0)}
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-gray-600 capitalize">{d.label}</div>
                  </div>
                ))}
              </div>
              {revenue === 0 && <p className="text-xs text-gray-600 text-center mt-2">Sin órdenes aún — las ventas aparecerán aquí</p>}
            </div>

            {/* Recent Orders */}
            <div className="lg:col-span-3 card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                <div className="section-label">Órdenes Recientes</div>
                <Link href="/admin/orders" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                  Ver todas <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="p-12 text-center text-gray-600 text-sm">No hay órdenes aún</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {recent.map((o, i) => {
                    const cfg = STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                    return (
                      <div key={o._id || i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {o.shippingAddress?.name || o.user?.name || 'Cliente'}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{String(o._id).slice(-8)}</div>
                        </div>
                        <div className="text-sm font-mono text-white">${(o.totalAmount || 0).toFixed(2)}</div>
                        <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <div className="section-label mb-4">Acciones Rápidas</div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/import" className="btn-primary text-sm">📥 Importar Productos</Link>
              <Link href="/admin/products" className="btn-ghost text-sm">📦 Gestionar Catálogo</Link>
              <Link href="/admin/orders" className="btn-ghost text-sm">🛒 Ver Órdenes</Link>
              <Link href="/" target="_blank" className="btn-ghost text-sm">🌐 Ver Tienda →</Link>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
